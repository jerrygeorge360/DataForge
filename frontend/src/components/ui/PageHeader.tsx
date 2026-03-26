import * as React from "react"
import { Link}from "react-router-dom"
import { ChevronRight, Home}from "lucide-react"

interface PageHeaderProps {
    title: string
    actions?: React.ReactNode
    subtitle?:string;
    breadcrumbs?: { label: string; path: string }[]
}

export function PageHeader({ title, actions, breadcrumbs, subtitle }: PageHeaderProps) {

    return (
        <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-end sm:justify-between border-b border-border pb-6">
            <div className="space-y-2">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs text-text-muted font-medium uppercase tracking-wider">
                    <Link to="/" className="hover:text-accent transition-colors flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        Home
                    </Link>
                    {breadcrumbs?.map((crumb) => (
                        <React.Fragment key={crumb.path}>
                            <ChevronRight className="w-3 h-3 opacity-50" />
                            <Link to={crumb.path} className="hover:text-accent transition-colors">
                                {crumb.label}
                            </Link>
                        </React.Fragment>
                    ))}
                    <ChevronRight className="w-3 h-3 opacity-50" />
                    <span className="text-text-primary">Current Page</span>
                </nav>

                <h1 className="text-2xl font-bold tracking-tight text-text-primary leading-tight">
                    {title}
                </h1>

                <p className="text-[12px] text-white">
                    {subtitle}
                </p>
            </div>

            <div className="flex items-center gap-3">
                {actions}
            </div>
        </div>
    )
}
