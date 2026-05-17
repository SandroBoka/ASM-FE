import { useState } from "react";
import type { BaseSyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/ui/Alert";
import { AppButton } from "../../../components/ui/AppButton";
import { AppTextField } from "../../../components/ui/AppTextField";
import type { Appointment, AppointmentStatus } from "../models/appointmentTypes";

export type AppointmentFormValues = {
    Datum: string;
    VrijemeOd: string;
    VrijemeDo: string;
    Status: AppointmentStatus;
    createHourlySlots?: boolean;
};

type Props = {
    initialValues?: Appointment;
    allowFullDayFree?: boolean;
    onSubmit: (values: AppointmentFormValues) => Promise<void> | void;
    onCancel?: () => void;
    submitLabel: string;
    submittingLabel: string;
    errorMessage?: string | null;
};

const STATUS_OPTIONS: AppointmentStatus[] = ["slobodan", "otkazan"];
const FULL_DAY_TIME_FROM = "08:00";
const FULL_DAY_TIME_TO = "20:00";

export function AppointmentForm({
    initialValues,
    allowFullDayFree = false,
    onSubmit,
    onCancel,
    submitLabel,
    submittingLabel,
    errorMessage,
}: Props) {
    const { t } = useTranslation();
    const [datum, setDatum] = useState(initialValues?.Datum ?? "");
    const [vrijemeOd, setVrijemeOd] = useState(initialValues?.VrijemeOd?.slice(0, 5) ?? "");
    const [vrijemeDo, setVrijemeDo] = useState(initialValues?.VrijemeDo?.slice(0, 5) ?? "");
    const [status, setStatus] = useState<AppointmentStatus>(initialValues?.Status ?? "slobodan");
    const [isFullDayFree, setIsFullDayFree] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    async function handleSubmit(event: BaseSyntheticEvent<SubmitEvent, HTMLFormElement>) {
        event.preventDefault();
        setValidationError(null);

        if (!datum || (!isFullDayFree && (!vrijemeOd || !vrijemeDo))) {
            setValidationError(t("appointments.validation.missingFields"));
            return;
        }
        if (!isFullDayFree && vrijemeOd >= vrijemeDo) {
            setValidationError(t("appointments.validation.timeRangeInvalid"));
            return;
        }

        setIsSubmitting(true);
        try {
            const values: AppointmentFormValues = {
                Datum: datum,
                VrijemeOd: isFullDayFree ? FULL_DAY_TIME_FROM : vrijemeOd,
                VrijemeDo: isFullDayFree ? FULL_DAY_TIME_TO : vrijemeDo,
                Status: isFullDayFree ? "slobodan" : status,
            };
            if (isFullDayFree) {
                values.createHourlySlots = true;
            }
            await onSubmit(values);
        } finally {
            setIsSubmitting(false);
        }
    }

    const displayedError = validationError ?? errorMessage ?? null;

    return (
        <form className="form" onSubmit={handleSubmit}>
            <AppTextField
                label={t("appointments.fields.date")}
                name="datum"
                type="date"
                value={datum}
                onChange={(event) => setDatum(event.target.value)}
                required
            />

            {allowFullDayFree ? (
                <label className="ui-checkbox-field">
                    <input
                        type="checkbox"
                        checked={isFullDayFree}
                        onChange={(event) => setIsFullDayFree(event.target.checked)}
                    />
                    <span>{t("appointments.fields.fullDayFree")}</span>
                </label>
            ) : null}

            <div className="wizard-filters">
                <AppTextField
                    label={t("appointments.fields.timeFrom")}
                    name="vrijemeOd"
                    type="time"
                    value={isFullDayFree ? FULL_DAY_TIME_FROM : vrijemeOd}
                    onChange={(event) => setVrijemeOd(event.target.value)}
                    disabled={isFullDayFree}
                    required={!isFullDayFree}
                />
                <AppTextField
                    label={t("appointments.fields.timeTo")}
                    name="vrijemeDo"
                    type="time"
                    value={isFullDayFree ? FULL_DAY_TIME_TO : vrijemeDo}
                    onChange={(event) => setVrijemeDo(event.target.value)}
                    disabled={isFullDayFree}
                    required={!isFullDayFree}
                />
            </div>

            <label className="ui-field">
                <span className="ui-field__label">{t("appointments.fields.status")}</span>
                <select
                    className="ui-field__input"
                    name="status"
                    value={isFullDayFree ? "slobodan" : status}
                    onChange={(event) => setStatus(event.target.value as AppointmentStatus)}
                    disabled={isFullDayFree}
                >
                    {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                            {t(`appointments.statusOptions.${option}`)}
                        </option>
                    ))}
                </select>
            </label>

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
