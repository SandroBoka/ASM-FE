import { render, screen } from "@testing-library/react";
import App from "../app/App";

describe("App", () => {
    it("renders the ASM application title", () => {
        render(<App />);

        expect(screen.getByRole("heading", { name: "ASM Auto Servis" })).toBeInTheDocument();
    });
});
