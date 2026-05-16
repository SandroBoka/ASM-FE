import { useState } from "react";
import type { BaseSyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/ui/Alert";
import { AppButton } from "../../../components/ui/AppButton";
import { AppTextField } from "../../../components/ui/AppTextField";
import type { Service } from "../models/serviceTypes";

export type ServiceFormValues = {
    NazivUsluge: string;
    Opis: string | null;
    Trajanje: number;
    Cijena: number;
};

type ServiceFormProps = {
    initialValues?: Service;
    onSubmit: (values: ServiceFormValues) => Promise<void> | void;
    onCancel?: () => void;
    submitLabel: string;
    submittingLabel: string;
    errorMessage?: string | null;
};

export function ServiceForm({
    initialValues,
    onSubmit,
    onCancel,
    submitLabel,
    submittingLabel,
    errorMessage,
}: ServiceFormProps) {
    const { t } = useTranslation();
    const [naziv, setNaziv] = useState(initialValues?.NazivUsluge ?? "");
    const [opis, setOpis] = useState(initialValues?.Opis ?? "");
    const [trajanje, setTrajanje] = useState<string>(
        initialValues?.Trajanje !== undefined ? String(initialValues.Trajanje) : "",
    );
    const [cijena, setCijena] = useState<string>(
        initialValues?.Cijena !== undefined ? String(initialValues.Cijena) : "",
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    async function handleSubmit(event: BaseSyntheticEvent<SubmitEvent, HTMLFormElement>) {
        event.preventDefault();
        setValidationError(null);

        const trajanjeNumber = Number.parseInt(trajanje, 10);
        const cijenaNumber = Number.parseFloat(cijena);

        if (Number.isNaN(trajanjeNumber) || trajanjeNumber <= 0) {
            setValidationError(t("services.validation.durationPositive"));
            return;
        }

        if (Number.isNaN(cijenaNumber) || cijenaNumber < 0) {
            setValidationError(t("services.validation.pricePositive"));
            return;
        }

        setIsSubmitting(true);

        try {
            await onSubmit({
                NazivUsluge: naziv.trim(),
                Opis: opis.trim() === "" ? null : opis.trim(),
                Trajanje: trajanjeNumber,
                Cijena: cijenaNumber,
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const displayedError = validationError ?? errorMessage ?? null;

    return (
        <form className="form" onSubmit={handleSubmit}>
            <AppTextField
                label={t("services.fields.name")}
                name="naziv"
                value={naziv}
                onChange={(event) => setNaziv(event.target.value)}
                required
            />

            <label className="ui-field">
                <span className="ui-field__label">{t("services.fields.description")}</span>
                <textarea
                    className="ui-field__input"
                    name="opis"
                    value={opis}
                    onChange={(event) => setOpis(event.target.value)}
                    rows={3}
                />
            </label>

            <AppTextField
                label={t("services.fields.duration")}
                name="trajanje"
                type="number"
                min={1}
                value={trajanje}
                onChange={(event) => setTrajanje(event.target.value)}
                required
                placeholder="60"
            />

            <AppTextField
                label={t("services.fields.price")}
                name="cijena"
                type="number"
                min={0}
                step="0.01"
                value={cijena}
                onChange={(event) => setCijena(event.target.value)}
                required
                placeholder="150.00"
            />

            {displayedError ? <Alert variant="error">{displayedError}</Alert> : null}

            <div className="form-actions">
                <AppButton type="submit" disabled={isSubmitting}>
                    {isSubmitting ? submittingLabel : submitLabel}
                </AppButton>
                {onCancel ? (
                    <AppButton type="button" variant="secondary" onClick={onCancel}>
                        {t("common.cancel")}
                    </AppButton>
                ) : null}
            </div>
        </form>
    );
}
