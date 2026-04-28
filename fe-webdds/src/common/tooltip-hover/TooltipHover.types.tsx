import type { ReactNode } from "react";

export interface TooltipHoverProps {
    children: ReactNode;
    tooltipsText: string;
    position?: "top" | "bottom" | "left" | "right";
    className?: string;
    arrowClassName?: string;
}
