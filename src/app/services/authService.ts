import * as authApi from "../api/authApi";
import {
    clearAuthSession,
    createAuthSession,
    getAuthSession,
    getStoredUser,
    hasValidAuthSession,
    saveAuthSession,
} from "../features/auth/storage/authStorage";
import type {
    AuthUser,
    CustomerResponse,
    LoginRequest,
    RegisterCustomerRequest,
} from "../features/auth/models/authTypes";

export async function login(request: LoginRequest): Promise<AuthUser> {
    const response = await authApi.login(request);
    const session = createAuthSession(response);

    saveAuthSession(session);

    return session.user;
}

export async function registerCustomer(
    request: RegisterCustomerRequest,
): Promise<CustomerResponse> {
    return authApi.registerCustomer(request);
}

export async function logout(): Promise<void> {
    const session = getAuthSession();

    try {
        if (session) {
            await authApi.logout({
                refresh_token: session.refreshToken,
            });
        }
    } finally {
        clearAuthSession();
    }
}

export function getStoredAuthenticatedUser(): AuthUser | null {
    if (!hasValidAuthSession()) {
        return null;
    }

    return getStoredUser();
}
