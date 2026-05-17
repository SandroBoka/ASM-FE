import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { NotificationsPage } from "../../../../../app/features/notifications/ui/NotificationsPage";
import * as notificationsHooks from "../../../../../app/features/notifications/hooks/useNotifications";
import type { Notification } from "../../../../../app/features/notifications/models/notificationTypes";
import { renderWithProviders } from "../../../../testUtils/renderWithProviders";

vi.mock("../../../../../app/features/notifications/hooks/useNotifications", () => ({
    useNotifications: vi.fn(),
    useMarkNotificationAsRead: vi.fn(),
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

describe("NotificationsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (notificationsHooks.useNotifications as unknown as AnyHook).mockReturnValue(
            mockQuery<Notification[]>([]),
        );
        (notificationsHooks.useMarkNotificationAsRead as unknown as AnyHook).mockReturnValue(
            mockMutation(),
        );
    });

    it("shows the empty state when there are no notifications", () => {
        renderWithProviders(<NotificationsPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        expect(screen.getByText("Nemaš obavijesti.")).toBeInTheDocument();
    });

    it("renders the notification list with unread and read items", () => {
        const notifications: Notification[] = [
            {
                IdObavijesti: 1,
                Naslov: "Rezervacija odobrena",
                Tekst: "Tvoja rezervacija je odobrena.",
                DatumSlanja: "2026-05-10T10:00:00",
                Procitana: false,
                IdOsobe: 1,
                IdRezervacije: 7,
            },
            {
                IdObavijesti: 2,
                Naslov: "Rezervacija završena",
                Tekst: "Servis je gotov.",
                DatumSlanja: "2026-05-12T10:00:00",
                Procitana: true,
                IdOsobe: 1,
                IdRezervacije: 8,
            },
        ];
        (notificationsHooks.useNotifications as unknown as AnyHook).mockReturnValue(
            mockQuery(notifications),
        );

        renderWithProviders(<NotificationsPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        expect(screen.getByText("Rezervacija odobrena")).toBeInTheDocument();
        expect(screen.getByText("Rezervacija završena")).toBeInTheDocument();
    });

    it("calls the markAsRead mutation when clicking an unread notification", async () => {
        const user = userEvent.setup();
        const mutate = vi.fn();
        const notifications: Notification[] = [
            {
                IdObavijesti: 42,
                Naslov: "Nova obavijest",
                Tekst: "Tekst",
                DatumSlanja: "2026-05-10T10:00:00",
                Procitana: false,
                IdOsobe: 1,
                IdRezervacije: 7,
            },
        ];
        (notificationsHooks.useNotifications as unknown as AnyHook).mockReturnValue(
            mockQuery(notifications),
        );
        (notificationsHooks.useMarkNotificationAsRead as unknown as AnyHook).mockReturnValue(
            mockMutation({ mutate }),
        );

        renderWithProviders(<NotificationsPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        await user.click(screen.getByText("Nova obavijest"));

        expect(mutate).toHaveBeenCalledWith(42);
    });

    it("does not call the mutation when clicking a read notification", async () => {
        const user = userEvent.setup();
        const mutate = vi.fn();
        const notifications: Notification[] = [
            {
                IdObavijesti: 42,
                Naslov: "Procitana obavijest",
                Tekst: "Tekst",
                DatumSlanja: "2026-05-10T10:00:00",
                Procitana: true,
                IdOsobe: 1,
                IdRezervacije: 7,
            },
        ];
        (notificationsHooks.useNotifications as unknown as AnyHook).mockReturnValue(
            mockQuery(notifications),
        );
        (notificationsHooks.useMarkNotificationAsRead as unknown as AnyHook).mockReturnValue(
            mockMutation({ mutate }),
        );

        renderWithProviders(<NotificationsPage />, {
            auth: { user: customerUser, isAuthenticated: true },
        });

        await user.click(screen.getByText("Procitana obavijest"));

        expect(mutate).not.toHaveBeenCalled();
    });
});
