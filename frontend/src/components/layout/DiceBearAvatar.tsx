import { cn}from '../../lib/utils'

type AvatarStyle = 'identicon' | 'bottts' | 'shapes' | 'pixel-art' | 'micah'

interface DiceBearAvatarProps {
    seed: string
    size?: number
    className?: string
    style?: AvatarStyle
}

export function DiceBearAvatar({
    seed,
    size = 32,
    className = '',
    style = 'identicon'
}: DiceBearAvatarProps) {
    // We use a set of curated background colors for a premium look
    const bgColors = ['f8fafc', 'f1f5f9', 'e2e8f0']
    const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=${bgColors.join(',')}`

    return (
        <div
            className={cn(
                "rounded-full overflow-hidden border border-[var(--border)] bg-[var(--bg-subtle)] flex-shrink-0 flex items-center justify-center shadow-sm",
                className
            )}
            style={{ width: size, height: size }}
        >
            <img
                src={avatarUrl}
                alt={`Avatar for ${seed}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                    // Fallback to a simple colored div if API fails
                    (e.target as HTMLImageElement).style.display = 'none'
                }}
            />
        </div>
    )
}
