import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "../../lib/utils"

interface Step {
    label: string
    status: 'waiting' | 'active' | 'done' | 'error'
}

interface StepIndicatorProps {
    steps: Step[]
    className?: string
}

export function StepIndicator({ steps, className }: StepIndicatorProps) {
    return (
        <div className={cn("flex items-center w-full mb-8", className)}>
            {steps.map((step, i) => (
                <React.Fragment key={i}>
                    {/* Step Item */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Circle */}
                        <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: step.status === 'active' ? 'var(--brand)' : step.status === 'done' ? 'var(--success)' : 'var(--bg-subtle)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: 700,
                            flexShrink: 0,
                            border: step.status === 'waiting' ? '1px solid var(--border)' : 'none'
                        }}>
                            {step.status === 'done' ? (
                                <Check size={16} />
                            ) : (
                                <span style={{ color: step.status === 'waiting' ? 'var(--text-3)' : 'white' }}>{i + 1}</span>
                            )}
                        </div>

                        {/* Label */}
                        <span style={{
                            fontSize: '13px',
                            fontWeight: step.status === 'active' ? 600 : 500,
                            color: step.status === 'active' ? 'var(--text-1)' : 'var(--text-3)',
                            transition: 'color 0.2s'
                        }}>
                            {step.label}
                        </span>
                    </div>

                    {/* Connector Line */}
                    {i < steps.length - 1 && (
                        <div style={{
                            flex: 1,
                            height: '1px',
                            background: 'var(--border)',
                            margin: '0 16px'
                        }} />
                    )}
                </React.Fragment>
            ))}
        </div>
    )
}
