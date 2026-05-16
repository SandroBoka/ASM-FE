import {
    clearAuthSession,
    createAuthSession,
    getAuthSession,
    isAuthSessionExpired,
    saveAuthSession,
} from "../auth/authStorage";
import type { AuthTokenResponse } from "../auth/authTypes";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
    status: number;
    body: unknown;

    constructor(message: string, status: number, body: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type HttpClientOptions = {
    method?: HttpMethod;
    body?: unknown;
    authenticated?: boolean;
};

let refreshSessionPromise: Promise<string | null> | null = null;

async function sendRequest(
    path: string,
    options: HttpClientOptions,
    accessToken: string | null,
): Promise<Response> {
    const headers = new Headers();

    headers.set("Accept", "application/json");

    if (options.body !== undefined) {
        headers.set("Content-Type", "application/json");
    }

    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    return fetch(`${API_BASE_URL}${path}`, {
        method: options.method ?? "GET",
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
}

async function refreshAuthSession(): Promise<string | null> {
    const session = getAuthSession();
    const path = "/auth/refresh";
    const method = "POST";

    if (!session) {
        return null;
    }

    const response = await sendRequest(
        path,
        {
            method,
            body: {
                refresh_token: session.refreshToken,
            },
            authenticated: false,
        },
        null,
    );

    const responseBody = await parseResponseBody(response);

    if (!response.ok) {
        clearAuthSession();
        throw new ApiError(getApiErrorMessage(responseBody), response.status, responseBody);
    }

    const refreshedSession = createAuthSession(responseBody as unknown as AuthTokenResponse);
    saveAuthSession(refreshedSession);

    return refreshedSession.accessToken;
}

async function refreshAuthSessionOnce(): Promise<string | null> {
    if (!refreshSessionPromise) {
        refreshSessionPromise = refreshAuthSession().finally(() => {
            refreshSessionPromise = null;
        });
    }

    return refreshSessionPromise;
}

async function getValidAccessToken(): Promise<string | null> {
    const session = getAuthSession();

    if (!session) {
        return null;
    }

    if (!isAuthSessionExpired(session)) {
        return session.accessToken;
    }

    return refreshAuthSessionOnce();
}

async function parseResponseBody(response: Response): Promise<unknown> {
    if (response.status === 204) {
        return null;
    }

    const text = await response.text();

    if (!text) {
        return null;
    }

    return JSON.parse(text);
}

function getApiErrorMessage(body: unknown): string {
    if (
        typeof body === "object" &&
        body !== null &&
        "detail" in body &&
        typeof body.detail === "string"
    ) {
        return body.detail;
    }

    return "Dogodila se pogreška prilikom komunikacije s poslužiteljem.";
}

export async function httpClient<TResponse>(
    path: string,
    options: HttpClientOptions = {},
): Promise<TResponse> {
    const accessToken = options.authenticated !== false ? await getValidAccessToken() : null;
    let response = await sendRequest(path, options, accessToken);

    if (options.authenticated !== false && response.status === 401) {
        const refreshedAccessToken = await refreshAuthSessionOnce();

        if (refreshedAccessToken) {
            response = await sendRequest(path, options, refreshedAccessToken);
        }
    }

    const responseBody = await parseResponseBody(response);

    if (!response.ok) {
        throw new ApiError(getApiErrorMessage(responseBody), response.status, responseBody);
    }

    return responseBody as TResponse;
}
