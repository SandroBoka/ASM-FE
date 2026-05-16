import { createContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
    AuthUser,
    CustomerResponse,
    LoginRequest,
    RegisterCustomerRequest,
} from "../models/authTypes";
import * as authService from "../../../services/authService";

export type AuthContextValue = {
    user: AuthUser | null;
    isAuthenticated: boolean;
    login: (request: LoginRequest) => Promise<void>;
    registerCustomer: (request: RegisterCustomerRequest) => Promise<CustomerResponse>;
    logout: () => Promise<void>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
    children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(() =>
        authService.getStoredAuthenticatedUser(),
    );

    async function login(request: LoginRequest): Promise<void> {
        const authenticatedUser = await authService.login(request);
        setUser(authenticatedUser);
    }

    async function registerCustomer(request: RegisterCustomerRequest): Promise<CustomerResponse> {
        return authService.registerCustomer(request);
    }

    async function logout(): Promise<void> {
        await authService.logout();
        setUser(null);
    }

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: user !== null,
            login,
            registerCustomer,
            logout,
        }),
        [user],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
