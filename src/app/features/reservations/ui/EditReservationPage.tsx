import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/ui/Alert";
import { AppButton } from "../../../components/ui/AppButton";
import { AppTextField } from "../../../components/ui/AppTextField";
import { useAuth } from "../../auth/hooks/useAuth";
import { useAppointmentById, useFreeAppointments } from "../../appointments/hooks/useAppointments";
import type { Appointment } from "../../appointments/models/appointmentTypes";
import { useServices } from "../../services/hooks/useServices";
import type { Service } from "../../services/models/serviceTypes";
import { useVehiclesByCustomerId } from "../../vehicles/hooks/useVehicles";
import {
    useAddReservationService,
    useRemoveReservationService,
    useReservationById,
    useUpdateReservation,
    useUpdateReservationService,
} from "../hooks/useReservations";
import type { Reservation, ReservationServiceItem } from "../models/reservationTypes";

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

export function EditReservationPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const params = useParams();
    const reservationId = Number.parseInt(params.reservationId ?? "", 10);

    const today = useMemo(() => toIsoDate(new Date()), []);
    const defaultDateTo = useMemo(() => {
        const future = new Date();
        future.setDate(future.getDate() + 14);
        return toIsoDate(future);
    }, []);
    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(defaultDateTo);

    const reservationQuery = useReservationById(Number.isNaN(reservationId) ? null : reservationId);
    const appointmentsQuery = useFreeAppointments(
        { dateFrom, dateTo },
        Boolean(user) && user?.TipKorisnika === "customer",
    );
    const currentAppointmentQuery = useAppointmentById(reservationQuery.data?.IdTermina ?? null);
    const vehiclesQuery = useVehiclesByCustomerId(user?.IdOsobe ?? null);
    const servicesQuery = useServices();

    if (!user) return null;

    if (Number.isNaN(reservationId)) {
        return (
            <section className="page">
                <Alert variant="error">{t("reservations.invalidId")}</Alert>
            </section>
        );
    }

    if (user.TipKorisnika !== "customer") {
        return (
            <section className="page">
                <h1>{t("reservations.editTitle")}</h1>
                <Alert variant="info">{t("reservations.customerOnly")}</Alert>
            </section>
        );
    }

    if (reservationQuery.isLoading) {
        return (
            <section className="page">
                <p>{t("common.loading")}</p>
            </section>
        );
    }

    if (reservationQuery.isError || !reservationQuery.data) {
        return (
            <section className="page">
                <Alert variant="error">
                    {t("reservations.fetchError", {
                        detail: getErrorMessage(reservationQuery.error, t("common.unknownError")),
                    })}
                </Alert>
            </section>
        );
    }

    const reservation = reservationQuery.data;

    if (reservation.IdOsobe_Korisnik !== user.IdOsobe) {
        return (
            <section className="page">
                <Alert variant="error">{t("reservations.customerOnly")}</Alert>
            </section>
        );
    }

    if (reservation.Status !== "na cekanju") {
        return (
            <section className="page">
                <h1>{t("reservations.editTitle")}</h1>
                <Alert variant="info">{t("reservations.editOnlyPending")}</Alert>
            </section>
        );
    }

    return (
        <section className="page">
            <header className="page__header">
                <h1>{t("reservations.editTitle")}</h1>
                <AppButton
                    variant="secondary"
                    onClick={() => navigate(`/reservations/${reservationId}`)}
                >
                    {t("reservations.form.cancel")}
                </AppButton>
            </header>

            <MasterSection
                reservation={reservation}
                appointments={appointmentsQuery.data ?? []}
                currentAppointment={currentAppointmentQuery.data ?? null}
                vehicles={vehiclesQuery.data ?? []}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
            />

            <DetailSection reservation={reservation} services={servicesQuery.data ?? []} />
        </section>
    );
}

type MasterSectionProps = {
    reservation: Reservation;
    appointments: Appointment[];
    currentAppointment: Appointment | null;
    vehicles: Reservation extends never
        ? never
        : import("../../vehicles/models/vehicleTypes").Vehicle[];
    dateFrom: string;
    dateTo: string;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
};

function MasterSection({
    reservation,
    appointments,
    currentAppointment,
    vehicles,
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
}: MasterSectionProps) {
    const { t } = useTranslation();
    const updateMutation = useUpdateReservation();

    const [appointmentId, setAppointmentId] = useState<number>(reservation.IdTermina);
    const [vehicleId, setVehicleId] = useState<number>(reservation.IdVozila);
    const [kilometraza, setKilometraza] = useState<string>(String(reservation.KilometrazaVozila));
    const [opisProblema, setOpisProblema] = useState<string>(reservation.OpisProblema);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [savedToast, setSavedToast] = useState(false);

    const appointmentOptions = useMemo<Appointment[]>(() => {
        if (
            currentAppointment &&
            !appointments.some((a) => a.IdTermina === currentAppointment.IdTermina)
        ) {
            return [currentAppointment, ...appointments];
        }
        return appointments;
    }, [appointments, currentAppointment]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSavedToast(false);

        const km = Number.parseInt(kilometraza, 10);
        if (Number.isNaN(km) || km < 0) {
            setValidationError(t("reservations.validation.kilometersInvalid"));
            return;
        }
        if (opisProblema.trim() === "") {
            setValidationError(t("reservations.validation.descriptionRequired"));
            return;
        }
        setValidationError(null);

        await updateMutation.mutateAsync({
            reservationId: reservation.IdRezervacije,
            payload: {
                IdTermina: appointmentId,
                IdVozila: vehicleId,
                KilometrazaVozila: km,
                OpisProblema: opisProblema.trim(),
            },
        });
        setSavedToast(true);
    }

    const displayedError =
        validationError ??
        (updateMutation.error
            ? getErrorMessage(updateMutation.error, t("common.unknownError"))
            : null);

    return (
        <form className="form page__section" onSubmit={handleSubmit} noValidate>
            <h2>{t("reservations.form.headerTitle")}</h2>

            <p className="muted-hint">{t("reservations.form.dateRangeHint")}</p>
            <div className="wizard-filters">
                <AppTextField
                    label={t("reservations.form.dateFrom")}
                    name="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(event) => onDateFromChange(event.target.value)}
                />
                <AppTextField
                    label={t("reservations.form.dateTo")}
                    name="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(event) => onDateToChange(event.target.value)}
                />
            </div>

            <label className="ui-field">
                <span className="ui-field__label">{t("reservations.form.appointmentLabel")}</span>
                <select
                    className="ui-field__input"
                    name="appointment"
                    value={String(appointmentId)}
                    onChange={(event) => setAppointmentId(Number(event.target.value))}
                >
                    {appointmentOptions.map((appointment) => (
                        <option key={appointment.IdTermina} value={appointment.IdTermina}>
                            {formatDate(appointment.Datum)} ·{" "}
                            {formatTimeRange(appointment.VrijemeOd, appointment.VrijemeDo)} ·{" "}
                            {durationInMinutes(appointment.VrijemeOd, appointment.VrijemeDo)} min
                        </option>
                    ))}
                </select>
            </label>

            <label className="ui-field">
                <span className="ui-field__label">{t("reservations.form.vehicleLabel")}</span>
                <select
                    className="ui-field__input"
                    name="vehicle"
                    value={String(vehicleId)}
                    onChange={(event) => setVehicleId(Number(event.target.value))}
                >
                    {vehicles.map((vehicle) => (
                        <option key={vehicle.IdVozila} value={vehicle.IdVozila}>
                            {vehicle.Marka} {vehicle.Model} · {vehicle.RegOznaka}
                        </option>
                    ))}
                </select>
            </label>

            <AppTextField
                label={t("reservations.fields.kilometers")}
                name="kilometraza"
                type="number"
                min={0}
                value={kilometraza}
                onChange={(event) => setKilometraza(event.target.value)}
            />

            <label className="ui-field">
                <span className="ui-field__label">
                    {t("reservations.fields.problemDescription")}
                </span>
                <textarea
                    className="ui-field__input"
                    name="opisProblema"
                    rows={3}
                    value={opisProblema}
                    onChange={(event) => setOpisProblema(event.target.value)}
                />
            </label>

            {displayedError ? <Alert variant="error">{displayedError}</Alert> : null}

            {savedToast && !displayedError ? (
                <Alert variant="info">{t("reservations.updateSuccessMessage")}</Alert>
            ) : null}

            <div className="form-actions form-actions--end">
                <AppButton type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending
                        ? t("reservations.form.submitting")
                        : t("reservations.form.submitEdit")}
                </AppButton>
            </div>
        </form>
    );
}

type DetailSectionProps = {
    reservation: Reservation;
    services: Service[];
};

function DetailSection({ reservation, services }: DetailSectionProps) {
    const { t } = useTranslation();
    const addMutation = useAddReservationService();
    const updateServiceMutation = useUpdateReservationService();
    const removeMutation = useRemoveReservationService();

    const [isAdding, setIsAdding] = useState(false);
    const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const usedServiceIds = new Set(reservation.services.map((item) => item.service.IdUsluge));
    const availableServices = services.filter((s) => !usedServiceIds.has(s.IdUsluge));

    function clearError() {
        setErrorMessage(null);
    }

    async function handleAdd(idUsluge: number, kolicina: number) {
        try {
            await addMutation.mutateAsync({
                reservationId: reservation.IdRezervacije,
                payload: { IdUsluge: idUsluge, Kolicina: kolicina },
            });
            setIsAdding(false);
            clearError();
        } catch (error) {
            setErrorMessage(getErrorMessage(error, t("common.unknownError")));
        }
    }

    async function handleUpdate(idUsluge: number, kolicina: number) {
        try {
            await updateServiceMutation.mutateAsync({
                reservationId: reservation.IdRezervacije,
                serviceId: idUsluge,
                payload: { Kolicina: kolicina },
            });
            setEditingServiceId(null);
            clearError();
        } catch (error) {
            setErrorMessage(getErrorMessage(error, t("common.unknownError")));
        }
    }

    async function handleRemove(idUsluge: number) {
        try {
            await removeMutation.mutateAsync({
                reservationId: reservation.IdRezervacije,
                serviceId: idUsluge,
            });
            clearError();
        } catch (error) {
            setErrorMessage(getErrorMessage(error, t("common.unknownError")));
        }
    }

    const totals = reservation.services.reduce(
        (acc, item) => ({
            duration: acc.duration + item.service.Trajanje * item.Kolicina,
            price: acc.price + Number(item.service.Cijena) * item.Kolicina,
        }),
        { duration: 0, price: 0 },
    );

    return (
        <section className="page__section">
            <header className="page__header">
                <h2>{t("reservations.form.detailsTitle")}</h2>
                {!isAdding ? (
                    <AppButton
                        variant="secondary"
                        onClick={() => {
                            setIsAdding(true);
                            setEditingServiceId(null);
                            clearError();
                        }}
                        disabled={availableServices.length === 0}
                    >
                        {t("reservations.form.addServiceAction")}
                    </AppButton>
                ) : null}
            </header>

            {errorMessage ? <Alert variant="error">{errorMessage}</Alert> : null}

            {isAdding ? (
                <AddServiceRow
                    availableServices={availableServices}
                    onSubmit={handleAdd}
                    onCancel={() => {
                        setIsAdding(false);
                        clearError();
                    }}
                    isSubmitting={addMutation.isPending}
                />
            ) : null}

            <table className="reservation-services-table">
                <thead>
                    <tr>
                        <th>{t("reservations.form.serviceLabel")}</th>
                        <th>{t("reservations.form.quantityLabel")}</th>
                        <th>{t("reservations.form.rowAction")}</th>
                    </tr>
                </thead>
                <tbody>
                    {reservation.services.map((item) => (
                        <ServiceRow
                            key={item.service.IdUsluge}
                            item={item}
                            isEditing={editingServiceId === item.service.IdUsluge}
                            onEditStart={() => {
                                setEditingServiceId(item.service.IdUsluge);
                                setIsAdding(false);
                                clearError();
                            }}
                            onEditCancel={() => {
                                setEditingServiceId(null);
                                clearError();
                            }}
                            onSave={(kolicina) => handleUpdate(item.service.IdUsluge, kolicina)}
                            onRemove={() => handleRemove(item.service.IdUsluge)}
                            isSubmitting={
                                (updateServiceMutation.isPending &&
                                    editingServiceId === item.service.IdUsluge) ||
                                removeMutation.isPending
                            }
                        />
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <th scope="row">{t("reservations.fields.totalDuration")}</th>
                        <td colSpan={2}>
                            {t("services.durationMinutes", { minutes: totals.duration })}
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">{t("reservations.fields.totalPrice")}</th>
                        <td colSpan={2}>
                            {t("services.priceFormatted", { price: totals.price.toFixed(2) })}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </section>
    );
}

type AddServiceRowProps = {
    availableServices: Service[];
    onSubmit: (idUsluge: number, kolicina: number) => void;
    onCancel: () => void;
    isSubmitting: boolean;
};

function AddServiceRow({
    availableServices,
    onSubmit,
    onCancel,
    isSubmitting,
}: AddServiceRowProps) {
    const { t } = useTranslation();
    const [idUsluge, setIdUsluge] = useState<number | null>(availableServices[0]?.IdUsluge ?? null);
    const [kolicina, setKolicina] = useState<number>(1);

    return (
        <div className="form" style={{ marginBottom: "1rem" }}>
            <div className="wizard-filters">
                <label className="ui-field">
                    <span className="ui-field__label">{t("reservations.form.serviceLabel")}</span>
                    <select
                        className="ui-field__input"
                        value={idUsluge === null ? "" : String(idUsluge)}
                        onChange={(event) =>
                            setIdUsluge(
                                event.target.value === "" ? null : Number(event.target.value),
                            )
                        }
                    >
                        <option value="">{t("reservations.form.servicePlaceholder")}</option>
                        {availableServices.map((service) => (
                            <option key={service.IdUsluge} value={service.IdUsluge}>
                                {service.NazivUsluge} ·{" "}
                                {t("services.durationMinutes", { minutes: service.Trajanje })} ·{" "}
                                {t("services.priceFormatted", {
                                    price: Number(service.Cijena).toFixed(2),
                                })}
                            </option>
                        ))}
                    </select>
                </label>
                <AppTextField
                    label={t("reservations.form.quantityLabel")}
                    name="newQuantity"
                    type="number"
                    min={1}
                    value={String(kolicina)}
                    onChange={(event) => {
                        const value = Number.parseInt(event.target.value, 10);
                        setKolicina(Number.isNaN(value) || value < 1 ? 1 : value);
                    }}
                />
            </div>
            <div className="form-actions form-actions--end">
                <AppButton variant="secondary" onClick={onCancel} disabled={isSubmitting}>
                    {t("reservations.form.cancel")}
                </AppButton>
                <AppButton
                    onClick={() => {
                        if (idUsluge !== null) onSubmit(idUsluge, kolicina);
                    }}
                    disabled={idUsluge === null || isSubmitting}
                >
                    {isSubmitting
                        ? t("reservations.form.submitting")
                        : t("reservations.form.addServiceAction")}
                </AppButton>
            </div>
        </div>
    );
}

type ServiceRowProps = {
    item: ReservationServiceItem;
    isEditing: boolean;
    onEditStart: () => void;
    onEditCancel: () => void;
    onSave: (kolicina: number) => void;
    onRemove: () => void;
    isSubmitting: boolean;
};

function ServiceRow({
    item,
    isEditing,
    onEditStart,
    onEditCancel,
    onSave,
    onRemove,
    isSubmitting,
}: ServiceRowProps) {
    const { t } = useTranslation();
    const [draftKolicina, setDraftKolicina] = useState<number>(item.Kolicina);

    if (isEditing) {
        return (
            <tr>
                <td>{item.service.NazivUsluge}</td>
                <td>
                    <input
                        className="ui-field__input"
                        type="number"
                        min={1}
                        value={draftKolicina}
                        aria-label={t("reservations.form.quantityLabel")}
                        onChange={(event) => {
                            const value = Number.parseInt(event.target.value, 10);
                            setDraftKolicina(Number.isNaN(value) || value < 1 ? 1 : value);
                        }}
                    />
                </td>
                <td>
                    <AppButton
                        variant="secondary"
                        onClick={() => {
                            setDraftKolicina(item.Kolicina);
                            onEditCancel();
                        }}
                        disabled={isSubmitting}
                    >
                        {t("reservations.form.cancel")}
                    </AppButton>
                    <AppButton onClick={() => onSave(draftKolicina)} disabled={isSubmitting}>
                        {t("common.save")}
                    </AppButton>
                </td>
            </tr>
        );
    }

    return (
        <tr>
            <td>
                <strong>{item.service.NazivUsluge}</strong>
                <small className="muted-hint">
                    {" "}
                    {t("services.durationMinutes", {
                        minutes: item.service.Trajanje * item.Kolicina,
                    })}{" "}
                    ·{" "}
                    {t("services.priceFormatted", {
                        price: (Number(item.service.Cijena) * item.Kolicina).toFixed(2),
                    })}
                </small>
            </td>
            <td>{item.Kolicina}</td>
            <td>
                <AppButton variant="secondary" onClick={onEditStart}>
                    {t("common.edit")}
                </AppButton>
                <AppButton variant="destructive" onClick={onRemove} disabled={isSubmitting}>
                    {t("reservations.form.removeServiceAction")}
                </AppButton>
            </td>
        </tr>
    );
}
