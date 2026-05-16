import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { AuthContext } from "../../app/features/auth/context/authContext";
import type { AuthContextValue } from "../../app/features/auth/context/authContext";

type RenderAuthPageOptions = {
    auth?: Partial<AuthContextValue>;
    route?: string;
};

function createDefaultAuthValue(): AuthContextValue {
    return {
        user: null,
        isAuthenticated: false,
        login: vi.fn().mockResolvedValue(undefined),
        registerCustomer: vi.fn().mockResolvedValue({
            IdOsobe: 1,
            Ime: "Test",
            Prezime: "Korisnik",
            Email: "test@example.com",
            Telefon: null,
        }),
        logout: vi.fn().mockResolvedValue(undefined),
    };
}

export function renderAuthPage(
    children: ReactNode,
    { auth, route = "/login" }: RenderAuthPageOptions = {},
) {
    const authValue: AuthContextValue = {
        ...createDefaultAuthValue(),
        ...auth,
    };

    return {
        auth: authValue,
        ...render(
            <AuthContext.Provider value={authValue}>
                <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
            </AuthContext.Provider>,
        ),
    };
}
