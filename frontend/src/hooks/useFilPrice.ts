import { useState, useEffect, useCallback } from 'react'

let cachedPrice: number | null = null
let lastFetched: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes


export function useFilPrice() {
    const [price, setPrice] = useState<number>(0)
    const [loading, setLoading] = useState(false)

    const fetchPrice = useCallback(async () => {
        if (cachedPrice !== null && Date.now() - lastFetched < CACHE_TTL) {
            setPrice(cachedPrice)
            return
        }

        setLoading(true)
        try {
            const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=filecoin&vs_currencies=usd')
            const data = await res.json()
            const usd = data.filecoin.usd
            cachedPrice = usd
            lastFetched = Date.now()
            setPrice(usd)
        } catch (err) {
            console.warn('Failed to fetch FIL price:', err)
            // Keep existing price if fetch fails
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPrice()
        const interval = setInterval(fetchPrice, CACHE_TTL)
        return () => clearInterval(interval)
    }, [fetchPrice])

    return { price, loading }
}
