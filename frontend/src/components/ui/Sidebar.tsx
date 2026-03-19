import { Link, useLocation}from "react-router-dom"
import {
    LayoutDashboard,
    Search,
    Upload,
    BarChart2,
    Shield
} from "lucide-react"
import { cn}from "../../lib/utils"
import ThemeToggle from "../ThemeToggle"
import { WalletButton}from "./WalletButton"

interface SidebarProps {
    account: string
    balance?: bigint
    onConnect: () => void
    onDisconnect?: () => void
    onBuyCrypto?: () => void
    isConnecting?: boolean
}

const NAV_ITEMS = [
    { label: 'Browse Marketplace', path: '/browse', icon: Search },
    { label: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Sell Station', path: '/sell', icon: Upload },
    { label: 'Bounty Board', path: '/dashboard/bounties', icon: Shield },
    { label: 'Analytics', path: '/dashboard/analytics', icon: BarChart2 },
]

export function Sidebar({
    account,
    balance,
    onConnect,
    onDisconnect,
    onBuyCrypto,
    isConnecting
}: SidebarProps) {
    const location = useLocation()

    return (
        <>
            {/* Sidebar Container */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <Link to="/" className="flex items-center gap-2 no-underline text-inherit">
                        <div className="w-6 h-6 bg-accent rounded flex items-center justify-center">
                            <span className="text-white text-xs">D</span>
                        </div>
                        DATAFORGE
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/browse' && location.pathname.startsWith(item.path))
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn("nav-item", isActive && "active")}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="sidebar-bottom">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                            Theme
                        </span>
                        <ThemeToggle />
                    </div>

                    <WalletButton
                        account={account}
                        balance={balance}
                        onConnect={onConnect}
                        onDisconnect={onDisconnect}
                        onBuyCrypto={onBuyCrypto}
                        isConnecting={isConnecting}
                        className="w-full"
                    />

                    <div className="bg-subtle p-2 text-center rounded">
                        <span className="text-[10px] font-bold text-success flex items-center justify-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-success animate-pulse" />
                            NETWORK_CALIBRATION
                        </span>
                    </div>
                </div>
            </aside>
        </>
    )
}
