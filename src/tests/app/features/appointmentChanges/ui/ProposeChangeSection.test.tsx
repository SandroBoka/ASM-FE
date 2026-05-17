import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ProposeChangeSection } from "../../../../../app/features/appointmentChanges/ui/ProposeChangeSection";
import * as appointmentsHooks from "../../../../../app/features/appointments/hooks/useAppointments";
import * as appointmentChangesHooks from "../../../../../app/features/appointmentChanges/hooks/useAppointmentChanges";
import type { Appointment } from "../../../../../app/features/appointments/models/appointmentTypes";
import type { Reservation } from "../../../../../app/features/reservations/models/reservationTypes";
import { renderWithProviders } from "../../../../testUtils/renderWithProviders";

vi.mock("../../../../../app/features/appointments/hooks/useAppointments", () => ({
    useFreeAppointments: vi.fn(),
}));

vi.mock("../../../../../app/features/appointmentChanges/hooks/useAppointmentChanges", () => ({
    useCreateAppointmentChange: vi.fn(),
}));

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

const reservation: Reservation = {
    IdRezervacije: 100,
    DatumKreiranja: "2026-05-10",
    Status: "odobrena",
    KilometrazaVozila: 50000,
    OpisProblema: "Test",
    KomentarZaposlenika: null,
    IdOsobe_Korisnik: 1,
    IdTermina: 5,
    IdVozila: 10,
    IdOsobe_Zaposlenik: null,
    services: [],
};

const freeAppointments: Appointment[] = [
    {
        IdTermina: 8,
        Datum: "2026-06-20",
        VrijemeOd: "08:00:00",
        VrijemeDo: "09:00:00",
        Status: "slobodan",
    },
];

describe("ProposeChangeSection", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (appointmentsHooks.useFreeAppointments as unknown as AnyHook).mockReturnValue(
            mockQuery(freeAppointments),
        );
        (appointmentChangesHooks.useCreateAppointmentChange as unknown as AnyHook).mockReturnValue(
            mockMutation(),
        );
    });

    it("renders the propose action button initially", () => {
        renderWithProviders(<ProposeChangeSection reservation={reservation} />, {
            auth: {
                user: {
                    IdOsobe: 1,
                    Ime: "Ana",
                    Prezime: "Anic",
                    Email: "a@a",
                    TipKorisnika: "customer",
                    Uloga: null,
                },
                isAuthenticated: true,
            },
        });

        expect(
            screen.getByRole("button", { name: "Predloži promjenu termina" }),
        ).toBeInTheDocument();
    });

    it("opens the form and shows free appointments after clicking the propose button", async () => {
        const user = userEvent.setup();
        renderWithProviders(<ProposeChangeSection reservation={reservation} />, {
            auth: {
                user: {
                    IdOsobe: 1,
                    Ime: "Ana",
                    Prezime: "Anic",
                    Email: "a@a",
                    TipKorisnika: "customer",
                    Uloga: null,
                },
                isAuthenticated: true,
            },
        });

        await user.click(screen.getByRole("button", { name: "Predloži promjenu termina" }));

        expect(screen.getByLabelText("Datum od")).toBeInTheDocument();
        expect(screen.getByLabelText("Datum do")).toBeInTheDocument();
        expect(screen.getByText("20.06.2026.")).toBeInTheDocument();
    });

    it("submits the new appointment id via the create mutation", async () => {
        const user = userEvent.setup();
        const mutateAsync = vi.fn().mockResolvedValue(undefined);
        (appointmentChangesHooks.useCreateAppointmentChange as unknown as AnyHook).mockReturnValue(
            mockMutation({ mutateAsync }),
        );

        renderWithProviders(<ProposeChangeSection reservation={reservation} />, {
            auth: {
                user: {
                    IdOsobe: 1,
                    Ime: "Ana",
                    Prezime: "Anic",
                    Email: "a@a",
                    TipKorisnika: "customer",
                    Uloga: null,
                },
                isAuthenticated: true,
            },
        });

        await user.click(screen.getByRole("button", { name: "Predloži promjenu termina" }));

        await user.click(screen.getByText("20.06.2026."));
        await user.click(screen.getByRole("button", { name: "Pošalji zahtjev" }));

        await waitFor(() => {
            expect(mutateAsync).toHaveBeenCalledWith({
                IdRezervacije: 100,
                IdNovogTermina: 8,
            });
        });
    });
});
