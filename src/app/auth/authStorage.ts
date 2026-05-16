import type { AuthTokenResponse, AuthUser } from "./authTypes";

const AUTH_SESSION_KEY = "asm_auth_session";

export type AuthSession = {
    accessToken: string;
    refreshToken: string;
    tokenType: "bearer";
    expiresAt: number;
    user: AuthUser;
};

export function createAuthSession(response: AuthTokenResponse): AuthSession {
    return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        tokenType: response.token_type,
        expiresAt: Date.now() + response.expires_in * 1000,
        user: response.user,
    };
}

export function saveAuthSession(session: AuthSession) {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function getAuthSession(): AuthSession | null {
    const rawSession = localStorage.getItem(AUTH_SESSION_KEY);

    if (!rawSession) {
        return null;
    }

    try {
        return JSON.parse(rawSession) as AuthSession;
    } catch {
        clearAuthSession();
        return null;
    }
}

export function clearAuthSession() {
    localStorage.removeItem(AUTH_SESSION_KEY);
}

export function getStoredUser(): AuthUser | null {
    const session = getAuthSession();

    if (!session) {
        return null;
    }

    return session.user;
}

export function isAuthSessionExpired(session: AuthSession, now = Date.now()): boolean {
    return session.expiresAt <= now;
}

export function hasValidAuthSession(now = Date.now()): boolean {
    const session = getAuthSession();

    if (!session) {
        return false;
    }

    return !isAuthSessionExpired(session, now);
}
