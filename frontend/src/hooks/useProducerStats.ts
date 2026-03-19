import { useState, useEffect, useCallback } from 'react'
import { BrowserProvider, Contract } from 'ethers'
import { useMarketplace, MARKETPLACE_ABI, VITE_CONTRACT_ADDRESS } from './useMarketplace'

export interface ProducerStats {
    revenue: bigint
    salesCount: number
    listingCount: number
    reputation: number
    dailySales: number[]
    revenueTrend: number
    salesTrend: number
}

export function useProducerStats(provider: BrowserProvider | null, account: string) {
    const { getListingCount, getReputation } = useMarketplace(provider!)
    const [stats, setStats] = useState<ProducerStats>({
        revenue: 0n,
        salesCount: 0,
        listingCount: 0,
        reputation: 0,
        dailySales: [0, 0, 0, 0, 0, 0, 0],
        revenueTrend: 0,
        salesTrend: 0
    })
    const [loading, setLoading] = useState(true)

    const fetchStats = useCallback(async () => {
        if (!provider || !account) return
        setLoading(true)
        try {
            const contract = new Contract(VITE_CONTRACT_ADDRESS, MARKETPLACE_ABI, provider)
            const currentBlock = await provider.getBlockNumber()
            const startBlock = Math.max(0, currentBlock - 2000) // RPC limit is ~16h (2000 blocks)

            const filter = contract.filters.DatasetPurchased(null, null, account)
            const events = await contract.queryFilter(filter, startBlock, currentBlock)

            let totalRev = 0n
            const dailyS = new Array(7).fill(0)
            const now = Math.floor(Date.now() / 1000)
            const DAY = 24 * 60 * 60

            let firstHalfRev = 0n
            let secondHalfRev = 0n
            let firstHalfSales = 0
            let secondHalfSales = 0

            const midBlock = startBlock + Math.floor((currentBlock - startBlock) / 2)

            for (const event of events as any[]) {
                const { price } = event.args
                totalRev += price

                if (event.blockNumber > midBlock) {
                    secondHalfRev += price
                    secondHalfSales++
                } else {
                    firstHalfRev += price
                    firstHalfSales++
                }

                try {
                    const block = await provider.getBlock(event.blockNumber)
                    if (block) {
                        const diffDays = Math.floor((now - Number(block.timestamp)) / DAY)
                        if (diffDays >= 0 && diffDays < 7) {
                            dailyS[6 - diffDays]++
                        }
                    }
                } catch (e) {
                    console.warn('Failed to fetch block for event:', event.blockNumber)
                }
            }

            const calcTrend = (nowPrev: number, prev: number) => {
                if (prev === 0) return nowPrev > 0 ? 100 : 0
                return ((nowPrev - prev) / prev) * 100
            }

            const calcTrendBigInt = (nowPrev: bigint, prev: bigint) => {
                if (prev === 0n) return nowPrev > 0n ? 100 : 0
                return Number(((nowPrev - prev) * 100n) / prev)
            }

            const rep = await getReputation(account)
            const totalListings = await getListingCount()
            const ids = Array.from({ length: Number(totalListings) }, (_, i) => BigInt(i + 1))
            const details = await Promise.all(ids.map(id => contract.listings(id)))
            const myCount = details.filter(l => l.seller.toLowerCase() === account.toLowerCase() && l.active).length

            setStats({
                revenue: totalRev,
                salesCount: events.length,
                listingCount: myCount,
                reputation: Number(rep),
                dailySales: dailyS,
                revenueTrend: calcTrendBigInt(secondHalfRev, firstHalfRev),
                salesTrend: calcTrend(secondHalfSales, firstHalfSales)
            })
        } catch (err) {
            console.error('Failed to fetch producer stats:', err)
        } finally {
            setLoading(false)
        }
    }, [account, provider, getListingCount, getReputation])

    useEffect(() => {
        let timer: any
        const run = async () => {
            await fetchStats()
            timer = setTimeout(run, 60000)
        }
        run()
        return () => clearTimeout(timer)
    }, [fetchStats])

    return { stats, loading, refresh: fetchStats }
}
