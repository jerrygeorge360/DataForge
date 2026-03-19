import { useState } from 'react'
import { BrowserProvider } from 'ethers'
import { ShoppingBag, Database, BarChart3, ShieldCheck, Zap } from 'lucide-react'
import BuyerDashboard from '../components/BuyerDashboard'
import ProducerDashboard from '../components/ProducerDashboard'
import MyPurchases from '../components/MyPurchases'
import BountyBoard from '../components/BountyBoard'
import ProducerAnalytics from '../components/ProducerAnalytics'

interface DashboardProps {
    provider: BrowserProvider
    account: string
}

type View = 'buy' | 'sell' | 'purchases' | 'bounties' | 'stats'

export default function Dashboard({ provider, account }: DashboardProps) {
    const [view, setView] = useState<View>('buy')

    if (!provider || !account) return null

    const tabs = [
        { id: 'buy' as View, label: 'Marketplace', icon: ShoppingBag },
        { id: 'sell' as View, label: 'My Listings', icon: Database },
        { id: 'bounties' as View, label: 'Bounty Board', icon: Zap },
        { id: 'stats' as View, label: 'Analytics', icon: BarChart3 },
        { id: 'purchases' as View, label: 'My Vault', icon: ShieldCheck },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Header with Tab Navigation */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                paddingBottom: 4,
                borderBottom: '1px solid var(--border)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16
                }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)' }}>
                        {tabs.find(t => t.id === view)?.label}
                    </h1>

                    {/* Tab nav */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--bg-subtle)',
                        padding: 4,
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        gap: 4
                    }}>
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const active = view === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setView(tab.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '8px 16px',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        minWidth: '120px',
                                        justifyContent: 'center',
                                        border: active ? '1px solid var(--border)' : '1px solid transparent',
                                        background: active ? '#FFFFFF' : 'transparent',
                                        color: active ? 'var(--brand)' : 'var(--text-3)',
                                        boxShadow: active ? 'var(--shadow-sm)' : 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <Icon size={16} />
                                    <span>{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Content area */}
            <div style={{ minHeight: 500 }}>
                {view === 'buy' && (
                    <BuyerDashboard provider={provider} />
                )}
                {view === 'sell' && (
                    <ProducerDashboard provider={provider} account={account} />
                )}
                {view === 'bounties' && (
                    <BountyBoard provider={provider} />
                )}
                {view === 'stats' && (
                    <ProducerAnalytics provider={provider} account={account} />
                )}
                {view === 'purchases' && (
                    <MyPurchases provider={provider} account={account} />
                )}
            </div>

        </div>
    )
}
