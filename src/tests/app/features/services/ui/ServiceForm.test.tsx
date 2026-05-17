import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { vi } from "vitest";
import { ServiceForm } from "../../../../../app/features/services/ui/ServiceForm";

function renderForm(overrides: Partial<ComponentProps<typeof ServiceForm>> = {}) {
    const onSubmit = overrides.onSubmit ?? vi.fn().mockResolvedValue(undefined);
    const props = {
        onSubmit,
        submitLabel: "Spremi",
        submittingLabel: "Spremanje...",
        ...overrides,
    };
    return {
        onSubmit,
        ...render(<ServiceForm {...props} />),
    };
}

describe("ServiceForm", () => {
    it("renders all fields", () => {
        renderForm();

        expect(screen.getByLabelText("Naziv usluge")).toBeInTheDocument();
        expect(screen.getByLabelText("Opis")).toBeInTheDocument();
        expect(screen.getByLabelText("Trajanje (minute)")).toBeInTheDocument();
        expect(screen.getByLabelText("Cijena (€)")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Spremi" })).toBeInTheDocument();
    });

    it("calls onSubmit with parsed numeric values and trimmed strings", async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderForm();

        await user.type(screen.getByLabelText("Naziv usluge"), "Zamjena ulja");
        await user.type(screen.getByLabelText("Opis"), "Cijela usluga");
        await user.type(screen.getByLabelText("Trajanje (minute)"), "60");
        await user.type(screen.getByLabelText("Cijena (€)"), "150");

        await user.click(screen.getByRole("button", { name: "Spremi" }));

        expect(onSubmit).toHaveBeenCalledWith({
            NazivUsluge: "Zamjena ulja",
            Opis: "Cijela usluga",
            Trajanje: 60,
            Cijena: 150,
        });
    });

    it("sends null for empty description", async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderForm();

        await user.type(screen.getByLabelText("Naziv usluge"), "Servis");
        await user.type(screen.getByLabelText("Trajanje (minute)"), "30");
        await user.type(screen.getByLabelText("Cijena (€)"), "50");

        await user.click(screen.getByRole("button", { name: "Spremi" }));

        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ Opis: null }));
    });

    it("rejects non-positive duration with validation error", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        const { container } = renderForm({ onSubmit });

        await user.type(screen.getByLabelText("Naziv usluge"), "Servis");
        await user.type(screen.getByLabelText("Trajanje (minute)"), "0");
        await user.type(screen.getByLabelText("Cijena (€)"), "100");

        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        expect(await screen.findByText("Trajanje mora biti veće od 0.")).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
