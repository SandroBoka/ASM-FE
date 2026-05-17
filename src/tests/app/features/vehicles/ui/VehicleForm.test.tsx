import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { vi } from "vitest";
import { VehicleForm } from "../../../../../app/features/vehicles/ui/VehicleForm";

function renderForm(overrides: Partial<ComponentProps<typeof VehicleForm>> = {}) {
    const onSubmit = overrides.onSubmit ?? vi.fn().mockResolvedValue(undefined);
    const props = {
        onSubmit,
        submitLabel: "Spremi",
        submittingLabel: "Spremanje...",
        ...overrides,
    };
    return {
        onSubmit,
        ...render(<VehicleForm {...props} />),
    };
}

describe("VehicleForm", () => {
    it("renders all fields", () => {
        renderForm();

        expect(screen.getByLabelText("Marka")).toBeInTheDocument();
        expect(screen.getByLabelText("Model")).toBeInTheDocument();
        expect(screen.getByLabelText("Godina")).toBeInTheDocument();
        expect(screen.getByLabelText("Vrsta motora")).toBeInTheDocument();
        expect(screen.getByLabelText("Registarska oznaka")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Spremi" })).toBeInTheDocument();
    });

    it("submits trimmed and uppercased values on valid input", async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderForm();

        await user.type(screen.getByLabelText("Marka"), " Volkswagen ");
        await user.type(screen.getByLabelText("Model"), " Golf ");
        await user.type(screen.getByLabelText("Godina"), "2018");
        await user.type(screen.getByLabelText("Vrsta motora"), "dizel");
        await user.type(screen.getByLabelText("Registarska oznaka"), "zg-1234-ab");

        await user.click(screen.getByRole("button", { name: "Spremi" }));

        expect(onSubmit).toHaveBeenCalledWith({
            Marka: "Volkswagen",
            Model: "Golf",
            Godina: 2018,
            VrstaMotora: "dizel",
            RegOznaka: "ZG-1234-AB",
        });
    });

    it("shows validation error when year is out of range", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        const { container } = renderForm({ onSubmit });

        await user.type(screen.getByLabelText("Marka"), "VW");
        await user.type(screen.getByLabelText("Model"), "Golf");
        await user.type(screen.getByLabelText("Godina"), "1500");
        await user.type(screen.getByLabelText("Vrsta motora"), "dizel");
        await user.type(screen.getByLabelText("Registarska oznaka"), "ZG-1");

        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        expect(await screen.findByText("Godina mora biti između 1900 i 2100.")).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("renders the cancel button when onCancel is provided", async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();
        renderForm({ onCancel });

        const cancelButton = screen.getByRole("button", { name: "Odustani" });
        await user.click(cancelButton);

        expect(onCancel).toHaveBeenCalled();
    });
});
