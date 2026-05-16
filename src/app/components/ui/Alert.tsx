import type { ReactNode } from "react";

type AlertVariant = "error" | "info";

type AlertProps = {
    children: ReactNode;
    variant?: AlertVariant;
};

export function Alert({ children, variant = "info" }: AlertProps) {
    return (
        <div
            className={`ui-alert ui-alert--${variant}`}
            role={variant === "error" ? "alert" : "status"}
        >
            {children}
        </div>
    );
}
