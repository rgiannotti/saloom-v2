const path = require("node:path");

module.exports = ({ rootDir, displayName, tsconfig }) => ({
  displayName,
  rootDir,
  preset: "ts-jest",
  testEnvironment: "node",
  watchman: false,
  setupFilesAfterEnv: [path.resolve(__dirname, "jest.setup.cjs")],
  testMatch: ["<rootDir>/src/**/*.(spec|test).(ts|tsx)"],
  moduleNameMapper: {
    "^@saloom/ui/(.*)$": path.resolve(__dirname, "packages/ui/src/$1"),
    "^@saloom/config/(.*)$": path.resolve(__dirname, "packages/config/src/$1"),
    "^.+\\.(css|scss|sass)$": "identity-obj-proxy"
  },
  transform: {
    "^.+\\.(t|j)sx?$": [
      "ts-jest",
      {
        tsconfig
      }
    ]
  }
});
