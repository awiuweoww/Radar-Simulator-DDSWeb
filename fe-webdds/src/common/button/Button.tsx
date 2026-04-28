import { forwardRef, memo } from "react";
import { cn } from "../../utils/cn";
import DotLoading from "../dot-loading/DotLoading";
import type { ButtonProps, ButtonVariant, ButtonColor } from "./Button.types";

const buttonBaseStyles: Record<ButtonVariant, Record<ButtonColor, string>> = {
    solid: {
        primary: "bg-brand-red text-white",
        error: "bg-red-600 text-white",
        success: "bg-green-600 text-white",
        warning: "bg-yellow-500 text-white",
        neutral: "bg-neutral-600 text-white"
    },
    outline: {
        primary: "border border-brand-red text-brand-red",
        error: "border border-red-600 text-red-600",
        success: "border border-green-600 text-green-600",
        warning: "border border-yellow-500 text-yellow-500",
        neutral: "border border-neutral-600 text-neutral-600"
    },
    ghost: {
        primary: "bg-transparent text-brand-red",
        error: "bg-transparent text-red-600",
        success: "bg-transparent text-green-600",
        warning: "bg-transparent text-yellow-500",
        neutral: "bg-transparent text-neutral-600"
    }
};

const buttonHoverStyles: Record<ButtonVariant, Record<ButtonColor, string>> = {
    solid: {
        primary: "hover:bg-brand-red/90",
        error: "hover:bg-red-700",
        success: "hover:bg-green-700",
        warning: "hover:bg-yellow-600",
        neutral: "hover:bg-neutral-700"
    },
    outline: {
        primary: "hover:bg-brand-red/10",
        error: "hover:bg-red-50",
        success: "hover:bg-green-50",
        warning: "hover:bg-yellow-50",
        neutral: "hover:bg-neutral-50"
    },
    ghost: {
        primary: "hover:bg-brand-red/10",
        error: "hover:bg-red-50",
        success: "hover:bg-green-50",
        warning: "hover:bg-yellow-50",
        neutral: "hover:bg-neutral-50"
    }
};

const sizeStyles = {
    xs: "h-6 px-3 text-xs",
    sm: "h-8 px-3 text-sm",
    md: "h-12 px-[18px] text-base",
    lg: "h-14 px-12 text-lg"
};

/**
 * Komponen tombol yang dapat disesuaikan yang mendukung varian, warna, ukuran,
 * status pemuatan, spinner, tata letak lebar penuh, dan atribut tombol asli.
 */
export const Button = memo(
    forwardRef<HTMLButtonElement, ButtonProps>(
        (
            {
                children,
                className,
                variant = "solid",
                color = "primary",
                size = "md",
                loading,
                loadingDirection = "left",
                spinnerColor = "text-current",
                fullWidth = false,
                dataTestId,
                type = "button",
                ...rest
            },
            ref
        ) => {
            const isDisabled = rest.disabled || loading;

            return (
                <button
                    ref={ref}
                    type={type}
                    data-testid={dataTestId}
                    className={cn(
                        "group inline-flex items-center justify-center rounded-lg font-medium transition-all select-none font-montserrat",
                        // Gaya dasar
                        sizeStyles[size],
                        buttonBaseStyles[variant]?.[color],
                        // Keadaan Hover & Active (hanya jika tidak disabled)
                        !isDisabled && buttonHoverStyles[variant]?.[color],
                        !isDisabled && "active:scale-[0.98] active:shadow-inner cursor-pointer",
                        // Keadaan Disabled
                        isDisabled && "opacity-60 cursor-not-allowed pointer-events-none",
                        // Tata Letak
                        fullWidth && "w-full",
                        className
                    )}
                    disabled={isDisabled}
                    {...rest}
                >
                    {loading ? (
                        <DotLoading direction={loadingDirection} color={spinnerColor} />
                    ) : (
                        children
                    )}
                </button>
            );
        }
    )
);

Button.displayName = "Button";

export default Button;
