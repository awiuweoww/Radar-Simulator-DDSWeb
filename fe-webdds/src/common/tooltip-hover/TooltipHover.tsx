
import { memo } from "react";
import { cn } from "../../utils/cn";
import { type TooltipHoverProps } from "./TooltipHover.types";

const getPositionClasses = (position: string) => {
    switch (position) {
        case "right":
            return "left-full top-1/2 ml-2 -translate-y-1/2";
        case "left":
            return "right-full top-1/2 mr-2 -translate-y-1/2";
        case "bottom":
            return "top-full left-1/2 mt-2 -translate-x-1/2";
        case "top":
        default:
            return "bottom-full left-1/2 mb-2 -translate-x-1/2";
    }
};

const getArrowClasses = (position: string) => {
    switch (position) {
        case "right":
            return "left-[-4px] top-1/2 -translate-y-1/2";
        case "left":
            return "right-[-4px] top-1/2 -translate-y-1/2";
        case "bottom":
            return "top-[-4px] left-1/2 -translate-x-1/2";
        case "top":
        default:
            return "bottom-[-4px] left-1/2 -translate-x-1/2";
    }
};

const TooltipHover = memo(({
    children,
    tooltipsText,
    position = "top",
    className,
    arrowClassName
}: TooltipHoverProps) => {
    const positionClass = getPositionClasses(position);
    const arrowClass = getArrowClasses(position);

    return (
        <div className="group relative inline-flex">
            {children}
            <div
                role="tooltip"
                className={cn(
                    "absolute z-50 hidden group-hover:block",
                    "whitespace-nowrap rounded-lg px-3 py-1.5 border shadow-2xl",
                    "bg-white border-neutral-100 text-neutral-800 dark:bg-neutral-950 dark:border-neutral-800 dark:text-white",
                    "text-[10px] font-black uppercase tracking-widest",
                    "animate-in fade-in zoom-in-95 duration-200",
                    "font-montserrat",
                    positionClass,
                    className
                )}
            >
                <div
                    className={cn(
                        "absolute h-2 w-2 rotate-45 border",
                        "bg-white border-neutral-100 dark:bg-neutral-950 dark:border-neutral-800",
                        arrowClass,
                        arrowClassName
                    )}
                />
                {tooltipsText}
            </div>
        </div>
    );
});

TooltipHover.displayName = "TooltipHover";

export default TooltipHover;
