import { forwardRef } from "react";
import { cn } from "../../utils/cn";
import { type InputProps } from "./Input.types";

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            containerClassName,
            label,
            helperText,
            error,
            leftIcon,
            rightIcon,
            fullWidth = false,
            disabled,
            ...props
        },
        ref,
    ) => {
        return (
            <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full", containerClassName)}>
                {label && (
                    <label
                        className={cn(
                            "text-sm font-medium",
                            error ? "text-red-500" : "text-neutral-700 dark:text-neutral-200",
                            disabled && "opacity-50 cursor-not-allowed",
                        )}
                    >
                        {label}
                    </label>
                )}
                <div className="relative group">
                    {leftIcon && (
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-brand-red pointer-events-none">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        disabled={disabled}
                        className={cn(
                            "flex h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-red focus-visible:border-brand-red disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 transition-all duration-200",
                            leftIcon && "pl-11",
                            rightIcon && "pr-11",
                            error && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500",
                            className,
                        )}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-brand-red pointer-events-none">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {(helperText || error) && (
                    <p
                        className={cn(
                            "text-xs",
                            error ? "text-red-500" : "text-neutral-500 dark:text-neutral-400",
                        )}
                    >
                        {error || helperText}
                    </p>
                )}
            </div>
        );
    },
);

Input.displayName = "Input";

export default Input;
