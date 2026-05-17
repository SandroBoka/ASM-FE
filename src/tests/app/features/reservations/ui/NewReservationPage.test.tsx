import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { NewReservationPage } from "../../../../../app/features/reservations/ui/NewReservationPage";
import * as appointmentsHooks from "../../../../../app/features/appointments/hooks/useAppointments";
import * as vehiclesHooks from "../../../../../app/features/vehicles/hooks/useVehicles";
import * as servicesHooks from "../../../../../app/features/services/hooks/useServices";
import * as reservationsHooks from "../../../../../app/features/reservations/hooks/useReservations";
import type { Appointment } from "../../../../../app/features/appointments/models/appointmentTypes";
import type { Vehicle } from "../../../../../app/features/vehicles/models/vehicleTypes";
import type { Service } from "../../../../../app/features/services/models/serviceTypes";
import { renderWithProviders } from "../../../../testUtils/renderWithProviders";

vi.mock("../../../../../app/features/appointments/hooks/useAppointments", () => ({
    useFreeAppointments: vi.fn(),
}));

vi.mock("../../../../../app/features/vehicles/hooks/useVehicles", () => ({
    useVehiclesByCustomerId: vi.fn(),
}));

vi.mock("../../../../../app/features/services/hooks/useServices", () => ({
    useServices: vi.fn(),
}));

vi.mock("../../../../../app/features/reservations/hooks/useReservations", () => ({
    useCreateReservation: vi.fn(),
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

function mockMutation(overrides: Record<string, unknown> = {}) {
    return {
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue(undefined),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
        reset: vi.fn(),
        ...overrides,
    };
}

const appointments: Appointment[] = [
    {
        IdTermina: 1,
        Datum: "2026-06-15",
        VrijemeOd: "08:00:00",
        VrijemeDo: "09:00:00",
        Status: "slobodan",
    },
    {
        IdTermina: 2,
        Datum: "2026-06-16",
        VrijemeOd: "10:00:00",
        VrijemeDo: "11:00:00",
        Status: "slobodan",
    },
];

const vehicles: Vehicle[] = [
    {
        IdVozila: 10,
        IdOsobe: 1,
        Marka: "VW",
        Model: "Golf",
        Godina: 2018,
        VrstaMotora: "dizel",
        RegOznaka: "ZG-1234-AB",
    },
];

const services: Service[] = [
    {
        IdUsluge: 7,
        NazivUsluge: "Zamjena ulja",
        Opis: "Servis",
        Trajanje: 30,
        Cijena: "50.00",
    },
];

function setupDefaultMocks() {
    (appointmentsHooks.useFreeAppointments as unknown as AnyHook).mockReturnValue(
        mockQuery(appointments),
    );
    (vehiclesHooks.useVehiclesByCustomerId as unknown as AnyHook).mockReturnValue(
        mockQuery(vehicles),
    );
    (servicesHooks.useServices as unknown as AnyHook).mockReturnValue(mockQuery(services));
    (reservationsHooks.useCreateReservation as unknown as AnyHook).mockReturnValue(mockMutation());
}

describe("NewReservationPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupDefaultMocks();
    });

    it("shows free appointments and disables 'Dalje' until an appointment is picked", () => {
        renderWithProviders(<NewReservationPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        expect(screen.getByText("15.06.2026.")).toBeInTheDocument();
        expect(screen.getByText("16.06.2026.")).toBeInTheDocument();

        const nextButton = screen.getByRole("button", { name: "Dalje" });
        expect(nextButton).toBeDisabled();
    });

    it("advances to step 2 after selecting an appointment and clicking 'Dalje'", async () => {
        const user = userEvent.setup();
        renderWithProviders(<NewReservationPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        await user.click(screen.getByText("15.06.2026."));
        await user.click(screen.getByRole("button", { name: "Dalje" }));

        expect(screen.getByRole("heading", { name: "Odabir vozila" })).toBeInTheDocument();
        expect(screen.getByText(/VW Golf/)).toBeInTheDocument();
    });

    it("validates kilometers and description on step 3", async () => {
        const user = userEvent.setup();
        renderWithProviders(<NewReservationPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        // step 1 -> step 2
        await user.click(screen.getByText("15.06.2026."));
        await user.click(screen.getByRole("button", { name: "Dalje" }));

        // step 2 -> step 3
        await user.click(screen.getByRole("button", { name: "Odaberi" }));
        await user.click(screen.getByRole("button", { name: "Dalje" }));

        // empty description -> validation
        const kmInput = screen.getByLabelText("Kilometraža vozila");
        await user.type(kmInput, "100000");
        await user.click(screen.getByRole("button", { name: "Dalje" }));

        expect(await screen.findByText("Opis problema je obavezan.")).toBeInTheDocument();
    });

    it("calls createReservation.mutateAsync with the full payload on final submit", async () => {
        const user = userEvent.setup();
        const mutateAsync = vi.fn().mockResolvedValue({ IdRezervacije: 1 });
        (reservationsHooks.useCreateReservation as unknown as AnyHook).mockReturnValue(
            mockMutation({ mutateAsync }),
        );

        renderWithProviders(<NewReservationPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        // step 1
        await user.click(screen.getByText("15.06.2026."));
        await user.click(screen.getByRole("button", { name: "Dalje" }));

        // step 2
        await user.click(screen.getByRole("button", { name: "Odaberi" }));
        await user.click(screen.getByRole("button", { name: "Dalje" }));

        // step 3
        await user.type(screen.getByLabelText("Kilometraža vozila"), "100000");
        await user.type(screen.getByLabelText("Opis problema"), "Curi ulje");
        await user.click(screen.getByRole("button", { name: "Dalje" }));

        // step 4 (skip choosing services)
        await user.click(screen.getByRole("button", { name: "Dalje" }));

        // step 5: submit
        await user.click(screen.getByRole("button", { name: "Potvrdi rezervaciju" }));

        await waitFor(() => {
            expect(mutateAsync).toHaveBeenCalledWith({
                IdOsobe_Korisnik: 1,
                IdTermina: 1,
                IdVozila: 10,
                KilometrazaVozila: 100000,
                OpisProblema: "Curi ulje",
                services: [],
            });
        });
    });
});
