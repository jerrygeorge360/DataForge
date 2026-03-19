import React from 'react'
import Navbar from './Navbar'

interface PublicLayoutProps {
    children: React.ReactNode
    account: string
    onConnect: () => void
}

export default function PublicLayout({ children, account, onConnect }: PublicLayoutProps) {
    return (
        <div className="app-root">
            <Navbar account={account} onConnect={onConnect} />
            <main className="app-main-public">
                {children}
            </main>
        </div>
    )
}
