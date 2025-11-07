import { render } from "@testing-library/react-native";

import { App } from "../App";

describe("App (client)", () => {
  it("renders the marketing copy", () => {
    const { getByText } = render(<App />);

    expect(getByText(/saloom client/i)).toBeTruthy();
    expect(getByText(/experiencia móvil/i)).toBeTruthy();
  });
});
