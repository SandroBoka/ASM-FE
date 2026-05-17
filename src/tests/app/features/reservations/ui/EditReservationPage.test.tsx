import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { EditReservationPage } from "../../../../../app/features/reservations/ui/EditReservationPage";
import * as reservationsHooks from "../../../../../app/features/reservations/hooks/useReservations";
import * as appointmentsHooks from "../../../../../app/features/appointments/hooks/useAppointments";
import * as servicesHooks from "../../../../../app/features/services/hooks/useServices";
import * as vehiclesHooks from "../../../../../app/features/vehicles/hooks/useVehicles";
import type { Reservation } from "../../../../../app/features/reservations/models/reservationTypes";
import { renderWithProviders } from "../../../../testUtils/renderWithProviders";

vi.mock("../../../../../app/features/reservations/hooks/useReservations", () => ({
    useReservationById: vi.fn(),
    useUpdateReservation: vi.fn(),
    useAddReservationService: vi.fn(),
    useUpdateReservationService: vi.fn(),
    useRemoveReservationService: vi.fn(),
}));

vi.mock("../../../../../app/features/appointments/hooks/useAppointments", () => ({
    useFreeAppointments: vi.fn(),
    useAppointmentById: vi.fn(),
}));

vi.mock("../../../../../app/features/services/hooks/useServices", () => ({
    useServices: vi.fn(),
}));

vi.mock("../../../../../app/features/vehicles/hooks/useVehicles", () => ({
    useVehiclesByCustomerId: vi.fn(),
}));

const customerUser = {
    IdOsobe: 7,
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
        reset: vi.fn(),
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
        ...overrides,
    };
}

const APPOINTMENT_CURRENT = {
    IdTermina: 11,
    Datum: "2026-06-15",
    VrijemeOd: "08:00:00",
    VrijemeDo: "09:00:00",
    Status: "zauzet" as const,
};

const APPOINTMENT_FREE = {
    IdTermina: 12,
    Datum: "2026-06-16",
    VrijemeOd: "10:00:00",
    VrijemeDo: "11:00:00",
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

const SERVICE_FILTER = {
    IdUsluge: 3,
    NazivUsluge: "Filter zraka",
    Opis: null,
    Trajanje: 15,
    Cijena: "40.00",
};

function buildReservation(overrides: Partial<Reservation> = {}): Reservation {
    return {
        IdRezervacije: 5,
        DatumKreiranja: "2026-05-10",
        Status: "na cekanju",
        KilometrazaVozila: 80000,
        OpisProblema: "Curi ulje",
        KomentarZaposlenika: null,
        IdOsobe_Korisnik: 7,
        IdTermina: 11,
        IdVozila: 21,
        IdOsobe_Zaposlenik: null,
        services: [
            { Kolicina: 1, service: SERVICE_OIL },
            { Kolicina: 1, service: SERVICE_BRAKES },
        ],
        ...overrides,
    };
}

function setupHooks(
    options: {
        reservation?: Reservation | undefined;
        updateMutateAsync?: ReturnType<typeof vi.fn>;
        addMutateAsync?: ReturnType<typeof vi.fn>;
        updateServiceMutateAsync?: ReturnType<typeof vi.fn>;
        removeMutateAsync?: ReturnType<typeof vi.fn>;
    } = {},
) {
    (reservationsHooks.useReservationById as unknown as AnyHook).mockReturnValue(
        mockQuery(options.reservation ?? buildReservation()),
    );
    (reservationsHooks.useUpdateReservation as unknown as AnyHook).mockReturnValue(
        mockMutation(options.updateMutateAsync ? { mutateAsync: options.updateMutateAsync } : {}),
    );
    (reservationsHooks.useAddReservationService as unknown as AnyHook).mockReturnValue(
        mockMutation(options.addMutateAsync ? { mutateAsync: options.addMutateAsync } : {}),
    );
    (reservationsHooks.useUpdateReservationService as unknown as AnyHook).mockReturnValue(
        mockMutation(
            options.updateServiceMutateAsync
                ? { mutateAsync: options.updateServiceMutateAsync }
                : {},
        ),
    );
    (reservationsHooks.useRemoveReservationService as unknown as AnyHook).mockReturnValue(
        mockMutation(options.removeMutateAsync ? { mutateAsync: options.removeMutateAsync } : {}),
    );
    (appointmentsHooks.useFreeAppointments as unknown as AnyHook).mockReturnValue(
        mockQuery([APPOINTMENT_FREE]),
    );
    (appointmentsHooks.useAppointmentById as unknown as AnyHook).mockReturnValue(
        mockQuery(APPOINTMENT_CURRENT),
    );
    (vehiclesHooks.useVehiclesByCustomerId as unknown as AnyHook).mockReturnValue(
        mockQuery([VEHICLE_GOLF]),
    );
    (servicesHooks.useServices as unknown as AnyHook).mockReturnValue(
        mockQuery([SERVICE_OIL, SERVICE_BRAKES, SERVICE_FILTER]),
    );
}

describe("EditReservationPage (master-detail form)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupHooks();
    });

    it("renders the master fields pre-populated and the detail table with existing services", () => {
        renderWithProviders(<EditReservationPage />, {
            auth: { user: customerUser, isAuthenticated: true },
            route: "/reservations/5/edit",
            routePath: "/reservations/:reservationId/edit",
        });

        expect(screen.getByLabelText("Kilometraža vozila")).toHaveValue(80000);
        expect(screen.getByLabelText("Opis problema")).toHaveValue("Curi ulje");

        // Detail table rows for the two existing services
        expect(screen.getByText("Zamjena ulja")).toBeInTheDocument();
        expect(screen.getByText("Pločice")).toBeInTheDocument();

        // The header-level "Dodaj uslugu" button (not in the mini-form yet)
        expect(screen.getByRole("button", { name: "Dodaj uslugu" })).toBeInTheDocument();
    });

    it("calls useUpdateReservation.mutateAsync with the header payload when submitting the master form", async () => {
        const user = userEvent.setup();
        const updateMutateAsync = vi.fn().mockResolvedValue(undefined);
        setupHooks({ updateMutateAsync });

        const { container } = renderWithProviders(<EditReservationPage />, {
            auth: { user: customerUser, isAuthenticated: true },
            route: "/reservations/5/edit",
            routePath: "/reservations/:reservationId/edit",
        });

        const km = screen.getByLabelText("Kilometraža vozila");
        await user.clear(km);
        await user.type(km, "90000");

        const desc = screen.getByLabelText("Opis problema");
        await user.clear(desc);
        await user.type(desc, "Servis prije ljeta");

        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(updateMutateAsync).toHaveBeenCalledWith({
                reservationId: 5,
                payload: {
                    IdTermina: 11,
                    IdVozila: 21,
                    KilometrazaVozila: 90000,
                    OpisProblema: "Servis prije ljeta",
                },
            });
        });
    });

    it("'Dodaj uslugu' opens the mini-form and submits useAddReservationService.mutateAsync with the chosen service", async () => {
        const user = userEvent.setup();
        const addMutateAsync = vi.fn().mockResolvedValue(undefined);
        setupHooks({ addMutateAsync });

        renderWithProviders(<EditReservationPage />, {
            auth: { user: customerUser, isAuthenticated: true },
            route: "/reservations/5/edit",
            routePath: "/reservations/:reservationId/edit",
        });

        // Open the inline add form via the header button
        await user.click(screen.getByRole("button", { name: "Dodaj uslugu" }));

        // The select inside the add row only lists services not already in the reservation
        const serviceSelect = screen.getByRole("combobox", { name: "Usluga" });
        // SERVICE_FILTER (IdUsluge 3) is the only one not already used
        await user.selectOptions(serviceSelect, "3");

        const quantityInput = screen.getByLabelText("Količina");
        fireEvent.change(quantityInput, { target: { value: "2" } });

        // Submit the inline add row (the button rendered inside the AddServiceRow)
        const addButtons = screen.getAllByRole("button", { name: "Dodaj uslugu" });
        // After opening, the header button is hidden; the only remaining is the submit one
        await user.click(addButtons[addButtons.length - 1]);

        await waitFor(() => {
            expect(addMutateAsync).toHaveBeenCalledWith({
                reservationId: 5,
                payload: { IdUsluge: 3, Kolicina: 2 },
            });
        });
    });

    it("'Uredi' on a service row enables inline edit and 'Spremi' calls useUpdateReservationService.mutateAsync", async () => {
        const user = userEvent.setup();
        const updateServiceMutateAsync = vi.fn().mockResolvedValue(undefined);
        setupHooks({ updateServiceMutateAsync });

        renderWithProviders(<EditReservationPage />, {
            auth: { user: customerUser, isAuthenticated: true },
            route: "/reservations/5/edit",
            routePath: "/reservations/:reservationId/edit",
        });

        // Click the first row's "Uredi" (there are two existing services)
        const editButtons = screen.getAllByRole("button", { name: "Uredi" });
        await user.click(editButtons[0]);

        const quantityInput = screen.getByLabelText("Količina");
        fireEvent.change(quantityInput, { target: { value: "3" } });

        // Inline "Spremi" button (NOT master "Spremi promjene")
        await user.click(screen.getByRole("button", { name: "Spremi" }));

        await waitFor(() => {
            expect(updateServiceMutateAsync).toHaveBeenCalledWith({
                reservationId: 5,
                serviceId: 1,
                payload: { Kolicina: 3 },
            });
        });
    });

    it("'Ukloni' calls useRemoveReservationService.mutateAsync with the correct service id", async () => {
        const user = userEvent.setup();
        const removeMutateAsync = vi.fn().mockResolvedValue(undefined);
        setupHooks({ removeMutateAsync });

        renderWithProviders(<EditReservationPage />, {
            auth: { user: customerUser, isAuthenticated: true },
            route: "/reservations/5/edit",
            routePath: "/reservations/:reservationId/edit",
        });

        const removeButtons = screen.getAllByRole("button", { name: "Ukloni" });
        // Second row -> SERVICE_BRAKES (IdUsluge 2)
        await user.click(removeButtons[1]);

        await waitFor(() => {
            expect(removeMutateAsync).toHaveBeenCalledWith({
                reservationId: 5,
                serviceId: 2,
            });
        });
    });

    it("shows the 'edit only pending' alert when the reservation status is not 'na cekanju'", () => {
        setupHooks({ reservation: buildReservation({ Status: "odobrena" }) });

        renderWithProviders(<EditReservationPage />, {
            auth: { user: customerUser, isAuthenticated: true },
            route: "/reservations/5/edit",
            routePath: "/reservations/:reservationId/edit",
        });

        expect(
            screen.getByText(
                "Uređivanje je moguće samo dok je rezervacija u statusu 'na čekanju'.",
            ),
        ).toBeInTheDocument();
        // The form must not be there
        expect(screen.queryByLabelText("Kilometraža vozila")).not.toBeInTheDocument();
    });

    it("shows the 'customer only' alert when an employee tries to edit a reservation", () => {
        setupHooks();

        renderWithProviders(<EditReservationPage />, {
            auth: { user: employeeUser, isAuthenticated: true },
            route: "/reservations/5/edit",
            routePath: "/reservations/:reservationId/edit",
        });

        expect(
            screen.getByText("Kreiranje rezervacija dostupno je samo korisnicima."),
        ).toBeInTheDocument();
        expect(screen.queryByLabelText("Kilometraža vozila")).not.toBeInTheDocument();
    });
});
