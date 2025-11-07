import { render } from "@testing-library/react-native";

import { App } from "../App";

describe("App (user)", () => {
  it("shows the marketing copy", () => {
    const { getByText } = render(<App />);

    expect(getByText(/saloom user/i)).toBeTruthy();
    expect(getByText(/experiencia móvil/i)).toBeTruthy();
  });
});
