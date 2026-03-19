import * as React from "react"
import { formatEther}from "ethers"
import {
    ChevronDown,
    Copy,
    ExternalLink,
    LogOut,
    CreditCard,
    Check
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@radix-ui/react-dropdown-menu"
import { Button}from "./Button"
import { cn}from "../../lib/utils"

interface WalletButtonProps {
    account: string
    balance?: bigint // tFIL balance
    onConnect: () => void
    onDisconnect?: () => void
    onBuyCrypto?: () => void
    isConnecting?: boolean
    className?: string
}

export function WalletButton({
    account,
    balance = 0n,
    onConnect,
    onDisconnect,
    onBuyCrypto,
    isConnecting,
    className
}: WalletButtonProps) {
    const [copied, setCopied] = React.useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(account)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const shortenedAddress = account
        ? `${account.slice(0, 6)}...${account.slice(-4)}`
        : ""

    if (!account) {
        return (
            <Button
                onClick={onConnect}
                loading={isConnecting}
                className={cn("btn btn-primary", className)}
            >
                Connect Wallet
            </Button>
        )
    }

    return (
        <div className={cn("relative", className)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="btn btn-secondary gap-2 px-3 h-10">
                        <div className="flex flex-col items-start leading-none gap-1 mr-1">
                            <span className="text-[10px] font-mono text-accent uppercase font-bold tracking-widest">
                                Connected
                            </span>
                            <span className="text-xs font-bold">
                                {shortenedAddress}
                            </span>
                        </div>
                        <div className="h-4 w-px bg-border mx-1" />
                        <span className="text-xs font-bold text-accent">
                            {Number(formatEther(balance)).toFixed(3)} FIL
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted" />
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    className="z-[7000] w-56 p-1 mt-2 bg-card border border-border rounded shadow animate-in fade-in-0 zoom-in-95"
                >
                    <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted uppercase tracking-wider">
                        Wallet Options
                    </DropdownMenuLabel>

                    <DropdownMenuItem
                        className="flex items-center gap-2 px-2 py-2 text-sm rounded cursor-pointer hover:bg-subtle outline-none"
                        onClick={handleCopy}
                    >
                        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted" />}
                        {copied ? 'Copied!' : 'Copy Address'}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        className="flex items-center gap-2 px-2 py-2 text-sm rounded cursor-pointer hover:bg-subtle outline-none"
                        asChild
                    >
                        <a href={`https://calibration.filfox.info/en/address/${account}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-4 h-4 text-muted" />
                            View on Filfox
                        </a>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="h-px bg-border my-1" />

                    <DropdownMenuItem
                        className="flex items-center gap-2 px-2 py-2 text-sm rounded cursor-pointer hover:bg-subtle outline-none"
                        onClick={onBuyCrypto}
                    >
                        <CreditCard className="w-4 h-4 text-accent" />
                        Buy Crypto (Transak)
                    </DropdownMenuItem>

                    {onDisconnect && (
                        <DropdownMenuItem
                            className="flex items-center gap-2 px-2 py-2 text-sm rounded cursor-pointer text-error hover:bg-error outline-none"
                            onClick={onDisconnect}
                        >
                            <LogOut className="w-4 h-4" />
                            Disconnect
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
