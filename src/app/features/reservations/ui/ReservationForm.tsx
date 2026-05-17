import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/ui/Alert";
import { AppButton } from "../../../components/ui/AppButton";
import { AppTextField } from "../../../components/ui/AppTextField";
import type { Appointment } from "../../appointments/models/appointmentTypes";
import type { Service } from "../../services/models/serviceTypes";
import type { Vehicle } from "../../vehicles/models/vehicleTypes";

export type ReservationServiceRow = {
    rowId: string;
    IdUsluge: number | null;
    Kolicina: number;
};

export type ReservationFormValues = {
    IdTermina: number;
    IdVozila: number;
    KilometrazaVozila: number;
    OpisProblema: string;
    services: { IdUsluge: number; Kolicina: number }[];
};

export type ReservationFormInitialValues = {
    appointmentId: number | null;
    vehicleId: number | null;
    kilometraza: string;
    opisProblema: string;
    rows: ReservationServiceRow[];
};

export type ReservationFormProps = {
    mode: "create" | "edit";
    initialValues?: ReservationFormInitialValues;
    appointments: Appointment[];
    vehicles: Vehicle[];
    services: Service[];
    dateFrom: string;
    dateTo: string;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    isLoadingData: boolean;
    extraAppointment?: Appointment | null;
    onSubmit: (values: ReservationFormValues) => Promise<void>;
    isSubmitting: boolean;
    errorMessage?: string | null;
    onCancel?: () => void;
};

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

function makeRowId(): string {
    return `row-${Math.random().toString(36).slice(2, 10)}`;
}

const EMPTY_INITIAL: ReservationFormInitialValues = {
    appointmentId: null,
    vehicleId: null,
    kilometraza: "",
    opisProblema: "",
    rows: [],
};

export function ReservationForm({
    mode,
    initialValues,
    appointments,
    vehicles,
    services,
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
    isLoadingData,
    extraAppointment,
    onSubmit,
    isSubmitting,
    errorMessage,
    onCancel,
}: ReservationFormProps) {
    const { t } = useTranslation();
    const seed = initialValues ?? EMPTY_INITIAL;

    const [appointmentId, setAppointmentId] = useState<number | null>(seed.appointmentId);
    const [vehicleId, setVehicleId] = useState<number | null>(seed.vehicleId);
    const [kilometraza, setKilometraza] = useState<string>(seed.kilometraza);
    const [opisProblema, setOpisProblema] = useState<string>(seed.opisProblema);
    const [rows, setRows] = useState<ReservationServiceRow[]>(seed.rows);
    const [validationError, setValidationError] = useState<string | null>(null);

    const appointmentOptions = useMemo<Appointment[]>(() => {
        if (
            extraAppointment &&
            !appointments.some((a) => a.IdTermina === extraAppointment.IdTermina)
        ) {
            return [extraAppointment, ...appointments];
        }
        return appointments;
    }, [appointments, extraAppointment]);

    const selectedAppointment = useMemo(
        () => appointmentOptions.find((a) => a.IdTermina === appointmentId) ?? null,
        [appointmentOptions, appointmentId],
    );

    const slotDuration = selectedAppointment
        ? durationInMinutes(selectedAppointment.VrijemeOd, selectedAppointment.VrijemeDo)
        : null;

    const rowsWithService = useMemo(
        () =>
            rows.map((row) => ({
                row,
                service:
                    row.IdUsluge === null
                        ? null
                        : (services.find((s) => s.IdUsluge === row.IdUsluge) ?? null),
            })),
        [rows, services],
    );

    const totals = useMemo(() => {
        return rowsWithService.reduce(
            (acc, { row, service }) => {
                if (!service) return acc;
                return {
                    duration: acc.duration + service.Trajanje * row.Kolicina,
                    price: acc.price + Number(service.Cijena) * row.Kolicina,
                };
            },
            { duration: 0, price: 0 },
        );
    }, [rowsWithService]);

    const exceedsSlot =
        slotDuration !== null && totals.duration > 0 && totals.duration > slotDuration;

    function addRow() {
        setRows((prev) => [...prev, { rowId: makeRowId(), IdUsluge: null, Kolicina: 1 }]);
    }

    function updateRow(rowId: string, patch: Partial<ReservationServiceRow>) {
        setRows((prev) => prev.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)));
    }

    function removeRow(rowId: string) {
        setRows((prev) => prev.filter((row) => row.rowId !== rowId));
    }

    function validate(): ReservationFormValues | null {
        if (appointmentId === null) {
            setValidationError(t("reservations.validation.appointmentRequired"));
            return null;
        }
        if (vehicleId === null) {
            setValidationError(t("reservations.validation.vehicleRequired"));
            return null;
        }
        const km = Number.parseInt(kilometraza, 10);
        if (Number.isNaN(km) || km < 0) {
            setValidationError(t("reservations.validation.kilometersInvalid"));
            return null;
        }
        if (opisProblema.trim() === "") {
            setValidationError(t("reservations.validation.descriptionRequired"));
            return null;
        }
        if (rows.length === 0) {
            setValidationError(t("reservations.validation.servicesRequired"));
            return null;
        }
        const seenServiceIds = new Set<number>();
        for (const row of rows) {
            if (row.IdUsluge === null) {
                setValidationError(t("reservations.validation.servicesRequired"));
                return null;
            }
            if (row.Kolicina < 1) {
                setValidationError(t("reservations.validation.servicesRequired"));
                return null;
            }
            if (seenServiceIds.has(row.IdUsluge)) {
                setValidationError(t("reservations.validation.duplicateService"));
                return null;
            }
            seenServiceIds.add(row.IdUsluge);
        }
        if (exceedsSlot && slotDuration !== null) {
            setValidationError(
                t("reservations.validation.durationExceedsSlot", {
                    total: totals.duration,
                    slot: slotDuration,
                }),
            );
            return null;
        }

        setValidationError(null);
        return {
            IdTermina: appointmentId,
            IdVozila: vehicleId,
            KilometrazaVozila: km,
            OpisProblema: opisProblema.trim(),
            services: rows.map((row) => ({
                IdUsluge: row.IdUsluge as number,
                Kolicina: row.Kolicina,
            })),
        };
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const payload = validate();
        if (payload === null) return;
        await onSubmit(payload);
    }

    const displayedError = validationError ?? errorMessage ?? null;
    const submitLabel = isSubmitting
        ? t("reservations.form.submitting")
        : mode === "edit"
          ? t("reservations.form.submitEdit")
          : t("reservations.form.submitNew");

    return (
        <form className="form" onSubmit={handleSubmit} noValidate>
            <section className="page__section">
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
                    <span className="ui-field__label">
                        {t("reservations.form.appointmentLabel")}
                    </span>
                    <select
                        className="ui-field__input"
                        name="appointment"
                        value={appointmentId === null ? "" : String(appointmentId)}
                        onChange={(event) =>
                            setAppointmentId(
                                event.target.value === "" ? null : Number(event.target.value),
                            )
                        }
                    >
                        <option value="">{t("reservations.form.appointmentPlaceholder")}</option>
                        {appointmentOptions.map((appointment) => (
                            <option key={appointment.IdTermina} value={appointment.IdTermina}>
                                {formatDate(appointment.Datum)} ·{" "}
                                {formatTimeRange(appointment.VrijemeOd, appointment.VrijemeDo)} ·{" "}
                                {durationInMinutes(appointment.VrijemeOd, appointment.VrijemeDo)}{" "}
                                min
                            </option>
                        ))}
                    </select>
                </label>

                {!isLoadingData && appointmentOptions.length === 0 ? (
                    <Alert variant="info">{t("reservations.form.noAppointments")}</Alert>
                ) : null}

                <label className="ui-field">
                    <span className="ui-field__label">{t("reservations.form.vehicleLabel")}</span>
                    <select
                        className="ui-field__input"
                        name="vehicle"
                        value={vehicleId === null ? "" : String(vehicleId)}
                        onChange={(event) =>
                            setVehicleId(
                                event.target.value === "" ? null : Number(event.target.value),
                            )
                        }
                    >
                        <option value="">{t("reservations.form.vehiclePlaceholder")}</option>
                        {vehicles.map((vehicle) => (
                            <option key={vehicle.IdVozila} value={vehicle.IdVozila}>
                                {vehicle.Marka} {vehicle.Model} · {vehicle.RegOznaka}
                            </option>
                        ))}
                    </select>
                </label>

                {!isLoadingData && vehicles.length === 0 ? (
                    <Alert variant="info">
                        {t("reservations.form.noVehicles")}{" "}
                        <Link to="/vehicles">{t("reservations.form.addVehicleLink")}</Link>
                    </Alert>
                ) : null}

                <AppTextField
                    label={t("reservations.fields.kilometers")}
                    name="kilometraza"
                    type="number"
                    min={0}
                    value={kilometraza}
                    onChange={(event) => setKilometraza(event.target.value)}
                    placeholder="125000"
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
            </section>

            <section className="page__section">
                <header className="page__header">
                    <h2>{t("reservations.form.detailsTitle")}</h2>
                    <AppButton type="button" variant="secondary" onClick={addRow}>
                        {t("reservations.form.addServiceAction")}
                    </AppButton>
                </header>

                {rows.length === 0 ? (
                    <Alert variant="info">{t("reservations.form.noServicesRow")}</Alert>
                ) : (
                    <table className="reservation-services-table">
                        <thead>
                            <tr>
                                <th>{t("reservations.form.serviceLabel")}</th>
                                <th>{t("reservations.form.quantityLabel")}</th>
                                <th>{t("reservations.form.rowAction")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rowsWithService.map(({ row, service }) => (
                                <tr key={row.rowId}>
                                    <td>
                                        <select
                                            className="ui-field__input"
                                            aria-label={t("reservations.form.serviceLabel")}
                                            value={
                                                row.IdUsluge === null ? "" : String(row.IdUsluge)
                                            }
                                            onChange={(event) =>
                                                updateRow(row.rowId, {
                                                    IdUsluge:
                                                        event.target.value === ""
                                                            ? null
                                                            : Number(event.target.value),
                                                })
                                            }
                                        >
                                            <option value="">
                                                {t("reservations.form.servicePlaceholder")}
                                            </option>
                                            {services.map((option) => (
                                                <option
                                                    key={option.IdUsluge}
                                                    value={option.IdUsluge}
                                                >
                                                    {option.NazivUsluge} ·{" "}
                                                    {t("services.durationMinutes", {
                                                        minutes: option.Trajanje,
                                                    })}{" "}
                                                    ·{" "}
                                                    {t("services.priceFormatted", {
                                                        price: Number(option.Cijena).toFixed(2),
                                                    })}
                                                </option>
                                            ))}
                                        </select>
                                        {service ? (
                                            <small className="muted-hint">
                                                {t("services.durationMinutes", {
                                                    minutes: service.Trajanje * row.Kolicina,
                                                })}{" "}
                                                ·{" "}
                                                {t("services.priceFormatted", {
                                                    price: (
                                                        Number(service.Cijena) * row.Kolicina
                                                    ).toFixed(2),
                                                })}
                                            </small>
                                        ) : null}
                                    </td>
                                    <td>
                                        <input
                                            className="ui-field__input"
                                            aria-label={t("reservations.form.quantityLabel")}
                                            type="number"
                                            min={1}
                                            value={row.Kolicina}
                                            onChange={(event) => {
                                                const value = Number.parseInt(
                                                    event.target.value,
                                                    10,
                                                );
                                                updateRow(row.rowId, {
                                                    Kolicina:
                                                        Number.isNaN(value) || value < 1
                                                            ? 1
                                                            : value,
                                                });
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <AppButton
                                            type="button"
                                            variant="destructive"
                                            onClick={() => removeRow(row.rowId)}
                                        >
                                            {t("reservations.form.removeServiceAction")}
                                        </AppButton>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th scope="row">{t("reservations.fields.totalDuration")}</th>
                                <td colSpan={2}>
                                    {t("services.durationMinutes", { minutes: totals.duration })}
                                    {slotDuration !== null ? ` / ${slotDuration} min` : null}
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">{t("reservations.fields.totalPrice")}</th>
                                <td colSpan={2}>
                                    {t("services.priceFormatted", {
                                        price: totals.price.toFixed(2),
                                    })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </section>

            {displayedError ? <Alert variant="error">{displayedError}</Alert> : null}

            <div className="form-actions form-actions--between">
                {onCancel ? (
                    <AppButton type="button" variant="secondary" onClick={onCancel}>
                        {t("reservations.form.cancel")}
                    </AppButton>
                ) : (
                    <span />
                )}
                <AppButton type="submit" disabled={isSubmitting}>
                    {submitLabel}
                </AppButton>
            </div>
        </form>
    );
}
