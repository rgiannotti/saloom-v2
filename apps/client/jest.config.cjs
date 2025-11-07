const path = require("node:path");

const rootSetup = path.resolve(__dirname, "../../jest.setup.cjs");

module.exports = {
  preset: "jest-expo",
  rootDir: __dirname,
  watchman: false,
  testMatch: ["<rootDir>/src/**/*.(spec|test).(ts|tsx)"],
  setupFilesAfterEnv: [rootSetup, "@testing-library/jest-native/extend-expect"],
  moduleNameMapper: {
    "^@saloom/ui/(.*)$": path.resolve(__dirname, "../../packages/ui/src/$1"),
    "^@saloom/config/(.*)$": path.resolve(__dirname, "../../packages/config/src/$1")
  },
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": [
      "babel-jest",
      {
        presets: ["babel-preset-expo"]
      }
    ]
  },
  transformIgnorePatterns: [
    "node_modules/(?!((?:\\.pnpm/[^/]+/node_modules/)?((jest-)?react-native|@react-native|@react-native-community|react-native-svg|expo(nent)?|@expo|expo-.*|@unimodules|@testing-library|react-test-renderer))/)"]
};
