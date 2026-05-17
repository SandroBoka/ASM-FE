import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/ui/Alert";
import { AppButton } from "../../../components/ui/AppButton";
import { useAuth } from "../../auth/hooks/useAuth";
import {
    useAllAppointments,
    useCreateAppointment,
    useDeleteAppointment,
    useUpdateAppointment,
} from "../hooks/useAppointments";
import type { Appointment, AppointmentStatus } from "../models/appointmentTypes";
import { AppointmentForm, type AppointmentFormValues } from "./AppointmentForm";

type Mode =
    | { type: "list" }
    | { type: "create" }
    | { type: "edit"; appointment: Appointment };

type StatusFilter = "slobodan" | "all";

function formatDate(value: string): string {
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;
    return `${day}.${month}.${year}.`;
}

function formatTimeRange(from: string, to: string): string {
    return `${from.slice(0, 5)}–${to.slice(0, 5)}`;
}

function getErrorMessage(error: unknown, fallback: string): string | null {
    if (!error) return null;
    if (error instanceof Error) return error.message;
    return fallback;
}

const STATUS_MODIFIERS: Record<AppointmentStatus, string> = {
    slobodan: "status-pill--approved",
    zauzet: "status-pill--pending",
    otkazan: "status-pill--cancelled",
};

export function AdminAppointmentsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [mode, setMode] = useState<Mode>({ type: "list" });
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("slobodan");

    const canEdit =
        user?.TipKorisnika === "employee" &&
        (user?.Uloga === "admin" || user?.Uloga === "voditelj");

    const appointmentsQuery = useAllAppointments(user?.TipKorisnika === "employee");
    const createMutation = useCreateAppointment();
    const updateMutation = useUpdateAppointment();
    const deleteMutation = useDeleteAppointment();

    if (!user) {
        return null;
    }

    if (user.TipKorisnika !== "employee") {
        return (
            <section className="page">
                <h1>{t("adminAppointments.title")}</h1>
                <Alert variant="info">{t("adminAppointments.employeeOnly")}</Alert>
            </section>
        );
    }

    async function handleCreate(values: AppointmentFormValues) {
        await createMutation.mutateAsync(values);
        setMode({ type: "list" });
    }

    async function handleUpdate(appointmentId: number, values: AppointmentFormValues) {
        await updateMutation.mutateAsync({ appointmentId, payload: values });
        setMode({ type: "list" });
    }

    function handleDelete(appointment: Appointment) {
        const confirmed = window.confirm(
            t("adminAppointments.deleteConfirm", {
                date: formatDate(appointment.Datum),
                time: formatTimeRange(appointment.VrijemeOd, appointment.VrijemeDo),
            }),
        );
        if (!confirmed) return;
        deleteMutation.mutate(appointment.IdTermina);
    }

    const sortedAppointments = useMemo(() => {
        const data = appointmentsQuery.data ?? [];
        const filtered =
            statusFilter === "all" ? data : data.filter((a) => a.Status === statusFilter);
        return filtered.sort((a, b) => {
            const aKey = `${a.Datum}T${a.VrijemeOd}`;
            const bKey = `${b.Datum}T${b.VrijemeOd}`;
            return aKey.localeCompare(bKey);
        });
    }, [appointmentsQuery.data, statusFilter]);

    const deleteErrorMessage = getErrorMessage(deleteMutation.error, t("common.unknownError"));

    return (
        <section className="page">
            <header className="page__header">
                <h1>{t("adminAppointments.title")}</h1>
                {canEdit && mode.type === "list" ? (
                    <AppButton onClick={() => setMode({ type: "create" })}>
                        {t("adminAppointments.addAction")}
                    </AppButton>
                ) : null}
            </header>

            {!canEdit ? (
                <section className="page__section">
                    <Alert variant="info">{t("adminAppointments.readOnly")}</Alert>
                </section>
            ) : null}

            {mode.type === "create" && canEdit ? (
                <section className="page__section">
                    <h2>{t("adminAppointments.addTitle")}</h2>
                    <AppointmentForm
                        onSubmit={handleCreate}
                        onCancel={() => setMode({ type: "list" })}
                        submitLabel={t("common.save")}
                        submittingLabel={t("common.saving")}
                        errorMessage={getErrorMessage(
                            createMutation.error,
                            t("common.unknownError"),
                        )}
                    />
                </section>
            ) : null}

            {mode.type === "edit" && canEdit ? (
                <section className="page__section">
                    <h2>{t("adminAppointments.editTitle")}</h2>
                    <AppointmentForm
                        initialValues={mode.appointment}
                        onSubmit={(values) => handleUpdate(mode.appointment.IdTermina, values)}
                        onCancel={() => setMode({ type: "list" })}
                        submitLabel={t("common.saveChanges")}
                        submittingLabel={t("common.saving")}
                        errorMessage={getErrorMessage(
                            updateMutation.error,
                            t("common.unknownError"),
                        )}
                    />
                </section>
            ) : null}

            <section className="page__section">
                <header className="page__header">
                    <h2>{t("adminAppointments.listTitle")}</h2>
                    <label className="ui-field" style={{ minWidth: "180px" }}>
                        <span className="ui-field__label">
                            {t("adminAppointments.filterLabel")}
                        </span>
                        <select
                            className="ui-field__input"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value as StatusFilter)
                            }
                        >
                            <option value="slobodan">
                                {t("adminAppointments.filterFree")}
                            </option>
                            <option value="all">
                                {t("adminAppointments.filterAll")}
                            </option>
                        </select>
                    </label>
                </header>

                {appointmentsQuery.isLoading ? <p>{t("common.loading")}</p> : null}

                {appointmentsQuery.isError ? (
                    <Alert variant="error">
                        {getErrorMessage(appointmentsQuery.error, t("common.unknownError"))}
                    </Alert>
                ) : null}

                {deleteMutation.isError ? (
                    <Alert variant="error">
                        {t("adminAppointments.deleteError", {
                            detail: deleteErrorMessage ?? t("common.unknownError"),
                        })}
                    </Alert>
                ) : null}

                {sortedAppointments.length === 0 && !appointmentsQuery.isLoading ? (
                    <Alert variant="info">{t("adminAppointments.empty")}</Alert>
                ) : null}

                {sortedAppointments.length > 0 ? (
                    <ul className="appointment-admin-list">
                        {sortedAppointments.map((appointment) => (
                            <li
                                key={appointment.IdTermina}
                                className="appointment-admin-list__item"
                            >
                                <div className="appointment-admin-list__main">
                                    <strong>{formatDate(appointment.Datum)}</strong>
                                    <span className="appointment-list__time">
                                        {formatTimeRange(
                                            appointment.VrijemeOd,
                                            appointment.VrijemeDo,
                                        )}
                                    </span>
                                </div>
                                <span
                                    className={`status-pill ${STATUS_MODIFIERS[appointment.Status]}`}
                                >
                                    {t(`appointments.statusOptions.${appointment.Status}`)}
                                </span>
                                {canEdit && appointment.Status !== "zauzet" ? (
                                    <div className="appointment-admin-list__actions">
                                        <AppButton
                                            variant="secondary"
                                            onClick={() =>
                                                setMode({ type: "edit", appointment })
                                            }
                                        >
                                            {t("common.edit")}
                                        </AppButton>
                                        <AppButton
                                            variant="destructive"
                                            onClick={() => handleDelete(appointment)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            {t("common.delete")}
                                        </AppButton>
                                    </div>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                ) : null}
            </section>
        </section>
    );
}
