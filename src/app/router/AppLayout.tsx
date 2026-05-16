import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../features/auth/hooks/useAuth";

export function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

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
                    <NavLink to="/vehicles">{t("app.vehicles")}</NavLink>
                    <NavLink to="/reservations">{t("app.reservations")}</NavLink>
                    <NavLink to="/services">{t("app.services")}</NavLink>

                    {isEmployee && (
                        <>
                            <NavLink to="/pending-reservations">
                                {t("app.pendingReservations")}
                            </NavLink>
                            <NavLink to="/pending-changes">
                                {t("app.pendingChanges")}
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
