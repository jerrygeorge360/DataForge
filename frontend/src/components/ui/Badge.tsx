import * as React from "react"
import { cn}from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
}

const Badge = ({ className, variant = 'neutral', ...props }: BadgeProps) => {
    return (
        <div
            className={cn(
                "badge",
                `badge-${variant}`,
                className
            )}
            {...props}
        />
    )
}

export { Badge }
