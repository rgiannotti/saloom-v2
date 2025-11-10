import React from "react";

import { useTheme } from "../theme/ThemeProvider";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button type="button" className="ghost-button" onClick={toggleTheme}>
      {theme === "light" ? "🌙 Modo oscuro" : "☀️ Modo claro"}
    </button>
  );
};
