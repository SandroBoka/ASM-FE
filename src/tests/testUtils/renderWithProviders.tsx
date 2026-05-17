import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { AuthContext } from "../../app/features/auth/context/authContext";
import type { AuthContextValue } from "../../app/features/auth/context/authContext";

type RenderWithProvidersOptions = {
    auth?: Partial<AuthContextValue>;
    route?: string;
    routePath?: string;
    queryClient?: QueryClient;
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

export function createTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
                staleTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });
}

export function renderWithProviders(
    children: ReactNode,
    { auth, route = "/", routePath, queryClient }: RenderWithProvidersOptions = {},
) {
    const authValue: AuthContextValue = {
        ...createDefaultAuthValue(),
        ...auth,
    };
    const client = queryClient ?? createTestQueryClient();

    const wrapped = routePath ? (
        <Routes>
            <Route path={routePath} element={children} />
        </Routes>
    ) : (
        children
    );

    const result = render(
        <QueryClientProvider client={client}>
            <AuthContext.Provider value={authValue}>
                <MemoryRouter initialEntries={[route]}>{wrapped}</MemoryRouter>
            </AuthContext.Provider>
        </QueryClientProvider>,
    );

    return {
        auth: authValue,
        queryClient: client,
        ...result,
    };
}
