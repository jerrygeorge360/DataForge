import React, { useState, useEffect, useCallback } from 'react'
import { BrowserProvider, JsonRpcProvider } from 'ethers'
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

const PUBLIC_RPC = 'https://api.calibration.node.glif.io/rpc/v1'
const fallbackProvider = new JsonRpcProvider(PUBLIC_RPC)

async function getSafeProvider(walletProvider: BrowserProvider | null, fallback: any) {
  if (!walletProvider) return fallback
  try {
    const network = await walletProvider.getNetwork()
    if (network.chainId !== 314159n) return fallback
    return walletProvider
  } catch {
    return fallback
  }
}

function App() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [activeProvider, setActiveProvider] = useState<any>(fallbackProvider)
  const [isWrongNetwork, setIsWrongNetwork] = useState(false)
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

  const checkNetwork = useCallback(async (p: BrowserProvider | null) => {
    const safe = await getSafeProvider(p, fallbackProvider)
    setActiveProvider(safe)
    setIsWrongNetwork(p !== null && safe === fallbackProvider)
    return safe
  }, [])

  useEffect(() => {
    const ethereum = (window as any).ethereum
    if (ethereum && typeof ethereum.on === 'function') {
      ethereum.on('accountsChanged', async (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          const p = new BrowserProvider(ethereum)
          setProvider(p)
          const safe = await checkNetwork(p)
          await fetchBalance(accounts[0], safe instanceof BrowserProvider ? safe : p)
        } else {
          setAccount('')
          setProvider(null)
          setBalance(0n)
          checkNetwork(null)
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
      const safe = await checkNetwork(p)
      await fetchBalance(accounts[0], safe instanceof BrowserProvider ? safe : p)
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
    checkNetwork(null)
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
              <Browse provider={activeProvider} isWrongNetwork={isWrongNetwork} />
            </PublicLayout>
          }
        />
        <Route
          path="/listing/:id"
          element={
            <PublicLayout account={account} onConnect={connectWallet}>
              <ListingDetail account={account} provider={activeProvider} isWrongNetwork={isWrongNetwork} />
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
                <Dashboard provider={activeProvider} account={account} />
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
                <SellerOnboarding provider={activeProvider} account={account} />
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
