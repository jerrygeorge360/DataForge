import { Link, useLocation}from "react-router-dom"
import { Search, LayoutDashboard, Upload, User}from "lucide-react"
import { cn}from "../../lib/utils"

interface MobileTabsProps {
    account?: string
}

export function MobileTabs({ account }: MobileTabsProps) {
    const location = useLocation()

    const tabs = [
        { label: 'Browse', path: '/browse', icon: Search },
        { label: 'Workspace', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Sell', path: '/sell', icon: Upload },
        { label: 'Profile', path: account ? `/profile/${account}` : '/connect', icon: User },
    ]

    const shortenedAddress = account
        ? `${account.slice(0, 4)}...${account.slice(-2)}`
        : "Connect"

    return (
        <nav className="mobile-bottom-tabs">
            {tabs.map((tab) => {
                const isActive = location.pathname.startsWith(tab.path)
                return (
                    <Link
                        key={tab.path}
                        to={tab.path}
                        className={cn("mobile-tab", isActive && "active")}
                    >
                        <tab.icon className="w-5 h-5" />
                        <span>
                            {tab.label === 'Profile' ? shortenedAddress : tab.label}
                        </span>
                    </Link>
                )
            })}
        </nav>
    )
}
