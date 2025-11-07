const path = require("node:path");
const createConfig = require("../../jest.config.base.cjs");

const baseConfig = createConfig({
  rootDir: __dirname,
  displayName: "backoffice",
  tsconfig: path.resolve(__dirname, "tsconfig.json")
});

module.exports = {
  ...baseConfig,
  testEnvironment: "jsdom",
  setupFilesAfterEnv: [
    ...baseConfig.setupFilesAfterEnv,
    path.resolve(__dirname, "jest.setup.cjs")
  ]
};
