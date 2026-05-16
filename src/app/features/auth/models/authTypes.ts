export type UserType = "customer" | "employee";

export type EmployeeRole = "admin" | "serviser" | "voditelj";

export type AuthUser = {
    IdOsobe: number;
    Ime: string;
    Prezime: string;
    Email: string;
    TipKorisnika: UserType;
    Uloga: EmployeeRole | null;
};

export type LoginRequest = {
    Email: string;
    Lozinka: string;
};

export type AuthTokenResponse = {
    access_token: string;
    refresh_token: string;
    token_type: "bearer";
    expires_in: number;
    user: AuthUser;
};

export type RefreshTokenRequest = {
    refresh_token: string;
};

export type LogoutRequest = {
    refresh_token: string;
};

export type RegisterCustomerRequest = {
    Ime: string;
    Prezime: string;
    Email: string;
    Telefon: string | null;
    Lozinka: string;
};

export type CustomerResponse = {
    IdOsobe: number;
    Ime: string;
    Prezime: string;
    Email: string;
    Telefon: string | null;
};
