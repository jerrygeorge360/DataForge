import * as React from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

export interface Column<T> {
    header: string
    accessorKey?: keyof T
    accessor?: (item: T) => React.ReactNode
    sortable?: boolean
    render?: (value: any, item: T) => React.ReactNode
}

interface DataTableProps<T> {
    columns: Column<T>[]
    data: T[]
    loading?: boolean
    emptyMessage?: string
}

export function DataTable<T>({ columns, data, loading, emptyMessage = "No results found." }: DataTableProps<T>) {
    const [sortKey, setSortKey] = React.useState<keyof T | null>(null)
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc')

    const handleSort = (key: keyof T) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortOrder('asc')
        }
    }

    const sortedData = React.useMemo(() => {
        if (!sortKey) return data
        return [...data].sort((a, b) => {
            const valA = a[sortKey]
            const valB = b[sortKey]
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1
            return 0
        })
    }, [data, sortKey, sortOrder])

    return (
        <div className="w-full overflow-hidden" style={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((column, i) => (
                            <th
                                key={i}
                                onClick={() => column.sortable && column.accessorKey && handleSort(column.accessorKey)}
                                className={cn(column.sortable && column.accessorKey && "cursor-pointer select-none")}
                            >
                                <div className="flex items-center" style={{ gap: '8px' }}>
                                    {column.header}
                                    {column.sortable && column.accessorKey && (
                                        <div className="flex flex-col" style={{ color: 'var(--text-3)' }}>
                                            {sortKey === column.accessorKey ? (
                                                sortOrder === 'asc' ? <ChevronUp style={{ width: '12px', height: '12px', color: 'var(--brand)' }} /> : <ChevronDown style={{ width: '12px', height: '12px', color: 'var(--brand)' }} />
                                            ) : (
                                                <ChevronDown style={{ width: '12px', height: '12px', opacity: 0.2 }} />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className={cn(loading && "opacity-50 transition-opacity duration-300 pointer-events-none")}>
                    {sortedData.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center" style={{ padding: '48px 24px', color: 'var(--text-3)' }}>
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        sortedData.map((item, i) => (
                            <tr key={i}>
                                {columns.map((column, j) => {
                                    const value = column.accessorKey ? item[column.accessorKey] : undefined
                                    return (
                                        <td key={j}>
                                            {column.render
                                                ? column.render(value, item)
                                                : column.accessor
                                                    ? column.accessor(item)
                                                    : String(value ?? '')}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}
