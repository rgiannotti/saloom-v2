import React from "react";
import { render, screen } from "@testing-library/react";

import { App } from "./App";

jest.mock("./auth/AuthProvider", () => {
  const actual = jest.requireActual("./auth/AuthProvider");
  return {
    ...(actual as object),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: () => ({
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      token: null
    })
  };
});

describe("App routing", () => {
  it("shows login page by default", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /backoffice saloom/i })).toBeInTheDocument();
  });
});
