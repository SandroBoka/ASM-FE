import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Alert } from "../../../components/ui/Alert";
import { AppButton } from "../../../components/ui/AppButton";
import * as appointmentsApi from "../../appointments/api/appointmentsApi";
import type { Appointment } from "../../appointments/models/appointmentTypes";
import { useChangesForReservation } from "../../appointmentChanges/hooks/useAppointmentChanges";
import { useAuth } from "../../auth/hooks/useAuth";
import { useVehiclesByCustomerId } from "../../vehicles/hooks/useVehicles";
import { useAllReservations, useReservationsByCustomer } from "../hooks/useReservations";
import type { Reservation, ReservationStatus } from "../models/reservationTypes";

function formatDate(value: string): string {
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;
    return `${day}.${month}.${year}.`;
}

function formatTimeRange(from: string, to: string): string {
    return `${from.slice(0, 5)}–${to.slice(0, 5)}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) {
        return error.message;
    }
    return fallback;
}

const STATUS_MODIFIERS: Record<ReservationStatus, string> = {
    "na cekanju": "status-pill--pending",
    odobrena: "status-pill--approved",
    odbijena: "status-pill--rejected",
    otkazana: "status-pill--cancelled",
    zavrsena: "status-pill--completed",
};

const ACTIVE_STATUSES: ReservationStatus[] = ["na cekanju", "odobrena"];

function StatusPill({ status }: { status: ReservationStatus }) {
    const { t } = useTranslation();
    return (
        <span className={`status-pill ${STATUS_MODIFIERS[status]}`}>
            {t(`reservations.status.${status.replace(" ", "_")}`)}
        </span>
    );
}

export function ReservationsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();

    const isCustomer = user?.TipKorisnika === "customer";
    const isEmployee = user?.TipKorisnika === "employee";

    const customerReservations = useReservationsByCustomer(
        isCustomer ? (user?.IdOsobe ?? null) : null,
    );
    const employeeReservations = useAllReservations(isEmployee);
    const reservationsQuery = isCustomer ? customerReservations : employeeReservations;

    const vehiclesQuery = useVehiclesByCustomerId(isCustomer ? (user?.IdOsobe ?? null) : null);

    const reservations = useMemo(() => reservationsQuery.data ?? [], [reservationsQuery.data]);

    const appointmentQueries = useQueries({
        queries: reservations.map((reservation) => ({
            queryKey: ["appointments", "detail", reservation.IdTermina],
            queryFn: () => appointmentsApi.getAppointmentById(reservation.IdTermina),
        })),
    });

    const appointmentsById = useMemo(() => {
        const map = new Map<number, Appointment>();
        appointmentQueries.forEach((query, index) => {
            if (query.data) {
                map.set(reservations[index].IdTermina, query.data);
            }
        });
        return map;
    }, [appointmentQueries, reservations]);

    const { upcomingReservations, pastReservations } = useMemo(() => {
        function sortKey(reservation: Reservation): string {
            const appointment = appointmentsById.get(reservation.IdTermina);
            if (!appointment) return "";
            return `${appointment.Datum}T${appointment.VrijemeOd}`;
        }

        const upcoming = reservations
            .filter((r) => ACTIVE_STATUSES.includes(r.Status))
            .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

        const past = reservations
            .filter((r) => !ACTIVE_STATUSES.includes(r.Status))
            .sort((a, b) => sortKey(b).localeCompare(sortKey(a)));

        return { upcomingReservations: upcoming, pastReservations: past };
    }, [reservations, appointmentsById]);

    if (!user) {
        return null;
    }

    const vehiclesById = new Map(
        (vehiclesQuery.data ?? []).map((vehicle) => [vehicle.IdVozila, vehicle]),
    );

    const fetchErrorMessage = getErrorMessage(reservationsQuery.error, t("common.unknownError"));

    return (
        <section className="page">
            <header className="page__header">
                <h1>{t("reservations.listTitle")}</h1>
                {isCustomer ? (
                    <Link to="/reservations/new">
                        <AppButton>{t("reservations.newAction")}</AppButton>
                    </Link>
                ) : null}
            </header>

            {reservationsQuery.isLoading ? (
                <section className="page__section">
                    <p>{t("common.loading")}</p>
                </section>
            ) : null}

            {reservationsQuery.isError ? (
                <section className="page__section">
                    <Alert variant="error">
                        {t("reservations.fetchError", { detail: fetchErrorMessage })}
                    </Alert>
                </section>
            ) : null}

            {reservationsQuery.data && reservationsQuery.data.length === 0 ? (
                <section className="page__section">
                    <Alert variant="info">{t("reservations.empty")}</Alert>
                </section>
            ) : null}

            {upcomingReservations.length > 0 ? (
                <section className="page__section">
                    <h2>{t("reservations.upcomingTitle")}</h2>
                    <ul className="reservation-list">
                        {upcomingReservations.map((reservation) => (
                            <ReservationListItem
                                key={reservation.IdRezervacije}
                                reservation={reservation}
                                appointment={appointmentsById.get(reservation.IdTermina) ?? null}
                                vehicleLabel={buildVehicleLabel(reservation, vehiclesById, t)}
                            />
                        ))}
                    </ul>
                </section>
            ) : null}

            {pastReservations.length > 0 ? (
                <section className="page__section">
                    <h2>{t("reservations.pastTitle")}</h2>
                    <ul className="reservation-list">
                        {pastReservations.map((reservation) => (
                            <ReservationListItem
                                key={reservation.IdRezervacije}
                                reservation={reservation}
                                appointment={appointmentsById.get(reservation.IdTermina) ?? null}
                                vehicleLabel={buildVehicleLabel(reservation, vehiclesById, t)}
                            />
                        ))}
                    </ul>
                </section>
            ) : null}
        </section>
    );
}

function buildVehicleLabel(
    reservation: Reservation,
    vehiclesById: Map<number, { Marka: string; Model: string; RegOznaka: string }>,
    t: (key: string, opts?: Record<string, unknown>) => string,
): string {
    const vehicle = vehiclesById.get(reservation.IdVozila);
    if (vehicle) {
        return `${vehicle.Marka} ${vehicle.Model} (${vehicle.RegOznaka})`;
    }
    return t("reservations.vehicleFallback", { id: reservation.IdVozila });
}

type ReservationListItemProps = {
    reservation: Reservation;
    appointment: Appointment | null;
    vehicleLabel: string;
};

function ReservationListItem({ reservation, appointment, vehicleLabel }: ReservationListItemProps) {
    const { t } = useTranslation();
    const changesQuery = useChangesForReservation(reservation.IdRezervacije);
    const hasPendingChange = (changesQuery.data ?? []).some(
        (change) => change.Status === "na cekanju",
    );

    return (
        <li className="reservation-list__item">
            <div className="reservation-list__head">
                <div className="reservation-list__head-left">
                    <StatusPill status={reservation.Status} />
                    {hasPendingChange ? (
                        <span className="status-pill status-pill--pending">
                            {t("reservations.changePendingBadge")}
                        </span>
                    ) : null}
                </div>
                <span className="reservation-list__when">
                    {appointment
                        ? `${formatDate(appointment.Datum)} · ${formatTimeRange(
                              appointment.VrijemeOd,
                              appointment.VrijemeDo,
                          )}`
                        : t("common.loading")}
                </span>
            </div>

            <div className="reservation-list__body">
                <div className="reservation-list__problem">{reservation.OpisProblema || "—"}</div>
                <div className="reservation-list__meta">
                    <span>{vehicleLabel}</span>
                    <span>
                        {t("reservations.kilometersFormatted", {
                            km: reservation.KilometrazaVozila,
                        })}
                    </span>
                    {reservation.services.length > 0 ? (
                        <span>
                            {t("reservations.servicesCount", {
                                count: reservation.services.length,
                            })}
                        </span>
                    ) : null}
                    <span className="reservation-list__created">
                        {t("reservations.createdOn", {
                            date: formatDate(reservation.DatumKreiranja),
                        })}
                    </span>
                </div>
            </div>

            <div className="reservation-list__actions">
                <Link to={`/reservations/${reservation.IdRezervacije}`}>
                    <AppButton variant="secondary">{t("reservations.viewDetails")}</AppButton>
                </Link>
            </div>
        </li>
    );
}
