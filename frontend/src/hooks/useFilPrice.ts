import { useState, useEffect, useCallback } from 'react'

const CACHE_KEY = 'dataforge_fil_price'
const CACHE_DURATION = 60000 // 60 seconds

interface PriceState {
    usd: number
    lastUpdated: number
}

export function useFilPrice() {
    const [price, setPrice] = useState<number>(0)
    const [loading, setLoading] = useState(false)

    const fetchPrice = useCallback(async () => {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
            const parsed: PriceState = JSON.parse(cached)
            if (Date.now() - parsed.lastUpdated < CACHE_DURATION) {
                setPrice(parsed.usd)
                return
            }
        }

        setLoading(true)
        try {
            const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=filecoin&vs_currencies=usd')
            const data = await res.json()
            const usd = data.filecoin.usd
            setPrice(usd)
            localStorage.setItem(CACHE_KEY, JSON.stringify({ usd, lastUpdated: Date.now() }))
        } catch (err) {
            console.warn('Failed to fetch FIL price:', err)
            // Keep existing price if fetch fails
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPrice()
        const interval = setInterval(fetchPrice, CACHE_DURATION)
        return () => clearInterval(interval)
    }, [fetchPrice])

    return { price, loading }
}
