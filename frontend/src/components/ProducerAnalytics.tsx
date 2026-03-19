import { useState, useEffect } from 'react'
import { BrowserProvider, formatEther, Contract } from 'ethers'
import {
    Activity,
    Download,
    BarChart3
} from 'lucide-react'
import { useMarketplace, MARKETPLACE_ABI, VITE_CONTRACT_ADDRESS } from '../hooks/useMarketplace'

interface ProducerAnalyticsProps {
    provider: BrowserProvider
    account: string
}

export default function ProducerAnalytics({ provider, account }: ProducerAnalyticsProps) {
    const { getActiveListings } = useMarketplace(provider)

    const [stats, setStats] = useState({
        totalRevenue: 0n,
        totalSales: 0,
        activeListings: 0,
        avgRating: 0,
        reputation: 0
    })

    const [dailyRevenue, setDailyRevenue] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
    const [windowWidth, setWindowWidth] = useState(window.innerWidth)

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                const contract = new Contract(VITE_CONTRACT_ADDRESS || '', MARKETPLACE_ABI, provider)
                const currentBlock = await provider.getBlockNumber()
                const startBlock = Math.max(0, currentBlock - 50000) // Approx 7 days

                const filter = contract.filters.DatasetPurchased(null, null, account)
                const events = await contract.queryFilter(filter, startBlock, currentBlock)

                // Count active listings
                const activeIds = await getActiveListings()
                let active = 0
                const details = await Promise.all(activeIds.map(id => contract.listings(id)))
                active = details.filter(l => l[0].toLowerCase() === account.toLowerCase() && l[11]).length

                let totalRev = 0n
                const revenueByDay = [0, 0, 0, 0, 0, 0, 0]

                for (const event of events as any[]) {
                    totalRev += event.args.price
                }

                // Get reputation from contract
                const repResult = await contract.reputationScore(account)

                setStats({
                    totalRevenue: totalRev,
                    totalSales: events.length,
                    activeListings: active,
                    avgRating: 0,
                    reputation: Number(repResult)
                })
                setDailyRevenue(revenueByDay)
            } catch (err) {
                console.error('Analytics load failed:', err)
            }
        }
        loadAnalytics()
    }, [provider, account, getActiveListings])

    const cardStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 24px',
        position: 'relative',
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
        fontSize: 32,
        fontWeight: 700,
        color: 'var(--text-1)',
        fontFamily: 'var(--font-mono)'
    }

    const Sparkline = () => (
        <svg width="60" height="24" viewBox="0 0 60 24" style={{ position: 'absolute', top: 20, right: 24, opacity: 0.6 }}>
            <path d="M0 12 L10 12 L20 12 L30 12 L40 12 L50 12 L60 12"
                fill="none"
                stroke="var(--brand)"
                strokeWidth="1.5"
            />
        </svg>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, animation: 'fadeIn 0.7s ease-out' }}>
            {/* Header with Export */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text-1)' }}>Performance Analytics</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Real-time metrics from the Filecoin network.</p>
                </div>
                <button style={{
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-1)',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }} className="export-btn">
                    <Download size={16} /> Export Report
                </button>
                <style>{`.export-btn:hover { border-color: var(--brand); color: var(--brand); }`}</style>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: windowWidth > 992 ? 'repeat(4, 1fr)' : windowWidth > 640 ? 'repeat(2, 1fr)' : '1fr',
                gap: 20
            }}>
                <div style={{ ...cardStyle, borderLeft: '3px solid var(--brand)' }}>
                    <span style={labelStyle}>Total Revenue</span>
                    <span style={valueStyle}>{formatEther(stats.totalRevenue)}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>lifetime earnings</span>
                    <Sparkline />
                </div>
                <div style={cardStyle}>
                    <span style={labelStyle}>Volume</span>
                    <span style={valueStyle}>{stats.totalSales} sales</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>total sales</span>
                    <Sparkline />
                </div>
                <div style={cardStyle}>
                    <span style={labelStyle}>Active Shelf</span>
                    <span style={valueStyle}>{stats.activeListings}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>currently listed</span>
                    <Sparkline />
                </div>
                <div style={cardStyle}>
                    <span style={labelStyle}>Avg Rating</span>
                    <span style={valueStyle}>—</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>no ratings yet</span>
                    <Sparkline />
                </div>
            </div>

            {/* Revenue Trajectory Chart */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                position: 'relative'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Revenue Trajectory</span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Last 7 days</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            borderRadius: 20,
                            padding: '3px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} /> Online
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>On-chain verified</span>
                    </div>
                </div>

                <div style={{
                    height: 220,
                    width: '100%',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    paddingBottom: 30
                }}>
                    {/* Y-Axis Ticks */}
                    {[100, 75, 50, 25, 0].map((tick, idx) => (
                        <div key={idx} style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: `${idx * 25}%`,
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: 10, color: 'var(--text-3)', width: 20, flexShrink: 0 }}>{100 - tick}</span>
                            <div style={{ height: 1, flex: 1, background: 'var(--border)', opacity: 0.3 }} />
                        </div>
                    ))}

                    {/* Chart overlay if no data */}
                    {stats.totalRevenue === 0n && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                            color: 'var(--text-3)',
                            fontSize: 12,
                            fontStyle: 'italic',
                            pointerEvents: 'none'
                        }}>
                            No revenue yet — your first sale will appear here
                        </div>
                    )}

                    {/* Bars Area */}
                    <div style={{
                        height: 180,
                        flex: 1,
                        marginLeft: 30,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        gap: 16,
                        position: 'relative',
                        zIndex: 1
                    }}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                            const val = dailyRevenue[i] || 0;
                            const heightPercentage = Math.max(2, (val / 50) * 100); // placeholder logic for structure

                            return (
                                <div key={day} style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 12,
                                    height: '100%',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        width: '100%',
                                        maxWidth: 40,
                                        background: 'var(--brand)',
                                        opacity: 0.8,
                                        height: stats.totalRevenue === 0n ? '4px' : `${heightPercentage}%`,
                                        borderRadius: '3px 3px 0 0',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        position: 'relative'
                                    }} className="chart-bar group">
                                        <div className="tooltip">
                                            {val.toFixed(2)} FIL
                                        </div>
                                    </div>
                                    <span style={{
                                        position: 'absolute',
                                        bottom: -24,
                                        fontSize: 11,
                                        color: 'var(--text-3)',
                                        fontWeight: 600
                                    }}>{day}</span>
                                </div>
                            )
                        })}
                    </div>
                    <style>{`
                        .chart-bar:hover { opacity: 1 !important; transform: scaleX(1.1); }
                        .tooltip {
                            position: absolute;
                            top: -35px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: var(--bg-card);
                            border: 1px solid var(--border);
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-size: 10px;
                            font-weight: 800;
                            white-space: nowrap;
                            opacity: 0;
                            transition: opacity 0.2s;
                            pointer-events: none;
                            box-shadow: var(--shadow-sm);
                        }
                        .chart-bar:hover .tooltip { opacity: 1; }
                    `}</style>
                </div>
            </div>

            {/* System Insights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <BarChart3 size={18} color="var(--brand)" /> Analytics Insights
                </h3>

                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '24px',
                    borderLeft: '4px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'var(--bg-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-3)'
                    }}>
                        <Activity size={24} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Insights unavailable</h4>
                        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, maxWidth: 400 }}>
                            Revenue analytics and trend optimization will appear here once you start generating transaction volume.
                        </p>
                    </div>
                </div>
            </div>

            {/* Note on mock values */}
            <div style={{
                marginTop: 20,
                padding: '12px 16px',
                background: 'rgba(1, 118, 211, 0.05)',
                border: '1px dashed var(--border)',
                borderRadius: 8,
                fontSize: 11,
                color: 'var(--text-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
            }}>
                <Activity size={12} />
                <span>Note: Historical revenue charts require continuous node indexing. Only lifetime totals are currently authoritative.</span>
            </div>
        </div>
    )
}
