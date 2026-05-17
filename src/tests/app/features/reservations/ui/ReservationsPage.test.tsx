import { screen } from "@testing-library/react";
import { vi } from "vitest";
import { ReservationsPage } from "../../../../../app/features/reservations/ui/ReservationsPage";
import * as reservationsHooks from "../../../../../app/features/reservations/hooks/useReservations";
import * as vehiclesHooks from "../../../../../app/features/vehicles/hooks/useVehicles";
import * as appointmentChangesHooks from "../../../../../app/features/appointmentChanges/hooks/useAppointmentChanges";
import * as appointmentsApi from "../../../../../app/features/appointments/api/appointmentsApi";
import type { Reservation } from "../../../../../app/features/reservations/models/reservationTypes";
import { renderWithProviders } from "../../../../testUtils/renderWithProviders";

vi.mock("../../../../../app/features/reservations/hooks/useReservations", () => ({
    useReservationsByCustomer: vi.fn(),
    useAllReservations: vi.fn(),
}));

vi.mock("../../../../../app/features/vehicles/hooks/useVehicles", () => ({
    useVehiclesByCustomerId: vi.fn(),
}));

vi.mock("../../../../../app/features/appointmentChanges/hooks/useAppointmentChanges", () => ({
    useChangesForReservation: vi.fn(),
}));

vi.mock("../../../../../app/features/appointments/api/appointmentsApi", () => ({
    getAppointmentById: vi.fn(),
}));

const customerUser = {
    IdOsobe: 1,
    Ime: "Ana",
    Prezime: "Anic",
    Email: "ana@example.com",
    TipKorisnika: "customer" as const,
    Uloga: null,
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

describe("ReservationsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (reservationsHooks.useReservationsByCustomer as unknown as AnyHook).mockReturnValue(
            mockQuery<Reservation[]>([]),
        );
        (reservationsHooks.useAllReservations as unknown as AnyHook).mockReturnValue(
            mockQuery<Reservation[]>([]),
        );
        (vehiclesHooks.useVehiclesByCustomerId as unknown as AnyHook).mockReturnValue(
            mockQuery([]),
        );
        (appointmentChangesHooks.useChangesForReservation as unknown as AnyHook).mockReturnValue(
            mockQuery([]),
        );
        (appointmentsApi.getAppointmentById as unknown as AnyHook).mockResolvedValue({
            IdTermina: 1,
            Datum: "2026-06-15",
            VrijemeOd: "08:00:00",
            VrijemeDo: "09:00:00",
            Status: "zauzet",
        });
    });

    it("shows the empty state when the customer has no reservations", () => {
        renderWithProviders(<ReservationsPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        expect(screen.getByText("Nema rezervacija.")).toBeInTheDocument();
    });

    it("renders customer reservation list with problem description", () => {
        const reservations: Reservation[] = [
            {
                IdRezervacije: 1,
                DatumKreiranja: "2026-05-10",
                Status: "odobrena",
                KilometrazaVozila: 100000,
                OpisProblema: "Servis kočnica",
                KomentarZaposlenika: null,
                IdOsobe_Korisnik: 1,
                IdTermina: 1,
                IdVozila: 10,
                IdOsobe_Zaposlenik: null,
                services: [],
            },
        ];
        (reservationsHooks.useReservationsByCustomer as unknown as AnyHook).mockReturnValue(
            mockQuery(reservations),
        );

        renderWithProviders(<ReservationsPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        expect(screen.getByText("Servis kočnica")).toBeInTheDocument();
        expect(screen.getByText("Odobrena")).toBeInTheDocument();
    });

    it("shows the 'Nova rezervacija' link only for customers", () => {
        renderWithProviders(<ReservationsPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        expect(screen.getByRole("button", { name: "Nova rezervacija" })).toBeInTheDocument();
    });
});
