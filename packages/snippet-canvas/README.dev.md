# SnippetCanvas Developer Guide

Architecture, development, build, packaging, browser-testing, and demo-recording documentation for SnippetCanvas contributors. User-facing Marketplace documentation lives in `README.md`.

## Features

### Capture and snippet management

- Add the current selection or entire active file from the editor's **SnippetCanvas** submenu or Command Palette.
- Prevent duplicate captures from the same URI and exact line/character range. Recapturing refreshes the existing snippet.
- Manage snippets from the Activity Bar sidebar: inspect, rename, delete, and reorder.
- Preserve each snippet as an independent source group. Code and line numbers never bleed into another snippet.
- Detect the VS Code language automatically and allow a manual syntax-language override.
- Persist the document in workspace state under `snippetCanvas.state`.

### Pages and columns

- A **Page** is the fixed-size exported artwork, similar to an Illustrator artboard.
- A **Column** is a resizable code panel contained by a page.
- Use custom page dimensions or US Letter portrait, US Letter landscape, and A4 presets.
- Automatically create additional pages when rows exceed the available page height.
- Split vertically overflowing snippets into continuation columns while preserving their original line numbers.
- Resize columns from the left, right, bottom, or corner. Individual width, height, font size, and line-height overrides are persisted.
- Right-click a column to move it, reset its overrides, export it independently, or remove its source snippet.

### Fit, Grid, and Flow layouts

**Fit** keeps each source snippet intact and automatically sizes the live and exported page height to every code line and page width to the longest rendered line. Its preset resolves to Custom while preset and dimension controls remain editable as composition constraints.

**Grid** treats **Maximum columns per row** as a limit, not a required count. A row wraps early when the next requested column width cannot fit. Changing the maximum calculates an initial equal-width default, after which individual widths remain adjustable.

**Flow** has no column-count preference. It measures content-driven widths, places as many columns as fit, wraps the rest, and distributes unused row width across the columns already in that row.

In both modes:

- Column widths include the line-number gutter and code padding.
- Inherited columns are measured after layout and receive width overrides when their code requires more room.
- Rows and columns remain within the page's usable width.
- Font changes trigger a debounced layout recalculation.
- Columns using the default font share one calculated font ceiling. Different font sizes occur only through manual column overrides.
- Default and selected-column sliders display their applicable font ceiling.

### Code-card styling

- Apply Midnight, Dracula, Nord, or Paper style presets, then customize every setting.
- Choose from six syntax themes independently of the column and page colors.
- Use bundled JetBrains Mono, Fira Code, Source Code Pro, IBM Plex Mono, Roboto Mono, or Space Mono fonts offline.
- Enter any Google Fonts family name for on-demand loading when network access is available.
- Adjust column padding, tab width, code alignment, corner radius, and detailed shadow position, blur, opacity, and color.
- Choose a complete syntax theme palette, then optionally customize its column, text, and accent colors globally or for one selected column.
- Choose macOS, minimal, terminal, or frameless column chrome.
- Edit each snippet title, reset it to the filename, and control global title font, size, weight, and alignment.
- Emphasize snippet-relative lines with comma/range syntax such as `3, 5-8`.
- Use solid, gradient, remote-image, or transparent page backgrounds.
- Add exportable captions, watermarks, icons or emoji, and column tilt.
- Override every column size and styling default on an individual selected column, including colors, syntax theme, font, padding, frame, shadow, title styling, and decorations. Resetting the column restores all inherited global values.

### Code visibility and export

- Code remains unwrapped with whitespace and tabs preserved.
- Export validation prevents output while any code in the selected export scope is horizontally or vertically clipped.
- Validation errors identify the page, snippet, and failure direction. Clicking an error selects and centers the affected column.
- General failures also use standard VS Code notifications.
- Export the current page or all pages as PNG, JPEG, SVG, or multi-page PDF at 1×–4× resolution.
- Export one column from its right-click menu.
- Copy-image plumbing writes a temporary PNG path through VS Code's stable text clipboard API.
- Selection outlines, page workspace shadows, resize handles, context menus, and editor actions are excluded from output.

### Workspace navigation

- Zoom from 10–200%, return to 100%, or fit the page and reset the workspace scroll position to `0,0`.
- Pan with Space-drag or the middle mouse button.
- Use cursor-centered Ctrl/Cmd-wheel zoom and the `+`, `-`, `0`, and `1` shortcuts.

## Requirements

- Node.js 20+
- VS Code 1.90+

## VS Code settings

Open **Settings** and search for `SnippetCanvas` to configure `snippetCanvas.*`. Settings are available for layout, page dimensions and backgrounds, column dimensions and typography, themes and fonts, window frames, shadows, title styling, and decorations. The extension host resolves these values and sends them to the React webview through the typed `configurationChanged` bridge message; the webview never calls VS Code APIs directly. Workspace-state values saved from the composer take precedence after a document has been customized.

Use `snippetCanvas.mode` to choose the default mode for new composer documents: `fit`, `grid`, or `flow`. The default is `fit`.

Use `snippetCanvas.column.scaleFontOnResize` to control whether handle-based column resizing also scales the column's code font. The default is `false`.

The persisted composer model keeps ownership explicit: `settings.page` contains only page dimensions and page background options, while `settings.column` contains the shared column defaults, including size, code appearance, window frame, title, shadow, and decorations. A column's `columnSettings` record contains only its individual overrides. Layout mode, maximum columns per row, and gap remain composer-level settings because they arrange columns rather than style a page or an individual column.

## Build and run

```bash
npm install
npm run build
```

Open the project in VS Code and press **F5**. In the Extension Development Host, select code and choose **SnippetCanvas → Add Selection** from the editor context menu. Run **SnippetCanvas: Open Composer** from the Command Palette to open the composer.

For the standalone sample preview:

```bash
npm run dev:preview
```

Open `/webview-preview.html` at the local address printed by Vite. Do not open `webview-preview.html` directly.

Additional commands:

```bash
npm run typecheck
npm run watch
npm run package
```

## Publish to the VS Code Marketplace

Create a Visual Studio Marketplace personal access token and make the README
media publicly available. If `package.json` does not yet contain the public
repository URL, set `VSCE_BASE_IMAGES_URL` to the public repository root. The
publisher uses it to turn `media/snippetcanvas-demo.gif` into an absolute
Marketplace image URL:

```bash
VSCE_PAT=your-token \
VSCE_BASE_IMAGES_URL=https://raw.githubusercontent.com/your-account/your-repository/main \
npm run publish:extension
```

Pass `patch`, `minor`, `major`, or an explicit version to update the extension
version as part of the release. Use `--dry-run` to run the checks and create a
local VSIX without uploading it:

```bash
npm run publish:extension -- patch
npm run publish:extension -- --dry-run
```

The command runs type checking and a clean production build before invoking
`vsce publish`. It stops if Marketplace credentials are missing, and `vsce`
stops if the README GIF cannot be resolved to a public URL. Additional arguments
are forwarded to `vsce`.

## Project structure

```text
src/
  extension.ts              Small activation and service-composition root
  commands.ts               Canonical typed VS Code command IDs
  documentStore.ts          Workspace-state defaults and functional updates
  snippetFeature.ts         Capture commands, snippet CRUD, ordering, and sidebar
  composerPanel.ts          Webview lifecycle and typed message handling
  imageExporter.ts          Multi-format save, multi-page save, and clipboard-path output
  protocol.ts               Shared extension-host message and state types
src/webview/
  components/               React pages, columns, controls, and workspace UI
  components/controls/      Reusable control-panel sections
  context/vscode/           VS Code bridge context and custom hook
  hooks/                    Composer state and workspace interactions
  utilities/layout/         Pure page, row, and column layout calculation
  types.ts                  Shared protocol re-exports and UI-specific types
dist/                       Generated extension-host output
dist/webview/               Generated Vite webview output
```

The raw `acquireVsCodeApi()` bridge lives in `api/vscode-api.ts`; React uses `VSCodeProvider` and `useVSCode`. Presentation components receive application actions rather than calling VS Code APIs.

The webview UI uses semantic, hand-written CSS with VS Code theme variables and Lucide icons. Its compact neutral surfaces, subtle borders, shared radii, and accessible focus rings are shadcn-inspired, but the project does not use Tailwind CSS or shadcn-generated components.

`computeLayout` derives immutable pages, rows, continuation columns, and resolved dimensions. `Column` owns pointer, drag, and context-menu interaction locally and receives a stable semantic action object from `Page`. Resize events are batched with animation frames.

Webview DOM capture uses `dom-to-image-more`; PDF assembly uses `pdf-lib`. PNG, JPEG, and SVG can be exported as numbered page sets, while PDF combines the selected pages into one document.

## Browser testing

The webview includes deterministic Playwright coverage with no AI or external-service integration. Test code and temporary output live under `demo/`. On each run the test launcher asks the operating system for an available port; Playwright's `webServer` block passes that port to Vite and uses the same generated URL for browser navigation and readiness checks. Tests interact through accessible roles and labels, record browser console errors, and retain screenshots, video, and traces for failures under `demo/artifacts/`.

The source project includes `demo/readme.md` with machine prerequisites, operating-system installation commands, recording configuration, artifact locations, and troubleshooting.

```bash
npm run demo:e2e:install
npm run demo:e2e
```

Use `npm run demo:e2e:ui` for Playwright's interactive runner and `npm run demo:e2e:report` to inspect the latest HTML report. The tests cover host-provided defaults, Fit/Grid/Flow behavior, sidebar persistence, configured themes, complete snippet rendering, and multi-format export controls.

### Record an optimized GIF demonstration

The demo workflow automates a visible composition session, records it with Playwright, and converts the WebM capture to an optimized looping GIF with FFmpeg:

```bash
npm run demo:record
```

The source WebM is written to `demo/artifacts/demo/`. The optimized, publishable GIF is written to `media/snippetcanvas-demo.gif`, which is embedded by the Marketplace README. Customize the recording without editing code:

```bash
SNIPPETCANVAS_SLOW_MO=400 SNIPPETCANVAS_GIF_FPS=12 SNIPPETCANVAS_GIF_WIDTH=960 npm run demo:record
```

- `SNIPPETCANVAS_SLOW_MO` controls the delay after each Playwright action in milliseconds (default `250`).
- `SNIPPETCANVAS_GIF_FPS` controls GIF frame rate (default `12`).
- `SNIPPETCANVAS_GIF_WIDTH` caps output width while preserving aspect ratio (default `960`).

The browser viewport and video are both recorded at 1600 × 1000, and the demo increases the composer zoom to fill the stage. Conversion uses Lanczos scaling, a full-frame 256-color palette, and high-quality Sierra dithering to preserve UI and code-text detail. FFmpeg must be available on your system path.

## Template architecture

Following `react-webview-vite-template-1`, the extension and React webview have separate Vite builds and TypeScript checks. `src/extension.ts` builds to CommonJS at `dist/extension.js`; `src/webview/index.tsx` builds to `dist/webview/webview.js` and `webview.css`. The host loads those assets through VS Code resource URIs and a nonce-protected HTML shell.

`src/protocol.ts` defines the shared message and document types. `src/webview/api/vscode-api.ts` acquires the VS Code API once and supplies the browser preview shim. The React provider handles subscriptions independently of that API.

Run `npm run dev` for both build watchers, the browser preview server, and an Extension Development Host. Set `CODE_COMMAND` if the VS Code CLI has a different name. Run `npm run dev:preview` for browser-only development and open `/webview-preview.html`. `npm run watch` watches both production asset builds. `npm run package` invokes the prepublish build before packaging.

## Monorepo workspace

Run the commands above from `packages/snippet-canvas`, or use `npm run <script> --workspace snippetcanvas` from the repository root. Install dependencies from the root with `npm install`; the root lockfile covers all workspaces. To debug the extension with its included launch configuration, open `packages/snippet-canvas` as the VS Code folder. Root Playwright configuration runs this package’s browser suite.
