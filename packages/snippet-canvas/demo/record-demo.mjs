import { spawn } from "node:child_process";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(testsDirectory);
const demoDirectory = path.join(testsDirectory, "artifacts", "demo");
const readmeMediaDirectory = path.join(projectDirectory, "media");
const source = path.join(demoDirectory, "snippetcanvas-demo.webm");
const destination = path.join(readmeMediaDirectory, "snippetcanvas-demo.gif");
const fps = Math.max(1, Number(process.env.SNIPPETCANVAS_GIF_FPS ?? 12));
const width = Math.max(320, Number(process.env.SNIPPETCANVAS_GIF_WIDTH ?? 960));
const trimStart = Math.max(0, Number(process.env.SNIPPETCANVAS_GIF_TRIM_START ?? 1));

function run(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: projectDirectory, env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`)));
  });
}

await mkdir(demoDirectory, { recursive: true });
await mkdir(readmeMediaDirectory, { recursive: true });
await run(process.execPath, [path.join(testsDirectory, "run-playwright.mjs"), "--demo", "--reporter=line"]);
await access(source);

const filter = `trim=start=${trimStart},setpts=PTS-STARTPTS,fps=${fps},scale='min(${width},iw)':-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=256:reserve_transparent=0:stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle`;
await run("ffmpeg", ["-y", "-i", source, "-filter_complex", filter, "-gifflags", "+transdiff", "-loop", "0", destination]);
console.log(`README GIF created: ${destination}`);
