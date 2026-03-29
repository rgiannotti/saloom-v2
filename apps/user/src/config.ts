import Constants from "expo-constants";

const DEFAULT_API_BASE = "https://api.saloom.local";

// expo-constants resolves extra from app.config.ts — works in SDK 48
const extra = (Constants.expoConfig?.extra ?? (Constants as any).manifest?.extra ?? {}) as Record<string, unknown>;

const envApiBase =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  undefined;

export const API_BASE_URL =
  typeof extra["EXPO_PUBLIC_API_BASE_URL"] === "string"
    ? extra["EXPO_PUBLIC_API_BASE_URL"]
    : envApiBase ?? DEFAULT_API_BASE;

export const GOOGLE_MAPS_API_KEY =
  typeof extra["EXPO_PUBLIC_GOOGLE_MAPS_API_KEY"] === "string"
    ? extra["EXPO_PUBLIC_GOOGLE_MAPS_API_KEY"]
    : "";
