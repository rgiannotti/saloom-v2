import Constants from "expo-constants";

const DEFAULT_API_BASE = "https://api.saloom.local";

const expoExtra = Constants?.expoConfig?.extra as Record<string, unknown> | undefined;
const extraApiBase =
  typeof expoExtra?.["EXPO_PUBLIC_API_BASE_URL"] === "string"
    ? (expoExtra["EXPO_PUBLIC_API_BASE_URL"] as string)
    : undefined;

const envApiBase =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  undefined;

export const API_BASE_URL = extraApiBase ?? envApiBase ?? DEFAULT_API_BASE;
