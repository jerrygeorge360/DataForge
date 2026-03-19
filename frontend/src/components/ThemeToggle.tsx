import { Sun, Moon}from 'lucide-react'
import { useTheme}from '../context/ThemeContext'

export default function ThemeToggle({ className }: { className?: string }) {
    const { theme, toggleTheme}= useTheme()

    return (
        <button
            onClick={toggleTheme}
            className={`
                flex items-center justify-center w-8 h-8 rounded-[var(--r-sm)]
                border border-[var(--border)] bg-[var(--bg-card)]
                hover:bg-[var(--bg-subtle)] transition-all duration-200 ease-in-out
                ${className || ''}
            `}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
            {theme === 'light' ? (
                <Sun className="w-4 h-4 text-[var(--text-2)]" />
            ) : (
                <Moon className="w-4 h-4 text-[var(--text-2)]" />
            )}
        </button>
    )
}
