import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { vi } from "vitest";
import { AppointmentForm } from "../../../../../app/features/appointments/ui/AppointmentForm";

function renderForm(overrides: Partial<ComponentProps<typeof AppointmentForm>> = {}) {
    const onSubmit = overrides.onSubmit ?? vi.fn().mockResolvedValue(undefined);
    const props = {
        onSubmit,
        submitLabel: "Spremi",
        submittingLabel: "Spremanje...",
        ...overrides,
    };
    return {
        onSubmit,
        ...render(<AppointmentForm {...props} />),
    };
}

describe("AppointmentForm", () => {
    it("renders date, time-from, and time-to fields", () => {
        renderForm();

        expect(screen.getByLabelText("Datum")).toBeInTheDocument();
        expect(screen.getByLabelText("Vrijeme od")).toBeInTheDocument();
        expect(screen.getByLabelText("Vrijeme do")).toBeInTheDocument();
        expect(screen.getByLabelText("Status")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Spremi" })).toBeInTheDocument();
    });

    it("submits valid values via onSubmit", async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderForm();

        await user.type(screen.getByLabelText("Datum"), "2026-06-15");
        await user.type(screen.getByLabelText("Vrijeme od"), "08:00");
        await user.type(screen.getByLabelText("Vrijeme do"), "09:00");

        await user.click(screen.getByRole("button", { name: "Spremi" }));

        expect(onSubmit).toHaveBeenCalledWith({
            Datum: "2026-06-15",
            VrijemeOd: "08:00",
            VrijemeDo: "09:00",
            Status: "slobodan",
        });
    });

    it("shows validation error when vrijemeDo is not after vrijemeOd", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        renderForm({ onSubmit });

        await user.type(screen.getByLabelText("Datum"), "2026-06-15");
        await user.type(screen.getByLabelText("Vrijeme od"), "10:00");
        await user.type(screen.getByLabelText("Vrijeme do"), "09:00");

        await user.click(screen.getByRole("button", { name: "Spremi" }));

        expect(
            await screen.findByText('Vrijeme "do" mora biti veće od vremena "od".'),
        ).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
