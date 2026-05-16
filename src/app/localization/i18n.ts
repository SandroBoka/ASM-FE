import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
    hr: {
        translation: {
            app: {
                brand: "ASM Auto Servis",
                home: "Početna",
                services: "Usluge",
                vehicles: "Vozila",
                reservations: "Rezervacije",
                user: "Prijavljeni korisnik",
                logout: "Odjavi se",
                logoutPending: "Odjava u tijeku...",
            },
            auth: {
                email: "Email",
                firstName: "Ime",
                lastName: "Prezime",
                login: "Prijava",
                loginAction: "Prijavi se",
                loginPending: "Prijava u tijeku...",
                loginFailed: "Prijava nije uspjela.",
                noAccount: "Nemaš račun?",
                password: "Lozinka",
                phone: "Telefon",
                register: "Registracija korisnika",
                registerAction: "Registriraj se",
                registerPending: "Registracija u tijeku...",
                registerFailed: "Registracija nije uspjela.",
                hasAccount: "Već imaš račun?",
                loginSubtitle: "Prijavi se za korištenje ASM aplikacije.",
                registerSubtitle: "Otvori račun za rezervacije servisa.",
            },
        },
    },
    en: {
        translation: {
            app: {
                brand: "ASM Auto Service",
                home: "Home",
                services: "Services",
                vehicles: "Vehicles",
                reservations: "Reservations",
                user: "Signed-in user",
                logout: "Sign out",
                logoutPending: "Signing out...",
            },
            auth: {
                email: "Email",
                firstName: "First name",
                lastName: "Last name",
                login: "Sign in",
                loginAction: "Sign in",
                loginPending: "Signing in...",
                loginFailed: "Sign-in failed.",
                noAccount: "No account yet?",
                password: "Password",
                phone: "Phone",
                register: "Customer registration",
                registerAction: "Create account",
                registerPending: "Creating account...",
                registerFailed: "Registration failed.",
                hasAccount: "Already have an account?",
                loginSubtitle: "Sign in to use the ASM application.",
                registerSubtitle: "Create an account for service reservations.",
            },
        },
    },
} as const;

void i18n.use(initReactI18next).init({
    resources,
    lng: import.meta.env.VITE_APP_LOCALE ?? "hr",
    fallbackLng: "hr",
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
