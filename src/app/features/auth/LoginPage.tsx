import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return "Prijava nije uspjela.";
}

export function LoginPage() {
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (isAuthenticated) {
        return <Navigate to="/app" replace />;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);
        setIsSubmitting(true);

        try {
            await login({
                Email: email,
                Lozinka: password,
            });
            navigate("/app", { replace: true });
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main>
            <h1>Prijava</h1>

            <form onSubmit={handleSubmit}>
                <label>
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </label>

                <label>
                    Lozinka
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </label>

                {errorMessage ? <p role="alert">{errorMessage}</p> : null}

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Prijava u tijeku..." : "Prijavi se"}
                </button>
            </form>

            <p>
                Nemaš račun? <Link to="/register">Registriraj se</Link>
            </p>
        </main>
    );
}
