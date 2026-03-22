import { useState, useEffect } from 'react'
import { BrowserProvider, formatEther, Contract } from 'ethers'
import { useMarketplace } from '../hooks/useMarketplace'
import { useFilecoin } from '../hooks/useFilecoin'
import { useLit } from '../hooks/useLit'
import { cn } from '../lib/utils'
import PreviewModal from './PreviewModal'

interface ListingRowProps {
    listing: any
    provider: BrowserProvider
    account: string
    onPurchaseSuccess: () => void
}

function ListingRow({ listing, provider, account, onPurchaseSuccess }: ListingRowProps) {
    const { purchaseDataset, getCID, checkPurchaseState, getReputation, rateListing, hasRated, isAuthorized } = useMarketplace(provider)
    const { download } = useFilecoin()
    const { downloadAndDecrypt } = useLit()

    const [isPurchased, setIsPurchased] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [purchasing, setPurchasing] = useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [purchaseCount, setPurchaseCount] = useState(0)
    const [reputation, setReputation] = useState(0n)
    const [alreadyRated, setAlreadyRated] = useState(false)
    const [message, setMessage] = useState('')
    const [downloading, setDownloading] = useState(false)

    useEffect(() => {
        fetchPurchaseState()
        fetchListingMetadata()
    }, [listing.id, account])

    async function fetchPurchaseState() {
        try {
            const bought = await checkPurchaseState(listing.id, account)
            setIsPurchased(bought)
            if (bought) {
                const rated = await hasRated(listing.id, account)
                setAlreadyRated(rated)
            }
        } catch (err) {
            console.error('Error fetching purchase state:', err)
        }
    }

    async function fetchListingMetadata() {
        try {
            const rep = await getReputation(listing.seller)
            setReputation(rep)

            if (listing.listingType === 1) {
                const contract = new Contract(
                    import.meta.env.MARKETPLACE_ADDRESS,
                    ['event DatasetPurchased(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 price, string cid)'],
                    provider
                )
                const filter = contract.filters.DatasetPurchased(listing.id)
                const logs = await contract.queryFilter(filter, -2880)
                setPurchaseCount(logs.length)
            }
        } catch (err) {
            console.error('Error fetching listing metadata:', err)
        }
    }

    async function handlePurchase() {
        setPurchasing(true)
        setMessage('WALLET_CONFIRMATION_PENDING...')
        try {
            await purchaseDataset(listing.id, listing.price)
            setIsPurchased(true)
            if (listing.listingType === 1) setPurchaseCount(prev => prev + 1)
            setMessage('PURCHASE_CONFIRMED')
            onPurchaseSuccess()
        } catch (err: any) {
            setMessage(`ERR:${err.message.slice(0, 20)}...`)
        } finally {
            setPurchasing(false)
        }
    }

    async function handleDownload() {
        setDownloading(true)
        setMessage('INITIALIZING_SECURE_DOWNLOAD...')
        try {
            const auth = await isAuthorized(listing.id, account)
            if (!auth) {
                setMessage('ERR: NOT_AUTHORIZED')
                return
            }

            const cid = await getCID(listing.id)
            setMessage('FETCHING_AND_DECRYPTING...')

            try {
                const decryptedFile = await downloadAndDecrypt(
                    cid,
                    account,
                    (c: string) => download(account, c)
                )

                const blob = new Blob([decryptedFile as any])
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = listing.name
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                setMessage('DOWNLOAD_COMPLETE')
            } catch (decryptErr) {
                console.warn('Decryption failed, attempting raw download:', decryptErr)
                const data = await download(account, cid)
                if (!data) throw new Error('DOWNLOAD_FAIL')
                const blob = new Blob([data])
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = listing.name
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                setMessage('LEGACY_DOWNLOAD_COMPLETE')
            }
        } catch (err: any) {
            setMessage(`ERR: ${err.message}`)
        } finally {
            setDownloading(false)
        }
    }

    async function handleRate(positive: boolean) {
        setMessage('SUBMITTING_RATING...')
        try {
            await rateListing(listing.id, positive)
            setAlreadyRated(true)
            setMessage('RATING_SAVED')
            fetchListingMetadata()
        } catch (err: any) {
            setMessage(`ERR:${err.message.slice(0, 20)}...`)
        }
    }


    return (
        <>
            <tr
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "cursor-pointer transition-colors hover:bg-subtle/30",
                    isExpanded && "border-l-2 border-accent bg-subtle/20"
                )}
            >
                <td className="font-medium">{listing.name}</td>
                <td>
                    <code className="text-[11px] text-accent font-mono">
                        {listing.cid.slice(0, 8)}...{listing.cid.slice(-4)}
                    </code>
                </td>
                <td className="font-mono">{formatEther(listing.price)} FIL</td>
                <td className="font-mono text-success">
                    {reputation.toString()}
                </td>
                <td className="text-[10px] font-bold uppercase tracking-wider">{listing.listingType === 1 ? 'CONT' : 'EXCL'}</td>
                <td>
                    <span className={cn(
                        "badge",
                        listing.listingType === 1 ? 'badge-success' : listing.sold ? 'badge-error' : 'badge-neutral'
                    )}>
                        {listing.listingType === 1 ? 'OPEN' : listing.sold ? 'SOLD' : 'AVAIL'}
                    </span>
                </td>
                <td className="text-right font-mono">
                    {listing.listingType === 1 ? `👥 ${purchaseCount}` : '-'}
                </td>
            </tr>

            {isExpanded && (
                <tr className="bg-subtle/10">
                    <td colSpan={7} className="p-0">
                        <div className="p-6 border-l-2 border-accent space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Description Manifest</h4>
                                        <p className="text-sm leading-relaxed">{listing.description}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <div className="bg-card border border-border rounded p-2 flex flex-col gap-1 min-w-[200px]">
                                            <span className="text-[9px] font-bold text-muted uppercase">Full CID</span>
                                            <code className="text-[10px] break-all font-mono opacity-80">{listing.cid}</code>
                                        </div>
                                        <div className="bg-card border border-border rounded p-2 flex flex-col gap-1 min-w-[200px]">
                                            <span className="text-[9px] font-bold text-muted uppercase">Preview CID</span>
                                            <code className="text-[10px] break-all font-mono opacity-80">{listing.previewCid}</code>
                                        </div>
                                    </div>

                                    {isPurchased && !alreadyRated && (
                                        <div className="card p-4 bg-accent/5 border-dashed">
                                            <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest mb-3">Validate Data Quality</h4>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleRate(true)}
                                                    className="btn btn-secondary btn-sm flex-1 text-success border-success/30 hover:bg-success/5"
                                                >
                                                    [+] Positive
                                                </button>
                                                <button
                                                    onClick={() => handleRate(false)}
                                                    className="btn btn-secondary btn-sm flex-1 text-error border-error/30 hover:bg-error/5"
                                                >
                                                    [-] Negative
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {message && (
                                        <div className="p-2 bg-accent/5 border border-accent/20 rounded text-accent text-[10px] font-mono animate-pulse">
                                            &gt; {message}
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        {!isPurchased && !listing.sold && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsPreviewOpen(true); }}
                                                className="btn btn-secondary btn-sm w-full"
                                            >
                                                System Preview
                                            </button>
                                        )}

                                        {isPurchased ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                                                disabled={downloading}
                                                className="btn btn-primary btn-sm w-full"
                                            >
                                                {downloading ? 'Fetching...' : 'Download Dataset'}
                                            </button>
                                        ) : (listing.listingType === 0 && listing.sold) ? (
                                            <div className="p-2 text-center text-[10px] font-bold text-muted border border-border rounded">
                                                Exclusive Sale Closed
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handlePurchase(); }}
                                                disabled={purchasing}
                                                className="btn btn-primary btn-sm w-full"
                                            >
                                                {purchasing ? 'Executing...' : 'Purchase Access'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <PreviewModal
                                isOpen={isPreviewOpen}
                                onClose={() => setIsPreviewOpen(false)}
                                previewCid={listing.previewCid}
                                datasetName={listing.name}
                                price={formatEther(listing.price)}
                                onBuy={handlePurchase}
                            />
                        </div>
                    </td>
                </tr>
            )}
        </>
    )
}

export default ListingRow
