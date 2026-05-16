import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Alert } from "../../../components/ui/Alert";
import { AppButton } from "../../../components/ui/AppButton";
import * as appointmentsApi from "../../appointments/api/appointmentsApi";
import type { Appointment } from "../../appointments/models/appointmentTypes";
import * as personsApi from "../../persons/api/personsApi";
import type { Customer } from "../../persons/models/personTypes";
import * as vehiclesApi from "../../vehicles/api/vehiclesApi";
import type { Vehicle } from "../../vehicles/models/vehicleTypes";
import { usePendingReservations } from "../hooks/useReservations";
import type { Reservation } from "../models/reservationTypes";

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

export function PendingReservationsPage() {
    const { t } = useTranslation();
    const pendingQuery = usePendingReservations();
    const reservations = pendingQuery.data ?? [];

    const appointmentQueries = useQueries({
        queries: reservations.map((reservation) => ({
            queryKey: ["appointments", "detail", reservation.IdTermina],
            queryFn: () => appointmentsApi.getAppointmentById(reservation.IdTermina),
        })),
    });

    const vehicleIds = useMemo(
        () => [...new Set(reservations.map((r) => r.IdVozila))],
        [reservations],
    );
    const vehicleQueries = useQueries({
        queries: vehicleIds.map((id) => ({
            queryKey: ["vehicles", "detail", id],
            queryFn: () => vehiclesApi.getVehicleById(id),
        })),
    });

    const customerIds = useMemo(
        () => [...new Set(reservations.map((r) => r.IdOsobe_Korisnik))],
        [reservations],
    );
    const customerQueries = useQueries({
        queries: customerIds.map((id) => ({
            queryKey: ["persons", "customer", id],
            queryFn: () => personsApi.getCustomerById(id),
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

    const vehiclesById = useMemo(() => {
        const map = new Map<number, Vehicle>();
        vehicleQueries.forEach((query, index) => {
            if (query.data) {
                map.set(vehicleIds[index], query.data);
            }
        });
        return map;
    }, [vehicleQueries, vehicleIds]);

    const customersById = useMemo(() => {
        const map = new Map<number, Customer>();
        customerQueries.forEach((query, index) => {
            if (query.data) {
                map.set(customerIds[index], query.data);
            }
        });
        return map;
    }, [customerQueries, customerIds]);

    const sortedReservations = useMemo(() => {
        return [...reservations].sort((a, b) => {
            const aAppointment = appointmentsById.get(a.IdTermina);
            const bAppointment = appointmentsById.get(b.IdTermina);
            const aKey = aAppointment
                ? `${aAppointment.Datum}T${aAppointment.VrijemeOd}`
                : "";
            const bKey = bAppointment
                ? `${bAppointment.Datum}T${bAppointment.VrijemeOd}`
                : "";
            return aKey.localeCompare(bKey);
        });
    }, [reservations, appointmentsById]);

    const fetchErrorMessage = getErrorMessage(
        pendingQuery.error,
        t("common.unknownError"),
    );

    return (
        <section className="page">
            <header className="page__header">
                <h1>{t("pendingReservations.title")}</h1>
                <span className="reservation-list__created">
                    {t("pendingReservations.count", {
                        count: sortedReservations.length,
                    })}
                </span>
            </header>

            <section className="page__section">
                {pendingQuery.isLoading ? <p>{t("common.loading")}</p> : null}

                {pendingQuery.isError ? (
                    <Alert variant="error">
                        {t("reservations.fetchError", { detail: fetchErrorMessage })}
                    </Alert>
                ) : null}

                {pendingQuery.data && sortedReservations.length === 0 ? (
                    <Alert variant="info">{t("pendingReservations.empty")}</Alert>
                ) : null}

                {sortedReservations.length > 0 ? (
                    <ul className="reservation-list">
                        {sortedReservations.map((reservation) => (
                            <PendingReservationItem
                                key={reservation.IdRezervacije}
                                reservation={reservation}
                                appointment={appointmentsById.get(reservation.IdTermina) ?? null}
                                vehicle={vehiclesById.get(reservation.IdVozila) ?? null}
                                customer={customersById.get(reservation.IdOsobe_Korisnik) ?? null}
                            />
                        ))}
                    </ul>
                ) : null}
            </section>
        </section>
    );
}

type PendingItemProps = {
    reservation: Reservation;
    appointment: Appointment | null;
    vehicle: Vehicle | null;
    customer: Customer | null;
};

function PendingReservationItem({
    reservation,
    appointment,
    vehicle,
    customer,
}: PendingItemProps) {
    const { t } = useTranslation();
    return (
        <li className="reservation-list__item">
            <div className="reservation-list__head">
                <strong>
                    {customer
                        ? `${customer.Ime} ${customer.Prezime}`
                        : t("reservations.vehicleFallback", {
                              id: reservation.IdOsobe_Korisnik,
                          })}
                </strong>
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
                <div className="reservation-list__problem">
                    {reservation.OpisProblema || "—"}
                </div>
                <div className="reservation-list__meta">
                    <span>
                        {vehicle
                            ? `${vehicle.Marka} ${vehicle.Model} (${vehicle.RegOznaka})`
                            : t("reservations.vehicleFallback", {
                                  id: reservation.IdVozila,
                              })}
                    </span>
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
                </div>
            </div>

            <div className="reservation-list__actions">
                <Link to={`/reservations/${reservation.IdRezervacije}`}>
                    <AppButton>{t("pendingReservations.processAction")}</AppButton>
                </Link>
            </div>
        </li>
    );
}
