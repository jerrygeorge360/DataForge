import { useEffect } from 'react'
import { Transak } from '@transak/transak-sdk'

interface TransakWidgetProps {
    walletAddress: string
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export default function TransakWidget({ walletAddress, isOpen, onClose, onSuccess }: TransakWidgetProps) {
    useEffect(() => {
        if (!isOpen) return

        const apiKey = import.meta.env.VITE_TRANSAK_API_KEY || 'your-transak-api-key'
        const transak = new Transak({
            apiKey: apiKey,
            environment: 'STAGING',
            defaultCryptoCurrency: 'FIL',
            network: 'filecoin',
            walletAddress: walletAddress,
            themeColor: '00d4ff', // Match DataForge accent
            widgetHeight: '625px',
            widgetWidth: '450px',
        } as any)

        transak.init()

        // To get all the event
        const tAny = transak as any
        tAny.on(tAny.ALL_EVENTS, (data: any) => {
            console.log('Transak Event:', data)
        })

        // This will trigger when the user successfully completes the order
        tAny.on(tAny.EVENTS.TRANSAK_ORDER_COMPLETED, (orderData: any) => {
            console.log('Order Completed:', orderData)
            if (onSuccess) onSuccess()
            tAny.close()
            onClose()
        })

        // Close handler
        tAny.on(tAny.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
            onClose()
        })

        return () => {
            tAny.close()
        }
    }, [isOpen, walletAddress, onClose, onSuccess])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="p-8 card border-accent bg-black/60 max-w-sm text-center space-y-4 animate-in zoom-in-95">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="text-xs font-mono text-accent uppercase tracking-widest animate-pulse">
                    Handshaking with Transak gateway...
                </div>
            </div>
        </div>
    )
}
