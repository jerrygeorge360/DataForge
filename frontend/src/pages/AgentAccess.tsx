import  { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { Activity, Server, ShieldCheck } from 'lucide-react'

const AGENT_JSON = {
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "DataForge Platform Agent",
  "description": "Autonomous broker for Lit-encrypted datasets on DataForge. External agents discover datasets, pay via x402 (USDC on Base Sepolia), and receive decrypted data. Sellers earn FIL automatically via the onchain marketplace.",
  "version": "1.0.0",
  "image": "https://dataforge.app/logo.png",
  "operator": "0xce151D40926BAd0815B587B759609e746F469C84",
  "capabilities": [
    "dataset.discover",
    "dataset.broker",
    "dataset.decrypt"
  ],
  "services": [
    { "name": "discovery", "endpoint": "/listings" },
    { "name": "purchase", "endpoint": "/dataset/:id" },
    { "name": "health", "endpoint": "/health" }
  ],
  "payment": {
    "protocol": "x402",
    "network": "base-sepolia",
    "token": "USDC",
    "payTo": "0xce151D40926BAd0815B587B759609e746F469C84"
  },
  "storage": {
    "network": "filecoin-calibration",
    "sdk": "@filoz/synapse-sdk",
    "encryption": "lit-protocol-v8-naga"
  },
  "identity": {
    "standard": "ERC-8004",
    "chain": "base-mainnet"
  },
  "marketplace": "0x6bf20ca98180651F08a2cDfB29e449F2467a4Fd8"
}

export default function AgentAccess() {
  const [totalTransactions, setTotalTransactions] = useState<number | null>(null)

  useEffect(() => {
    fetch('https://dataforge.prodigal.sbs/health')
      .then(res => res.json())
      .then(data => {
        if (data && data.transactions !== undefined) {
          setTotalTransactions(data.transactions)
        }
      })
      .catch(err => {
        console.error('Failed to fetch agent health check:', err)
      })
  }, [])

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-1)' }}>
      <PageHeader
        title="Agent Access"
        subtitle="Programmatic interfaces and verified AI capabilities for DataForge."
      />

      <div className="flex flex-col gap-6 max-w-6xl mt-6">
        
        {/* TOP ROW: Identity + Live Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <Card className="lg:col-span-2 flex flex-col justify-between" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <CardHeader style={{ paddingBottom: '16px' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck style={{ color: 'var(--brand)', width: '18px', height: '18px' }} />
                  <CardTitle>Platform Agent Identity</CardTitle>
                </div>
                <Badge variant="success" className="animate-pulse">LIVE</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 text-sm mt-2">
                <div className="flex justify-between items-end border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                  <span style={{ color: 'var(--text-3)' }}>ERC-8004 Participant ID</span>
                  <span className="font-mono text-xs" style={{ color: 'var(--text-1)' }}>695fc25ca041417797f45e30a8317c82</span>
                </div>
                <div className="flex justify-between items-end border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                  <span style={{ color: 'var(--text-3)' }}>Agent Address</span>
                  <span className="font-mono text-xs" style={{ color: 'var(--text-1)' }}>0xce151D40926BAd0815B587B759609e746F469C84</span>
                </div>
                <div className="flex justify-between items-end border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                  <span style={{ color: 'var(--text-3)' }}>Registry Network</span>
                  <span style={{ color: 'var(--text-1)' }}>Base Mainnet</span>
                </div>
                <div className="flex justify-between items-end pt-1">
                  <span style={{ color: 'var(--text-3)' }}>Registration Transaction</span>
                  <a 
                    href="https://basescan.org/tx/0xf115b884c0ba9539a0a5d87c02c1de7a375ff3e1dbe3248c1aee7506d7182514" 
                    target="_blank" 
                    rel="noreferrer"
                    className="font-mono text-xs hover:underline"
                    style={{ color: 'var(--brand)' }}
                  >
                    0xf115b...82514
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col items-center justify-center text-center p-6" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <Activity style={{ color: 'var(--brand)', width: '28px', height: '28px', marginBottom: '16px' }} />
            <div className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--text-3)', fontWeight: '600' }}>
              Total Brokered
            </div>
            <div className="text-7xl font-light font-mono" style={{ color: 'var(--text-1)', lineHeight: '1' }}>
              {totalTransactions !== null ? totalTransactions : '-'}
            </div>
            <div className="text-xs mt-6" style={{ color: 'var(--text-4)' }}>
              {totalTransactions === null ? 'Connecting to node...' : 'Verified via x402'}
            </div>
          </Card>

        </div>

        {/* MIDDLE ROW: API Endpoints (Grid of 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="info">GET</Badge>
                <span className="font-mono text-sm font-semibold text-[var(--text-1)]">/listings</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs mb-4" style={{ color: 'var(--text-3)', minHeight: '40px' }}>
                Free discovery endpoint. Lists all available datasets directly from the Filecoin marketplace.
              </p>
              <div className="text-xs font-mono p-2 rounded" style={{ color: 'var(--text-2)', backgroundColor: '#000' }}>
                curl https://dataforge.prodigal.sbs/listings
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="info">GET</Badge>
                  <span className="font-mono text-sm font-semibold text-[var(--text-1)]">/dataset/:id</span>
                </div>
              </div>
              <Badge variant="warning" className="w-fit mt-3">x402 Required ($0.01)</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-xs mb-4 mt-2" style={{ color: 'var(--text-3)', minHeight: '24px' }}>
                Fetches and decrypts the dataset via Lit Protocol after a Base Sepolia payment.
              </p>
              <div className="text-xs font-mono p-2 rounded" style={{ color: 'var(--text-2)', backgroundColor: '#000' }}>
                curl https://dataforge.prodigal.sbs/dataset/0
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="info">GET</Badge>
                <span className="font-mono text-sm font-semibold text-[var(--text-1)]">/health</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs mb-4" style={{ color: 'var(--text-3)', minHeight: '40px' }}>
                Returns platform agent health status and active network connectivity states.
              </p>
              <div className="text-xs font-mono p-2 rounded" style={{ color: 'var(--text-2)', backgroundColor: '#000' }}>
                curl https://dataforge.prodigal.sbs/health
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BOTTOM ROW: Agent.json Viewer */}
        <Card style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <CardHeader style={{ paddingBottom: '16px' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server style={{ color: 'var(--text-2)', width: '18px', height: '18px' }} />
                <CardTitle>Agent Manifest (Stored on Filecoin)</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xs mb-3 flex items-center justify-between p-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-3)' }}>
              <span className="font-mono">PieceCID: bafybeit2z32dwh7v5exy3c2p4gntuawdndr3d35zms2ryz4o4lhm3i45rm</span>
            </div>
            <pre className="p-4 rounded-md font-mono text-[11px] overflow-x-auto" style={{ backgroundColor: '#000', border: '1px solid var(--border)' }}>
              <code style={{ color: 'var(--brand)' }}>
                {JSON.stringify(AGENT_JSON, null, 2)}
              </code>
            </pre>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
