import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Alert } from "../../../components/ui/Alert";
import { AppButton } from "../../../components/ui/AppButton";
import * as appointmentsApi from "../../appointments/api/appointmentsApi";
import type { Appointment } from "../../appointments/models/appointmentTypes";
import {
    useAcceptChange,
    usePendingChanges,
    useRejectChange,
} from "../../appointmentChanges/hooks/useAppointmentChanges";
import type { AppointmentChange } from "../../appointmentChanges/models/appointmentChangeTypes";
import * as personsApi from "../../persons/api/personsApi";
import type { Customer } from "../../persons/models/personTypes";
import * as vehiclesApi from "../../vehicles/api/vehiclesApi";
import * as reservationsApi from "../api/reservationsApi";
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
    const reservations = useMemo(() => pendingQuery.data ?? [], [pendingQuery.data]);

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
            const aKey = aAppointment ? `${aAppointment.Datum}T${aAppointment.VrijemeOd}` : "";
            const bKey = bAppointment ? `${bAppointment.Datum}T${bAppointment.VrijemeOd}` : "";
            return aKey.localeCompare(bKey);
        });
    }, [reservations, appointmentsById]);

    const fetchErrorMessage = getErrorMessage(pendingQuery.error, t("common.unknownError"));

    return (
        <section className="page">
            <header className="page__header">
                <h1>{t("pendingReservations.title")}</h1>
            </header>

            <section className="page__section">
                <header className="page__header">
                    <h2>{t("pendingReservations.reservationsSection")}</h2>
                    <span className="reservation-list__created">
                        {t("pendingReservations.count", {
                            count: sortedReservations.length,
                        })}
                    </span>
                </header>

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

            <PendingChangesSection />
        </section>
    );
}

function PendingChangesSection() {
    const { t } = useTranslation();
    const changesQuery = usePendingChanges();
    const changes = useMemo(() => changesQuery.data ?? [], [changesQuery.data]);

    const appointmentIds = useMemo(() => {
        const ids = new Set<number>();
        changes.forEach((change) => {
            ids.add(change.IdStarogTermina);
            ids.add(change.IdNovogTermina);
        });
        return [...ids];
    }, [changes]);

    const appointmentQueries = useQueries({
        queries: appointmentIds.map((id) => ({
            queryKey: ["appointments", "detail", id],
            queryFn: () => appointmentsApi.getAppointmentById(id),
        })),
    });

    const reservationIds = useMemo(
        () => [...new Set(changes.map((c) => c.IdRezervacije))],
        [changes],
    );
    const reservationQueries = useQueries({
        queries: reservationIds.map((id) => ({
            queryKey: ["reservations", "detail", id],
            queryFn: () => reservationsApi.getReservationById(id),
        })),
    });

    const reservationsById = useMemo(() => {
        const map = new Map<number, Reservation>();
        reservationQueries.forEach((query, index) => {
            if (query.data) map.set(reservationIds[index], query.data);
        });
        return map;
    }, [reservationQueries, reservationIds]);

    const appointmentsByIdLocal = useMemo(() => {
        const map = new Map<number, Appointment>();
        appointmentQueries.forEach((query, index) => {
            if (query.data) map.set(appointmentIds[index], query.data);
        });
        return map;
    }, [appointmentQueries, appointmentIds]);

    const customerIds = useMemo(() => {
        const ids = new Set<number>();
        reservationQueries.forEach((q) => {
            if (q.data) ids.add(q.data.IdOsobe_Korisnik);
        });
        return [...ids];
    }, [reservationQueries]);

    const customerQueries = useQueries({
        queries: customerIds.map((id) => ({
            queryKey: ["persons", "customer", id],
            queryFn: () => personsApi.getCustomerById(id),
        })),
    });

    const customersById = useMemo(() => {
        const map = new Map<number, Customer>();
        customerQueries.forEach((query, index) => {
            if (query.data) map.set(customerIds[index], query.data);
        });
        return map;
    }, [customerQueries, customerIds]);

    const vehicleIdsForChanges = useMemo(() => {
        const ids = new Set<number>();
        reservationQueries.forEach((q) => {
            if (q.data) ids.add(q.data.IdVozila);
        });
        return [...ids];
    }, [reservationQueries]);

    const vehicleQueries = useQueries({
        queries: vehicleIdsForChanges.map((id) => ({
            queryKey: ["vehicles", "detail", id],
            queryFn: () => vehiclesApi.getVehicleById(id),
        })),
    });

    const vehiclesByIdLocal = useMemo(() => {
        const map = new Map<number, Vehicle>();
        vehicleQueries.forEach((query, index) => {
            if (query.data) map.set(vehicleIdsForChanges[index], query.data);
        });
        return map;
    }, [vehicleQueries, vehicleIdsForChanges]);

    return (
        <section className="page__section">
            <header className="page__header">
                <h2>{t("pendingChanges.title")}</h2>
                <span className="reservation-list__created">
                    {t("pendingChanges.count", { count: changes.length })}
                </span>
            </header>

            {changesQuery.isLoading ? <p>{t("common.loading")}</p> : null}

            {changesQuery.isError ? (
                <Alert variant="error">
                    {getErrorMessage(changesQuery.error, t("common.unknownError"))}
                </Alert>
            ) : null}

            {changesQuery.data && changes.length === 0 ? (
                <Alert variant="info">{t("pendingChanges.empty")}</Alert>
            ) : null}

            {changes.length > 0 ? (
                <ul className="change-list change-list--full">
                    {changes.map((change) => {
                        const reservation = reservationsById.get(change.IdRezervacije);
                        const customer = reservation
                            ? customersById.get(reservation.IdOsobe_Korisnik)
                            : undefined;
                        const vehicle = reservation
                            ? (vehiclesByIdLocal.get(reservation.IdVozila) ?? null)
                            : null;
                        return (
                            <PendingChangeItem
                                key={change.IdZahtjevaPromjene}
                                change={change}
                                reservation={reservation ?? null}
                                vehicle={vehicle}
                                oldAppointment={
                                    appointmentsByIdLocal.get(change.IdStarogTermina) ?? null
                                }
                                newAppointment={
                                    appointmentsByIdLocal.get(change.IdNovogTermina) ?? null
                                }
                                customerLabel={
                                    customer
                                        ? `${customer.Ime} ${customer.Prezime}`
                                        : reservation
                                          ? t("pendingChanges.customerFallback", {
                                                id: reservation.IdOsobe_Korisnik,
                                            })
                                          : "—"
                                }
                            />
                        );
                    })}
                </ul>
            ) : null}
        </section>
    );
}

type PendingChangeItemProps = {
    change: AppointmentChange;
    reservation: Reservation | null;
    vehicle: Vehicle | null;
    oldAppointment: Appointment | null;
    newAppointment: Appointment | null;
    customerLabel: string;
};

function PendingChangeItem({
    change,
    reservation,
    vehicle,
    oldAppointment,
    newAppointment,
    customerLabel,
}: PendingChangeItemProps) {
    const { t } = useTranslation();
    const [comment, setComment] = useState("");
    const acceptMutation = useAcceptChange();
    const rejectMutation = useRejectChange();

    const inFlight = acceptMutation.isPending || rejectMutation.isPending;
    const actionError = acceptMutation.error || rejectMutation.error;

    function handleAccept() {
        acceptMutation.mutate({
            changeId: change.IdZahtjevaPromjene,
            payload: { komentar: comment.trim() === "" ? null : comment.trim() },
        });
    }

    function handleReject() {
        rejectMutation.mutate({
            changeId: change.IdZahtjevaPromjene,
            payload: { komentar: comment.trim() === "" ? null : comment.trim() },
        });
    }

    return (
        <li className="change-list__item change-list__item--card">
            <div className="reservation-list__head">
                <strong>{customerLabel}</strong>
                <span className="reservation-list__created">
                    {t("appointmentChanges.requestedOn", {
                        date: change.DatumZahtjeva,
                    })}
                </span>
            </div>

            <div className="change-list__appointments">
                <div className="change-list__slot">
                    <span className="muted-hint">{t("appointmentChanges.oldAppointment")}</span>
                    <strong>
                        {oldAppointment
                            ? `${formatDate(oldAppointment.Datum)} · ${formatTimeRange(
                                  oldAppointment.VrijemeOd,
                                  oldAppointment.VrijemeDo,
                              )}`
                            : "—"}
                    </strong>
                </div>
                <div className="change-list__arrow">→</div>
                <div className="change-list__slot">
                    <span className="muted-hint">{t("appointmentChanges.newAppointment")}</span>
                    <strong>
                        {newAppointment
                            ? `${formatDate(newAppointment.Datum)} · ${formatTimeRange(
                                  newAppointment.VrijemeOd,
                                  newAppointment.VrijemeDo,
                              )}`
                            : "—"}
                    </strong>
                </div>
            </div>

            {reservation ? (
                <dl className="summary">
                    <dt>{t("reservations.fields.vehicle")}</dt>
                    <dd>
                        {vehicle ? `${vehicle.Marka} ${vehicle.Model} (${vehicle.RegOznaka})` : "—"}
                    </dd>

                    <dt>{t("reservations.fields.kilometers")}</dt>
                    <dd>
                        {t("reservations.kilometersFormatted", {
                            km: reservation.KilometrazaVozila,
                        })}
                    </dd>

                    <dt>{t("reservations.fields.problemDescription")}</dt>
                    <dd>{reservation.OpisProblema || "—"}</dd>

                    {reservation.services.length > 0 ? (
                        <>
                            <dt>{t("reservations.fields.services")}</dt>
                            <dd>
                                <ul className="summary__services">
                                    {reservation.services.map((item) => (
                                        <li key={item.service.IdUsluge}>
                                            {item.service.NazivUsluge} × {item.Kolicina}
                                            {" · "}
                                            {t("services.durationMinutes", {
                                                minutes: item.service.Trajanje * item.Kolicina,
                                            })}
                                        </li>
                                    ))}
                                </ul>
                            </dd>
                        </>
                    ) : null}
                </dl>
            ) : null}

            <label className="ui-field">
                <span className="ui-field__label">{t("reservations.commentLabel")}</span>
                <textarea
                    className="ui-field__input"
                    rows={2}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder={t("reservations.commentPlaceholder")}
                />
            </label>

            {actionError ? (
                <Alert variant="error">
                    {getErrorMessage(actionError, t("common.unknownError"))}
                </Alert>
            ) : null}

            <div className="form-actions">
                <AppButton onClick={handleAccept} disabled={inFlight}>
                    {t("appointmentChanges.acceptAction")}
                </AppButton>
                <AppButton variant="destructive" onClick={handleReject} disabled={inFlight}>
                    {t("appointmentChanges.rejectAction")}
                </AppButton>
            </div>
        </li>
    );
}

type PendingItemProps = {
    reservation: Reservation;
    appointment: Appointment | null;
    vehicle: Vehicle | null;
    customer: Customer | null;
};

function PendingReservationItem({ reservation, appointment, vehicle, customer }: PendingItemProps) {
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
                <div className="reservation-list__problem">{reservation.OpisProblema || "—"}</div>
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
