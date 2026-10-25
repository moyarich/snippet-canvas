import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import rehypeSlug from "rehype-slug";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [{ enforce: "pre", ...mdx({ rehypePlugins: [rehypeSlug] }) }, react({ include: /\.(mdx|tsx|ts|jsx|js)$/ })],
  base: process.env.VITE_BASE_PATH || "./",
  resolve: { alias: { "/packages": fileURLToPath(new URL("../../packages", import.meta.url)) } },
  build: { rollupOptions: { input: { main: fileURLToPath(new URL("index.html", import.meta.url)), composer: fileURLToPath(new URL("snippet-preview.html", import.meta.url)) } } },
});
