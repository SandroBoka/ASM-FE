import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/hooks/useAuth";
import { useUnreadNotifications } from "../notifications/hooks/useNotifications";
import {
    usePendingReservations,
    useReservationsByCustomer,
} from "../reservations/hooks/useReservations";
import { usePendingChanges } from "../appointmentChanges/hooks/useAppointmentChanges";

export function HomePage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isCustomer = user?.TipKorisnika === "customer";
    const isEmployee = user?.TipKorisnika === "employee";

    const customerReservationsQuery = useReservationsByCustomer(
        isCustomer ? (user?.IdOsobe ?? null) : null,
    );
    const unreadQuery = useUnreadNotifications(isCustomer);
    const pendingReservationsQuery = usePendingReservations(isEmployee);
    const pendingChangesQuery = usePendingChanges(isEmployee);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const activeReservationsCount = (customerReservationsQuery.data ?? []).filter(
        (r) => r.Status === "na cekanju" || r.Status === "odobrena",
    ).length;
    const unreadNotificationsCount = unreadQuery.data?.length ?? 0;
    const pendingReservationsCount = pendingReservationsQuery.data?.length ?? 0;
    const pendingChangesCount = pendingChangesQuery.data?.length ?? 0;

    return (
        <section className="page">
            <header className="dashboard-hero">
                <h1>{t("home.greeting", { name: user.Ime })}</h1>
                <p className="muted-hint">
                    {isCustomer ? t("home.customerSubtitle") : t("home.employeeSubtitle")}
                </p>
            </header>

            {isCustomer ? (
                <>
                    <section className="dashboard-stats">
                        <Link to="/reservations" className="dashboard-stat">
                            <span className="dashboard-stat__value">{activeReservationsCount}</span>
                            <span className="dashboard-stat__label">
                                {t("home.stats.activeReservations")}
                            </span>
                        </Link>
                        <Link to="/notifications" className="dashboard-stat">
                            <span className="dashboard-stat__value">
                                {unreadNotificationsCount}
                            </span>
                            <span className="dashboard-stat__label">
                                {t("home.stats.unreadNotifications")}
                            </span>
                        </Link>
                    </section>

                    <section className="dashboard-quick-actions">
                        <h2>{t("home.quickActions")}</h2>
                        <div className="dashboard-actions">
                            <Link to="/reservations/new" className="dashboard-action">
                                <strong>{t("home.actions.newReservation")}</strong>
                                <span className="muted-hint">
                                    {t("home.actions.newReservationHint")}
                                </span>
                            </Link>
                            <Link to="/vehicles" className="dashboard-action">
                                <strong>{t("home.actions.manageVehicles")}</strong>
                                <span className="muted-hint">
                                    {t("home.actions.manageVehiclesHint")}
                                </span>
                            </Link>
                            <Link to="/services" className="dashboard-action">
                                <strong>{t("home.actions.viewServices")}</strong>
                                <span className="muted-hint">
                                    {t("home.actions.viewServicesHint")}
                                </span>
                            </Link>
                        </div>
                    </section>
                </>
            ) : null}

            {isEmployee ? (
                <>
                    <section className="dashboard-stats">
                        <Link to="/pending-reservations" className="dashboard-stat">
                            <span className="dashboard-stat__value">
                                {pendingReservationsCount}
                            </span>
                            <span className="dashboard-stat__label">
                                {t("home.stats.pendingReservations")}
                            </span>
                        </Link>
                        <Link to="/pending-reservations" className="dashboard-stat">
                            <span className="dashboard-stat__value">{pendingChangesCount}</span>
                            <span className="dashboard-stat__label">
                                {t("home.stats.pendingChanges")}
                            </span>
                        </Link>
                    </section>

                    <section className="dashboard-quick-actions">
                        <h2>{t("home.quickActions")}</h2>
                        <div className="dashboard-actions">
                            <Link to="/pending-reservations" className="dashboard-action">
                                <strong>{t("home.actions.processRequests")}</strong>
                                <span className="muted-hint">
                                    {t("home.actions.processRequestsHint")}
                                </span>
                            </Link>
                            <Link to="/reservations" className="dashboard-action">
                                <strong>{t("home.actions.allReservations")}</strong>
                                <span className="muted-hint">
                                    {t("home.actions.allReservationsHint")}
                                </span>
                            </Link>
                            <Link to="/admin/appointments" className="dashboard-action">
                                <strong>{t("home.actions.manageAppointments")}</strong>
                                <span className="muted-hint">
                                    {t("home.actions.manageAppointmentsHint")}
                                </span>
                            </Link>
                            <Link to="/services" className="dashboard-action">
                                <strong>{t("home.actions.manageServices")}</strong>
                                <span className="muted-hint">
                                    {t("home.actions.manageServicesHint")}
                                </span>
                            </Link>
                        </div>
                    </section>
                </>
            ) : null}
        </section>
    );
}
