import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { VehiclesPage } from "../../../../../app/features/vehicles/ui/VehiclesPage";
import * as vehiclesHooks from "../../../../../app/features/vehicles/hooks/useVehicles";
import type { Vehicle } from "../../../../../app/features/vehicles/models/vehicleTypes";
import { renderWithProviders } from "../../../../testUtils/renderWithProviders";

vi.mock("../../../../../app/features/vehicles/hooks/useVehicles", () => ({
    useVehiclesByCustomerId: vi.fn(),
    useCreateVehicle: vi.fn(),
    useUpdateVehicle: vi.fn(),
    useDeleteVehicle: vi.fn(),
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
        isError: false,
        error: null,
        ...overrides,
    };
}

describe("VehiclesPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (vehiclesHooks.useVehiclesByCustomerId as unknown as AnyHook).mockReturnValue(
            mockQuery<Vehicle[]>([]),
        );
        (vehiclesHooks.useCreateVehicle as unknown as AnyHook).mockReturnValue(mockMutation());
        (vehiclesHooks.useUpdateVehicle as unknown as AnyHook).mockReturnValue(mockMutation());
        (vehiclesHooks.useDeleteVehicle as unknown as AnyHook).mockReturnValue(mockMutation());
    });

    it("shows empty state when there are no vehicles", () => {
        renderWithProviders(<VehiclesPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        expect(screen.getByText(/Još nemaš registrirano nijedno vozilo/)).toBeInTheDocument();
    });

    it("renders the list of vehicles from the hook", () => {
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
        (vehiclesHooks.useVehiclesByCustomerId as unknown as AnyHook).mockReturnValue(
            mockQuery(vehicles),
        );

        renderWithProviders(<VehiclesPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        expect(screen.getByText(/VW/)).toBeInTheDocument();
        expect(screen.getByText(/Golf/)).toBeInTheDocument();
        expect(screen.getByText(/ZG-1234-AB/)).toBeInTheDocument();
    });

    it("opens the create form and calls the create mutation on submit", async () => {
        const user = userEvent.setup();
        const mutateAsync = vi.fn().mockResolvedValue({ IdVozila: 99 });
        (vehiclesHooks.useCreateVehicle as unknown as AnyHook).mockReturnValue(
            mockMutation({ mutateAsync }),
        );

        renderWithProviders(<VehiclesPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        await user.click(screen.getByRole("button", { name: "Dodaj vozilo" }));

        await user.type(screen.getByLabelText("Marka"), "VW");
        await user.type(screen.getByLabelText("Model"), "Polo");
        await user.type(screen.getByLabelText("Godina"), "2020");
        await user.type(screen.getByLabelText("Vrsta motora"), "benzin");
        await user.type(screen.getByLabelText("Registarska oznaka"), "ZG-9999-CD");

        await user.click(screen.getByRole("button", { name: "Spremi" }));

        await waitFor(() => {
            expect(mutateAsync).toHaveBeenCalledWith({
                IdOsobe: 1,
                Marka: "VW",
                Model: "Polo",
                Godina: 2020,
                VrstaMotora: "benzin",
                RegOznaka: "ZG-9999-CD",
            });
        });
    });

    it("shows the employee-only message for non-customer users", () => {
        renderWithProviders(<VehiclesPage />, {
            auth: {
                user: {
                    ...customerUser,
                    TipKorisnika: "employee",
                    Uloga: "admin",
                },
                isAuthenticated: true,
            },
        });

        expect(screen.getByText(/dostupna je samo korisnicima/)).toBeInTheDocument();
    });
});
