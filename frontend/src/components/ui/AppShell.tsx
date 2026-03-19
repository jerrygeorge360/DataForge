import * as React from "react"
import { useLocation}from "react-router-dom"
import { Sidebar}from "./Sidebar"
import { MobileTabs}from "./MobileTabs"
import { WalletButton}from "./WalletButton"
import ThemeToggle from "../ThemeToggle"

interface AppShellProps {
    children: React.ReactNode
    account: string
    balance?: bigint
    onConnect: () => void
    onDisconnect?: () => void
    isConnecting?: boolean
    onBuyCrypto?: () => void
}

export function AppShell({
    children,
    account,
    balance,
    onConnect,
    onDisconnect,
    isConnecting,
    onBuyCrypto
}: AppShellProps) {
    const location = useLocation()

    // Define workspace routes
    const isWorkspace = location.pathname.startsWith('/dashboard') ||
        location.pathname.startsWith('/sell')

    if (!isWorkspace) {
        return <main className="min-h-screen bg-primary">{children}</main>
    }

    return (
        <div className="app-shell">
            {/* Desktop Sidebar */}
            <Sidebar
                account={account}
                balance={balance}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
                onBuyCrypto={onBuyCrypto}
                isConnecting={isConnecting}
            />

            {/* Mobile Top Bar */}
            <header className="mobile-topbar">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
                        <span className="text-white font-bold">D</span>
                    </div>
                    <span className="page-title">DATAFORGE</span>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <WalletButton
                        account={account}
                        balance={balance}
                        onConnect={onConnect}
                        onDisconnect={onDisconnect}
                        isConnecting={isConnecting}
                        onBuyCrypto={onBuyCrypto}
                    />
                </div>
            </header>

            {/* Main Content Area */}
            <main className="main-content">
                <header className="page-header">
                    <h1 className="page-title">
                        {location.pathname === '/browse' ? 'Marketplace' :
                            location.pathname === '/dashboard' ? 'Dashboard' :
                                location.pathname === '/sell' ? 'List Dataset' : 'Workspace'}
                    </h1>
                    <div className="hidden lg:flex items-center gap-4">
                        <WalletButton
                            account={account}
                            balance={balance}
                            onConnect={onConnect}
                            onDisconnect={onDisconnect}
                            isConnecting={isConnecting}
                            onBuyCrypto={onBuyCrypto}
                        />
                    </div>
                </header>
                <div className="page-body">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Tabs */}
            <MobileTabs account={account} />
        </div>
    )
}
