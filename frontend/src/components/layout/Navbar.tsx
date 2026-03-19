import { Link } from 'react-router-dom'
import { Database } from 'lucide-react'
import ThemeToggle from '../ThemeToggle'
import { DiceBearAvatar } from './DiceBearAvatar'

interface NavbarProps {
    account: string
    onConnect: () => void
}

export default function Navbar({ account, onConnect }: NavbarProps) {
    const navLinks = [
        { label: 'Browse Datasets', path: '/browse' },
        { label: 'How it Works', path: '/#how-it-works' },
        { label: 'Pricing', path: '/#pricing' },
    ]

    return (
        <header className="landing-navbar">
            {/* Logo */}
            <Link to="/" className="landing-navbar-logo">
                <Database /> <span>DataForge</span>
            </Link>

            {/* Center Links */}
            <nav className="landing-navbar-links" style={{ display: 'flex' }}>
                {navLinks.map((link) => (
                    <a
                        key={link.label}
                        href={link.path}
                    >
                        {link.label}
                    </a>
                ))}
                <Link to="/sell" style={{ color: 'inherit', textDecoration: 'none' }}>
                    Sell Data
                </Link>
            </nav>

            {/* Right Side */}
            <div className="flex items-center" style={{ gap: '16px' }}>
                <ThemeToggle />
                {account ? (
                    <Link to="/dashboard" className="flex items-center" style={{ gap: '12px', textDecoration: 'none' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-1)' }}>
                                {account.slice(0, 6)}...{account.slice(-4)}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>Dashboard</div>
                        </div>
                        <DiceBearAvatar seed={account} size={32} />
                    </Link>
                ) : (
                    <button
                        onClick={onConnect}
                        className="btn btn-md btn-primary"
                    >
                        Connect Wallet
                    </button>
                )}
            </div>
        </header>
    )
}
