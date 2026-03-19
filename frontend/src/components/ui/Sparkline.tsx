import { useTheme}from "../../context/ThemeContext"
import { cn}from "../../lib/utils"

interface SparklineProps {
    data: number[]
    className?: string
}

export function Sparkline({ data, className }: SparklineProps) {
    const { theme}= useTheme()
    const isDark = theme === 'dark'

    if (isDark) {
        // ASCII Sparkline
        const chars = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█']
        const max = Math.max(...data, 1)
        const ascii = data.map(v => chars[Math.floor((v / max) * (chars.length - 1))]).join('')
        return (
            <div className={cn("font-mono text-accent text-lg tracking-tighter", className)}>
                {ascii}
            </div>
        )
    }

    // SVG Sparkline
    const max = Math.max(...data, 1)
    const width = 100
    const height = 30
    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width
        const y = height - (v / max) * height
        return `${x},${y}`
    }).join(' ')

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className={cn("w-24 h-8 overflow-visible", className)}
            preserveAspectRatio="none"
        >
            <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="text-accent"
            />
        </svg>
    )
}
