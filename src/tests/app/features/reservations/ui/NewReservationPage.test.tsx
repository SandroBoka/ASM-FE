import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { NewReservationPage } from "../../../../../app/features/reservations/ui/NewReservationPage";
import * as appointmentsHooks from "../../../../../app/features/appointments/hooks/useAppointments";
import * as reservationsHooks from "../../../../../app/features/reservations/hooks/useReservations";
import * as servicesHooks from "../../../../../app/features/services/hooks/useServices";
import * as vehiclesHooks from "../../../../../app/features/vehicles/hooks/useVehicles";
import { renderWithProviders } from "../../../../testUtils/renderWithProviders";

vi.mock("../../../../../app/features/appointments/hooks/useAppointments", () => ({
    useFreeAppointments: vi.fn(),
}));
vi.mock("../../../../../app/features/services/hooks/useServices", () => ({
    useServices: vi.fn(),
}));
vi.mock("../../../../../app/features/vehicles/hooks/useVehicles", () => ({
    useVehiclesByCustomerId: vi.fn(),
}));
vi.mock("../../../../../app/features/reservations/hooks/useReservations", () => ({
    useCreateReservation: vi.fn(),
}));

const customerUser = {
    IdOsobe: 7,
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
        reset: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
        ...overrides,
    };
}

const APPOINTMENT_60_MIN = {
    IdTermina: 11,
    Datum: "2026-06-15",
    VrijemeOd: "08:00:00",
    VrijemeDo: "09:00:00",
    Status: "slobodan" as const,
};

const VEHICLE_GOLF = {
    IdVozila: 21,
    IdOsobe: 7,
    Marka: "VW",
    Model: "Golf",
    Godina: 2018,
    VrstaMotora: "dizel",
    RegOznaka: "ZG-1234-AB",
};

const SERVICE_OIL = {
    IdUsluge: 1,
    NazivUsluge: "Zamjena ulja",
    Opis: null,
    Trajanje: 30,
    Cijena: "60.00",
};

const SERVICE_BRAKES = {
    IdUsluge: 2,
    NazivUsluge: "Pločice",
    Opis: null,
    Trajanje: 45,
    Cijena: "120.00",
};

function setupHooks(overrides: { createMutateAsync?: ReturnType<typeof vi.fn> } = {}) {
    (appointmentsHooks.useFreeAppointments as unknown as AnyHook).mockReturnValue(
        mockQuery([APPOINTMENT_60_MIN]),
    );
    (vehiclesHooks.useVehiclesByCustomerId as unknown as AnyHook).mockReturnValue(
        mockQuery([VEHICLE_GOLF]),
    );
    (servicesHooks.useServices as unknown as AnyHook).mockReturnValue(
        mockQuery([SERVICE_OIL, SERVICE_BRAKES]),
    );
    (reservationsHooks.useCreateReservation as unknown as AnyHook).mockReturnValue(
        mockMutation(
            overrides.createMutateAsync ? { mutateAsync: overrides.createMutateAsync } : {},
        ),
    );
}

describe("NewReservationPage (master-detail form)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupHooks();
    });

    it("renders header dropdowns and an empty detail section", () => {
        renderWithProviders(<NewReservationPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        expect(screen.getByLabelText("Termin")).toBeInTheDocument();
        expect(screen.getByLabelText("Vozilo")).toBeInTheDocument();
        expect(screen.getByLabelText("Kilometraža vozila")).toBeInTheDocument();
        expect(screen.getByLabelText("Opis problema")).toBeInTheDocument();
        expect(screen.getByText("Klikni 'Dodaj uslugu' za prvi redak.")).toBeInTheDocument();
    });

    it("flags missing appointment when submitting an empty form", async () => {
        const user = userEvent.setup();
        const { container } = renderWithProviders(<NewReservationPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        expect(await screen.findByText("Odaberi termin.")).toBeInTheDocument();

        await user.selectOptions(screen.getByLabelText("Termin"), "11");
        fireEvent.submit(form);
        expect(await screen.findByText("Odaberi vozilo.")).toBeInTheDocument();
    });

    it("blocks submit when services duration exceeds the chosen slot", async () => {
        const user = userEvent.setup();
        const { container } = renderWithProviders(<NewReservationPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        await user.selectOptions(screen.getByLabelText("Termin"), "11");
        await user.selectOptions(screen.getByLabelText("Vozilo"), "21");
        await user.type(screen.getByLabelText("Kilometraža vozila"), "120000");
        await user.type(screen.getByLabelText("Opis problema"), "Curi ulje");

        await user.click(screen.getByRole("button", { name: "Dodaj uslugu" }));
        await user.click(screen.getByRole("button", { name: "Dodaj uslugu" }));
        const serviceSelects = screen.getAllByRole("combobox", { name: "Usluga" });
        await user.selectOptions(serviceSelects[0], "1");
        await user.selectOptions(serviceSelects[1], "2");

        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        expect(
            await screen.findByText(/Odabrane usluge traju 75 min, a odabrani termin traje 60 min/),
        ).toBeInTheDocument();
    });

    it("submits the full payload to createReservation.mutateAsync", async () => {
        const user = userEvent.setup();
        const mutateAsync = vi.fn().mockResolvedValue(undefined);
        setupHooks({ createMutateAsync: mutateAsync });

        const { container } = renderWithProviders(<NewReservationPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        await user.selectOptions(screen.getByLabelText("Termin"), "11");
        await user.selectOptions(screen.getByLabelText("Vozilo"), "21");
        await user.type(screen.getByLabelText("Kilometraža vozila"), "98000");
        await user.type(screen.getByLabelText("Opis problema"), "Servis prije ljeta");

        await user.click(screen.getByRole("button", { name: "Dodaj uslugu" }));
        await user.selectOptions(screen.getByRole("combobox", { name: "Usluga" }), "1");

        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mutateAsync).toHaveBeenCalledWith({
                IdOsobe_Korisnik: 7,
                IdTermina: 11,
                IdVozila: 21,
                KilometrazaVozila: 98000,
                OpisProblema: "Servis prije ljeta",
                services: [{ IdUsluge: 1, Kolicina: 1 }],
            });
        });
    });
});
