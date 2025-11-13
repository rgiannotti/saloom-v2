import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Saloom Client",
  slug: "saloom-client",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "saloomclient",
  userInterfaceStyle: "light",
  platforms: ["ios", "android", "web"],
  jsEngine: "hermes",
  updates: {
    enabled: true
  },
  assetBundlePatterns: ["**/*"],
  extra: {
    EXPO_PUBLIC_API_BASE_URL: "http://localhost:3000",
    EXPO_PUBLIC_SOCKET_URL: "http://localhost:3000",
    EXPO_PUBLIC_ENV: "dev"
  }
};

export default config;
