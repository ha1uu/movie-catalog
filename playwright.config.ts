import { defineConfig } from "@playwright/test";
import process from "node:process";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: "chromium",
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "node tests/fixtures/tmdb-server.mjs",
      url: "http://127.0.0.1:4010/__health",
      reuseExistingServer: false,
    },
    {
      command: "node .output/server/index.mjs",
      url: "http://127.0.0.1:3100",
      env: {
        NITRO_HOST: "127.0.0.1",
        NITRO_PORT: "3100",
        NUXT_TMDB_READ_TOKEN: "tmdb-fixture-only",
        NUXT_TMDB_API_BASE: "http://127.0.0.1:4010/3",
      },
      reuseExistingServer: false,
    },
    {
      command: "node .output/server/index.mjs",
      url: "http://127.0.0.1:3101",
      env: {
        NITRO_HOST: "127.0.0.1",
        NITRO_PORT: "3101",
        NUXT_TMDB_READ_TOKEN: "",
      },
      reuseExistingServer: false,
    },
  ],
  reporter: "list",
});
