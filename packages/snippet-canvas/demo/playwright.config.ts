import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const configDirectory = __dirname;

const port = Number(process.env.SNIPPETCANVAS_TEST_PORT);
if (!Number.isInteger(port) || port < 1) {
  throw new Error("Run Playwright through npm run demo:e2e so an available server port can be assigned.");
}
const baseURL = `http://127.0.0.1:${port}`;
const artifacts = path.join(configDirectory, "artifacts");
const isDemo = process.env.SNIPPETCANVAS_RECORD_DEMO === "true";
const slowMo = Number(process.env.SNIPPETCANVAS_SLOW_MO ?? 250);

export default defineConfig({
  testDir: configDirectory,
  testMatch: "*.spec.ts",
  grep: isDemo ? /@demo/ : undefined,
  grepInvert: isDemo ? undefined : /@demo/,
  outputDir: path.join(artifacts, "results"),
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: path.join(artifacts, "report"), open: "never" }]],
  use: {
    baseURL: `${baseURL}/webview-preview.html`,
    viewport: { width: 1600, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: isDemo ? { mode: "on", size: { width: 1600, height: 1000 } } : "retain-on-failure",
    launchOptions: { slowMo: isDemo && Number.isFinite(slowMo) ? Math.max(0, slowMo) : 0 },
  },
  expect: { timeout: 5_000 },
  webServer: {
    command: `npm run dev:preview -- --port ${port} --strictPort`,
    url: `${baseURL}/webview-preview.html`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1600, height: 1000 } } }],
});
