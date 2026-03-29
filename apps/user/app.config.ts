import { ExpoConfig } from "expo/config";

const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "AIzaSyBBXArrZ8ydlcOJ0dtVTTGPaJCFAKdzpSc";

const config: ExpoConfig = {
  name: "Saloom User",
  slug: "saloom-user",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "saloomuser",
  userInterfaceStyle: "light",
  platforms: ["ios", "android", "web"],
  jsEngine: "hermes",
  web: {
    favicon: "./assets/favicon.png"
  },
  updates: {
    enabled: true
  },
  assetBundlePatterns: ["**/*"],
  extra: {
    EXPO_PUBLIC_API_BASE_URL: "http://localhost:3000",
    EXPO_PUBLIC_SOCKET_URL: "http://localhost:3000",
    EXPO_PUBLIC_ENV: "dev",
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_API_KEY
  },
  android: {
    package: "io.saloom.user",
    config: {
      googleMaps: {
        apiKey: GOOGLE_MAPS_API_KEY
      }
    }
  },
  ios: {
    bundleIdentifier: "io.saloom.user",
    config: {
      googleMapsApiKey: GOOGLE_MAPS_API_KEY
    }
  }
};

export default config;
