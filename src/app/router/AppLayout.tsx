import { useQuery } from "@tanstack/react-query";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as appointmentChangesApi from "../features/appointmentChanges/api/appointmentChangesApi";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useUnreadNotifications } from "../features/notifications/hooks/useNotifications";
import * as reservationsApi from "../features/reservations/api/reservationsApi";

export function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isCustomer = user?.TipKorisnika === "customer";
    const isEmployeeFlag = user?.TipKorisnika === "employee";

    const unreadQuery = useUnreadNotifications(isCustomer);
    const unreadCount = unreadQuery.data?.length ?? 0;

    const pendingReservationsQuery = useQuery({
        queryKey: ["reservations", "pending"],
        queryFn: () => reservationsApi.getPendingReservations(),
        enabled: isEmployeeFlag,
        refetchInterval: 10_000,
    });
    const pendingChangesQuery = useQuery({
        queryKey: ["appointment-changes", "pending"],
        queryFn: () => appointmentChangesApi.getPendingChanges(),
        enabled: isEmployeeFlag,
        refetchInterval: 10_000,
    });
    const pendingCount =
        (pendingReservationsQuery.data?.length ?? 0) +
        (pendingChangesQuery.data?.length ?? 0);

    if (!user) {
        return null;
    }

    const isEmployee = user.TipKorisnika === "employee";

    async function handleLogout() {
        await logout();
        navigate("/login", { replace: true });
    }

    return (
        <div className="app-shell">
            <header className="app-shell__header">
                <div className="app-shell__brand">{t("app.brand")}</div>

                <nav className="app-shell__nav">
                    <NavLink to="/" end>
                        {t("app.home")}
                    </NavLink>
                    {!isEmployee && (
                        <NavLink to="/vehicles">{t("app.vehicles")}</NavLink>
                    )}
                    <NavLink to="/reservations">{t("app.reservations")}</NavLink>
                    <NavLink to="/services">{t("app.services")}</NavLink>

                    {isCustomer && (
                        <NavLink to="/notifications" className="app-shell__nav-with-badge">
                            <span>{t("app.notifications")}</span>
                            {unreadCount > 0 ? (
                                <span className="nav-badge">{unreadCount}</span>
                            ) : null}
                        </NavLink>
                    )}

                    {isEmployee && (
                        <>
                            <NavLink
                                to="/pending-reservations"
                                className="app-shell__nav-with-badge"
                            >
                                <span>{t("app.pendingReservations")}</span>
                                {pendingCount > 0 ? (
                                    <span className="nav-badge">{pendingCount}</span>
                                ) : null}
                            </NavLink>
                            <NavLink to="/admin/appointments">
                                {t("app.adminAppointments")}
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="app-shell__user">
                    <span>
                        {user.Ime} {user.Prezime}
                    </span>
                    <button type="button" onClick={handleLogout}>
                        {t("app.logout")}
                    </button>
                </div>
            </header>

            <main className="app-shell__main">
                <Outlet />
            </main>
        </div>
    );
}
