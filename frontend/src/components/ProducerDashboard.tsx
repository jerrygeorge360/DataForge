import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BrowserProvider, formatEther } from 'ethers'
import {
  Plus,
  Database,
  Edit3,
  Trash2,
  BarChart2
} from 'lucide-react'
import { useMarketplace } from '../hooks/useMarketplace'
import { useProducerStats } from '../hooks/useProducerStats'
import { useFilPrice } from '../hooks/useFilPrice'
import { Card } from './ui/Card'

interface ProducerDashboardProps {
  provider: BrowserProvider
  account: string
}

export default function ProducerDashboard({ provider, account }: ProducerDashboardProps) {
  const { getActiveListings, getListingDetails, cancelListing } = useMarketplace(provider)
  const { stats, loading: statsLoading } = useProducerStats(provider, account)
  const { price: filPrice } = useFilPrice()

  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadListings = async () => {
      setLoading(true)
      try {
        const ids = await getActiveListings()
        const details = await Promise.all(ids.map(id => getListingDetails(id)))
        const myListings = details
          .map((l, i) => ({ ...l, id: ids[i] }))
          .filter(l => l.seller.toLowerCase() === account.toLowerCase())
        if (!cancelled) setListings(myListings)
      } catch (err) {
        console.error('Failed to load producer listings:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadListings()
    return () => { cancelled = true }
  }, [getActiveListings, getListingDetails, account])

  const handleCancel = async (id: bigint) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return
    await cancelListing(id)
    window.location.reload()
  }

  const priceUSD = (val: bigint) => {
    const fil = parseFloat(formatEther(val))
    return (fil * filPrice).toFixed(2)
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    textTransform: 'uppercase',
    color: 'var(--text-3)',
    letterSpacing: '1px',
    fontWeight: 600
  }

  const valueStyle: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 700,
    color: 'var(--text-1)',
    fontFamily: 'var(--font-mono)'
  }

  const subLabelStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--text-3)',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, animation: 'fadeIn 0.7s ease-out' }}>
      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth > 992 ? 'repeat(4, 1fr)' : windowWidth > 640 ? 'repeat(2, 1fr)' : '1fr',
        gap: 20
      }}>
        <div style={{ ...cardStyle, borderLeft: '3px solid var(--brand)' }}>
          <span style={labelStyle}>Total Revenue</span>
          <span style={valueStyle}>{formatEther(stats.revenue)} FIL</span>
          <span style={subLabelStyle}>≈ ${priceUSD(stats.revenue)}</span>
        </div>
        <div style={cardStyle}>
          <span style={labelStyle}>Datasets Sold</span>
          <span style={valueStyle}>{stats.salesCount}</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>total units</span>
        </div>
        <div style={cardStyle}>
          <span style={labelStyle}>Act. Listings</span>
          <span style={valueStyle}>{listings.length}</span>
          <span style={subLabelStyle}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} /> Live
          </span>
        </div>
        <div style={cardStyle}>
          <span style={labelStyle}>Reputation</span>
          <span style={valueStyle}>{stats.reputation}</span>
          <span style={{ ...subLabelStyle, color: 'var(--brand)', fontWeight: 600 }}>★ {stats.reputation > 0 ? 'Verified Seller' : 'New Seller'}</span>
        </div>
      </div>

      {/* Listings Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={20} color="var(--brand)" /> Your Listings
          </h2>
          <Link to="/sell" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'var(--brand)',
              color: 'white',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: 'none',
              cursor: 'pointer'
            }}>
              <Plus size={16} /> New Dataset
            </button>
          </Link>
        </div>

        {/* Table Header */}
        <div style={{
          background: 'var(--bg-subtle)',
          borderBottom: '2px solid var(--border)',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          fontSize: 11,
          textTransform: 'uppercase',
          color: 'var(--text-3)',
          letterSpacing: '0.8px',
          fontWeight: 700
        }}>
          <div style={{ flex: 3 }}>Dataset</div>
          <div style={{ flex: 1 }}>Price</div>
          <div style={{ flex: 1 }}>Sales</div>
          <div style={{ flex: 1 }}>Status</div>
          <div style={{ flex: 1, textAlign: 'right' }}>Actions</div>
        </div>

        {/* Table Body */}
        <div style={{ minHeight: 200 }}>
          {(loading || statsLoading) ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>Loading your dashboard...</div>
          ) : listings.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>You haven't listed any datasets yet.</div>
          ) : (
            listings.map((l) => (
              <div key={l.id.toString()} style={{
                padding: '14px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.2s',
              }} className="list-row-hover">
                <style>{`.list-row-hover:hover { background: var(--bg-subtle) !important; }`}</style>
                <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{l.name}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{
                      fontSize: 10,
                      borderRadius: 4,
                      padding: '2px 6px',
                      background: 'rgba(1, 118, 211, 0.15)',
                      color: 'var(--brand)',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>{l.category}</span>
                    <span style={{
                      fontSize: 10,
                      borderRadius: 4,
                      padding: '2px 6px',
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-3)',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>{l.fileFormat}</span>
                  </div>
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{formatEther(l.price)} FIL</div>
                <div style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: l.sales > 0 ? 700 : 400,
                  color: l.sales > 0 ? '#22c55e' : 'var(--text-3)'
                }}>
                  {l.sales || 0} sales
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: '#22c55e',
                    borderRadius: 20,
                    padding: '3px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} /> Active
                  </span>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    background: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    color: 'var(--text-3)'
                  }} className="action-btn edit-btn">
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleCancel(l.id)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: '1px solid var(--border)',
                      background: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: 'var(--text-3)'
                    }} className="action-btn delete-btn">
                    <Trash2 size={14} />
                  </button>
                  <style>{`
                    .action-btn:hover { border-color: var(--brand); color: var(--brand); }
                    .delete-btn:hover { border-color: var(--error); color: var(--error); }
                  `}</style>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Revenue Forecast */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <BarChart2 size={18} color="var(--brand)" />
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Revenue Forecast</h3>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: windowWidth > 640 ? 'row' : 'column',
          gap: 40,
          alignItems: windowWidth > 640 ? 'center' : 'flex-start'
        }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Projected next month</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
              {listings.length >= 3 ? `${(parseFloat(formatEther(stats.revenue)) * 1.4).toFixed(2)} FIL` : '0.00 FIL'}
            </span>
            {listings.length < 3 ? (
              <p style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', marginTop: 8 }}>
                Add more listings to unlock revenue projections.
              </p>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>based on latest volume</span>
            )}
          </div>

          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 12,
            height: 100,
            paddingBottom: 12,
            borderBottom: '1px solid var(--border)',
            width: '100%',
            justifyContent: 'space-between'
          }}>
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m) => (
              <div key={m} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                flex: 1
              }}>
                <div style={{
                  width: '100%',
                  background: 'var(--bg-subtle)',
                  height: 60,
                  borderRadius: '4px 4px 0 0',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700 }}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
