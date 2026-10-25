# SnippetCanvas browser tests and demonstrations

This folder contains all Playwright browser testing, automated demonstration recording, GIF conversion, and generated test artifacts for the SnippetCanvas webview.

## Prerequisites

Install these tools on the machine before running the tests:

- Node.js 20 or newer
- npm (included with Node.js)
- Playwright's Chromium headless shell
- FFmpeg, required only for GIF demonstration conversion

Install the project packages and Playwright browser:

```bash
npm install
npm run demo:e2e:install
```

### Install FFmpeg

macOS with Homebrew:

```bash
brew install ffmpeg
```

Ubuntu or Debian:

```bash
sudo apt update
sudo apt install ffmpeg
```

Fedora:

```bash
sudo dnf install ffmpeg
```

Windows with WinGet:

```powershell
winget install Gyan.FFmpeg
```

Confirm that FFmpeg is available:

```bash
ffmpeg -version
```

## Run browser tests

```bash
npm run demo:e2e
```

Playwright starts Vite through the `webServer` configuration. The launcher asks the operating system for an available local port and shares it with Vite and every Playwright worker; no fixed port is required.

Other test commands:

```bash
npm run demo:e2e:ui
npm run demo:e2e:report
```

The regular suite excludes demonstration-only scenarios and stores failure screenshots, videos, traces, and the HTML report under `demo/artifacts/`.

## Record an optimized GIF

```bash
npm run demo:record
```

This command:

1. Starts Vite on an available port.
2. Runs the `@demo` Playwright interaction sequence with slow motion enabled.
3. Saves the source browser recording under the generated-artifact directory.
4. Uses FFmpeg to generate a looping, palette-optimized GIF with Lanczos scaling.
5. Writes the finished GIF to `media/`, where `README.md` embeds it and the VSIX packaging rules include it.

Before publishing, commit and push the generated GIF to the public repository.
The extension manifest's `repository` field or the publishing command's
`VSCE_BASE_IMAGES_URL` value lets `vsce` rewrite the relative README link to
that public asset.

The demo uses a 1600 × 1000 browser viewport and recording surface, then increases the composer zoom so the page and controls occupy the available frame without letterboxing.

Output files:

```text
demo/artifacts/demo/snippetcanvas-demo.webm
media/snippetcanvas-demo.gif
```

### Recording options

| Environment variable | Default | Purpose |
|---|---:|---|
| `SNIPPETCANVAS_SLOW_MO` | `250` | Delay in milliseconds after Playwright actions |
| `SNIPPETCANVAS_GIF_FPS` | `12` | Output GIF frames per second |
| `SNIPPETCANVAS_GIF_WIDTH` | `960` | Maximum GIF width while preserving aspect ratio |
| `SNIPPETCANVAS_GIF_TRIM_START` | `1` | Seconds removed from the initial browser-loading frames |

Example:

```bash
SNIPPETCANVAS_SLOW_MO=400 SNIPPETCANVAS_GIF_FPS=12 SNIPPETCANVAS_GIF_WIDTH=960 npm run demo:record
```

PowerShell example:

```powershell
$env:SNIPPETCANVAS_SLOW_MO=400
$env:SNIPPETCANVAS_GIF_FPS=12
$env:SNIPPETCANVAS_GIF_WIDTH=960
npm run demo:record
```

## Folder contents

```text
demo/
├── README.md
├── playwright.config.ts   # Browser, web server, video, and artifact settings
├── run-playwright.mjs     # Available-port discovery and Playwright launcher
├── webview.spec.ts        # Browser regression scenarios
├── demo.spec.ts           # Automated visual demonstration scenario
├── record-demo.mjs        # Recording orchestration and FFmpeg conversion
└── artifacts/             # Temporary recordings and test output; ignored by Git and VSIX packaging
```

## Troubleshooting

- If Playwright cannot launch Chromium, run `npm run demo:e2e:install` again.
- If GIF conversion reports that `ffmpeg` cannot be found, install FFmpeg and restart the terminal so the system path is refreshed.
- If a test fails, inspect `demo/artifacts/report/` or run `npm run demo:e2e:report`.
- Temporary test output and source recordings are excluded from the extension. The optimized README GIF in `media/` is intentionally published.
