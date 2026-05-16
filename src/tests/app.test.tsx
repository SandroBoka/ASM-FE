import { render, screen } from "@testing-library/react";
import App from "../app/App";

describe("App", () => {
    it("renders the login screen for an anonymous user", async () => {
        render(<App />);

        expect(await screen.findByRole("heading", { name: "Prijava" })).toBeInTheDocument();
    });
});
