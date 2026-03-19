import * as React from "react"
import { cn}from "../../lib/utils"

interface StatProps {
    label: string
    value: React.ReactNode
    change?: {
        value: number | string
        trend: 'up' | 'down' | 'neutral'
    }
    className?: string
}

export function Stat({ label, value, change, className }: StatProps) {
    return (
        <div className={cn("stat-card", className)}>
            <div className="stat-label">
                {label}
            </div>
            <div className="stat-value">
                {value}
            </div>
            {change && (
                <div className={cn(
                    "stat-change",
                    change.trend === 'up' && "up",
                    change.trend === 'down' && "down"
                )}>
                    {change.trend === 'up' ? '▲' : change.trend === 'down' ? '▼' : ''}
                    <span className="ml-1">{change.value}</span>
                </div>
            )}
        </div>
    )
}
