import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "destructive";

type ButtonProps = {
    children: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
    variant?: ButtonVariant;
};

export function Button({
    children,
    disabled = false,
    onClick,
    type = "button",
    variant = "primary",
}: ButtonProps) {
    return (
        <button
            className={`ui-button ui-button--${variant}`}
            disabled={disabled}
            onClick={onClick}
            type={type}
        >
            {children}
        </button>
    );
}
