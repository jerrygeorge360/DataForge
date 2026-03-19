import { Button } from "./Button"
import { Card } from "./Card"
import { ShieldCheck, Zap, Lock, CreditCard } from "lucide-react"

interface ConnectCardProps {
    onConnect: () => void
    onBuyCrypto?: () => void
    isConnecting?: boolean
}

export function ConnectCard({ onConnect, onBuyCrypto, isConnecting }: ConnectCardProps) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            minHeight: '400px'
        }}>
            <Card style={{
                maxWidth: 440,
                width: '100%',
                padding: 40,
                borderRadius: 12,
                boxShadow: 'var(--shadow-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: 24
            }}>
                {/* Shield Icon Header */}
                <div style={{
                    margin: '0 auto',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'var(--brand-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <ShieldCheck size={48} color="var(--brand)" />
                </div>

                {/* Text Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h2 style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: 'var(--text-1)',
                        margin: 0
                    }}>
                        Connect Your Wallet
                    </h2>
                    <p style={{
                        fontSize: 14,
                        color: 'var(--text-2)',
                        lineHeight: 1.6,
                        margin: 0
                    }}>
                        Access your dashboard to list datasets, track sales, and manage your data products on Filecoin.
                    </p>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Button
                        variant="primary"
                        onClick={onConnect}
                        loading={isConnecting}
                        style={{
                            width: '100%',
                            height: 48,
                            fontSize: 15,
                            fontWeight: 600
                        }}
                    >
                        Connect MetaMask
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onBuyCrypto}
                        style={{
                            width: '100%',
                            height: 48,
                            fontSize: 15,
                            fontWeight: 600,
                            background: 'var(--bg-subtle)',
                            color: 'var(--text-1)',
                            border: '1px solid var(--border-strong)'
                        }}
                    >
                        <CreditCard size={18} style={{ marginRight: 8 }} />
                        Buy Crypto with Card
                    </Button>
                </div>

                {/* Divider */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    margin: '8px 0'
                }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>OR</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
                </div>

                {/* Feature Badges */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 16,
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 12 }}>
                        <Lock size={14} />
                        <span>Secure</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 12 }}>
                        <Zap size={14} />
                        <span>Instant</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 12 }}>
                        <ShieldCheck size={14} />
                        <span>Verified</span>
                    </div>
                </div>
            </Card>
        </div>
    )
}
