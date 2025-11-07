import { render, screen } from "@testing-library/react";

import { App } from "./App";

describe("App", () => {
  it("renders the headline and status", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /saloom backoffice/i })).toBeVisible();
    expect(screen.getByText(/en construcción/i)).toBeVisible();
  });
});
