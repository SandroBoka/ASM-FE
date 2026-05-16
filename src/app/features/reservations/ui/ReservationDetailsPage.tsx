import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/ui/Alert";
import { AppButton } from "../../../components/ui/AppButton";
import { useAuth } from "../../auth/hooks/useAuth";
import { useAppointmentById } from "../../appointments/hooks/useAppointments";
import { useVehicleById } from "../../vehicles/hooks/useVehicles";
import {
    useApproveReservation,
    useCancelReservation,
    useCompleteReservation,
    useRejectReservation,
    useReservationById,
} from "../hooks/useReservations";
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

function StatusPill({ status }: { status: ReservationStatus }) {
    const { t } = useTranslation();
    return (
        <span className={`status-pill ${STATUS_MODIFIERS[status]}`}>
            {t(`reservations.status.${status.replace(" ", "_")}`)}
        </span>
    );
}

export function ReservationDetailsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const params = useParams();
    const reservationId = Number.parseInt(params.reservationId ?? "", 10);
    const [comment, setComment] = useState("");

    const reservationQuery = useReservationById(
        Number.isNaN(reservationId) ? null : reservationId,
    );
    const vehicleQuery = useVehicleById(reservationQuery.data?.IdVozila ?? null);
    const appointmentQuery = useAppointmentById(reservationQuery.data?.IdTermina ?? null);

    const approveMutation = useApproveReservation();
    const rejectMutation = useRejectReservation();
    const cancelMutation = useCancelReservation();
    const completeMutation = useCompleteReservation();

    if (!user) {
        return null;
    }

    if (Number.isNaN(reservationId)) {
        return (
            <section className="page">
                <Alert variant="error">{t("reservations.invalidId")}</Alert>
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
                        detail: getErrorMessage(
                            reservationQuery.error,
                            t("common.unknownError"),
                        ),
                    })}
                </Alert>
            </section>
        );
    }

    const reservation = reservationQuery.data;
    const isOwner = user.IdOsobe === reservation.IdOsobe_Korisnik;
    const isEmployee = user.TipKorisnika === "employee";

    const canCancel = isOwner && (reservation.Status === "na cekanju" || reservation.Status === "odobrena");
    const canApprove = isEmployee && reservation.Status === "na cekanju";
    const canReject = isEmployee && reservation.Status === "na cekanju";
    const canComplete = isEmployee && reservation.Status === "odobrena";

    const totalPrice = reservation.services.reduce(
        (acc, item) => acc + Number(item.service.Cijena) * item.Kolicina,
        0,
    );

    function handleAction(
        action: "approve" | "reject" | "cancel" | "complete",
    ): () => void {
        return () => {
            const payload = { komentar: comment.trim() === "" ? null : comment.trim() };
            const onSuccess = () => navigate("/reservations");
            if (action === "approve") {
                approveMutation.mutate(
                    { reservationId, payload },
                    { onSuccess },
                );
            } else if (action === "reject") {
                rejectMutation.mutate(
                    { reservationId, payload },
                    { onSuccess },
                );
            } else if (action === "cancel") {
                if (!window.confirm(t("reservations.cancelConfirm"))) return;
                cancelMutation.mutate(
                    { reservationId, payload },
                    { onSuccess },
                );
            } else if (action === "complete") {
                completeMutation.mutate(reservationId, { onSuccess });
            }
        };
    }

    const actionInFlight =
        approveMutation.isPending ||
        rejectMutation.isPending ||
        cancelMutation.isPending ||
        completeMutation.isPending;
    const actionError =
        approveMutation.error ||
        rejectMutation.error ||
        cancelMutation.error ||
        completeMutation.error;

    return (
        <section className="page">
            <header className="page__header">
                <h1>
                    {t("reservations.detailTitle", { id: reservation.IdRezervacije })}
                </h1>
                <StatusPill status={reservation.Status} />
            </header>

            <section className="page__section">
                <ReservationSummaryGrid
                    reservation={reservation}
                    vehicleLabel={
                        vehicleQuery.data
                            ? `${vehicleQuery.data.Marka} ${vehicleQuery.data.Model} (${vehicleQuery.data.RegOznaka})`
                            : "—"
                    }
                    appointmentLabel={
                        appointmentQuery.data
                            ? `${formatDate(appointmentQuery.data.Datum)} · ${formatTimeRange(
                                  appointmentQuery.data.VrijemeOd,
                                  appointmentQuery.data.VrijemeDo,
                              )}`
                            : "—"
                    }
                    totalPrice={totalPrice}
                />
            </section>

            {reservation.KomentarZaposlenika ? (
                <section className="page__section">
                    <h2>{t("reservations.employeeComment")}</h2>
                    <p>{reservation.KomentarZaposlenika}</p>
                </section>
            ) : null}

            {canApprove || canReject || canCancel || canComplete ? (
                <section className="page__section">
                    <h2>{t("reservations.actionsTitle")}</h2>

                    {(canApprove || canReject) && (
                        <label className="ui-field">
                            <span className="ui-field__label">
                                {t("reservations.commentLabel")}
                            </span>
                            <textarea
                                className="ui-field__input"
                                rows={3}
                                value={comment}
                                onChange={(event) => setComment(event.target.value)}
                                placeholder={t("reservations.commentPlaceholder")}
                            />
                        </label>
                    )}

                    {actionError ? (
                        <Alert variant="error">
                            {getErrorMessage(actionError, t("common.unknownError"))}
                        </Alert>
                    ) : null}

                    <div className="form-actions">
                        {canApprove ? (
                            <AppButton
                                onClick={handleAction("approve")}
                                disabled={actionInFlight}
                            >
                                {t("reservations.approveAction")}
                            </AppButton>
                        ) : null}
                        {canReject ? (
                            <AppButton
                                variant="destructive"
                                onClick={handleAction("reject")}
                                disabled={actionInFlight}
                            >
                                {t("reservations.rejectAction")}
                            </AppButton>
                        ) : null}
                        {canComplete ? (
                            <AppButton
                                onClick={handleAction("complete")}
                                disabled={actionInFlight}
                            >
                                {t("reservations.completeAction")}
                            </AppButton>
                        ) : null}
                        {canCancel ? (
                            <AppButton
                                variant="destructive"
                                onClick={handleAction("cancel")}
                                disabled={actionInFlight}
                            >
                                {t("reservations.cancelAction")}
                            </AppButton>
                        ) : null}
                    </div>
                </section>
            ) : null}
        </section>
    );
}

type ReservationSummaryGridProps = {
    reservation: Reservation;
    vehicleLabel: string;
    appointmentLabel: string;
    totalPrice: number;
};

function ReservationSummaryGrid({
    reservation,
    vehicleLabel,
    appointmentLabel,
    totalPrice,
}: ReservationSummaryGridProps) {
    const { t } = useTranslation();
    return (
        <dl className="summary">
            <dt>{t("reservations.fields.appointment")}</dt>
            <dd>{appointmentLabel}</dd>

            <dt>{t("reservations.fields.vehicle")}</dt>
            <dd>{vehicleLabel}</dd>

            <dt>{t("reservations.fields.kilometers")}</dt>
            <dd>
                {t("reservations.kilometersFormatted", {
                    km: reservation.KilometrazaVozila,
                })}
            </dd>

            <dt>{t("reservations.fields.problemDescription")}</dt>
            <dd>{reservation.OpisProblema || "—"}</dd>

            <dt>{t("reservations.fields.services")}</dt>
            <dd>
                {reservation.services.length === 0 ? (
                    "—"
                ) : (
                    <ul className="summary__services">
                        {reservation.services.map((item) => (
                            <li key={item.service.IdUsluge}>
                                {item.service.NazivUsluge} × {item.Kolicina}
                                {" · "}
                                {t("services.priceFormatted", {
                                    price: Number(item.service.Cijena).toFixed(2),
                                })}
                            </li>
                        ))}
                    </ul>
                )}
            </dd>

            {reservation.services.length > 0 ? (
                <>
                    <dt>{t("reservations.fields.totalPrice")}</dt>
                    <dd>
                        {t("services.priceFormatted", { price: totalPrice.toFixed(2) })}
                    </dd>
                </>
            ) : null}

            <dt>{t("reservations.fields.created")}</dt>
            <dd>{formatDate(reservation.DatumKreiranja)}</dd>
        </dl>
    );
}
