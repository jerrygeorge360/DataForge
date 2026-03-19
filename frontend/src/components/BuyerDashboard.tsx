import { useState, useEffect, useCallback } from 'react'
import { BrowserProvider, formatEther } from 'ethers'
import {
  Database,
  Eye,
  ShoppingBag
} from 'lucide-react'
import { useMarketplace } from '../hooks/useMarketplace'
import { useFilPrice } from '../hooks/useFilPrice'
import { Button } from './ui/Button'
import { Card, CardHeader, CardTitle } from './ui/Card'
import { DataTable, Column } from './ui/DataTable'
import { Badge } from './ui/Badge'
import { Link } from 'react-router-dom'

interface BuyerDashboardProps {
  provider: BrowserProvider
}

export default function BuyerDashboard({ provider }: BuyerDashboardProps) {
  const { getActiveListings, getListingDetails, purchaseDataset } = useMarketplace(provider)
  const { price: filPrice } = useFilPrice()

  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadListings = useCallback(async () => {
    setLoading(true)
    try {
      const ids = await getActiveListings()
      const details = await Promise.all(ids.map(id => getListingDetails(id)))
      setListings(details.map((l, i) => ({ ...l, id: ids[i] })))
    } catch (err) {
      console.error('Failed to load market listings:', err)
    } finally {
      setLoading(false)
    }
  }, [getActiveListings, getListingDetails])

  useEffect(() => {
    loadListings()
  }, [loadListings])

  const columns: Column<any>[] = [
    {
      header: 'Dataset',
      accessor: (l: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-[var(--text-1)]">{l.name}</span>
          <Badge variant="neutral" className="w-fit mt-1 text-[10px]">{l.category}</Badge>
        </div>
      )
    },
    {
      header: 'Price',
      accessor: (l: any) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold">{formatEther(l.price)} FIL</span>
          <span className="text-[10px] text-[var(--text-3)] font-medium">
            ≈ ${(parseFloat(formatEther(l.price)) * filPrice).toFixed(2)}
          </span>
        </div>
      )
    },
    {
      header: 'Format',
      accessorKey: 'fileFormat'
    },
    {
      header: 'Actions',
      accessor: (l: any) => (
        <div className="flex gap-2">
          <Link to={`/listing/${l.id}`}>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={() => purchaseDataset(BigInt(l.id), l.price).then(loadListings)}
          >
            Buy
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 px-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[var(--brand)]" /> Market Registry
        </h2>
        <p className="text-sm text-[var(--text-3)]">All active datasets listed on the DataForge protocol.</p>
      </div>

      <Card>
        <CardHeader className="border-b border-[var(--border)] bg-[var(--bg-subtle)]/30">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4" /> Available Datasets
          </CardTitle>
        </CardHeader>
        <DataTable
          columns={columns}
          data={listings}
          loading={loading}
          emptyMessage="The market is currently empty."
        />
      </Card>
    </div>
  )
}
