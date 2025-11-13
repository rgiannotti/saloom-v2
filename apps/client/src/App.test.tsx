import { render } from "@testing-library/react-native";

import { App } from "../App";

jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      apiBaseUrl: "https://api.saloom.test"
    }
  }
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined)
}));

describe("App (client)", () => {
  it("renders the login form by default", () => {
    const { getByText } = render(<App />);

    expect(getByText(/Ingreso para profesionales/i)).toBeTruthy();
    expect(
      getByText(/Solo usuarios PRO con un cliente asignado pueden continuar/i)
    ).toBeTruthy();
  });
});
