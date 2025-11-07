const path = require("node:path");
const createConfig = require("../../jest.config.base.cjs");

module.exports = createConfig({
  rootDir: __dirname,
  displayName: "backend",
  tsconfig: path.resolve(__dirname, "tsconfig.json")
});
