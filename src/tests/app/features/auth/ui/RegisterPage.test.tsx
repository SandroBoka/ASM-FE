import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { RegisterPage } from "../../../../../app/features/auth/ui/RegisterPage";
import { renderAuthPage } from "../../../../testUtils/renderAuthPage";

describe("RegisterPage", () => {
    it("renders the registration form", () => {
        renderAuthPage(<RegisterPage />, { route: "/register" });

        expect(screen.getByRole("heading", { name: "Registracija korisnika" })).toBeInTheDocument();
        expect(screen.getByLabelText("Ime")).toBeInTheDocument();
        expect(screen.getByLabelText("Prezime")).toBeInTheDocument();
        expect(screen.getByLabelText("Email")).toBeInTheDocument();
        expect(screen.getByLabelText("Telefon")).toBeInTheDocument();
        expect(screen.getByLabelText("Lozinka")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Registriraj se" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Prijavi se" })).toHaveAttribute("href", "/login");
    });

    it("registers the customer and logs in with the submitted credentials", async () => {
        const user = userEvent.setup();
        const { auth } = renderAuthPage(<RegisterPage />, { route: "/register" });

        await user.type(screen.getByLabelText("Ime"), "Ana");
        await user.type(screen.getByLabelText("Prezime"), "Anic");
        await user.type(screen.getByLabelText("Email"), "ana@example.com");
        await user.type(screen.getByLabelText("Telefon"), "0911234567");
        await user.type(screen.getByLabelText("Lozinka"), "tajna-lozinka");
        await user.click(screen.getByRole("button", { name: "Registriraj se" }));

        await waitFor(() => {
            expect(auth.registerCustomer).toHaveBeenCalledWith({
                Ime: "Ana",
                Prezime: "Anic",
                Email: "ana@example.com",
                Telefon: "0911234567",
                Lozinka: "tajna-lozinka",
            });
        });

        expect(auth.login).toHaveBeenCalledWith({
            Email: "ana@example.com",
            Lozinka: "tajna-lozinka",
        });
    });

    it("sends null for an empty phone number", async () => {
        const user = userEvent.setup();
        const { auth } = renderAuthPage(<RegisterPage />, { route: "/register" });

        await user.type(screen.getByLabelText("Ime"), "Ana");
        await user.type(screen.getByLabelText("Prezime"), "Anic");
        await user.type(screen.getByLabelText("Email"), "ana@example.com");
        await user.type(screen.getByLabelText("Lozinka"), "tajna-lozinka");
        await user.click(screen.getByRole("button", { name: "Registriraj se" }));

        await waitFor(() => {
            expect(auth.registerCustomer).toHaveBeenCalledWith(
                expect.objectContaining({
                    Telefon: null,
                }),
            );
        });
    });

    it("shows an error message when registration fails", async () => {
        const user = userEvent.setup();
        const registerCustomer = vi.fn().mockRejectedValue(new Error("Email je već zauzet."));

        renderAuthPage(<RegisterPage />, {
            auth: {
                registerCustomer,
            },
            route: "/register",
        });

        await user.type(screen.getByLabelText("Ime"), "Ana");
        await user.type(screen.getByLabelText("Prezime"), "Anic");
        await user.type(screen.getByLabelText("Email"), "ana@example.com");
        await user.type(screen.getByLabelText("Lozinka"), "tajna-lozinka");
        await user.click(screen.getByRole("button", { name: "Registriraj se" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Email je već zauzet.");
    });
});
