import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Saloom Client",
  slug: "saloom-client",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "saloomclient",
  userInterfaceStyle: "automatic",
  platforms: ["ios", "android", "web"],
  jsEngine: "hermes",
  updates: {
    enabled: true
  },
  assetBundlePatterns: ["**/*"]
};

export default config;
