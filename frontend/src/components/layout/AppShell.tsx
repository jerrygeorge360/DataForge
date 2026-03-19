import React from 'react'
import Sidebar from './Sidebar'
import MobileTabs from './MobileTabs'
import MobileTopbar from './MobileTopbar'

interface AppShellProps {
    children: React.ReactNode
    account: string
    balance: bigint
    onConnect: () => void
    onDisconnect: () => void
    isConnecting: boolean
    onBuyCrypto: () => void
}

export default function AppShell({
    children,
    account,
    balance,
    onConnect,
    onDisconnect,
    onBuyCrypto
}: AppShellProps) {

    return (
        <div className="app-root">
            {/* Desktop Sidebar */}
            <Sidebar
                account={account}
                balance={balance}
                onDisconnect={onDisconnect}
                onBuyCrypto={onBuyCrypto}
            />

            {/* Mobile Header */}
            <MobileTopbar account={account} onConnect={onConnect} />

            {/* Main Content */}
            <main className="app-main-protected">
                {children}
            </main>

            {/* Mobile Tabs */}
            <MobileTabs />
        </div>
    )
}
