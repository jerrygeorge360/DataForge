import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    ArrowRight,
    CloudUpload,
    Database,
    Zap,
    Loader2,
    CloudRain,
    BarChart3,
    Copy,
    Check
} from 'lucide-react'
import { useMarketplace } from '../hooks/useMarketplace'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { StepIndicator } from '../components/ui/StepIndicator'
import { Badge } from '../components/ui/Badge'
import { parseEther, formatEther } from 'ethers'
import { uploadDataset, getSynapse, getUSDFCBalances } from '../filecoin'
import { useLit } from '../hooks/useLit'

const CATEGORIES = ['Finance', 'Weather', 'Sports', 'Health', 'Research', 'Media', 'Other']
const FORMATS = ['CSV', 'JSON', 'Parquet', 'Other']

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function SellerOnboarding({ provider, account }: { provider?: any, account: string }) {
    const navigate = useNavigate()
    const { listDataset, getListingCount } = useMarketplace(provider)
    const { encryptAndUpload } = useLit()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [currentStep, setCurrentStep] = useState(0)
    const [uploading, setUploading] = useState(false)
    const [deploying, setDeploying] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [uploadError, setUploadError] = useState<{ title: string; message: string; isFundingError?: boolean } | null>(null)

    // Storage Setup State
    const [storageStatus, setStorageStatus] = useState<'checking' | 'needs_setup' | 'ready'>('checking')
    const [storagePrep, setStoragePrep] = useState<any>(null)
    const [settingUpStorage, setSettingUpStorage] = useState(false)
    const [usdfcBalance, setUsdfcBalance] = useState<string>('0')
    const [customCapacity, setCustomCapacity] = useState<string>('1')
    const [setupStepStatus, setSetupStepStatus] = useState<string | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'Finance',
        format: 'CSV',
        price: '',
        cid: '',
        previewAid: '',
        rowCount: '0',
        fileSize: 0,
        listingType: 0 // 0: Single, 1: Continuous
    })

    const [copied, setCopied] = useState(false)
    const [windowWidth, setWindowWidth] = useState(window.innerWidth)

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const labelStyle: React.CSSProperties = {
        fontSize: 12,
        color: 'var(--text-3)',
        fontWeight: 500,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    }

    const inputStyle: React.CSSProperties = {
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 14px',
        color: 'var(--text-1)',
        fontSize: 14,
        width: '100%',
        outline: 'none',
        transition: 'border-color 0.2s'
    }

    const steps = [
        { label: 'Upload Data', status: currentStep === 0 ? 'active' : currentStep > 0 ? 'done' : 'waiting' },
        { label: 'Dataset Details', status: currentStep === 1 ? 'active' : currentStep > 1 ? 'done' : 'waiting' },
        { label: 'Review & Deploy', status: currentStep === 2 ? 'active' : currentStep > 2 ? 'done' : 'waiting' }
    ]

    useEffect(() => {
        if (account && currentStep === 0) {
            checkStorageReadiness()
        }
    }, [account, currentStep])

    const checkStorageReadiness = async (capacityGB: string = customCapacity): Promise<boolean> => {
        setStorageStatus('checking')
        try {
            const gb = parseFloat(capacityGB) || 1
            const bytes = BigInt(Math.floor(gb * 1024 * 1024 * 1024))
            const synapse = await getSynapse(account)
            const prep = await synapse.storage.prepare({
                dataSize: bytes
            })

            const balances = await getUSDFCBalances(account)
            setUsdfcBalance(formatEther(balances.wallet))

            const depositNeeded = prep.costs?.depositNeeded || 0n

            // If there's no transaction or if the amount needed is less than 0.01 USDFC (dust), we are ready.
            // 1e16 = 0.01 USDFC
            if (!prep.transaction || depositNeeded < BigInt("10000000000000000")) {
                setStorageStatus('ready')
                setSetupStepStatus(null)
                return true
            } else {
                setStoragePrep(prep)
                setStorageStatus('needs_setup')
                return false
            }
        } catch (err) {
            console.error('Storage check failed:', err)
            setStorageStatus('ready') // Fallback
            return true
        }
    }

    const handleSetupStorage = async () => {
        if (!storagePrep?.transaction) return
        setSettingUpStorage(true)
        setUploadError(null)
        try {
            console.log('Executing storage setup transaction step...')
            const { hash } = await storagePrep.transaction.execute()
            console.log('✅ Transaction confirmed:', hash)

            // Wait for 30 seconds (standard Filecoin block time) for on-chain state to propagate
            console.log('Waiting for network propagation (30s)...')
            await new Promise(resolve => setTimeout(resolve, 30000))

            // Re-check readiness
            console.log('Re-checking storage readiness...')
            const isReady = await checkStorageReadiness()

            if (!isReady) {
                setSetupStepStatus('Step partial! One final transaction or wait a bit more.')
            } else {
                setSetupStepStatus(null)
            }
        } catch (err: any) {
            console.error('Storage setup failed:', err)
            setUploadError({
                title: 'Setup failed',
                message: err.message || 'Could not complete storage deposit.'
            })
        } finally {
            setSettingUpStorage(false)
        }
    }

    const handleFile = async (file: File) => {
        setUploading(true)
        setUploadError(null)
        try {
            // Calculate row count for CSV
            let rows = 'N/A'
            if (file.name.toLowerCase().endsWith('.csv')) {
                const text = await file.text()
                const lineCount = text.split('\n').filter(l => l.trim()).length
                rows = (lineCount > 0 ? lineCount - 1 : 0).toLocaleString()
            }

            const nextId = await getListingCount()
            const cid = await encryptAndUpload(
                file,
                Number(nextId),
                (data: Uint8Array) => uploadDataset(account, data)
            )

            setFormData({
                ...formData,
                cid: cid,
                name: file.name.split('.')[0],
                fileSize: file.size,
                rowCount: rows
            })
            setUploading(false)
            setCurrentStep(1)
        } catch (err: any) {
            console.error('Upload failed:', err)
            const isFundingError = err.message?.includes('InsufficientLockupFunds')
            setUploadError({
                title: isFundingError ? 'Insufficient Allowance' : 'Upload failed',
                message: isFundingError
                    ? 'Your storage allowance is too low. Please run storage setup again.'
                    : (err.message || 'Upload failed'),
                isFundingError
            })
            setUploading(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleFile(file)
    }

    const handleDeploy = async () => {
        if (!formData.price) return
        setDeploying(true)
        try {
            await listDataset(
                formData.cid,
                'bafybeigdw6x...preview', // mock preview
                formData.name,
                formData.description,
                formData.category,
                formData.format,
                parseInt(formData.rowCount.replace(/,/g, '') || '0'),
                formData.fileSize,
                parseEther(formData.price),
                formData.listingType as any
            )
            navigate('/dashboard')
        } catch (err) {
            console.error('Deployment failed:', err)
        } finally {
            setDeploying(false)
        }
    }

    return (
        <div style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '32px 40px'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>List Your Dataset</h1>
                <p style={{ fontSize: 15, color: 'var(--text-2)', marginTop: 4, margin: 0 }}>Monetize your data on the decentralized marketplace.</p>
            </div>

            {/* Stepper */}
            <StepIndicator steps={steps as any} />

            {/* Step Content Card */}
            <Card style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 32,
                boxShadow: 'none'
            }}>
                <div className="min-h-[400px]">
                    {currentStep === 0 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            {storageStatus === 'checking' && (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <Loader2 size={40} className="animate-spin text-[var(--brand)]" />
                                    <p className="text-[var(--text-2)] font-medium">Checking storage status...</p>
                                </div>
                            )}

                            {storageStatus === 'needs_setup' && (
                                <div className="flex flex-col items-center text-center py-12 px-6 space-y-8">
                                    <div className="w-20 h-20 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand)]">
                                        <CloudRain size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-[var(--text-1)]">One-time storage setup</h2>
                                        <p className="text-[var(--text-2)] max-w-md mx-auto leading-relaxed">
                                            To upload datasets you need to deposit USDFC into the Filecoin storage system. This is a one-time setup per wallet to cover your storage capacity.
                                        </p>
                                    </div>

                                    <div style={{
                                        width: '100%',
                                        maxWidth: '400px',
                                        background: 'var(--bg-subtle)',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left', marginBottom: 8 }}>
                                            <label style={labelStyle}>Desired Capacity (GB)</label>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <input
                                                    type="number"
                                                    min="0.1"
                                                    step="0.1"
                                                    style={{ ...inputStyle, flex: 1 }}
                                                    value={customCapacity}
                                                    onChange={(e) => {
                                                        setCustomCapacity(e.target.value)
                                                        checkStorageReadiness(e.target.value)
                                                    }}
                                                />
                                                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--border)', padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>GB</div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-[var(--text-3)] font-medium">Required Deposit</span>
                                            <span className="font-bold text-[var(--text-1)]">
                                                {storagePrep?.costs?.depositNeeded ? formatEther(storagePrep.costs.depositNeeded) : '0'} USDFC
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm border-t border-[var(--border)] pt-3">
                                            <span className="text-[var(--text-3)] font-medium">Your Wallet Balance</span>
                                            <span className="font-bold text-[var(--text-1)]">{usdfcBalance} USDFC</span>
                                        </div>
                                    </div>

                                    <div className="w-full max-w-[400px] flex flex-col gap-3">
                                        {setupStepStatus && (
                                            <div style={{
                                                padding: '12px',
                                                background: 'rgba(34, 197, 94, 0.1)',
                                                border: '1px solid #22c55e',
                                                borderRadius: 8,
                                                color: '#22c55e',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                marginBottom: 8
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Check size={16} /> {setupStepStatus}
                                                </div>
                                            </div>
                                        )}
                                        <Button
                                            fullWidth
                                            size="lg"
                                            onClick={handleSetupStorage}
                                            loading={settingUpStorage}
                                            className="h-14 text-lg font-bold"
                                        >
                                            {settingUpStorage ? 'Setting up storage...' : setupStepStatus ? 'Complete Final Step' : 'Setup Storage'}
                                        </Button>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <Button
                                                variant="ghost"
                                                onClick={() => checkStorageReadiness()}
                                                disabled={settingUpStorage}
                                                style={{ flex: 1 }}
                                            >
                                                Refresh Status
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => setStorageStatus('ready')}
                                                disabled={settingUpStorage}
                                                style={{ flex: 1 }}
                                            >
                                                Skip Check
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {storageStatus === 'ready' && (
                                <>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept=".csv,.json,.parquet,.xlsx,.xls"
                                        onChange={handleFileSelect}
                                    />
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDragEnter={() => setIsDragging(true)}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={handleDrop}
                                        className="group"
                                        style={{
                                            border: isDragging ? '2px dashed var(--brand)' : '2px dashed var(--border-strong)',
                                            borderRadius: 8,
                                            padding: '84px 24px',
                                            textAlign: 'center',
                                            background: isDragging ? 'var(--brand-light)' : 'var(--bg-subtle)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 16
                                        }}>
                                            {uploading ? (
                                                <Loader2 size={48} className="animate-spin" color="var(--brand)" />
                                            ) : (
                                                <CloudUpload size={48} color={isDragging ? 'var(--brand)' : 'var(--text-3)'} />
                                            )}
                                            <div style={{ marginTop: 4 }}>
                                                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                                                    {isDragging ? 'Drop to upload' : 'Drop your file here'}
                                                </h3>
                                                <p style={{ fontSize: 15, color: 'var(--text-2)', marginTop: 8, margin: 0 }}>or click to browse from computer</p>
                                            </div>

                                            {/* Format Pills */}
                                            <div style={{ display: 'inline-flex', gap: 10, marginTop: 12 }}>
                                                {['CSV', 'JSON', 'Parquet', 'XLSX'].map(f => (
                                                    <span key={f} style={{
                                                        padding: '4px 12px',
                                                        background: 'var(--border)',
                                                        borderRadius: 6,
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        color: 'var(--text-3)',
                                                        textTransform: 'uppercase'
                                                    }}>{f}</span>
                                                ))}
                                            </div>
                                            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 12, margin: 0 }}>Max 254 MB</p>

                                            {uploadError && (
                                                <div style={{
                                                    marginTop: 24,
                                                    padding: '20px',
                                                    background: 'rgba(239, 68, 68, 0.05)',
                                                    border: '1px solid var(--error)',
                                                    borderRadius: '8px',
                                                    width: '100%',
                                                    maxWidth: '400px'
                                                }}>
                                                    <h4 style={{ color: 'var(--error)', margin: 0, fontWeight: 700, fontSize: 14 }}>{uploadError.title}</h4>
                                                    <p style={{ color: 'var(--text-2)', margin: '4px 0 0 0', fontSize: 13, lineHeight: '1.4' }}>{uploadError.message}</p>

                                                    <div style={{ marginTop: 16 }}>
                                                        {uploadError.isFundingError ? (
                                                            <Button size="sm" onClick={(e) => {
                                                                e.stopPropagation();
                                                                setStorageStatus('needs_setup');
                                                                setUploadError(null);
                                                            }}>
                                                                Setup Storage
                                                            </Button>
                                                        ) : (
                                                            <Button variant="ghost" size="sm" onClick={(e) => {
                                                                e.stopPropagation();
                                                                setUploadError(null);
                                                            }}>
                                                                Try Again
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div style={{
                            display: 'flex',
                            flexDirection: windowWidth > 768 ? 'row' : 'column',
                            gap: 32,
                            animation: 'fadeIn 0.5s ease-out'
                        }}>
                            {/* Left Column: Form Fields */}
                            <div style={{ flex: '1 1 55%', display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={labelStyle}>Dataset Name</label>
                                    <input
                                        style={inputStyle}
                                        placeholder="e.g. Global Tech Sentiment 2024"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={labelStyle}>Description</label>
                                    <textarea
                                        style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
                                        rows={3}
                                        placeholder="Describe what's inside the data..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={labelStyle}>Category</label>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                style={inputStyle}
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            >
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={labelStyle}>Format</label>
                                        <select
                                            style={inputStyle}
                                            value={formData.format}
                                            onChange={e => setFormData({ ...formData, format: e.target.value })}
                                        >
                                            {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Data Profile & Pricing */}
                            <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {/* Data Profile Card */}
                                <div style={{
                                    background: 'var(--bg-subtle)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 12,
                                    padding: 16
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 16,
                                        color: 'var(--text-3)',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        <BarChart3 size={14} /> Data Profile
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <span style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600 }}>Rows Detected</span>
                                            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{formData.rowCount}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <span style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600 }}>File Size</span>
                                            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{formatFileSize(formData.fileSize)}</span>
                                        </div>
                                    </div>

                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                                        <span style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>Storage Path</span>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis' }} title={formData.cid}>
                                                {formData.cid.slice(0, 8)}...{formData.cid.slice(-6)}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(formData.cid)
                                                    setCopied(true)
                                                    setTimeout(() => setCopied(false), 1500)
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    padding: 4,
                                                    cursor: 'pointer',
                                                    color: copied ? 'var(--success)' : 'var(--text-3)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    transition: 'color 0.2s'
                                                }}
                                            >
                                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Listing Type */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={labelStyle}>Listing Type</label>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div
                                            onClick={() => setFormData({ ...formData, listingType: 0 })}
                                            style={{
                                                flex: 1,
                                                padding: 12,
                                                borderRadius: 10,
                                                cursor: 'pointer',
                                                border: formData.listingType === 0 ? '2px solid var(--brand)' : '1px solid var(--border)',
                                                background: formData.listingType === 0 ? 'rgba(1, 118, 211, 0.08)' : 'var(--bg-subtle)',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 4
                                            }}
                                        >
                                            <span style={{ fontSize: 18 }}>🎯</span>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>One-Time</span>
                                            <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0, lineHeight: 1.3 }}>Single buyer, auto-delists</p>
                                        </div>
                                        <div
                                            onClick={() => setFormData({ ...formData, listingType: 1 })}
                                            style={{
                                                flex: 1,
                                                padding: 12,
                                                borderRadius: 10,
                                                cursor: 'pointer',
                                                border: formData.listingType === 1 ? '2px solid var(--brand)' : '1px solid var(--border)',
                                                background: formData.listingType === 1 ? 'rgba(1, 118, 211, 0.08)' : 'var(--bg-subtle)',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 4
                                            }}
                                        >
                                            <span style={{ fontSize: 18 }}>♾️</span>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Subscription</span>
                                            <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0, lineHeight: 1.3 }}>Unlimited buyers</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Price Input */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={labelStyle}>Price</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            style={{
                                                ...inputStyle,
                                                fontSize: 20,
                                                fontWeight: 700,
                                                fontFamily: 'var(--font-mono)',
                                                paddingRight: 50,
                                                height: 52
                                            }}
                                            placeholder="0.00"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        />
                                        <span style={{
                                            position: 'absolute',
                                            right: 14,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'var(--text-3)',
                                            fontWeight: 700,
                                            fontSize: 14,
                                            pointerEvents: 'none'
                                        }}>FIL</span>
                                    </div>
                                    {formData.price && parseFloat(formData.price) > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                                                Platform fee (2.5%): <span style={{ fontFamily: 'var(--font-mono)' }}>{(parseFloat(formData.price) * 0.025).toFixed(5)} FIL</span>
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                                                You receive: <span style={{ color: 'var(--brand)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{(parseFloat(formData.price) * 0.975).toFixed(5)} FIL</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <Card className="overflow-hidden border-2 border-[var(--brand)] shadow-[var(--shadow-lg)]">
                                <div className="bg-[var(--brand)] p-6 text-white flex justify-between items-center">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold">{formData.name}</h3>
                                        <p className="text-white/80 text-sm">Final listing preview</p>
                                    </div>
                                    <Badge variant="info" className="bg-white text-[var(--brand)] hover:bg-white border-transparent">
                                        {formData.category} • {formData.format}
                                    </Badge>
                                </div>
                                <CardContent className="p-8 space-y-8">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold uppercase text-[var(--text-3)] tracking-wider">Description</h4>
                                        <p className="text-[var(--text-2)] leading-relaxed">{formData.description || 'No description provided.'}</p>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-[var(--border)]">
                                        <div className="space-y-1 text-center">
                                            <div className="text-2xl font-bold font-mono">{formData.rowCount}</div>
                                            <div className="text-[10px] uppercase font-bold text-[var(--text-3)]">Total Rows</div>
                                        </div>
                                        <div className="space-y-1 text-center border-x border-[var(--border)]">
                                            <div className="text-2xl font-bold font-mono text-[var(--brand)]">{formData.price} FIL</div>
                                            <div className="text-[10px] uppercase font-bold text-[var(--text-3)]">Unit Price</div>
                                        </div>
                                        <div className="space-y-1 text-center">
                                            <div className="text-2xl font-bold font-mono">{formatFileSize(formData.fileSize)}</div>
                                            <div className="text-[10px] uppercase font-bold text-[var(--text-3)]">Storage Size</div>
                                        </div>
                                    </div>

                                    <Card className="bg-[var(--success-bg)] border-transparent">
                                        <CardContent className="p-6 flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[var(--success)] shadow-sm shrink-0">
                                                <Database className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-[var(--success)]">Ready for Filecoin Pipeline</h4>
                                                <p className="text-xs text-[var(--success)]/80 leading-relaxed">By clicking deploy, your data will be encrypted with Lit Protocol and stored via CID on the network.</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Bottom Navigation Buttons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 24,
                    paddingTop: 24,
                    borderTop: '1px solid var(--border)'
                }}>
                    <div>
                        {currentStep > 0 && (
                            <Button variant="ghost" onClick={() => setCurrentStep(prev => prev - 1)} className="gap-2">
                                <ArrowLeft size={16} /> Back
                            </Button>
                        )}
                    </div>
                    <div>
                        {currentStep < 2 ? (
                            <Button
                                onClick={() => currentStep === 0 ? fileInputRef.current?.click() : setCurrentStep(2)}
                                disabled={currentStep === 0 && uploading}
                                className="gap-2 px-8"
                            >
                                Continue <ArrowRight size={16} />
                            </Button>
                        ) : (
                            <Button size="lg" className="px-12 gap-2" loading={deploying} onClick={handleDeploy}>
                                <Zap className="w-4 h-4 fill-current" /> Deploy Listing
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}
