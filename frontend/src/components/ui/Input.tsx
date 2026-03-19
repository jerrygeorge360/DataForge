import * as React from "react"
import { cn}from "../../lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    helperText?: string
    error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, helperText, error, ...props }, ref) => {
        return (
            <div className="form-group">
                {label && (
                    <label className="form-label">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={cn(
                        "form-input",
                        error && "error",
                        className
                    )}
                    {...props}
                />
                {error ? (
                    <p className="form-error">{error}</p>
                ) : helperText ? (
                    <p className="form-helper">{helperText}</p>
                ) : null}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
