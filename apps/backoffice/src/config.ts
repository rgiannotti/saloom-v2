const DEFAULT_API_BASE = "https://api.saloom.local";

const fromViteEnv = (): string | undefined => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      return import.meta.env.VITE_API_BASE_URL as string | undefined;
    }
  } catch {
    // ignored: running in environments (e.g., Jest) where import.meta is not defined
  }
  return undefined;
};

const fromProcessEnv = (): string | undefined => {
  if (typeof process !== "undefined" && process.env) {
    return process.env.VITE_API_BASE_URL;
  }
  return undefined;
};

export const API_BASE_URL = fromViteEnv() ?? fromProcessEnv() ?? DEFAULT_API_BASE;
