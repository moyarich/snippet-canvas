import { createServer } from "node:net";
import { defineConfig } from "@playwright/test";

const port = process.env.SNIPPETCANVAS_DOCS_PORT ? Number(process.env.SNIPPETCANVAS_DOCS_PORT) : await new Promise<number>((resolve, reject) => {
  const server = createServer();
  server.on("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    if (!address || typeof address === "string") return reject(new Error("No test port"));
    server.close((error) => error ? reject(error) : resolve(address.port));
  });
});
process.env.SNIPPETCANVAS_DOCS_PORT = String(port);
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: "tests",
  testMatch: "*.spec.ts",
  workers: 1,
  use: { baseURL, viewport: { width: 1440, height: 1000 } },
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
