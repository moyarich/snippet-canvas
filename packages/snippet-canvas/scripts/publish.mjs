#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";

const args = process.argv.slice(2);
const dryRunIndex = args.indexOf("--dry-run");
const dryRun = dryRunIndex !== -1;

if (dryRun) {
  args.splice(dryRunIndex, 1);
}

const hasBaseImagesUrl = args.some(
  (arg) => arg === "--baseImagesUrl" || arg.startsWith("--baseImagesUrl="),
);

if (!hasBaseImagesUrl && process.env.VSCE_BASE_IMAGES_URL) {
  args.push("--baseImagesUrl", process.env.VSCE_BASE_IMAGES_URL);
}

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: npm run publish:extension -- [version] [vsce options]

Examples:
  npm run publish:extension
  npm run publish:extension -- patch
  npm run publish:extension -- 1.0.0
  npm run publish:extension -- --pre-release
  npm run publish:extension -- --dry-run

Set VSCE_PAT to a Visual Studio Marketplace personal access token before
publishing. Because README.md contains the instructional GIF, this project also
needs a public repository URL in package.json or VSCE_BASE_IMAGES_URL pointing
to the public directory that contains media/snippetcanvas-demo.gif.

All arguments other than --dry-run are passed to vsce.`);
  process.exit(0);
}

const hasExplicitAuthentication =
  args.includes("--azure-credential") ||
  args.includes("--pat") ||
  args.includes("-p") ||
  args.some((arg) => arg.startsWith("--pat="));

if (!dryRun && !process.env.VSCE_PAT && !hasExplicitAuthentication) {
  console.error(
    "Missing Marketplace credentials. Set VSCE_PAT or pass a supported vsce authentication option.",
  );
  process.exit(1);
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const vsceCli = createRequire(import.meta.url).resolve("@vscode/vsce/vsce");

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: new URL("..", import.meta.url),
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("Checking and building SnippetCanvas...");
run(npmCommand, ["run", "typecheck"]);
run(npmCommand, ["run", "build"]);

if (dryRun) {
  console.log("Creating a local VSIX (dry run; nothing will be published)...");
  run(process.execPath, [vsceCli, "package", ...args]);
} else {
  console.log("Publishing SnippetCanvas to the Visual Studio Marketplace...");
  run(process.execPath, [vsceCli, "publish", ...args]);
}
