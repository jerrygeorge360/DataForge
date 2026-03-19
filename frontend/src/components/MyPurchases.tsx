import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { BrowserProvider, formatEther } from 'ethers'
import {
    ShieldCheck,
    Download,
    Activity,
    Copy,
    Check,
    Lock,
    ExternalLink,
    Loader2,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react'
import { useMarketplace } from '../hooks/useMarketplace'
import { useFilPrice } from '../hooks/useFilPrice'
import { downloadDataset } from '../filecoin'
import { useLit } from '../hooks/useLit'
import { Card } from './ui/Card'

interface MyPurchasesProps {
    provider: BrowserProvider
    account: string
}

export default function MyPurchases({ provider, account }: MyPurchasesProps) {
    const { getPurchasedListings, hasRated, rateListing } = useMarketplace(provider)
    const { price: filPrice } = useFilPrice()
    const { downloadAndDecrypt } = useLit()

    const [purchases, setPurchases] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState<string | null>(null)
    const [copiedCid, setCopiedCid] = useState<string | null>(null)
    const [windowWidth, setWindowWidth] = useState(window.innerWidth)
    const [ratedMap, setRatedMap] = useState<Record<string, boolean>>({})
    const [ratingId, setRatingId] = useState<string | null>(null)

    const [logs, setLogs] = useState<{ msg: string; type?: 'info' | 'error' | 'success'; time: string }[]>([])

    const appendLog = useCallback((msg: string, type: 'info' | 'error' | 'success' = 'info') => {
        setLogs(prev => [...prev.slice(-10), {
            msg,
            type,
            time: new Date().toLocaleTimeString([], { hour12: false })
        }])
    }, [])

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        appendLog('Vault session started.')
        return () => window.removeEventListener('resize', handleResize)
    }, [appendLog])

    useEffect(() => {
        let cancelled = false
        const run = async () => {
            setLoading(true)
            try {
                const owned = await getPurchasedListings(account)
                if (!cancelled) {
                    setPurchases(owned)
                    // Batch fetch rated status
                    const statuses: Record<string, boolean> = {}
                    await Promise.all(owned.map(async (p: any) => {
                        const rated = await hasRated(p.listingId, account)
                        statuses[p.listingId.toString()] = rated
                    }))
                    setRatedMap(statuses)
                }
            } catch (err) {
                console.error('Failed to load purchases:', err)
                appendLog('Failed to synchronize vault data.', 'error')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        run()
        return () => { cancelled = true }
    }, [getPurchasedListings, hasRated, account, appendLog])

    const handleRate = async (listingId: bigint, positive: boolean) => {
        const idStr = listingId.toString()
        setRatingId(idStr)
        try {
            appendLog(`Submitting ${positive ? 'positive' : 'negative'} rating...`, 'info')
            await rateListing(listingId, positive)
            setRatedMap(prev => ({ ...prev, [idStr]: true }))
            appendLog('✓ Rating submitted successfully', 'success')
        } catch (err: any) {
            console.error('Rating failed:', err)
            appendLog(`✗ Rating failed: ${err.message || 'Unknown error'}`, 'error')
        } finally {
            setRatingId(null)
        }
    }

    const handleCopy = (cid: string) => {
        navigator.clipboard.writeText(cid)
        setCopiedCid(cid)
        setTimeout(() => setCopiedCid(null), 2000)
    }

    const handleDownload = async (purchase: any) => {
        const purchaseId = purchase.listingId.toString()
        setDownloading(purchaseId)
        const cid = purchase.cid
        const filename = purchase.name || `dataset_${cid.slice(0, 8)}`

        const triggerBrowserDownload = (data: Uint8Array | File | Blob) => {
            const blob = data instanceof Uint8Array ? new Blob([data as any]) : data
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        }

        try {
            appendLog('Downloading from Filecoin...')
            const buffer = await downloadDataset(account, cid)

            // Sniff for Lit Encryption
            let isEncrypted = false
            try {
                const decoder = new TextDecoder()
                const text = decoder.decode(buffer)
                if (text.trim().startsWith('{')) {
                    const parsed = JSON.parse(text)
                    if (parsed.ciphertext && parsed.dataToEncryptHash) {
                        isEncrypted = true
                    }
                }
            } catch (sniffErr) {
                // Not JSON or missing Lit fields, treat as raw
                isEncrypted = false
            }

            if (isEncrypted) {
                appendLog('Lock detected. Initializing Lit security...', 'info')
                try {
                    // We don't use downloadAndDecrypt directly because we already have the data
                    // Instead we'll use a more surgical approach if possible, or just pass the data back.
                    // For simplicity, let's keep useLit's downloadAndDecrypt but pass a function 
                    // that returns our already-downloaded buffer.
                   const decryptedFile = await downloadAndDecrypt(cid, account, async () => {
                        return buffer
                    })

                    appendLog('✓ Decryption successful', 'success')
                    triggerBrowserDownload(decryptedFile)
                    appendLog(`✓ Download complete: ${filename}`, 'success')
                } catch (litErr: any) {
                    appendLog(`✗ Decryption failed: ${litErr.message || 'Identity verification failed'}`, 'error')
                    throw litErr
                }
            } else {
                appendLog('Dataset unencrypted, skipping security layer...')
                triggerBrowserDownload(new Blob([buffer as any]))
                appendLog(`✓ Download complete: ${filename}`, 'success')
            }
        } catch (err: any) {
            console.error('Download failed:', err)
            const isNetworkError = err.message?.includes('fetch') || err.message?.includes('Network')
            appendLog(`✗ Download failed: ${isNetworkError ? 'Network connectivity issue' : (err.message || 'Unknown error')}`, 'error')
            if (isNetworkError) {
                appendLog('Lit identity nodes may be unreachable from your network.', 'error')
            }
        } finally {
            setDownloading(null)
        }
    }

    const totalSpent = purchases.reduce((sum, p) => sum + BigInt(p.price), 0n)
    const lastPurchase = purchases.length > 0 ? 'Recently' : 'Never'

    const cardStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8
    }

    const labelStyle: React.CSSProperties = {
        fontSize: 11,
        textTransform: 'uppercase',
        color: 'var(--text-3)',
        letterSpacing: '1px',
        fontWeight: 600
    }

    const valueStyle: React.CSSProperties = {
        fontSize: 28,
        fontWeight: 700,
        color: 'var(--text-1)',
        fontFamily: 'var(--font-mono)'
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, animation: 'fadeIn 0.7s ease-out' }}>
            {/* 1. Page Header Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: windowWidth > 768 ? 'repeat(3, 1fr)' : '1fr',
                gap: 20
            }}>
                <div style={cardStyle}>
                    <span style={labelStyle}>Datasets Owned</span>
                    <span style={valueStyle}>{purchases.length}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>in secure vault</span>
                </div>
                <div style={cardStyle}>
                    <span style={labelStyle}>Total Spent</span>
                    <span style={valueStyle}>{formatEther(totalSpent)} FIL</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        ≈ ${(parseFloat(formatEther(totalSpent)) * filPrice).toFixed(2)} USD
                    </span>
                </div>
                <div style={cardStyle}>
                    <span style={labelStyle}>Last Purchase</span>
                    <span style={valueStyle}>{lastPurchase}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>—</span>
                </div>
            </div>

            {/* 2. Main content area */}
            <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 1024 ? '1fr 340px' : '1fr', gap: 32 }}>

                {/* Left: Secure Vault Table */}
                <Card style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
                        <ShieldCheck size={20} color="var(--success)" />
                        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Secure Vault</h2>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ minWidth: 600 }}>
                            {/* Table Header */}
                            <div style={{
                                background: 'var(--bg-subtle)',
                                borderBottom: '2px solid var(--border)',
                                padding: '10px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: 11,
                                textTransform: 'uppercase',
                                color: 'var(--text-3)',
                                letterSpacing: '0.8px',
                                fontWeight: 700
                            }}>
                                <div style={{ flex: 3 }}>Dataset</div>
                                <div style={{ flex: 1.2 }}>Price Paid</div>
                                <div style={{ flex: 1.2, textAlign: 'center' }}>Quality</div>
                                <div style={{ flex: 1.8 }}>CID</div>
                                <div style={{ flex: 1.5, textAlign: 'right' }}>Action</div>
                            </div>

                            {/* Table Body */}
                            <div style={{ minHeight: 300 }}>
                                {loading ? (
                                    <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-3)' }}>Synchronizing vault...</div>
                                ) : purchases.length === 0 ? (
                                    <div style={{ padding: 64, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                                        <Lock size={56} color="var(--text-3)" style={{ opacity: 0.3 }} />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Your vault is empty</h3>
                                            <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, maxWidth: 300 }}>
                                                Datasets you purchase will appear here, ready to download securely.
                                            </p>
                                        </div>
                                        <Link to="/browse">
                                            <button style={{
                                                background: 'var(--brand)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 8,
                                                padding: '10px 20px',
                                                fontSize: 14,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                marginTop: 8
                                            }}>Browse Marketplace →</button>
                                        </Link>
                                    </div>
                                ) : (
                                    purchases.map((p) => (
                                        <div key={p.listingId.toString()} style={{
                                            padding: '16px 24px',
                                            borderBottom: '1px solid var(--border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'background 0.2s',
                                        }} className="vault-row">
                                            <style>{`.vault-row:hover { background: var(--bg-subtle) !important; }`}</style>

                                            <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</span>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        padding: '2px 8px',
                                                        background: 'rgba(34, 197, 94, 0.1)',
                                                        color: '#22c55e',
                                                        borderRadius: 4,
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        border: '1px solid rgba(34, 197, 94, 0.2)'
                                                    }}>
                                                        <Lock size={10} />
                                                        SECURE
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <span style={{ fontSize: 10, background: 'rgba(1, 118, 211, 0.1)', color: 'var(--brand)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{p.category}</span>
                                                    <span style={{ fontSize: 10, background: 'var(--bg-subtle)', color: 'var(--text-3)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{p.fileFormat}</span>
                                                </div>
                                            </div>

                                            <div style={{ flex: 1.2, fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                                {formatEther(p.price)} FIL
                                            </div>

                                            <div style={{ flex: 1.2, display: 'flex', gap: 12, justifyContent: 'center' }}>
                                                {ratedMap[p.listingId.toString()] ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#22c55e', fontSize: 10, fontWeight: 700 }}>
                                                        <Check size={12} /> RATED
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleRate(p.listingId, true)}
                                                            disabled={!!ratingId}
                                                            style={{
                                                                border: 'none',
                                                                background: 'none',
                                                                cursor: 'pointer',
                                                                color: 'var(--text-3)',
                                                                padding: 4,
                                                                transition: 'color 0.2s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            className="rate-btn up"
                                                            title="Rate Positive"
                                                        >
                                                            {ratingId === p.listingId.toString() ? (
                                                                <Loader2 size={16} className="animate-spin" />
                                                            ) : (
                                                                <ThumbsUp size={16} />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRate(p.listingId, false)}
                                                            disabled={!!ratingId}
                                                            style={{
                                                                border: 'none',
                                                                background: 'none',
                                                                cursor: 'pointer',
                                                                color: 'var(--text-3)',
                                                                padding: 4,
                                                                transition: 'color 0.2s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            className="rate-btn down"
                                                            title="Rate Negative"
                                                        >
                                                            {ratingId === p.listingId.toString() ? (
                                                                <Loader2 size={16} className="animate-spin" />
                                                            ) : (
                                                                <ThumbsDown size={16} />
                                                            )}
                                                        </button>
                                                        <style>{`
                                                            .rate-btn.up:hover { color: #22c55e !important; }
                                                            .rate-btn.down:hover { color: #ef4444 !important; }
                                                        `}</style>
                                                    </>
                                                )}
                                            </div>

                                            <div style={{ flex: 1.8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                                                    {p.cid.slice(0, 8)}...{p.cid.slice(-6)}
                                                </span>
                                                <button
                                                    onClick={() => handleCopy(p.cid)}
                                                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: copiedCid === p.cid ? '#22c55e' : 'var(--text-3)' }}
                                                >
                                                    {copiedCid === p.cid ? <Check size={14} /> : <Copy size={14} />}
                                                </button>
                                            </div>

                                            <div style={{ flex: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleDownload(p)}
                                                    disabled={!!downloading}
                                                    style={{
                                                        border: '1px solid var(--brand)',
                                                        background: 'transparent',
                                                        color: 'var(--brand)',
                                                        borderRadius: 6,
                                                        padding: '6px 12px',
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        cursor: downloading === p.listingId.toString() ? 'not-allowed' : 'pointer',
                                                        opacity: downloading && downloading !== p.listingId.toString() ? 0.5 : 1,
                                                        transition: 'all 0.2s'
                                                    }}
                                                    className="dl-btn"
                                                >
                                                    {downloading === p.listingId.toString() ? (
                                                        <><Loader2 size={14} className="animate-spin" /> Fetching...</>
                                                    ) : (
                                                        <><Download size={14} /> Download</>
                                                    )}
                                                </button>
                                                <style>{`.dl-btn:hover:not(:disabled) { background: var(--brand); color: white; }`}</style>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Right Column: Terminal & Integrity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Download Terminal */}
                    <div style={{
                        background: '#0a0a0a',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            background: 'var(--bg-subtle)',
                            borderBottom: '1px solid var(--border)',
                            padding: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                            </div>
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', marginLeft: 'auto' }}>
                                dataforge — vault terminal
                            </span>
                        </div>
                        <div style={{ padding: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#22c55e', minHeight: 120 }}>
                            {logs.map((log, i) => (
                                <div key={i} style={{ marginBottom: 4, color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#22c55e' : undefined }}>
                                    <span style={{ opacity: 0.5, marginRight: 8 }}>[{log.time}]</span>
                                    <span>{log.msg}</span>
                                </div>
                            ))}
                            <div className="animate-pulse">_</div>
                        </div>
                    </div>

                    {/* Storage Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ ...cardStyle, background: 'var(--bg-subtle)', padding: 16, gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                                <span style={{ fontSize: 13, fontWeight: 700 }}>Filecoin Calibration</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>Chain ID: 314159</span>
                                <a
                                    href="https://calibration.filscan.io"
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ fontSize: 11, color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                    View on Explorer <ExternalLink size={10} />
                                </a>
                            </div>
                        </div>

                        <div style={{ ...cardStyle, background: 'var(--bg-subtle)', padding: 16, gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Activity size={16} color="var(--brand)" />
                                <span style={{ fontSize: 13, fontWeight: 700 }}>Storage Metadata</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                    <span style={{ color: 'var(--text-3)' }}>Datasets in Vault:</span>
                                    <span style={{ fontWeight: 600 }}>{purchases.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                    <span style={{ color: 'var(--text-3)' }}>Storage Provider:</span>
                                    <span style={{ fontWeight: 600 }}>Synapse Network</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                    <span style={{ color: 'var(--text-3)' }}>Encryption:</span>
                                    <span style={{ fontWeight: 600 }}>Planned (coming soon)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
