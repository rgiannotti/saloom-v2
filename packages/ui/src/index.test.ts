import { placeholderComponent } from "./index";

describe("placeholderComponent", () => {
  it("builds a friendly message with the provided name", () => {
    expect(placeholderComponent("Botón")).toBe("Botón compartido listo.");
  });

  it("falls back to the default name", () => {
    expect(placeholderComponent()).toBe("Componente compartido listo.");
  });
});
