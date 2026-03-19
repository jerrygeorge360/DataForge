import { formatEther } from "ethers"
import { Edit2, ShieldOff, MoreHorizontal } from "lucide-react"
import { DataTable, Column } from "./ui/DataTable"
import { Badge } from "./ui/Badge"
import { Button } from "./ui/Button"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@radix-ui/react-dropdown-menu"

interface ProducerListing {
    id: number
    name: string
    category: string
    fileFormat: string
    price: bigint
    listingType: number
    salesCount: number
    active: boolean
}

interface ProducerListingTableProps {
    listings: ProducerListing[]
    loading?: boolean
    onEditPrice: (id: number) => void
    onDelist: (id: number) => void
}

export function ProducerListingTable({
    listings,
    loading,
    onEditPrice,
    onDelist
}: ProducerListingTableProps) {

    const columns: Column<ProducerListing>[] = [
        {
            header: 'Name',
            accessorKey: 'name',
            sortable: true,
            render: (val) => <span className="font-semibold text-text-primary">{val}</span>
        },
        {
            header: 'Category',
            accessorKey: 'category',
            render: (val) => <Badge variant="neutral" className="bg-secondary">{val}</Badge>
        },
        {
            header: 'Format',
            accessorKey: 'fileFormat',
            render: (val) => <span className="text-xs font-mono text-text-muted">{val}</span>
        },
        {
            header: 'Price',
            accessorKey: 'price',
            sortable: true,
            render: (val) => <span className="font-bold">{formatEther(val)} FIL</span>
        },
        {
            header: 'Type',
            accessorKey: 'listingType',
            render: (val) => (
                <Badge variant={val === 1 ? 'success' : 'warning'}>
                    {val === 1 ? 'Open' : 'Exclusive'}
                </Badge>
            )
        },
        {
            header: 'Sales',
            accessorKey: 'salesCount',
            sortable: true,
            render: (val) => <span className="font-mono">{val}</span>
        },
        {
            header: 'Status',
            accessorKey: 'active',
            render: (val) => (
                <div className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", val ? "bg-success" : "bg-error")} />
                    <span className="text-xs font-medium">{val ? 'Active' : 'Delisted'}</span>
                </div>
            )
        },
        {
            header: 'Actions',
            accessorKey: 'id',
            render: (val) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[5000] w-48 bg-primary border border-border p-1 rounded-md shadow-lg">
                        <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold text-text-muted uppercase">Options</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => onEditPrice(val)}
                            className="flex items-center gap-2 px-2 py-2 text-sm rounded cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 outline-none"
                        >
                            <Edit2 className="w-4 h-4" /> Edit Price
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="h-px bg-border my-1" />
                        <DropdownMenuItem
                            onClick={() => onDelist(val)}
                            className="flex items-center gap-2 px-2 py-2 text-sm rounded cursor-pointer hover:bg-error/10 text-error outline-none"
                        >
                            <ShieldOff className="w-4 h-4" /> Delist Asset
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ]

    return (
        <DataTable
            columns={columns}
            data={listings}
            loading={loading}
            emptyMessage="No datasets listed in your station yet."
        />
    )
}

import { cn } from "../lib/utils"
