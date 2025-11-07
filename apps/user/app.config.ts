import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Saloom User",
  slug: "saloom-user",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "saloomuser",
  userInterfaceStyle: "automatic",
  platforms: ["ios", "android", "web"],
  jsEngine: "hermes",
  updates: {
    enabled: true
  },
  assetBundlePatterns: ["**/*"]
};

export default config;
