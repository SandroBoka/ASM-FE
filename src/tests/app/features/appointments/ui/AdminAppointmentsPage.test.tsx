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

    it("filters appointments by an exact date and can show all dates again when cleared", async () => {
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
                Status: "slobodan",
            },
        ];
        (appointmentsHooks.useAllAppointments as unknown as AnyHook).mockReturnValue(
            mockQuery(appointments),
        );

        renderWithProviders(<AdminAppointmentsPage />, {
            auth: { user: adminUser, isAuthenticated: true },
        });

        await user.type(screen.getByLabelText("Datum termina"), "2026-06-16");

        expect(screen.queryByText("15.06.2026.")).not.toBeInTheDocument();
        expect(screen.getByText("16.06.2026.")).toBeInTheDocument();

        await user.clear(screen.getByLabelText("Datum termina"));

        expect(screen.getByText("15.06.2026.")).toBeInTheDocument();
        expect(screen.getByText("16.06.2026.")).toBeInTheDocument();
    });

    it("renders 'Dodaj termin' button for admin user", () => {
        renderWithProviders(<AdminAppointmentsPage />, {
            auth: { user: adminUser, isAuthenticated: true },
        });

        expect(screen.getByRole("button", { name: "Dodaj termin" })).toBeInTheDocument();
    });

    it("creates one-hour free appointments for a full working day from the add form", async () => {
        const user = userEvent.setup();
        const createMutation = mockMutation();
        (appointmentsHooks.useCreateAppointment as unknown as AnyHook).mockReturnValue(
            createMutation,
        );

        renderWithProviders(<AdminAppointmentsPage />, {
            auth: { user: adminUser, isAuthenticated: true },
        });

        await user.click(screen.getByRole("button", { name: "Dodaj termin" }));
        await user.type(screen.getByLabelText("Datum"), "2026-06-15");
        await user.click(screen.getByRole("checkbox", { name: /Cijeli radni dan slobodan/ }));
        await user.click(screen.getByRole("button", { name: "Spremi" }));

        expect(createMutation.mutateAsync).toHaveBeenCalledTimes(12);
        expect(createMutation.mutateAsync).toHaveBeenNthCalledWith(1, {
            Datum: "2026-06-15",
            VrijemeOd: "08:00",
            VrijemeDo: "09:00",
            Status: "slobodan",
        });
        expect(createMutation.mutateAsync).toHaveBeenNthCalledWith(12, {
            Datum: "2026-06-15",
            VrijemeOd: "19:00",
            VrijemeDo: "20:00",
            Status: "slobodan",
        });
    });
});
