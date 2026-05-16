import type { ReactNode } from "react";

type FormLayoutProps = {
    children: ReactNode;
    footer?: ReactNode;
    subtitle?: string;
    title: string;
};

export function FormLayout({ children, footer, subtitle, title }: FormLayoutProps) {
    return (
        <main className="form-page">
            <section className="form-card" aria-labelledby="form-page-title">
                <div className="form-card__header">
                    <h1 id="form-page-title">{title}</h1>
                    {subtitle ? <p>{subtitle}</p> : null}
                </div>

                {children}

                {footer ? <div className="form-card__footer">{footer}</div> : null}
            </section>
        </main>
    );
}
