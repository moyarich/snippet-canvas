import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "node:net";

/** Ask the operating system for an unused local port. */
function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : undefined;
      server.close((error) => (error || !port ? reject(error ?? new Error("No test port available")) : resolve(port)));
    });
  });
}

const port = await findAvailablePort();
const args = process.argv.slice(2);
const demoIndex = args.indexOf("--demo");
const isDemo = demoIndex >= 0;
if (isDemo) args.splice(demoIndex, 1);
const cli = createRequire(import.meta.url).resolve("@playwright/test/cli");
const child = spawn(process.execPath, [cli, "test", "-c", "demo/playwright.config.ts", ...args], {
  cwd: new URL("..", import.meta.url),
  env: {
    ...process.env,
    SNIPPETCANVAS_TEST_PORT: String(port),
    SNIPPETCANVAS_RECORD_DEMO: String(isDemo),
  },
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = signal ? 1 : (code ?? 1);
});
