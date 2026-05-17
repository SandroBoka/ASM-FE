import { useState } from "react";
import type { BaseSyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/ui/Alert";
import { AppButton } from "../../../components/ui/AppButton";
import { AppTextField } from "../../../components/ui/AppTextField";
import type { Vehicle } from "../models/vehicleTypes";

export type VehicleFormValues = {
    Marka: string;
    Model: string;
    Godina: number;
    VrstaMotora: string;
    RegOznaka: string;
};

type VehicleFormProps = {
    initialValues?: Vehicle;
    onSubmit: (values: VehicleFormValues) => Promise<void> | void;
    onCancel?: () => void;
    submitLabel: string;
    submittingLabel: string;
    errorMessage?: string | null;
};

const CURRENT_YEAR = new Date().getFullYear();

export function VehicleForm({
    initialValues,
    onSubmit,
    onCancel,
    submitLabel,
    submittingLabel,
    errorMessage,
}: VehicleFormProps) {
    const { t } = useTranslation();
    const [marka, setMarka] = useState(initialValues?.Marka ?? "");
    const [model, setModel] = useState(initialValues?.Model ?? "");
    const [godina, setGodina] = useState<string>(
        initialValues?.Godina !== undefined ? String(initialValues.Godina) : "",
    );
    const [vrstaMotora, setVrstaMotora] = useState(initialValues?.VrstaMotora ?? "");
    const [regOznaka, setRegOznaka] = useState(initialValues?.RegOznaka ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    async function handleSubmit(event: BaseSyntheticEvent<SubmitEvent, HTMLFormElement>) {
        event.preventDefault();
        setValidationError(null);

        const godinaNumber = Number.parseInt(godina, 10);

        if (Number.isNaN(godinaNumber) || godinaNumber < 1900 || godinaNumber > 2100) {
            setValidationError(t("vehicles.validation.yearOutOfRange"));
            return;
        }

        setIsSubmitting(true);

        try {
            await onSubmit({
                Marka: marka.trim(),
                Model: model.trim(),
                Godina: godinaNumber,
                VrstaMotora: vrstaMotora,
                RegOznaka: regOznaka.trim().toUpperCase(),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const displayedError = validationError ?? errorMessage ?? null;

    return (
        <form className="form" onSubmit={handleSubmit}>
            <AppTextField
                label={t("vehicles.fields.make")}
                name="marka"
                value={marka}
                onChange={(event) => setMarka(event.target.value)}
                required
            />

            <AppTextField
                label={t("vehicles.fields.model")}
                name="model"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                required
            />

            <AppTextField
                label={t("vehicles.fields.year")}
                name="godina"
                type="number"
                min={1900}
                max={2100}
                value={godina}
                onChange={(event) => setGodina(event.target.value)}
                required
                placeholder={String(CURRENT_YEAR)}
            />

            <AppTextField
                label={t("vehicles.fields.engineType")}
                name="vrstaMotora"
                value={vrstaMotora}
                onChange={(event) => setVrstaMotora(event.target.value)}
                required
                placeholder="benzin, dizel, ..."
            />

            <AppTextField
                label={t("vehicles.fields.plate")}
                name="regOznaka"
                value={regOznaka}
                onChange={(event) => setRegOznaka(event.target.value)}
                required
                placeholder="ZG-1234-AB"
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
