import { createServer } from "node:net";
import { defineConfig } from "@playwright/test";

async function findAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Unable to allocate a port for Playwright"));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

// The Playwright runner loads this config before forking test workers.
// Persist the selected port in the environment so workers use the same baseURL.
const port = process.env.PLAYWRIGHT_PORT
  ? Number(process.env.PLAYWRIGHT_PORT)
  : await findAvailablePort();
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PLAYWRIGHT_PORT must be a valid TCP port");
}
process.env.PLAYWRIGHT_PORT = String(port);

process.env.SNIPPETCANVAS_TEST_PORT = String(port);
const { default: loadedConfig } = await import("./packages/snippet-canvas/demo/playwright.config");

const snippetCanvas = "default" in loadedConfig ? loadedConfig.default : loadedConfig;

export default defineConfig({
  ...snippetCanvas,
  webServer: {
    ...snippetCanvas.webServer,
    command: `npm run dev:preview --workspace snippetcanvas -- --port ${port} --strictPort`,
  },
});
