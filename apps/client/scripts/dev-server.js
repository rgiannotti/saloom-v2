#!/usr/bin/env node

const { spawn } = require("node:child_process");
const path = require("node:path");

const DEFAULT_PORT = 19000;
const envPort = process.env.EXPO_PUBLIC_PORT || process.env.PORT;
const parsed = Number(envPort);
const port = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;

const expoCli = require.resolve("expo/bin/cli.js");
const args = ["start", "--clear", "--port", String(port)];

const child = spawn(process.execPath, [expoCli, ...args], {
  cwd: path.resolve(__dirname, ".."),
  stdio: "inherit"
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
