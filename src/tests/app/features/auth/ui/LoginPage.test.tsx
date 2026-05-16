import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { LoginPage } from "../../../../../app/features/auth/ui/LoginPage";
import { renderAuthPage } from "../../../../testUtils/renderAuthPage";

describe("LoginPage", () => {
    it("renders the login form", () => {
        renderAuthPage(<LoginPage />);

        expect(screen.getByRole("heading", { name: "Prijava" })).toBeInTheDocument();
        expect(screen.getByLabelText("Email")).toBeInTheDocument();
        expect(screen.getByLabelText("Lozinka")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Prijavi se" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Registriraj se" })).toHaveAttribute(
            "href",
            "/register",
        );
    });

    it("submits email and password to auth context", async () => {
        const user = userEvent.setup();
        const { auth } = renderAuthPage(<LoginPage />);

        await user.type(screen.getByLabelText("Email"), "ana@example.com");
        await user.type(screen.getByLabelText("Lozinka"), "tajna-lozinka");
        await user.click(screen.getByRole("button", { name: "Prijavi se" }));

        await waitFor(() => {
            expect(auth.login).toHaveBeenCalledWith({
                Email: "ana@example.com",
                Lozinka: "tajna-lozinka",
            });
        });
    });

    it("shows an error message when login fails", async () => {
        const user = userEvent.setup();
        const login = vi.fn().mockRejectedValue(new Error("Neispravni podaci za prijavu."));

        renderAuthPage(<LoginPage />, {
            auth: {
                login,
            },
        });

        await user.type(screen.getByLabelText("Email"), "ana@example.com");
        await user.type(screen.getByLabelText("Lozinka"), "kriva-lozinka");
        await user.click(screen.getByRole("button", { name: "Prijavi se" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Neispravni podaci za prijavu.");
    });
});
