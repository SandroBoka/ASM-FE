import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";

export function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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
                <div className="app-shell__brand">ASM Auto Servis</div>

                <nav className="app-shell__nav">
                    <NavLink to="/" end>
                        Početna
                    </NavLink>
                    <NavLink to="/vehicles">Vozila</NavLink>
                    <NavLink to="/reservations">Rezervacije</NavLink>
                    <NavLink to="/services">Usluge</NavLink>

                    {isEmployee && (
                        <>
                            <NavLink to="/pending-reservations">Pending zahtjevi</NavLink>
                            <NavLink to="/pending-changes">Promjene termina</NavLink>
                        </>
                    )}
                </nav>

                <div className="app-shell__user">
                    <span>
                        {user.Ime} {user.Prezime}
                    </span>
                    <button type="button" onClick={handleLogout}>
                        Odjavi se
                    </button>
                </div>
            </header>

            <main className="app-shell__main">
                <Outlet />
            </main>
        </div>
    );
}
