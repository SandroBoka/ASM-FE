import { screen } from "@testing-library/react";
import { vi } from "vitest";
import { ReservationDetailsPage } from "../../../../../app/features/reservations/ui/ReservationDetailsPage";
import * as reservationsHooks from "../../../../../app/features/reservations/hooks/useReservations";
import * as appointmentsHooks from "../../../../../app/features/appointments/hooks/useAppointments";
import * as vehiclesHooks from "../../../../../app/features/vehicles/hooks/useVehicles";
import * as appointmentChangesHooks from "../../../../../app/features/appointmentChanges/hooks/useAppointmentChanges";
import type { Reservation } from "../../../../../app/features/reservations/models/reservationTypes";
import { renderWithProviders } from "../../../../testUtils/renderWithProviders";

vi.mock("../../../../../app/features/reservations/hooks/useReservations", () => ({
    useReservationById: vi.fn(),
    useApproveReservation: vi.fn(),
    useRejectReservation: vi.fn(),
    useCancelReservation: vi.fn(),
    useCompleteReservation: vi.fn(),
}));

vi.mock("../../../../../app/features/appointments/hooks/useAppointments", () => ({
    useAppointmentById: vi.fn(),
}));

vi.mock("../../../../../app/features/vehicles/hooks/useVehicles", () => ({
    useVehicleById: vi.fn(),
}));

vi.mock("../../../../../app/features/appointmentChanges/hooks/useAppointmentChanges", () => ({
    useChangesForReservation: vi.fn(),
}));

// Avoid rendering the propose-change section's complex inner hooks
vi.mock("../../../../../app/features/appointmentChanges/ui/ProposeChangeSection", () => ({
    ProposeChangeSection: () => <div data-testid="propose-change-stub">propose-change</div>,
}));

const customerUser = {
    IdOsobe: 1,
    Ime: "Ana",
    Prezime: "Anic",
    Email: "ana@example.com",
    TipKorisnika: "customer" as const,
    Uloga: null,
};

const employeeUser = {
    IdOsobe: 99,
    Ime: "Marko",
    Prezime: "Markic",
    Email: "marko@example.com",
    TipKorisnika: "employee" as const,
    Uloga: "admin" as const,
};

type AnyHook = ReturnType<typeof vi.fn>;

function mockQuery<T>(data: T | undefined, overrides: Record<string, unknown> = {}) {
    return {
        data,
        isLoading: false,
        isError: false,
        error: null,
        ...overrides,
    };
}

function mockMutation(overrides: Record<string, unknown> = {}) {
    return {
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue(undefined),
        isPending: false,
        isError: false,
        error: null,
        ...overrides,
    };
}

function buildReservation(overrides: Partial<Reservation> = {}): Reservation {
    return {
        IdRezervacije: 100,
        DatumKreiranja: "2026-05-10",
        Status: "na cekanju",
        KilometrazaVozila: 50000,
        OpisProblema: "Curi ulje",
        KomentarZaposlenika: null,
        IdOsobe_Korisnik: 1,
        IdTermina: 5,
        IdVozila: 10,
        IdOsobe_Zaposlenik: null,
        services: [],
        ...overrides,
    };
}

describe("ReservationDetailsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (appointmentsHooks.useAppointmentById as unknown as AnyHook).mockReturnValue(
            mockQuery({
                IdTermina: 5,
                Datum: "2026-06-15",
                VrijemeOd: "08:00:00",
                VrijemeDo: "09:00:00",
                Status: "zauzet",
            }),
        );
        (vehiclesHooks.useVehicleById as unknown as AnyHook).mockReturnValue(
            mockQuery({
                IdVozila: 10,
                IdOsobe: 1,
                Marka: "VW",
                Model: "Golf",
                Godina: 2018,
                VrstaMotora: "dizel",
                RegOznaka: "ZG-1234-AB",
            }),
        );
        (appointmentChangesHooks.useChangesForReservation as unknown as AnyHook).mockReturnValue(
            mockQuery([]),
        );
        (reservationsHooks.useApproveReservation as unknown as AnyHook).mockReturnValue(
            mockMutation(),
        );
        (reservationsHooks.useRejectReservation as unknown as AnyHook).mockReturnValue(
            mockMutation(),
        );
        (reservationsHooks.useCancelReservation as unknown as AnyHook).mockReturnValue(
            mockMutation(),
        );
        (reservationsHooks.useCompleteReservation as unknown as AnyHook).mockReturnValue(
            mockMutation(),
        );
    });

    it("renders reservation details with vehicle and appointment info", () => {
        (reservationsHooks.useReservationById as unknown as AnyHook).mockReturnValue(
            mockQuery(buildReservation()),
        );

        renderWithProviders(<ReservationDetailsPage />, {
            auth: { user: customerUser, isAuthenticated: true },
            route: "/reservations/100",
            routePath: "/reservations/:reservationId",
        });

        expect(screen.getByText(/Rezervacija #100/)).toBeInTheDocument();
        expect(screen.getByText("Curi ulje")).toBeInTheDocument();
        expect(screen.getByText(/VW Golf/)).toBeInTheDocument();
    });

    it("shows approve and reject actions for an employee on a pending reservation", () => {
        (reservationsHooks.useReservationById as unknown as AnyHook).mockReturnValue(
            mockQuery(buildReservation({ Status: "na cekanju" })),
        );

        renderWithProviders(<ReservationDetailsPage />, {
            auth: { user: employeeUser, isAuthenticated: true },
            route: "/reservations/100",
            routePath: "/reservations/:reservationId",
        });

        expect(screen.getByRole("button", { name: "Odobri" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Odbij" })).toBeInTheDocument();
    });

    it("shows the cancel action for the owner on an approved reservation", () => {
        (reservationsHooks.useReservationById as unknown as AnyHook).mockReturnValue(
            mockQuery(buildReservation({ Status: "odobrena" })),
        );

        renderWithProviders(<ReservationDetailsPage />, {
            auth: { user: customerUser, isAuthenticated: true },
            route: "/reservations/100",
            routePath: "/reservations/:reservationId",
        });

        expect(screen.getByRole("button", { name: "Otkaži rezervaciju" })).toBeInTheDocument();
    });

    it("hides employee actions when reservation is already completed", () => {
        (reservationsHooks.useReservationById as unknown as AnyHook).mockReturnValue(
            mockQuery(buildReservation({ Status: "zavrsena" })),
        );

        renderWithProviders(<ReservationDetailsPage />, {
            auth: { user: employeeUser, isAuthenticated: true },
            route: "/reservations/100",
            routePath: "/reservations/:reservationId",
        });

        expect(screen.queryByRole("button", { name: "Odobri" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Odbij" })).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Označi kao završenu" }),
        ).not.toBeInTheDocument();
    });
});
