import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { AdminAppointmentsPage } from "../../../../../app/features/appointments/ui/AdminAppointmentsPage";
import * as appointmentsHooks from "../../../../../app/features/appointments/hooks/useAppointments";
import type { Appointment } from "../../../../../app/features/appointments/models/appointmentTypes";
import { renderWithProviders } from "../../../../testUtils/renderWithProviders";

vi.mock("../../../../../app/features/appointments/hooks/useAppointments", () => ({
    useAllAppointments: vi.fn(),
    useCreateAppointment: vi.fn(),
    useUpdateAppointment: vi.fn(),
    useDeleteAppointment: vi.fn(),
}));

const adminUser = {
    IdOsobe: 5,
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

describe("AdminAppointmentsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (appointmentsHooks.useAllAppointments as unknown as AnyHook).mockReturnValue(
            mockQuery<Appointment[]>([]),
        );
        (appointmentsHooks.useCreateAppointment as unknown as AnyHook).mockReturnValue(
            mockMutation(),
        );
        (appointmentsHooks.useUpdateAppointment as unknown as AnyHook).mockReturnValue(
            mockMutation(),
        );
        (appointmentsHooks.useDeleteAppointment as unknown as AnyHook).mockReturnValue(
            mockMutation(),
        );
    });

    it("shows the empty state when no appointments match the filter", () => {
        renderWithProviders(<AdminAppointmentsPage />, {
            auth: { user: adminUser, isAuthenticated: true },
        });

        expect(screen.getByText("Nema termina za odabrani filter.")).toBeInTheDocument();
    });

    it("renders appointments with status badges", async () => {
        const user = userEvent.setup();
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
                Status: "otkazan",
            },
        ];
        (appointmentsHooks.useAllAppointments as unknown as AnyHook).mockReturnValue(
            mockQuery(appointments),
        );

        renderWithProviders(<AdminAppointmentsPage />, {
            auth: { user: adminUser, isAuthenticated: true },
        });

        await user.selectOptions(screen.getByLabelText("Filter"), "all");

        expect(screen.getByText("Slobodan")).toBeInTheDocument();
        expect(screen.getByText("Otkazan")).toBeInTheDocument();
        expect(screen.getByText("15.06.2026.")).toBeInTheDocument();
        expect(screen.getByText("16.06.2026.")).toBeInTheDocument();
    });

    it("renders 'Dodaj termin' button for admin user", () => {
        renderWithProviders(<AdminAppointmentsPage />, {
            auth: { user: adminUser, isAuthenticated: true },
        });

        expect(screen.getByRole("button", { name: "Dodaj termin" })).toBeInTheDocument();
    });
});
