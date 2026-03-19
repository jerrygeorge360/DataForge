import { Link, useLocation } from 'react-router-dom'
import { Search, PlusSquare, LayoutDashboard, User } from 'lucide-react'

export default function MobileTabs() {
    const location = useLocation()

    const tabs = [
        { label: 'Browse', icon: Search, path: '/browse' },
        { label: 'Sell', icon: PlusSquare, path: '/sell' },
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Me', icon: User, path: '/profile' },
    ]

    const isActive = (path: string) => {
        if (path === '/dashboard') return location.pathname.startsWith('/dashboard')
        return location.pathname === path
    }

    return (
        <div className="lg-hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 50 }}>
            {tabs.map((tab) => (
                <Link
                    key={tab.path}
                    to={tab.path}
                    className="flex flex-col items-center justify-center"
                    style={{ gap: '4px', textDecoration: 'none', color: isActive(tab.path) ? 'var(--brand)' : 'var(--text-3)', WebkitTapHighlightColor: 'transparent' }}
                >
                    <tab.icon style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontSize: '10px', fontWeight: '500' }}>{tab.label}</span>
                </Link>
            ))}
        </div>
    )
}
