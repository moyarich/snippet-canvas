import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: "src/extension.ts",
    target: "node20",
    sourcemap: "hidden",
    minify: false,
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      external: ["vscode"],
      output: {
        format: "cjs",
        exports: "named",
        entryFileNames: "extension.js",
      },
    },
  },
  ssr: {
    noExternal: true,
  },
});
