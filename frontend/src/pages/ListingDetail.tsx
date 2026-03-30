import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { formatEther } from 'ethers'
import {
    ChevronRight,
    ShieldCheck,
    Lock,
    Download,
    Eye,
    ExternalLink,
    Copy,
    Check,
    Clock,
    ShoppingBag,
    X
} from 'lucide-react'
import { useMarketplace } from '../hooks/useMarketplace'
import { useFilPrice } from '../hooks/useFilPrice'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DiceBearAvatar } from '../components/layout/DiceBearAvatar'
import { formatBytes } from '../lib/assets'
import { downloadDataset } from '../filecoin'
import { formatDistanceToNow } from 'date-fns'
import Papa from 'papaparse'

interface Listing {
    id: number
    seller: string
    cid: string
    previewCid: string
    name: string
    description: string
    category: string
    fileFormat: string
    fileSize: string
    rowCount: string
    price: bigint
    listingType: number
    active: boolean
}


export default function ListingDetail({ account, provider, isWrongNetwork }: { account?: string, provider?: any, isWrongNetwork?: boolean }) {
    const { id } = useParams()
    const navigate = useNavigate()

    const { getListingDetails, purchaseDataset, checkPurchaseState, contract } = useMarketplace(provider)
    const { price: filPrice } = useFilPrice()

    const [listing, setListing] = useState<Listing | null>(null)
    const [loading, setLoading] = useState(true)
    const [isPurchased, setIsPurchased] = useState(false)
    const [buying, setBuying] = useState(false)
    const [activeTab, setActiveTab] = useState<'preview' | 'profile' | 'provenance'>('preview')
    const [copied, setCopied] = useState(false)
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

    // Real Data State
    const [salesCount, setSalesCount] = useState<number>(0)
    const [listedAt, setListedAt] = useState<Date | null>(null)
    const [previewData, setPreviewData] = useState<any[] | null>(null)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewError, setPreviewError] = useState<string | null>(null)
    const [imageError, setImageError] = useState(false)

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        let cancelled = false
        const fetchDetail = async () => {
            if (!id) return
            setLoading(true)



            try {
                const details = await getListingDetails(BigInt(id))
                if (!cancelled && details) {
                    setListing({
                        id: Number(id),
                        ...details,
                        rowCount: details.rowCount.toString(),
                        fileSize: formatBytes(details.fileSizeBytes)
                    } as Listing)

                    // Check if already purchased
                    if (account) {
                        const owned = await checkPurchaseState(BigInt(id), account)
                        if (!cancelled) setIsPurchased(owned)
                    }
                }
            } catch (err) {
                console.error('Failed to fetch listing:', err)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        const fetchExtendedData = async () => {
            if (!id || !provider || !listing || !contract) return

            try {
                const currentBlock = await provider.getBlockNumber()
                const startBlock = Math.max(0, currentBlock - 800)

                // 1. Fetch Sales Count
                const purchaseFilter = contract.filters.DatasetPurchased(BigInt(id))
                const purchaseEvents = await contract.queryFilter(purchaseFilter, startBlock, currentBlock)
                if (!cancelled) setSalesCount(purchaseEvents.length)

                const listFilter = contract.filters.DatasetListed(BigInt(id))
                const listEvents = await contract.queryFilter(listFilter, startBlock, currentBlock)
                if (listEvents.length > 0) {
                    const block = await provider.getBlock(listEvents[0].blockNumber)
                    if (block && !cancelled) setListedAt(new Date(Number(block.timestamp) * 1000))
                }

                // 3. Fetch Preview Data
                if (listing.previewCid && !previewData && !previewLoading) {
                    setPreviewLoading(true)
                    try {
                        const buffer = await downloadDataset(account || '0x0000000000000000000000000000000000000000', listing.previewCid)
                        const text = new TextDecoder().decode(buffer)
                        const { data } = Papa.parse(text, { header: true })
                        if (!cancelled) setPreviewData(data.slice(0, 5))
                    } catch (err) {
                        console.warn('Failed to fetch preview data:', err)
                        if (!cancelled) setPreviewError('Preview unavailable')
                    } finally {
                        if (!cancelled) setPreviewLoading(false)
                    }
                }
            } catch (err) {
                console.error('Failed to fetch extended data:', err)
            }
        }

        fetchDetail()
        if (id && provider) fetchExtendedData()
        return () => { cancelled = true }
    }, [id, getListingDetails, account, checkPurchaseState, provider, listing?.previewCid, contract])

    const handleBuy = async () => {
        if (!account || !listing) return
        setBuying(true)
        try {
            await purchaseDataset(BigInt(listing.id), listing.price)
            setIsPurchased(true)
        } catch (err) {
            console.error('Purchase failed:', err)
        } finally {
            setBuying(false)
        }
    }

    const handleCopy = () => {
        if (!listing) return
        navigator.clipboard.writeText(listing.cid)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) {
        return (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>
                <div style={{ height: 20, width: 200, background: 'var(--bg-subtle)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                <div style={{ display: 'grid', gridTemplateColumns: windowWidth > 768 ? '1fr 360px' : '1fr', gap: 32 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ height: 40, width: '60%', background: 'var(--bg-subtle)', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
                        <div style={{ height: 320, width: '100%', background: 'var(--bg-subtle)', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
                    </div>
                    <div style={{ height: 500, background: 'var(--bg-subtle)', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />
                </div>
            </div>
        )
    }

    if (!listing) {
        return (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 32px', textAlign: 'center' }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Listing not found</h1>
                <Button onClick={() => navigate('/browse')}>Return to Browsing</Button>
            </div>
        )
    }

    const priceFIL = parseFloat(formatEther(listing.price))
    const priceUSD = filPrice > 0 ? (priceFIL * filPrice).toFixed(2) : null
    const platformFee = priceFIL * 0.025
    const sellerNet = priceFIL - platformFee

    const badgeStyle = (variant: 'brand' | 'neutral' | 'amber' | 'green'): React.CSSProperties => ({
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        background: variant === 'brand' ? 'var(--brand)' :
            variant === 'amber' ? '#f59e0b' :
                variant === 'green' ? '#10b981' : 'var(--bg-subtle)',
        color: variant === 'neutral' ? 'var(--text-2)' : 'white',
        border: variant === 'neutral' ? '1px solid var(--border)' : 'none'
    })

    const tabStyle = (active: boolean): React.CSSProperties => ({
        padding: '12px 24px',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        borderBottom: `2px solid ${active ? 'var(--brand)' : 'transparent'}`,
        color: active ? 'var(--brand)' : 'var(--text-3)',
        background: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        transition: 'all 0.2s',
        marginBottom: -2
    })

    const statCardStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
    }

    const statLabelStyle: React.CSSProperties = {
        fontSize: 10,
        textTransform: 'uppercase',
        color: 'var(--text-3)',
        fontWeight: 700,
        letterSpacing: '0.8px'
    }

    const statValueStyle: React.CSSProperties = {
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-1)'
    }

    return (
        <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '24px 32px',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            {isWrongNetwork && (
                <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: 12,
                    padding: '16px 24px',
                    color: '#991b1b',
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: 'center',
                    marginBottom: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    animation: 'slideDown 0.3s ease-out'
                }}>
                    <X size={18} style={{ opacity: 0.5 }} />
                    Warning: Your wallet is connected to the wrong network. Please switch to <b>Filecoin Calibration (Chain ID 314159)</b> to purchase datasets.
                </div>
            )}
            {/* Breadcrumb */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 12 }}>
                <Link to="/browse" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Browse</Link>
                <ChevronRight size={14} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-3)' }}>{listing.category}</span>
                <ChevronRight size={14} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{listing.name}</span>
            </nav>

            <div style={{
                display: 'grid',
                gridTemplateColumns: windowWidth > 992 ? '1fr 360px' : '1fr',
                gap: 40,
                alignItems: 'start'
            }}>

                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32, minWidth: 0 }}>

                    {/* Title Section */}
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', marginBottom: 12, lineHeight: 1.1 }}>{listing.name}</h1>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                            <span style={badgeStyle('brand')}>{listing.category}</span>
                            <span style={badgeStyle('neutral')}>{listing.fileFormat}</span>
                            <span style={badgeStyle(listing.listingType === 0 ? 'amber' : 'green')}>
                                {listing.listingType === 0 ? 'One-Time' : 'Subscription'}
                            </span>
                        </div>
                        <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
                            {listing.description || `This high-integrity ${listing.category} dataset provides comprehensive structural records intended for advanced modeling and analysis. Verified on-chain via the DataForge protocol.`}
                        </p>
                    </div>

                    {/* Tabs Navigation */}
                    <div style={{ borderBottom: '2px solid var(--border)', display: 'flex', gap: 0 }}>
                        <button onClick={() => setActiveTab('preview')} style={tabStyle(activeTab === 'preview')}>Data Preview</button>
                        <button onClick={() => setActiveTab('profile')} style={tabStyle(activeTab === 'profile')}>Data Profile</button>
                        <button onClick={() => setActiveTab('provenance')} style={tabStyle(activeTab === 'provenance')}>Provenance</button>
                    </div>

                    {/* Tab Content */}
                    <div style={{ minHeight: 400 }}>
                        {activeTab === 'preview' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {listing.previewCid && !imageError ? (
                                    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                                        <img
                                            src={`https://gateway.lighthouse.storage/ipfs/${listing.previewCid}`}
                                            alt="Dataset Preview"
                                            style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }}
                                            onError={() => setImageError(true)}
                                        />
                                        <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Eye size={12} color="white" />
                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>Data Preview</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        height: 200,
                                        background: 'var(--bg-subtle)',
                                        borderRadius: 8,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 12,
                                        border: '1px solid var(--border)'
                                    }}>
                                        <div style={{ padding: 12, borderRadius: 12, background: 'var(--bg-card)', color: 'var(--text-3)' }}>
                                            <Eye size={24} />
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)' }}>{imageError ? 'Preview image failed to load' : 'No preview available'}</span>
                                    </div>
                                )}

                                <div style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', minHeight: 120 }}>
                                    {previewLoading ? (
                                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Loading preview...</div>
                                    ) : previewError ? (
                                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-error)' }}>{previewError}</div>
                                    ) : previewData && previewData.length > 0 ? (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                                                <thead style={{ background: 'var(--bg-subtle)', position: 'sticky', top: 0, zIndex: 1 }}>
                                                    <tr>
                                                        {Object.keys(previewData[0]).map(h => (
                                                            <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {previewData.map((row, i) => (
                                                        <tr key={i} style={{
                                                            background: i % 2 === 0 ? 'transparent' : 'var(--bg-card)'
                                                        }}>
                                                            {Object.values(row).map((val: any, j) => (
                                                                <td key={j} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>
                                                                    {val?.toString() || ''}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <span style={{ fontSize: 14, fontWeight: 600 }}>Preview not available</span>
                                            <span style={{ fontSize: 12 }}>Purchase to access the full dataset</span>
                                        </div>
                                    )}
                                    {!isPurchased && previewData && (
                                        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 40, background: 'linear-gradient(to top, var(--bg-card) 0%, transparent 100%)' }}>
                                            <div style={{
                                                pointerEvents: 'auto',
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 12,
                                                padding: '16px 24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                boxShadow: 'var(--shadow-xl)'
                                            }}>
                                                <Lock size={18} color="var(--brand)" />
                                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Full dataset locked — purchase to unlock</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                                <div style={statCardStyle}>
                                    <span style={statLabelStyle}>Records / Rows</span>
                                    <span style={statValueStyle}>{parseInt(listing.rowCount).toLocaleString()} Rows</span>
                                </div>
                                <div style={statCardStyle}>
                                    <span style={statLabelStyle}>File Size</span>
                                    <span style={statValueStyle}>{listing.fileSize}</span>
                                </div>
                                <div style={statCardStyle}>
                                    <span style={statLabelStyle}>Format</span>
                                    <span style={statValueStyle}>{listing.fileFormat}</span>
                                </div>
                                <div style={statCardStyle}>
                                    <span style={statLabelStyle}>Category</span>
                                    <span style={statValueStyle}>{listing.category}</span>
                                </div>
                                <div style={statCardStyle}>
                                    <span style={statLabelStyle}>Availability</span>
                                    <span style={statValueStyle}>99.9% Up-time</span>
                                </div>
                                <div style={statCardStyle}>
                                    <span style={statLabelStyle}>Listed</span>
                                    <span style={statValueStyle}>{listedAt ? formatDistanceToNow(listedAt, { addSuffix: true }) : '—'}</span>
                                </div>
                            </div>
                        )}

                        {activeTab === 'provenance' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <span style={statLabelStyle}>Content Identifier (CID)</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)', overflowWrap: 'anywhere' }}>{listing.cid}</span>
                                            <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--success)' : 'var(--text-3)', padding: 0 }}>
                                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <span style={statLabelStyle}>Contract</span>
                                            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>0x5e0d...3315</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <span style={statLabelStyle}>Network</span>
                                            <span style={{ fontSize: 13, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
                                                Filecoin Calibration (314159)
                                            </span>
                                        </div>
                                    </div>

                                    <a
                                        href={`https://calibration.filfox.info/en/address/0x5e0d9D7d89cB375Cc9311815dF9cAdD2B0ea3315`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--brand)', textDecoration: 'none', fontWeight: 600, marginTop: 8 }}
                                    >
                                        View on explorer <ExternalLink size={14} />
                                    </a>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 20, background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: 12 }}>
                                    <ShieldCheck size={24} color="#10b981" />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#065f46' }}>Verified Provenance</span>
                                        <span style={{ fontSize: 12, color: '#065f46', opacity: 0.8 }}>This dataset has been cryptographically signed and archived.</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN - PURCHASE CARD */}
                <aside style={{
                    position: windowWidth > 992 ? 'sticky' : 'static',
                    top: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                    width: '100%'
                }}>
                    <Card style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-xl)' }}>
                        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                                <span style={statLabelStyle}>List Price</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                                    <span style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>{priceFIL}</span>
                                    <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>FIL</span>
                                </div>
                                {priceUSD && <span style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>≈ ${priceUSD} USD</span>}
                            </div>

                            <div style={{ height: 1, background: 'var(--border)', opacity: 0.5 }} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)' }}>
                                    <span>Platform Fee (2.5%)</span>
                                    <span style={{ fontFamily: 'var(--font-mono)' }}>{platformFee.toFixed(4)} FIL</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                                    <span>Seller Receives</span>
                                    <span style={{ fontFamily: 'var(--font-mono)' }}>{sellerNet.toFixed(4)} FIL</span>
                                </div>
                            </div>

                            {isPurchased ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontSize: 13, fontWeight: 700, background: 'rgba(52, 211, 153, 0.1)', padding: '10px', borderRadius: 8, justifyContent: 'center' }}>
                                        <ShieldCheck size={18} /> You own this dataset
                                    </div>
                                    <Button size="xl" style={{ width: '100%' }}>
                                        <Download className="mr-2 w-5 h-5" /> Download Now
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    size="xl"
                                    style={{ width: '100%', fontSize: 16, height: 56 }}
                                    onClick={!account ? undefined : handleBuy} // Parent app should handle connect
                                    loading={buying}
                                >
                                    {!account ? (
                                        <span onClick={(e) => { e.stopPropagation(); navigate('/sell'); }}>Connect Wallet to Buy</span>
                                    ) : (
                                        <><ShoppingBag className="mr-2 w-5 h-5" /> Purchase Dataset</>
                                    )}
                                </Button>
                            )}
                        </div>

                        <div style={{ background: 'var(--bg-subtle)', padding: 20, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <DiceBearAvatar seed={listing.seller} size={36} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>SELLER</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{listing.seller.slice(0, 8)}...{listing.seller.slice(-6)}</span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: 13, fontWeight: 700 }}>{salesCount}</span>
                                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>Sales</span>
                                </div>
                                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>
                                        No Ratings
                                    </div>
                                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>reputation</span>
                                </div>
                                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: 13, fontWeight: 700 }}>{listedAt ? formatDistanceToNow(listedAt) : '—'}</span>
                                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>Listed</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 20, fontSize: 9, fontWeight: 700, color: 'var(--text-3)' }}>
                                    <Lock size={10} /> SECURE
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 20, fontSize: 9, fontWeight: 700, color: 'var(--text-3)' }}>
                                    <ShieldCheck size={10} /> FILECOIN
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                        <Clock size={14} />
                        <span>Instant access on confirmation</span>
                    </div>
                </aside>

            </div>
        </div>
    )
}
