import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { PendingReservationsPage } from "../../../../../app/features/reservations/ui/PendingReservationsPage";
import * as reservationsHooks from "../../../../../app/features/reservations/hooks/useReservations";
import * as appointmentChangesHooks from "../../../../../app/features/appointmentChanges/hooks/useAppointmentChanges";
import * as appointmentsApi from "../../../../../app/features/appointments/api/appointmentsApi";
import * as vehiclesApi from "../../../../../app/features/vehicles/api/vehiclesApi";
import * as personsApi from "../../../../../app/features/persons/api/personsApi";
import * as reservationsApi from "../../../../../app/features/reservations/api/reservationsApi";
import type { Reservation } from "../../../../../app/features/reservations/models/reservationTypes";
import type { AppointmentChange } from "../../../../../app/features/appointmentChanges/models/appointmentChangeTypes";
import { renderWithProviders } from "../../../../testUtils/renderWithProviders";

vi.mock("../../../../../app/features/reservations/hooks/useReservations", () => ({
    usePendingReservations: vi.fn(),
}));

vi.mock("../../../../../app/features/appointmentChanges/hooks/useAppointmentChanges", () => ({
    usePendingChanges: vi.fn(),
    useAcceptChange: vi.fn(),
    useRejectChange: vi.fn(),
}));

vi.mock("../../../../../app/features/appointments/api/appointmentsApi", () => ({
    getAppointmentById: vi.fn(),
}));

vi.mock("../../../../../app/features/vehicles/api/vehiclesApi", () => ({
    getVehicleById: vi.fn(),
}));

vi.mock("../../../../../app/features/persons/api/personsApi", () => ({
    getCustomerById: vi.fn(),
}));

vi.mock("../../../../../app/features/reservations/api/reservationsApi", () => ({
    getReservationById: vi.fn(),
}));

const adminUser = {
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

describe("PendingReservationsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (reservationsHooks.usePendingReservations as unknown as AnyHook).mockReturnValue(
            mockQuery<Reservation[]>([]),
        );
        (appointmentChangesHooks.usePendingChanges as unknown as AnyHook).mockReturnValue(
            mockQuery<AppointmentChange[]>([]),
        );
        (appointmentChangesHooks.useAcceptChange as unknown as AnyHook).mockReturnValue(
            mockMutation(),
        );
        (appointmentChangesHooks.useRejectChange as unknown as AnyHook).mockReturnValue(
            mockMutation(),
        );
        (appointmentsApi.getAppointmentById as unknown as AnyHook).mockResolvedValue({
            IdTermina: 1,
            Datum: "2026-06-15",
            VrijemeOd: "08:00:00",
            VrijemeDo: "09:00:00",
            Status: "zauzet",
        });
        (vehiclesApi.getVehicleById as unknown as AnyHook).mockResolvedValue({
            IdVozila: 10,
            IdOsobe: 1,
            Marka: "VW",
            Model: "Golf",
            Godina: 2018,
            VrstaMotora: "dizel",
            RegOznaka: "ZG-1234-AB",
        });
        (personsApi.getCustomerById as unknown as AnyHook).mockResolvedValue({
            IdOsobe: 1,
            Ime: "Ana",
            Prezime: "Anic",
            Email: "ana@example.com",
            Telefon: null,
        });
        (reservationsApi.getReservationById as unknown as AnyHook).mockResolvedValue({
            IdRezervacije: 200,
            DatumKreiranja: "2026-05-10",
            Status: "odobrena",
            KilometrazaVozila: 80000,
            OpisProblema: "Curi ulje",
            KomentarZaposlenika: null,
            IdOsobe_Korisnik: 1,
            IdTermina: 1,
            IdVozila: 10,
            IdOsobe_Zaposlenik: null,
            services: [],
        });
    });

    it("shows the empty state for both sections", () => {
        renderWithProviders(<PendingReservationsPage />, {
            auth: { user: adminUser, isAuthenticated: true },
        });

        expect(screen.getByText("Nema novih rezervacija za obradu.")).toBeInTheDocument();
        expect(screen.getByText("Nema zahtjeva za promjenu termina.")).toBeInTheDocument();
    });

    it("renders the list of pending reservations", async () => {
        const reservations: Reservation[] = [
            {
                IdRezervacije: 100,
                DatumKreiranja: "2026-05-10",
                Status: "na cekanju",
                KilometrazaVozila: 80000,
                OpisProblema: "Curi ulje",
                KomentarZaposlenika: null,
                IdOsobe_Korisnik: 1,
                IdTermina: 1,
                IdVozila: 10,
                IdOsobe_Zaposlenik: null,
                services: [],
            },
        ];
        (reservationsHooks.usePendingReservations as unknown as AnyHook).mockReturnValue(
            mockQuery(reservations),
        );

        renderWithProviders(<PendingReservationsPage />, {
            auth: { user: adminUser, isAuthenticated: true },
        });

        expect(screen.getByText("Curi ulje")).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText("Ana Anic")).toBeInTheDocument();
        });
    });

    it("invokes acceptChange mutation with the change id and comment", async () => {
        const user = userEvent.setup();
        const accept = vi.fn();
        const reject = vi.fn();
        const changes: AppointmentChange[] = [
            {
                IdZahtjevaPromjene: 55,
                DatumZahtjeva: "2026-05-10",
                Status: "na cekanju",
                KomentarZaposlenika: null,
                IdRezervacije: 200,
                IdStarogTermina: 1,
                IdNovogTermina: 2,
                IdOsobe_Zaposlenik: null,
            },
        ];
        (appointmentChangesHooks.usePendingChanges as unknown as AnyHook).mockReturnValue(
            mockQuery(changes),
        );
        (appointmentChangesHooks.useAcceptChange as unknown as AnyHook).mockReturnValue(
            mockMutation({ mutate: accept }),
        );
        (appointmentChangesHooks.useRejectChange as unknown as AnyHook).mockReturnValue(
            mockMutation({ mutate: reject }),
        );

        renderWithProviders(<PendingReservationsPage />, {
            auth: { user: adminUser, isAuthenticated: true },
        });

        await user.click(screen.getByRole("button", { name: "Prihvati promjenu" }));

        expect(accept).toHaveBeenCalledWith({
            changeId: 55,
            payload: { komentar: null },
        });
    });

    it("invokes rejectChange mutation when clicking 'Odbij promjenu'", async () => {
        const user = userEvent.setup();
        const accept = vi.fn();
        const reject = vi.fn();
        const changes: AppointmentChange[] = [
            {
                IdZahtjevaPromjene: 77,
                DatumZahtjeva: "2026-05-10",
                Status: "na cekanju",
                KomentarZaposlenika: null,
                IdRezervacije: 200,
                IdStarogTermina: 1,
                IdNovogTermina: 2,
                IdOsobe_Zaposlenik: null,
            },
        ];
        (appointmentChangesHooks.usePendingChanges as unknown as AnyHook).mockReturnValue(
            mockQuery(changes),
        );
        (appointmentChangesHooks.useAcceptChange as unknown as AnyHook).mockReturnValue(
            mockMutation({ mutate: accept }),
        );
        (appointmentChangesHooks.useRejectChange as unknown as AnyHook).mockReturnValue(
            mockMutation({ mutate: reject }),
        );

        renderWithProviders(<PendingReservationsPage />, {
            auth: { user: adminUser, isAuthenticated: true },
        });

        await user.click(screen.getByRole("button", { name: "Odbij promjenu" }));

        expect(reject).toHaveBeenCalledWith({
            changeId: 77,
            payload: { komentar: null },
        });
    });
});
