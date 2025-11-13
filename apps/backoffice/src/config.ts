const DEFAULT_API_BASE = "https://api.saloom.local";

const getViteEnv = () => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      return import.meta.env as Record<string, string | undefined>;
    }
  } catch {
    // ignored
  }
  return {};
};

const getProcessEnv = () => {
  if (typeof process !== "undefined" && process.env) {
    return process.env as Record<string, string | undefined>;
  }
  return {};
};

const viteEnv = getViteEnv();
const processEnv = getProcessEnv();

export const API_BASE_URL =
  viteEnv.VITE_API_BASE_URL ?? processEnv.VITE_API_BASE_URL ?? DEFAULT_API_BASE;

export const GOOGLE_MAPS_API_KEY =
  viteEnv.VITE_GOOGLE_MAPS_API_KEY ?? processEnv.VITE_GOOGLE_MAPS_API_KEY ?? "";

const countryCode =
  viteEnv.VITE_GOOGLE_MAPS_COUNTRY ?? processEnv.VITE_GOOGLE_MAPS_COUNTRY ?? "VE";

export const GOOGLE_MAPS_COUNTRY = countryCode.toUpperCase();
