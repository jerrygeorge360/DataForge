import { Link, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Search,
    PlusSquare,
    LogOut,
    Settings,
    HelpCircle,
    Database,
    Bot
} from 'lucide-react'
import { formatEther } from 'ethers'
import ThemeToggle from '../ThemeToggle'
import { DiceBearAvatar } from './DiceBearAvatar'

interface SidebarProps {
    account: string
    balance: bigint
    onDisconnect: () => void
    onBuyCrypto: () => void
}

export default function Sidebar({ account, balance, onDisconnect, onBuyCrypto }: SidebarProps) {
    const location = useLocation()

    const navItems = [
        { label: 'Marketplace', icon: Search, path: '/browse' },
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'List Dataset', icon: PlusSquare, path: '/sell' },
    ]

    const secondaryItems = [
        { label: 'Agent Access', icon: Bot, path: '/agent' },
        { label: 'Settings', icon: Settings, path: '/settings' },
        { label: 'Documentation', icon: HelpCircle, path: '/docs' },
    ]

    const isActive = (path: string) => {
        if (path === '/dashboard') return location.pathname.startsWith('/dashboard')
        return location.pathname === path
    }

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-header">
                <Link to="/" className="landing-navbar-logo" style={{ textDecoration: 'none' }}>
                    <Database className="w-6 h-6" />
                    <span style={{ fontSize: '20px', fontWeight: '700' }}>DataForge</span>
                </Link>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                <div className="sidebar-nav-section-title">
                    Menu
                </div>
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                    >
                        <item.icon style={{ width: '20px', height: '20px' }} />
                        {item.label}
                    </Link>
                ))}

                <div className="sidebar-nav-section-title" style={{ marginTop: '32px' }}>
                    Support
                </div>
                {secondaryItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                    >
                        <item.icon style={{ width: '20px', height: '20px' }} />
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="sidebar-footer">
                <div className="sidebar-user-card">
                    <DiceBearAvatar seed={account} size={32} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {account.slice(0, 6)}...{account.slice(-4)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--brand)', fontWeight: '600' }}>
                            {parseFloat(formatEther(balance)).toFixed(4)} tFIL
                        </div>
                    </div>
                </div>

                <div className="sidebar-footer-actions" style={{ marginTop: '4px', display: 'flex', gap: '8px' }}>
                    <ThemeToggle />
                    <button
                        onClick={onBuyCrypto}
                        className="btn-brand"
                        style={{ padding: '8px 12px', height: 'auto', fontSize: '12px', flex: 1 }}
                    >
                        Buy tFIL
                    </button>
                    <button
                        onClick={onDisconnect}
                        className="btn-ghost"
                        style={{ padding: '8px', height: 'auto', color: 'var(--error)' }}
                        title="Disconnect Wallet"
                    >
                        <LogOut style={{ width: '18px', height: '18px' }} />
                    </button>
                </div>
            </div>
        </aside>
    )
}
