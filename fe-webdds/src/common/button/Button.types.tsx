
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "solid" | "outline" | "ghost";
export type ButtonColor = "primary" | "error" | "success" | "warning" | "neutral";

export type ButtonProps = {
    children: ReactNode;
    variant?: ButtonVariant;
    color?: ButtonColor;
    size?: "xs" | "sm" | "md" | "lg";
    loading?: boolean;
    spinnerColor?: string;
    className?: string;
    fullWidth?: boolean;
    dataTestId?: string;
    loadingDirection?: "left" | "right" | "up" | "down";
} & ButtonHTMLAttributes<HTMLButtonElement>;
