import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ServicesPage } from "../../../../../app/features/services/ui/ServicesPage";
import * as servicesHooks from "../../../../../app/features/services/hooks/useServices";
import type { Service } from "../../../../../app/features/services/models/serviceTypes";
import { renderWithProviders } from "../../../../testUtils/renderWithProviders";

vi.mock("../../../../../app/features/services/hooks/useServices", () => ({
    useServices: vi.fn(),
    useCreateService: vi.fn(),
    useUpdateService: vi.fn(),
    useDeleteService: vi.fn(),
}));

const employeeUser = {
    IdOsobe: 5,
    Ime: "Marko",
    Prezime: "Markic",
    Email: "marko@example.com",
    TipKorisnika: "employee" as const,
    Uloga: "admin" as const,
};

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

describe("ServicesPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (servicesHooks.useServices as unknown as AnyHook).mockReturnValue(mockQuery<Service[]>([]));
        (servicesHooks.useCreateService as unknown as AnyHook).mockReturnValue(mockMutation());
        (servicesHooks.useUpdateService as unknown as AnyHook).mockReturnValue(mockMutation());
        (servicesHooks.useDeleteService as unknown as AnyHook).mockReturnValue(mockMutation());
    });

    it("shows the empty state when no services exist", () => {
        renderWithProviders(<ServicesPage />, {
            auth: { user: employeeUser, isAuthenticated: true },
        });

        expect(screen.getByText("Još nije unesena nijedna usluga.")).toBeInTheDocument();
    });

    it("renders the service list from the hook", () => {
        const services: Service[] = [
            {
                IdUsluge: 1,
                NazivUsluge: "Zamjena ulja",
                Opis: "Brza zamjena ulja",
                Trajanje: 30,
                Cijena: "60.00",
            },
        ];
        (servicesHooks.useServices as unknown as AnyHook).mockReturnValue(mockQuery(services));

        renderWithProviders(<ServicesPage />, {
            auth: { user: employeeUser, isAuthenticated: true },
        });

        expect(screen.getByText("Zamjena ulja")).toBeInTheDocument();
        expect(screen.getByText("Brza zamjena ulja")).toBeInTheDocument();
    });

    it("opens the add form when the employee clicks 'Dodaj uslugu'", async () => {
        const user = userEvent.setup();

        renderWithProviders(<ServicesPage />, {
            auth: { user: employeeUser, isAuthenticated: true },
        });

        await user.click(screen.getByRole("button", { name: "Dodaj uslugu" }));

        expect(screen.getByLabelText("Naziv usluge")).toBeInTheDocument();
        expect(screen.getByLabelText("Trajanje (minute)")).toBeInTheDocument();
    });

    it("forwards the typed search term to the useServices hook", async () => {
        const user = userEvent.setup();
        const useServicesMock = servicesHooks.useServices as unknown as AnyHook;

        renderWithProviders(<ServicesPage />, {
            auth: { user: employeeUser, isAuthenticated: true },
        });

        await user.type(screen.getByLabelText("Pretraži"), "  ulja  ");

        expect(useServicesMock).toHaveBeenLastCalledWith("ulja");
    });

    it("shows the search-specific empty state when filtering returns nothing", async () => {
        const user = userEvent.setup();

        renderWithProviders(<ServicesPage />, {
            auth: { user: employeeUser, isAuthenticated: true },
        });

        await user.type(screen.getByLabelText("Pretraži"), "nepostojeca");

        expect(screen.getByText("Nijedna usluga ne odgovara pretrazi.")).toBeInTheDocument();
    });

    it("hides employee actions for customer users", () => {
        const services: Service[] = [
            {
                IdUsluge: 1,
                NazivUsluge: "Zamjena ulja",
                Opis: null,
                Trajanje: 30,
                Cijena: "60.00",
            },
        ];
        (servicesHooks.useServices as unknown as AnyHook).mockReturnValue(mockQuery(services));

        renderWithProviders(<ServicesPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        expect(screen.queryByRole("button", { name: "Dodaj uslugu" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Uredi" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Obriši" })).not.toBeInTheDocument();
    });
});
