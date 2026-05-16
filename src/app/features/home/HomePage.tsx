import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/hooks/useAuth";

export function HomePage() {
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    async function handleLogout() {
        await logout();
        navigate("/login", { replace: true });
    }

    return (
        <main>
            <h1>ASM Auto Servis</h1>

            <section>
                <h2>Prijavljeni korisnik</h2>
                <dl>
                    <dt>Ime</dt>
                    <dd>{user.Ime}</dd>

                    <dt>Prezime</dt>
                    <dd>{user.Prezime}</dd>

                    <dt>Email</dt>
                    <dd>{user.Email}</dd>

                    <dt>Tip korisnika</dt>
                    <dd>{user.TipKorisnika}</dd>

                    {user.Uloga ? (
                        <>
                            <dt>Uloga</dt>
                            <dd>{user.Uloga}</dd>
                        </>
                    ) : null}
                </dl>
            </section>

            <button type="button" onClick={handleLogout}>
                Odjavi se
            </button>
        </main>
    );
}
