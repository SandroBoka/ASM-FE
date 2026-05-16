import type {
    AuthTokenResponse,
    AuthUser,
    CustomerResponse,
    LoginRequest,
    LogoutRequest,
    RegisterCustomerRequest,
} from "../models/authTypes";
import { httpClient } from "../../../api/httpClient";

export function login(request: LoginRequest): Promise<AuthTokenResponse> {
    return httpClient<AuthTokenResponse>("/auth/login", {
        method: "POST",
        body: request,
        authenticated: false,
    });
}

export function getCurrentUser(): Promise<AuthUser> {
    return httpClient<AuthUser>("/auth/me");
}

export function logout(request: LogoutRequest): Promise<void> {
    return httpClient<void>("/auth/logout", {
        method: "POST",
        body: request,
        authenticated: false,
    });
}

export function registerCustomer(request: RegisterCustomerRequest): Promise<CustomerResponse> {
    return httpClient<CustomerResponse>("/persons/customers", {
        method: "POST",
        body: request,
        authenticated: false,
    });
}
