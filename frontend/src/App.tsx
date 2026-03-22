import React, { useState, useEffect, useCallback } from 'react'
import { BrowserProvider } from 'ethers'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Browse from './pages/Browse'
import ListingDetail from './pages/ListingDetail'
import SellerOnboarding from './pages/SellerOnboarding'
import Dashboard from './pages/Dashboard'
import AgentAccess from './pages/AgentAccess'
import TransakWidget from './components/TransakWidget'
import { ThemeProvider } from './context/ThemeContext'
import AppShell from './components/layout/AppShell'
import PublicLayout from './components/layout/PublicLayout'
import { ConnectCard } from './components/ui/ConnectCard'
import DebugStorage from './pages/DebugStorage'

function App() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [account, setAccount] = useState<string>('')
  const [balance, setBalance] = useState<bigint>(0n)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showTransak, setShowTransak] = useState(false)

  const fetchBalance = useCallback(async (addr: string, p: BrowserProvider) => {
    try {
      const b = await p.getBalance(addr)
      setBalance(b)
    } catch (err) {
      console.error('Failed to fetch balance:', err)
    }
  }, [])

  useEffect(() => {
    const ethereum = (window as any).ethereum
    if (ethereum && typeof ethereum.on === 'function') {
      ethereum.on('accountsChanged', async (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          const p = new BrowserProvider(ethereum)
          setProvider(p)
          await fetchBalance(accounts[0], p)
        } else {
          setAccount('')
          setProvider(null)
          setBalance(0n)
        }
      })

      ethereum.on('chainChanged', () => window.location.reload())
    }
  }, [fetchBalance])

  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      alert('MetaMask not found!')
      return
    }
    setIsConnecting(true)
    try {
      const p = new BrowserProvider((window as any).ethereum)
      const accounts = await p.send('eth_requestAccounts', [])
      setProvider(p)
      setAccount(accounts[0])
      await fetchBalance(accounts[0], p)
    } catch (err) {
      console.error('Connection failed:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAccount('')
    setProvider(null)
    setBalance(0n)
  }

  // Wrapper for routes to handle AppShell and Protection
  const WorkspaceRoute = ({ children }: { children: React.ReactNode }) => {
    if (!account) {
      return (
        <div className="flex-1 flex flex-col justify-center py-12">
          <ConnectCard
            onConnect={connectWallet}
            onBuyCrypto={() => setShowTransak(true)}
            isConnecting={isConnecting}
          />
        </div>
      )
    }
    return <>{children}</>
  }

  return (
    <ThemeProvider>
      <Routes>
        {/* Landing - UNWRAPPED (has its own navbar) */}
        <Route path="/" element={<Landing />} />

        {/* Public Routes - Wrapped in PublicLayout */}
        <Route
          path="/browse"
          element={
            <PublicLayout account={account} onConnect={connectWallet}>
              <Browse provider={provider} />
            </PublicLayout>
          }
        />
        <Route
          path="/listing/:id"
          element={
            <PublicLayout account={account} onConnect={connectWallet}>
              <ListingDetail account={account} provider={provider} />
            </PublicLayout>
          }
        />

        {/* Protected Routes - Wrapped in AppShell */}
        <Route
          path="/dashboard/*"
          element={
            <AppShell
              account={account}
              balance={balance}
              onConnect={connectWallet}
              onDisconnect={disconnectWallet}
              isConnecting={isConnecting}
              onBuyCrypto={() => setShowTransak(true)}
            >
              <WorkspaceRoute>
                <Dashboard provider={provider!} account={account} />
              </WorkspaceRoute>
            </AppShell>
          }
        />
        <Route
          path="/sell"
          element={
            <AppShell
              account={account}
              balance={balance}
              onConnect={connectWallet}
              onDisconnect={disconnectWallet}
              isConnecting={isConnecting}
              onBuyCrypto={() => setShowTransak(true)}
            >
              <WorkspaceRoute>
                <SellerOnboarding provider={provider} account={account} />
              </WorkspaceRoute>
            </AppShell>
          }
        />

        <Route
          path="/agent"
          element={
            <AppShell
              account={account}
              balance={balance}
              onConnect={connectWallet}
              onDisconnect={disconnectWallet}
              isConnecting={isConnecting}
              onBuyCrypto={() => setShowTransak(true)}
            >
              <WorkspaceRoute>
                <AgentAccess />
              </WorkspaceRoute>
            </AppShell>
          }
        />

        <Route
          path="/debug"
          element={
            <AppShell
              account={account}
              balance={balance}
              onConnect={connectWallet}
              onDisconnect={disconnectWallet}
              isConnecting={isConnecting}
              onBuyCrypto={() => setShowTransak(true)}
            >
              <WorkspaceRoute>
                <DebugStorage account={account} />
              </WorkspaceRoute>
            </AppShell>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <TransakWidget
        walletAddress={account}
        isOpen={showTransak}
        onClose={() => setShowTransak(false)}
      />
    </ThemeProvider>
  )
}

export default App
