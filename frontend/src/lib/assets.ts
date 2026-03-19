const CATEGORY_KEYWORDS: Record<string, string> = {
    'Finance': 'finance,trading,stock-market,crypto',
    'Weather': 'weather,meteorology,clouds,storm',
    'Sports': 'sports,stadium,athlete,fitness',
    'Health': 'health,medical,hospital,science',
    'Research': 'laboratory,microscope,biology,research',
    'Media': 'media,film,cinema,television',
    'Other': 'data,technology,server,abstract'
}

/**
 * Returns a curated Unsplash image URL based on the dataset category
 */
export function getUnsplashUrl(category: string, width: number = 800, height: number = 450): string {
    const keyword = CATEGORY_KEYWORDS[category] || 'technology,data'
    return `https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=${width}&h=${height}&auto=format&fit=crop&sig=${encodeURIComponent(keyword)}`
}

/**
 * Generates a mock set of sparkline data (normalized coordinates)
 */
export function generateMockSparkline(length: number = 10): number[] {
    return Array.from({ length }, () => Math.floor(Math.random() * 80) + 10)
}

/**
 * Formats bytes into human readable sizes
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
