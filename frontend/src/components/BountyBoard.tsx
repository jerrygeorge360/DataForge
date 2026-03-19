import { useState, useEffect } from 'react'
import { BrowserProvider, formatEther, parseEther } from 'ethers'
import {
    Target,
    CloudUpload,
    Target as TargetIcon
} from 'lucide-react'
import { useMarketplace } from '../hooks/useMarketplace'
import { useFilPrice } from '../hooks/useFilPrice'
import { Button } from './ui/Button'

interface BountyBoardProps {
    provider: BrowserProvider
}

export default function BountyBoard({ provider }: BountyBoardProps) {
    const { getActiveBounties, getBountyDetails, createBounty, getBountyCount } = useMarketplace(provider)
    const { price: filPrice } = useFilPrice()

    const [bounties, setBounties] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [reward, setReward] = useState('')
    const [description, setDescription] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [refresh, setRefresh] = useState(0)
    const [windowWidth, setWindowWidth] = useState(window.innerWidth)

    const [stats, setStats] = useState({
        totalRewards: 0n,
        fulfilled: 0,
        active: 0
    })

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        let cancelled = false
        const loadBounties = async () => {
            setLoading(true)
            try {
                // Get active bounties for display
                const activeIds = await getActiveBounties()
                const activeDetails = await Promise.all(activeIds.map(id => getBountyDetails(id)))
                const activeBountiesList = activeDetails.map((b, i) => ({ ...b, id: activeIds[i] }))

                // Get all bounties for accurate stats
                const count = await getBountyCount()
                const allIds = Array.from({ length: Number(count) }, (_, i) => BigInt(i))
                const allBounties = await Promise.all(allIds.map(id => getBountyDetails(id)))

                const totalRewards = allBounties.reduce((sum, b) => sum + (b?.reward || 0n), 0n)
                const fulfilled = allBounties.filter(b => b?.fulfilled).length
                const active = allBounties.filter(b => b?.active).length

                if (!cancelled) {
                    setBounties(activeBountiesList)
                    setStats({
                        totalRewards,
                        fulfilled,
                        active
                    })
                }
            } catch (err) {
                console.error('Failed to load bounties:', err)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        loadBounties()
        return () => { cancelled = true }
    }, [getActiveBounties, getBountyDetails, getBountyCount, refresh])

    const handlePost = async () => {
        if (!reward || !description) return
        setSubmitting(true)
        try {
            await createBounty(description, parseEther(reward))
            setReward('')
            setDescription('')
            setRefresh(prev => prev + 1)
        } catch (err) {
            console.error('Failed to post bounty:', err)
        } finally {
            setSubmitting(false)
        }
    }

    const priceUSD = (val: string) => {
        const fil = parseFloat(val || '0')
        return (fil * filPrice).toFixed(2)
    }

    const labelStyle: React.CSSProperties = {
        fontSize: 11,
        textTransform: 'uppercase',
        color: 'var(--text-3)',
        letterSpacing: '0.8px',
        fontWeight: 700,
        marginBottom: 6,
        display: 'block'
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

    const cardStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '24px 28px'
    }

    const pillStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-2)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap'
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.7s ease-out' }}>
            {/* 1. Hero Banner */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(1, 118, 211, 0.12) 0%, rgba(88, 28, 255, 0.08) 100%)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '24px 28px',
                display: 'flex',
                flexDirection: windowWidth > 992 ? 'row' : 'column',
                justifyContent: 'space-between',
                alignItems: windowWidth > 992 ? 'center' : 'flex-start',
                gap: 24
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)' }}>Bounty Board</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
                        Post a data request. Suppliers compete to fulfill it. Pay only on delivery.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={pillStyle}>💰 Total Rewards: {formatEther(stats.totalRewards)} FIL</div>
                    <div style={pillStyle}>✅ Fulfilled: {stats.fulfilled}</div>
                    <div style={pillStyle}>⏳ Active: {stats.active}</div>
                </div>
            </div>

            {/* 2. Active Bounties Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '8px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TargetIcon size={20} color="var(--brand)" /> Active Bounties
                </h2>

                {loading ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>Loading active bounties...</div>
                ) : bounties.length === 0 ? (
                    <div style={{
                        padding: 48,
                        textAlign: 'center',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <Target size={48} color="var(--text-3)" style={{ opacity: 0.5 }} />
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>No active bounties yet</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Be the first to post a data request</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                        {bounties.map((b) => (
                            <div key={b.id.toString()} style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: 12,
                                padding: '16px 20px',
                                display: 'flex',
                                flexDirection: windowWidth > 640 ? 'row' : 'column',
                                justifyContent: 'space-between',
                                alignItems: windowWidth > 640 ? 'center' : 'flex-start',
                                gap: 20
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{b.description}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                                        Posted by {b.buyer.slice(0, 6)}...{b.buyer.slice(-4)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: windowWidth > 640 ? 'center' : 'flex-start', gap: 2, minWidth: 100 }}>
                                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>
                                        {formatEther(b.reward)}
                                    </span>
                                    <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600 }}>FIL reward</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <span style={{
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        color: '#22c55e',
                                        borderRadius: 20,
                                        padding: '3px 10px',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6
                                    }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} /> Active
                                    </span>
                                    <Button variant="ghost" size="sm" className="border border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white h-9 px-4">
                                        Fulfill Bounty
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. Broadcast Request Section */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CloudUpload size={20} color="var(--brand)" />
                        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Broadcast Request</h2>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Reward data providers from your network</p>
                </div>

                <div style={{ display: 'flex', flexDirection: windowWidth > 992 ? 'row' : 'column', gap: 32 }}>
                    {/* Form Left (60%) */}
                    <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={labelStyle}>Data Requirement</label>
                            <textarea
                                style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }}
                                rows={4}
                                placeholder="Describe exactly what data you need — format, date range, geography, schema..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={labelStyle}>Reward Amount</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number"
                                    style={{
                                        ...inputStyle,
                                        fontSize: 18,
                                        fontWeight: 700,
                                        fontFamily: 'var(--font-mono)',
                                        paddingRight: 50,
                                        height: 48
                                    }}
                                    placeholder="0.00"
                                    value={reward}
                                    onChange={e => setReward(e.target.value)}
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
                            <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span>≈ ${priceUSD(reward)} USD</span>
                            </div>
                        </div>

                        <button
                            onClick={handlePost}
                            disabled={submitting}
                            style={{
                                background: 'var(--brand)',
                                color: 'white',
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 14,
                                fontWeight: 600,
                                border: 'none',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                opacity: submitting ? 0.7 : 1,
                                width: '100%',
                                marginTop: 4,
                                transition: 'all 0.2s'
                            }}
                        >
                            {submitting ? 'Publishing...' : 'Publish Bounty'}
                        </button>
                    </div>

                    {/* How it works Right (40%) */}
                    <div style={{ flex: '1 1 40%' }}>
                        <div style={{
                            background: 'var(--bg-subtle)',
                            borderRadius: 10,
                            padding: 20,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 20,
                            height: '100%'
                        }}>
                            <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>How it works</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                                {[
                                    { step: '1', title: 'Describe your data need', icon: '📝' },
                                    { step: '2', title: 'Set your FIL reward', icon: '💰' },
                                    { step: '3', title: 'Suppliers notified', icon: '🔔' },
                                    { step: '4', title: 'Pay only when fulfilled', icon: '✅' }
                                ].map((item, idx, arr) => (
                                    <div key={item.step} style={{ display: 'flex', gap: 16, position: 'relative', paddingBottom: idx === arr.length - 1 ? 0 : 24 }}>
                                        {idx !== arr.length - 1 && (
                                            <div style={{
                                                position: 'absolute',
                                                left: 10,
                                                top: 24,
                                                bottom: 0,
                                                width: 1,
                                                background: 'var(--brand)',
                                                opacity: 0.3
                                            }} />
                                        )}
                                        <div style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            background: 'var(--brand)',
                                            color: 'white',
                                            fontSize: 10,
                                            fontWeight: 800,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 1,
                                            flexShrink: 0
                                        }}>
                                            {item.step}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{item.icon} {item.title}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
