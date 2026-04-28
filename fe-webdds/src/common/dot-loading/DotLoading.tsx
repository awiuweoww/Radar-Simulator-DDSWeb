import { memo, type FC, type HTMLAttributes } from "react";
import "./dotloading.css";

export interface DotLoadingProps extends HTMLAttributes<HTMLDivElement> {
    direction?: "left" | "right" | "up" | "down";
    color?: string;
}

/**
 * A component for displaying a loading state with animated dots.
 *
 * @param {Object} props Component props
 * @param {"left" | "right" | "up" | "down"} [props.direction="left"] Direction of the loading animation
 * @param {string} [props.className=""] Additional class names to apply to the element
 * @param {string} [props.color="text-current"] Color class for the dots
 * @param {Object} [props.style={}] Additional CSS styles to apply to the element
 * @returns A JSX element of the DotLoading component.
 */
const DotLoading: FC<DotLoadingProps> = ({
    direction = "left",
    className = "",
    color = "text-current",
    style = {},
    ...props
}) => {
    /**
     * Get the correct CSS flex-direction value based on the given direction.
     *
     * @returns A string value for the CSS flex-direction property.
     */
    const getFlexDirection = () => {
        if (direction === "up") return "column-reverse";
        if (direction === "down") return "column";
        if (direction === "left") return "row-reverse";
        return "row";
    };

    return (
        <div
            className={`dot-loading ${className} ${color}`}
            data-testid="dot-loading"
            style={{
                display: "flex",
                flexDirection: getFlexDirection(),
                alignItems: "center",
                justifyContent: "center",
                ...style
            }}
            {...props}
        >
            <span className="dot" />
            <span className="dot delay-1" />
            <span className="dot delay-2" />
            <span className="dot delay-3" />
        </div>
    );
};

export default memo(DotLoading);
