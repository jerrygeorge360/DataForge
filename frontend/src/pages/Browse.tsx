import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { formatEther } from 'ethers'
import {
    Search,
    X,
} from 'lucide-react'
import { useMarketplace } from '../hooks/useMarketplace'
import { useFilPrice } from '../hooks/useFilPrice'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DiceBearAvatar } from '../components/layout/DiceBearAvatar'
import { formatBytes } from '../lib/assets'

const CATEGORIES = ['Finance', 'Weather', 'Sports', 'Health', 'Research', 'Media', 'Other']
const FORMATS = ['CSV', 'JSON', 'Parquet', 'Other']

interface Listing {
    id: number
    seller: string
    cid: string
    previewCid: string
    name: string
    description: string
    category: string
    fileFormat: string
    fileSize: string
    rowCount: string
    price: bigint
    listingType: number // 1: Open, 2: Exclusive
    active: boolean
    rating: number
    ratingCount: number
}

// Fallback public provider for guests
export default function Browse({ provider, isWrongNetwork }: { provider?: any, isWrongNetwork?: boolean }) {
    const [searchParams, setSearchParams] = useSearchParams()

    const { getListingCount, getListingDetails } = useMarketplace(provider)
    const { price: filPrice } = useFilPrice()

    const [allListings, setAllListings] = useState<Listing[]>([])
    const [loading, setLoading] = useState(true)
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

    // Filter states
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
    const selectedCategory = searchParams.get('category') || 'all'
    const selectedFormat = searchParams.get('format') || 'all'
    const selectedType = searchParams.get('type') || 'all'
    const sortBy = searchParams.get('sort') || 'newest'
    const minPrice = searchParams.get('minPrice') || ''
    const maxPrice = searchParams.get('maxPrice') || ''

    const loadListings = useCallback(async () => {
        setLoading(true)
        console.log('--- MARKETPLACE DATA LOAD ---')
        console.log('Using Provider:', provider === (window as any).ethereum ? 'Wallet' : 'Public RPC')

        try {
            const countBigInt = await getListingCount()
            const count = Number(countBigInt)
            console.log('Total Listing Count:', count)

            if (count > 0) {
                // listings are 0-indexed in our contract
                const ids = Array.from({ length: count }, (_, i) => BigInt(i))
                console.log('Fetching IDs:', ids.map(id => id.toString()))

                const details = await Promise.all(ids.map(id => getListingDetails(id)))
                console.log('Raw Listings Result:', details)

                const processed = details
                    .filter((l: any) => l && l.active)
                    .map((l: any) => ({
                        id: Number(ids[details.indexOf(l)]),
                        ...l,
                        fileSize: formatBytes(l.fileSizeBytes),
                        rating: 4.5 + (Math.random() * 0.5), // Mock rating
                        ratingCount: Math.floor(Math.random() * 50) + 1 // Mock rating count
                    }))

                console.log('Processed/Active Listings:', processed)
                setAllListings(processed)
            } else {
                setAllListings([])
            }
        } catch (err) {
            console.error('CRITICAL: Failed to load listings from contract:', err)
        } finally {
            setLoading(false)
        }
    }, [getListingCount, getListingDetails, provider])

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        loadListings()
        return () => window.removeEventListener('resize', handleResize)
    }, [loadListings, provider])

    const updateFilter = (key: string, value: string) => {
        const newParams = new URLSearchParams(searchParams)
        if (value && value !== 'all' && searchParams.get(key) !== value) {
            newParams.set(key, value)
        } else if (value === 'all' || searchParams.get(key) === value) {
            newParams.delete(key)
        } else {
            newParams.set(key, value)
        }
        setSearchParams(newParams)
    }

    const clearFilters = () => {
        setSearchParams(new URLSearchParams())
        setSearchQuery('')
    }

    const filteredListings = useMemo(() => {
        let result = [...allListings]

        if (searchQuery) {
            const s = searchQuery.toLowerCase()
            result = result.filter(l =>
                l.name.toLowerCase().includes(s) ||
                l.description.toLowerCase().includes(s) ||
                l.category.toLowerCase().includes(s)
            )
        }

        if (selectedCategory !== 'all') {
            result = result.filter(l => l.category === selectedCategory)
        }

        if (selectedFormat !== 'all') {
            result = result.filter(l => l.fileFormat === selectedFormat)
        }

        if (selectedType !== 'all') {
            const typeValue = selectedType === 'One-Time' ? 0 : 1
            result = result.filter(l => l.listingType === typeValue)
        }

        if (minPrice) {
            result = result.filter(l => parseFloat(formatEther(l.price)) >= parseFloat(minPrice))
        }

        if (maxPrice) {
            result = result.filter(l => parseFloat(formatEther(l.price)) <= parseFloat(maxPrice))
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'newest') return b.id - a.id
            if (sortBy === 'price_asc') return Number(a.price - b.price)
            if (sortBy === 'price_desc') return Number(b.price - a.price)
            if (sortBy === 'rating') return b.rating - a.rating
            return 0
        })

        return result
    }, [allListings, searchQuery, selectedCategory, selectedFormat, selectedType, sortBy, minPrice, maxPrice])

    // Styles
    const containerStyle: React.CSSProperties = {
        minHeight: '100vh',
        background: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column'
    }

    const headerStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '40px 40px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 20
    }

    const searchBarContainer: React.CSSProperties = {
        position: 'relative',
        width: '100%',
        maxWidth: 480,
        marginTop: 8
    }

    const searchInput: React.CSSProperties = {
        width: '100%',
        height: 48,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: '0 24px 0 48px',
        fontSize: 14,
        color: 'var(--text-1)',
        outline: 'none',
        transition: 'all 0.2s',
        boxShadow: 'var(--shadow-sm)'
    }

    const sidebarStyle: React.CSSProperties = {
        width: 260,
        flexShrink: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
        position: 'sticky',
        top: 100,
        height: 'fit-content',
        display: windowWidth > 1024 ? 'flex' : 'none',
        flexDirection: 'column',
        gap: 32
    }

    const sectionHeader: React.CSSProperties = {
        fontSize: 11,
        textTransform: 'uppercase',
        fontWeight: 700,
        color: 'var(--text-3)',
        letterSpacing: '1px',
        marginBottom: 12
    }

    const pillStyle = (selected: boolean): React.CSSProperties => ({
        padding: '6px 14px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: selected ? 'var(--brand)' : 'var(--border)',
        background: selected ? 'var(--brand)' : 'var(--bg-subtle)',
        color: selected ? 'white' : 'var(--text-2)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.2s'
    })

    return (
        <div style={containerStyle}>
            {isWrongNetwork && (
                <div style={{
                    background: '#fef2f2',
                    borderBottom: '1px solid #fee2e2',
                    padding: '12px 20px',
                    color: '#991b1b',
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    animation: 'slideDown 0.3s ease-out'
                }}>
                    <X size={16} />
                    Warning: Your wallet is connected to the wrong network. Please switch to <b>Filecoin Calibration (Chain ID 314159)</b> for marketplace transactions.
                </div>
            )}
            <header style={headerStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>Data Marketplace</h1>
                    <p style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>
                        {loading ? 'Discovering secure datasets...' : `${allListings.length} datasets available for purchase.`}
                    </p>
                </div>

                <div style={searchBarContainer}>
                    <Search
                        size={18}
                        style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}
                    />
                    <input
                        className="search-input-hover"
                        style={searchInput}
                        placeholder="Search specific datasets, providers, or categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <style>{`
                        .search-input-hover:focus { 
                            border-color: var(--brand) !important; 
                            box-shadow: 0 0 0 4px rgba(1, 118, 211, 0.1) !important;
                        }
                    `}</style>
                </div>
            </header>

            <div style={{
                display: 'flex',
                gap: 32,
                padding: '40px',
                maxWidth: 1400,
                margin: '0 auto',
                width: '100%',
                boxSizing: 'border-box',
                flex: 1
            }}>
                <aside style={sidebarStyle}>
                    <div>
                        <div style={sectionHeader}>Category</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <button
                                onClick={() => updateFilter('category', 'all')}
                                style={pillStyle(selectedCategory === 'all')}
                            >
                                All
                            </button>
                            {CATEGORIES.map(cat => {
                                const count = allListings.filter(l => l.category === cat).length
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => updateFilter('category', cat)}
                                        style={pillStyle(selectedCategory === cat)}
                                    >
                                        {cat} <span style={{ opacity: 0.6 }}>({count})</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div>
                        <div style={sectionHeader}>File Format</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <button
                                onClick={() => updateFilter('format', 'all')}
                                style={pillStyle(selectedFormat === 'all')}
                            >
                                All
                            </button>
                            {FORMATS.map(fmt => (
                                <button
                                    key={fmt}
                                    onClick={() => updateFilter('format', fmt)}
                                    style={pillStyle(selectedFormat === fmt)}
                                >
                                    {fmt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div style={sectionHeader}>License Type</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <button
                                onClick={() => updateFilter('type', 'all')}
                                style={pillStyle(selectedType === 'all')}
                            >
                                All
                            </button>
                            <button
                                onClick={() => updateFilter('type', 'One-Time')}
                                style={pillStyle(selectedType === 'One-Time')}
                            >
                                One-Time
                            </button>
                            <button
                                onClick={() => updateFilter('type', 'Subscription')}
                                style={pillStyle(selectedType === 'Subscription')}
                            >
                                Subscription
                            </button>
                        </div>
                    </div>

                    <div>
                        <div style={sectionHeader}>Price Range (FIL)</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                                type="number"
                                placeholder="Min"
                                style={{ width: '100%', height: 36, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 6, padding: '0 10px', fontSize: 12, color: 'var(--text-1)' }}
                                value={minPrice}
                                onChange={(e) => updateFilter('minPrice', e.target.value)}
                            />
                            <span style={{ color: 'var(--text-3)' }}>—</span>
                            <input
                                type="number"
                                placeholder="Max"
                                style={{ width: '100%', height: 36, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 6, padding: '0 10px', fontSize: 12, color: 'var(--text-1)' }}
                                value={maxPrice}
                                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <div style={sectionHeader}>Sort Results</div>
                        <select
                            style={{
                                width: '100%',
                                height: 40,
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                padding: '0 12px',
                                fontSize: 13,
                                color: 'var(--text-1)',
                                appearance: 'none',
                                cursor: 'pointer'
                            }}
                            value={sortBy}
                            onChange={(e) => updateFilter('sort', e.target.value)}
                        >
                            <option value="newest">Newest First</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="rating">Highest Rated</option>
                        </select>
                    </div>

                    {(selectedCategory !== 'all' || selectedFormat !== 'all' || selectedType !== 'all' || minPrice || maxPrice || searchQuery) && (
                        <button
                            onClick={clearFilters}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--brand)',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: 0,
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}
                        >
                            <X size={14} /> Reset Filters
                        </button>
                    )}
                </aside>

                <div style={{ flex: 1 }}>
                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} style={{ height: 360, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, animation: 'pulse 1.5s infinite ease-in-out' }} />
                            ))}
                        </div>
                    ) : filteredListings.length === 0 ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '120px 0',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 16,
                            textAlign: 'center'
                        }}>
                            <Search size={64} style={{ color: 'var(--text-3)', opacity: 0.2, marginBottom: 24 }} />
                            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>No datasets found</h2>
                            <p style={{ fontSize: 15, color: 'var(--text-3)', maxWidth: 400, margin: '0 0 24px' }}>
                                We couldn't find any results matching your search or filter criteria. Try broadening your parameters.
                            </p>
                            {allListings.length > filteredListings.length ? (
                                <Button onClick={clearFilters}>Clear filters to see all</Button>
                            ) : (
                                <Link to="/sell"><Button>Be the first to list a dataset →</Button></Link>
                            )}
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: 24
                        }}>
                            {filteredListings.map(listing => (
                                <ListingCard
                                    key={listing.id}
                                    listing={listing}
                                    filPrice={filPrice}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function ListingCard({ listing, filPrice }: {
    listing: Listing,
    filPrice: number
}) {
    const bannerGradients: Record<string, string> = {
        'Finance': 'linear-gradient(135deg, #1e3a5f, #0176D3)',
        'Weather': 'linear-gradient(135deg, #1a3a2a, #16a34a)',
        'Sports': 'linear-gradient(135deg, #3a1a1a, #dc2626)',
        'Health': 'linear-gradient(135deg, #2a1a3a, #9333ea)',
        'Default': 'linear-gradient(135deg, #1a1a3a, #6366f1)'
    }

    const gradient = bannerGradients[listing.category] || bannerGradients['Default']

    const priceFIL = parseFloat(formatEther(listing.price))
    const priceUSD = filPrice > 0 ? (priceFIL * filPrice).toFixed(2) : null

    return (
        <Card
            className="listing-card"
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                padding: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)'
            }}
        >
            <style>{`
                .listing-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 32px rgba(0,0,0,0.2) !important;
                    border-color: var(--brand) !important;
                }
            `}</style>

            <div style={{
                height: 52,
                background: gradient,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'white',
                    background: 'rgba(255,255,255,0.2)',
                    padding: '3px 8px',
                    borderRadius: 12,
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(4px)'
                }}>
                    {listing.category}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>
                    {listing.listingType === 0 ? 'One-Time' : 'Subscription'}
                </span>
            </div>

            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <h3 style={{
                        fontSize: 15,
                        fontWeight: 700,
                        margin: 0,
                        color: 'var(--text-1)',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                    }}>
                        {listing.name}
                    </h3>
                    <p style={{
                        fontSize: 12,
                        color: 'var(--text-3)',
                        margin: 0,
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        height: 36
                    }}>
                        {listing.description}
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 12,
                    borderTop: '1px solid var(--border)',
                    fontSize: 11,
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-mono)'
                }}>
                    <span title="Record count"><span style={{ fontWeight: 700, color: 'var(--text-2)' }}>📊 {parseInt(listing.rowCount).toLocaleString()}</span> records</span>
                    <span>|</span>
                    <span title="File size"><span style={{ fontWeight: 700, color: 'var(--text-2)' }}>💾 {listing.fileSize}</span></span>
                    <span>|</span>
                    <span title="Format"><span style={{ fontWeight: 700, color: 'var(--text-2)' }}>📁 {listing.fileFormat}</span></span>
                </div>
            </div>

            <div style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border)',
                background: 'var(--bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{priceFIL}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>FIL</span>
                    </div>
                    {priceUSD && <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>≈ ${priceUSD}</span>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <DiceBearAvatar seed={listing.seller} size={18} />
                            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                                {listing.seller.slice(0, 4)}...{listing.seller.slice(-2)}
                            </span>
                        </div>
                    </div>
                    <Link to={`/listing/${listing.id}`}>
                        <button style={{
                            background: 'var(--brand)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            padding: '6px 14px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}>
                            View details
                        </button>
                    </Link>
                </div>
            </div>
        </Card>
    )
}
