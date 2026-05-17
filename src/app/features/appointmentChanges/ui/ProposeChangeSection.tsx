import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/ui/Alert";
import { AppButton } from "../../../components/ui/AppButton";
import { AppTextField } from "../../../components/ui/AppTextField";
import { useFreeAppointments } from "../../appointments/hooks/useAppointments";
import type { Reservation } from "../../reservations/models/reservationTypes";
import { useCreateAppointmentChange } from "../hooks/useAppointmentChanges";

function toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function formatDate(value: string): string {
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;
    return `${day}.${month}.${year}.`;
}

function formatTimeRange(from: string, to: string): string {
    return `${from.slice(0, 5)}–${to.slice(0, 5)}`;
}

function durationInMinutes(from: string, to: string): number {
    const [fromHours, fromMinutes] = from.split(":").map(Number);
    const [toHours, toMinutes] = to.split(":").map(Number);
    return toHours * 60 + toMinutes - (fromHours * 60 + fromMinutes);
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) {
        return error.message;
    }
    return fallback;
}

type Props = {
    reservation: Reservation;
};

export function ProposeChangeSection({ reservation }: Props) {
    const reservationId = reservation.IdRezervacije;
    const currentAppointmentId = reservation.IdTermina;
    const totalServiceDuration = reservation.services.reduce(
        (sum, item) => sum + item.service.Trajanje * item.Kolicina,
        0,
    );
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const today = useMemo(() => toIsoDate(new Date()), []);
    const defaultDateTo = useMemo(() => {
        const future = new Date();
        future.setDate(future.getDate() + 14);
        return toIsoDate(future);
    }, []);
    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(defaultDateTo);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

    const appointmentsQuery = useFreeAppointments({ dateFrom, dateTo }, isOpen);
    const createMutation = useCreateAppointmentChange();

    async function handleSubmit() {
        if (selectedAppointmentId === null) return;
        await createMutation.mutateAsync({
            IdRezervacije: reservationId,
            IdNovogTermina: selectedAppointmentId,
        });
        setIsOpen(false);
        setSelectedAppointmentId(null);
    }

    if (createMutation.isSuccess) {
        return <Alert variant="info">{t("appointmentChanges.requestSent")}</Alert>;
    }

    if (!isOpen) {
        return (
            <AppButton variant="secondary" onClick={() => setIsOpen(true)}>
                {t("appointmentChanges.proposeAction")}
            </AppButton>
        );
    }

    const availableAppointments = (appointmentsQuery.data ?? []).filter(
        (a) => a.IdTermina !== currentAppointmentId,
    );

    const selectedAppointment = availableAppointments.find(
        (a) => a.IdTermina === selectedAppointmentId,
    );
    const selectedSlotDuration = selectedAppointment
        ? durationInMinutes(selectedAppointment.VrijemeOd, selectedAppointment.VrijemeDo)
        : null;
    const exceedsSlot =
        selectedSlotDuration !== null &&
        totalServiceDuration > 0 &&
        totalServiceDuration > selectedSlotDuration;

    return (
        <div className="propose-change">
            <p className="muted-hint">{t("appointmentChanges.proposeHint")}</p>

            <div className="wizard-filters">
                <AppTextField
                    label={t("reservations.form.dateFrom")}
                    name="changeDateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                />
                <AppTextField
                    label={t("reservations.form.dateTo")}
                    name="changeDateTo"
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                />
            </div>

            {appointmentsQuery.isLoading ? <p>{t("common.loading")}</p> : null}

            {appointmentsQuery.isError ? (
                <Alert variant="error">
                    {getErrorMessage(appointmentsQuery.error, t("common.unknownError"))}
                </Alert>
            ) : null}

            {!appointmentsQuery.isLoading && availableAppointments.length === 0 ? (
                <Alert variant="info">{t("reservations.form.noAppointments")}</Alert>
            ) : null}

            {availableAppointments.length > 0 ? (
                <ul className="appointment-list">
                    {availableAppointments.map((appointment) => {
                        const selected = appointment.IdTermina === selectedAppointmentId;
                        return (
                            <li key={appointment.IdTermina}>
                                <button
                                    type="button"
                                    className={`appointment-list__item ${
                                        selected ? "appointment-list__item--selected" : ""
                                    }`}
                                    onClick={() => setSelectedAppointmentId(appointment.IdTermina)}
                                >
                                    <span className="appointment-list__date">
                                        {formatDate(appointment.Datum)}
                                    </span>
                                    <span className="appointment-list__time">
                                        {formatTimeRange(
                                            appointment.VrijemeOd,
                                            appointment.VrijemeDo,
                                        )}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : null}

            {exceedsSlot && selectedSlotDuration !== null ? (
                <Alert variant="error">
                    {t("reservations.validation.durationExceedsSlot", {
                        total: totalServiceDuration,
                        slot: selectedSlotDuration,
                    })}
                </Alert>
            ) : null}

            {createMutation.error ? (
                <Alert variant="error">
                    {getErrorMessage(createMutation.error, t("common.unknownError"))}
                </Alert>
            ) : null}

            <div className="form-actions">
                <AppButton
                    onClick={handleSubmit}
                    disabled={
                        selectedAppointmentId === null || createMutation.isPending || exceedsSlot
                    }
                >
                    {createMutation.isPending
                        ? t("appointmentChanges.sendingRequest")
                        : t("appointmentChanges.sendRequest")}
                </AppButton>
                <AppButton
                    variant="secondary"
                    onClick={() => {
                        setIsOpen(false);
                        setSelectedAppointmentId(null);
                    }}
                    disabled={createMutation.isPending}
                >
                    {t("common.cancel")}
                </AppButton>
            </div>
        </div>
    );
}
