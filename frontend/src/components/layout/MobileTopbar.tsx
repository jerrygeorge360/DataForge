import { Link } from 'react-router-dom'
import { Database } from 'lucide-react'
import ThemeToggle from '../ThemeToggle'
import { DiceBearAvatar } from './DiceBearAvatar'

interface MobileTopbarProps {
    account: string
    onConnect: () => void
}

export default function MobileTopbar({ account, onConnect }: MobileTopbarProps) {
    return (
        <div className="lg-hidden" style={{ position: 'sticky', top: 0, height: '56px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
            <Link to="/" className="flex items-center" style={{ gap: '8px', textDecoration: 'none' }}>
                <Database style={{ width: '20px', height: '20px', color: 'var(--brand)' }} />
                <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--brand)' }}>DataForge</span>
            </Link>

            <div className="flex items-center" style={{ gap: '12px' }}>
                <ThemeToggle />
                {account ? (
                    <DiceBearAvatar seed={account} size={32} />
                ) : (
                    <button
                        onClick={onConnect}
                        className="btn btn-sm btn-primary"
                    >
                        Connect
                    </button>
                )}
            </div>
        </div>
    )
}
