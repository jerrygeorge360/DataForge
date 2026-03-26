import { useState } from 'react'
import { downloadDataset } from '../filecoin'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Shield,  Database,  Unlock, Search,  } from 'lucide-react'

export default function DebugStorage({ account }: { account?: string }) {
    const address = account || (window as any).ethereum?.selectedAddress
    const [cid, setCid] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleVerify = async () => {
        if (!cid || !address) return
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            const rawData = await downloadDataset(address, cid)
            const decoder = new TextDecoder()
            const text = decoder.decode(rawData)

            let isJson = false
            let parsed = null
            try {
                parsed = JSON.parse(text)
                isJson = true
            } catch (e) { }

            setResult({
                isJson,
                content: text,
                parsed,
                size: rawData.byteLength
            })
        } catch (err: any) {
            console.error('Verify failed:', err)
            setError(err.message || 'Could not download CID from network.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ marginBottom: 32, textAlign: 'center' }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>
                    Storage Inspector
                </h1>
                <p style={{ color: 'var(--text-2)' }}>
                    Verify the raw contents of any CID on the Filecoin network.
                </p>
            </div>

            <Card style={{ padding: 32, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)' }}>ENTER FILECOIN CID</label>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <input
                                placeholder="bafybeig..."
                                value={cid}
                                onChange={(e) => setCid(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: 8,
                                    background: 'var(--bg-subtle)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-1)',
                                    fontSize: 14,
                                    fontFamily: 'monospace'
                                }}
                            />
                            <Button
                                onClick={handleVerify}
                                loading={loading}
                                disabled={!cid || !address}
                                style={{ padding: '0 24px' }}
                            >
                                <Search size={18} style={{ marginRight: 8 }} /> Inspect
                            </Button>
                        </div>
                        {!address && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>Please connect your wallet to use the Synapse gateway.</p>}
                    </div>

                    {error && (
                        <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 8, color: '#ef4444', fontSize: 14 }}>
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                                <div style={{
                                    flex: 1,
                                    padding: 20,
                                    background: 'var(--bg-subtle)',
                                    borderRadius: 12,
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 8,
                                    textAlign: 'center'
                                }}>
                                    {result.isJson ? (
                                        <>
                                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                                                <Shield size={20} />
                                            </div>
                                            <span style={{ fontWeight: 700, color: '#22c55e' }}>ENCRYPTED</span>
                                            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Data is wrapped in Lit Protocol metadata.</span>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                                                <Unlock size={20} />
                                            </div>
                                            <span style={{ fontWeight: 700, color: '#f59e0b' }}>PLAIN TEXT</span>
                                            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Data is stored in the clear (Legacy).</span>
                                        </>
                                    )}
                                </div>
                                <div style={{
                                    flex: 1,
                                    padding: 20,
                                    background: 'var(--bg-subtle)',
                                    borderRadius: 12,
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 8,
                                    textAlign: 'center'
                                }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                                        <Database size={20} />
                                    </div>
                                    <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{(result.size / 1024).toFixed(2)} KB</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Total piece size on network.</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)' }}>RAW CONTENT FROM NETWORK</label>
                                <pre style={{
                                    padding: 20,
                                    background: '#0a0a0a',
                                    color: '#22c55e',
                                    borderRadius: 12,
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                    overflowX: 'auto',
                                    border: '1px solid var(--border)',
                                    maxHeight: '400px'
                                }}>
                                    {result.isJson ? JSON.stringify(result.parsed, null, 2) : result.content}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
