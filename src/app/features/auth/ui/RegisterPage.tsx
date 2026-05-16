import { useState } from "react";
import type { BaseSyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { FormLayout } from "../../../components/ui/FormLayout";
import { AppTextField } from "../../../components/ui/AppTextField";
import { Alert } from "../../../components/ui/Alert";
import { AppButton } from "../../../components/ui/AppButton";

function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error) {
        return error.message;
    }

    return fallbackMessage;
}

export function RegisterPage() {
    const { login, registerCustomer } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: BaseSyntheticEvent<SubmitEvent, HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);
        setIsSubmitting(true);

        try {
            await registerCustomer({
                Ime: firstName,
                Prezime: lastName,
                Email: email,
                Telefon: phone.trim() || null,
                Lozinka: password,
            });

            await login({
                Email: email,
                Lozinka: password,
            });

            navigate("/", { replace: true });
        } catch (error) {
            setErrorMessage(getErrorMessage(error, t("auth.registerFailed")));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <FormLayout
            title={t("auth.register")}
            subtitle={t("auth.registerSubtitle")}
            footer={
                <p>
                    {t("auth.hasAccount")} <Link to="/login">{t("auth.loginAction")}</Link>
                </p>
            }
        >
            <form className="form" onSubmit={handleSubmit}>
                <AppTextField
                    label={t("auth.firstName")}
                    name="firstName"
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                />

                <AppTextField
                    label={t("auth.lastName")}
                    name="lastName"
                    type="text"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required
                />

                <AppTextField
                    label={t("auth.email")}
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />

                <AppTextField
                    label={t("auth.phone")}
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
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
                    {isSubmitting ? t("auth.registerPending") : t("auth.registerAction")}
                </AppButton>
            </form>
        </FormLayout>
    );
}
