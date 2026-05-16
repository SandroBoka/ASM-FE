import { useState } from "react";
import type { BaseSyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/ui/Alert";
import { AppTextField } from "../../../components/ui/AppTextField";
import { useAuth } from "../hooks/useAuth";
import { FormLayout } from "../../../components/ui/FormLayout";
import { AppButton } from "../../../components/ui/AppButton";

function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error) {
        return error.message;
    }

    return fallbackMessage;
}

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: BaseSyntheticEvent<SubmitEvent, HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);
        setIsSubmitting(true);

        try {
            await login({
                Email: email,
                Lozinka: password,
            });
            navigate("/", { replace: true });
        } catch (error) {
            setErrorMessage(getErrorMessage(error, t("auth.loginFailed")));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <FormLayout
            title={t("auth.login")}
            subtitle={t("auth.loginSubtitle")}
            footer={
                <p>
                    {t("auth.noAccount")} <Link to="/register">{t("auth.registerAction")}</Link>
                </p>
            }
        >
            <form className="form" onSubmit={handleSubmit}>
                <AppTextField
                    label={t("auth.email")}
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />

                <AppTextField
                    label={t("auth.password")}
                    name="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />

                {errorMessage ? <Alert variant="error">{errorMessage}</Alert> : null}

                <AppButton type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t("auth.loginPending") : t("auth.loginAction")}
                </AppButton>
            </form>
        </FormLayout>
    );
}
