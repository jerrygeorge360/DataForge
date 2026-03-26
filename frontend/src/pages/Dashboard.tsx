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
        { id: 'buy'       as View, label: 'Marketplace', icon: ShoppingBag },
        { id: 'sell'      as View, label: 'My Listings',  icon: Database    },
        { id: 'bounties'  as View, label: 'Bounty Board', icon: Zap         },
        { id: 'stats'     as View, label: 'Analytics',    icon: BarChart3   },
        { id: 'purchases' as View, label: 'My Vault',     icon: ShieldCheck },
    ]

    const activeTab = tabs.find(t => t.id === view)!

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                paddingBottom: 4,
                borderBottom: '1px solid var(--border)',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>
                        {activeTab.label}
                    </h1>

                    {/* ── Desktop tab strip (hidden on mobile) ─────────── */}
                    <div className="dash-tabs-desktop">
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
                                        minWidth: 120,
                                        justifyContent: 'center',
                                        border: active ? '1px solid var(--border)' : '1px solid transparent',
                                        background: active ? 'var(--bg-card)' : 'transparent',
                                        color: active ? 'var(--brand)' : 'var(--text-3)',
                                        boxShadow: active ? 'var(--shadow-sm)' : 'none',
                                        transition: 'all 0.2s ease',
                                        whiteSpace: 'nowrap',
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

            {/* ── Mobile scrollable pill tabs (hidden on desktop) ──────── */}
            <div className="dash-tabs-mobile">
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
                                gap: 6,
                                padding: '7px 14px',
                                fontSize: 13,
                                fontWeight: 600,
                                borderRadius: 99,
                                cursor: 'pointer',
                                flexShrink: 0,
                                border: active
                                    ? '1px solid var(--border-focus)'
                                    : '1px solid var(--border)',
                                background: active ? 'var(--brand-light)' : 'var(--bg-card)',
                                color: active ? 'var(--brand)' : 'var(--text-3)',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <Icon size={15} />
                            <span>{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* ── Content ─────────────────────────────────────────────── */}
            <div style={{ minHeight: 400 }}>
                {view === 'buy'       && <BuyerDashboard    provider={provider} />}
                {view === 'sell'      && <ProducerDashboard provider={provider} account={account} />}
                {view === 'bounties'  && <BountyBoard       provider={provider} />}
                {view === 'stats'     && <ProducerAnalytics provider={provider} account={account} />}
                {view === 'purchases' && <MyPurchases       provider={provider} account={account} />}
            </div>

            <style>{`
                /* ── Desktop tab strip ───────────────────────────────── */
                .dash-tabs-desktop {
                    display: flex;
                    align-items: center;
                    background: var(--bg-subtle);
                    padding: 4px;
                    border-radius: 8px;
                    border: 1px solid var(--border);
                    gap: 4px;
                    flex-shrink: 0;
                }

                /* ── Mobile pill row (horizontal scroll) ─────────────── */
                .dash-tabs-mobile {
                    display: none;
                    gap: 8px;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    padding-bottom: 4px;
                    /* fade out at the edges */
                    mask-image: linear-gradient(
                        to right,
                        transparent 0px,
                        black 12px,
                        black calc(100% - 12px),
                        transparent 100%
                    );
                    /* hide scrollbar but keep scrolling */
                    scrollbar-width: none;
                }
                .dash-tabs-mobile::-webkit-scrollbar { display: none; }

                /* ── Breakpoints ─────────────────────────────────────── */

                /* Tablet: shrink tab labels */
                @media (max-width: 900px) {
                    .dash-tabs-desktop button {
                        min-width: 0 !important;
                        padding: 8px 12px !important;
                        font-size: 12px !important;
                    }
                }

                /* Mobile: swap to pill row */
                @media (max-width: 680px) {
                    .dash-tabs-desktop { display: none; }
                    .dash-tabs-mobile  { display: flex;  }
                }
            `}</style>
        </div>
    )
}