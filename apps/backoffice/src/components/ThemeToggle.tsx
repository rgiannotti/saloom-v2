import React from "react";

import { useTheme } from "../theme/ThemeProvider";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="icon-button icon-button--ghost"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
};
