import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return "Registracija nije uspjela.";
}

export function RegisterPage() {
    const { isAuthenticated, login, registerCustomer } = useAuth();
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
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
            await registerCustomer({
                Ime: firstName,
                Prezime: lastName,
                Email: email,
                Telefon: phone.trim() || null,
                Lozinka: password,
            });

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
            <h1>Registracija korisnika</h1>

            <form onSubmit={handleSubmit}>
                <label>
                    Ime
                    <input
                        type="text"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        required
                    />
                </label>

                <label>
                    Prezime
                    <input
                        type="text"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        required
                    />
                </label>

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
                    Telefon
                    <input
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
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
                    {isSubmitting ? "Registracija u tijeku..." : "Registriraj se"}
                </button>
            </form>

            <p>
                Već imaš račun? <Link to="/login">Prijavi se</Link>
            </p>
        </main>
    );
}
