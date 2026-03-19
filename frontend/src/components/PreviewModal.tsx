import { useState, useEffect}from 'react'
import { useFilecoin}from '../hooks/useFilecoin'

interface PreviewModalProps {
    isOpen: boolean
    onClose: () => void
    previewCid: string
    datasetName: string
    price: string
    onBuy: () => void
}

function PreviewModal({ isOpen, onClose, previewCid, datasetName, price, onBuy }: PreviewModalProps) {
    const { download, downloading, error}= useFilecoin()
    const [data, setData] = useState<string[][]>([])

    useEffect(() => {
        if (isOpen && previewCid) {
            loadPreview()
        }
    }, [isOpen, previewCid])

    async function loadPreview() {
        setData([])
        try {
            const buffer = await download('', previewCid)
            if (buffer) {
                const text = new TextDecoder().decode(buffer)
                const rows = text.split('\n').filter(row => row.trim() !== '')
                const parsed = rows.map(row => row.split(','))
                setData(parsed)
            }
       }catch (err) {
            console.error('Error loading preview:', err)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
            <div className="card w-full max-w-4xl bg-card shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider">Inspect Preview</h2>
                        <p className="text-[10px] text-muted font-mono">{datasetName}</p>
                    </div>
                    <button onClick={onClose} className="text-muted hover:text-text-primary h-8 w-8 flex items-center justify-center rounded-full hover:bg-subtle/50 transition-colors">✕</button>
                </header>

                <div className="flex-1 overflow-auto p-0">
                    {downloading ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                            <div className="text-[10px] font-mono text-muted uppercase animate-pulse">Retrieving from Filecoin...</div>
                        </div>
                    ) : error ? (
                        <div className="py-12 text-center text-error text-xs font-medium bg-error/5 border-y border-error/10">ERR: Preview Unavailable ({error})</div>
                    ) : data.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {data[0].map((header, i) => (
                                        <th key={i}>{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(1).map((row, i) => (
                                    <tr key={i}>
                                        {row.map((cell, j) => (
                                            <td key={j} className="text-[11px] py-2">{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-20 text-center text-muted font-mono text-xs">Empty Dataset Snippet</div>
                    )}
                </div>

                <footer className="p-4 border-t border-border bg-subtle/30 flex items-center justify-between gap-4">
                    <button onClick={onClose} className="btn btn-secondary btn-sm px-6">Close</button>
                    <button
                        onClick={() => { onClose(); onBuy(); }}
                        className="btn btn-primary btn-sm px-8"
                    >
                        Purchase Access • {price} FIL
                    </button>
                </footer>
            </div>
        </div>
    )
}

export default PreviewModal
