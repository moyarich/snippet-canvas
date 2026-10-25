# Product Requirements: SnippetCanvas

## 1. Product summary

SnippetCanvas is a VS Code extension that turns captured code into structured, multi-column page compositions. Users collect selections or complete files, arrange them without leaving VS Code, and export complete pages or individual columns as high-resolution PNG images.

**Capture code → organize snippets → compose pages → adjust columns → validate visibility → export**

## 2. Goals

- Remove the need to assemble multiple code screenshots in an external design tool.
- Preserve code correctness, indentation, syntax highlighting, source grouping, and line numbering.
- Support fixed-size, publication-oriented pages with independently adjustable columns.
- Guarantee that an export never silently omits clipped code.
- Keep VS Code integration separate from React presentation code.

## 3. Terminology

- **Snippet:** A captured selection or complete file with source metadata.
- **Page:** The fixed-size exported background. Page and artboard are synonymous in concept; the product and code use **Page**.
- **Column:** A code panel inside a page. A long snippet may create multiple continuation columns.
- **Workspace:** The scrollable and zoomable area surrounding pages.
- **Default column settings:** Values inherited by columns without individual overrides.
- **Column override:** A persisted width, height, font-size, or line-height value for one rendered column.

## 4. Functional requirements

### 4.1 Capture and management

1. Users can add the current editor selection or entire active file.
2. Commands are available from the Command Palette and editor SnippetCanvas submenu.
3. A capture is unique by canonical URI and exact start/end line and character bounds.
4. Recapturing the same range refreshes the existing snippet.
5. New snippets inherit current defaults and never reuse another snippet's overrides.
6. The Activity Bar sidebar supports inspect, rename, delete, and reorder.
7. Deleting a snippet removes its source and continuation-column settings.
8. Snippets remain independent source groups; code and line numbers never merge across snippet IDs.

### 4.2 Page composition

1. Pages have explicit pixel width, height, padding, gap, and background settings.
2. Presets include US Letter portrait at 2550 × 3300, US Letter landscape, and A4 portrait.
3. Columns cannot exceed usable page width or height.
4. Rows that exceed usable page height continue on a new page.
5. Vertical code overflow creates continuation columns rather than scrollable panels.
6. Continuations retain original, continuous line numbers.

### 4.3 Grid layout

1. **Maximum columns per row** is an upper bound.
2. A row may contain fewer columns when requested widths cannot fit.
3. Changing the maximum establishes an initial equal-width default.
4. Content measurement can expand inherited columns and reflow rows.
5. Individual column dimensions remain adjustable afterward.

### 4.4 Flow layout

1. Flow has no preferred or maximum column count.
2. Natural content width establishes each column's basis.
3. As many columns as fit are placed in a row.
4. The next column wraps when remaining width is insufficient.
5. Remaining row width is distributed among that row's columns.

### 4.5 Column interaction

1. Clicking a column toggles selection.
2. Users can resize from left, right, bottom, or corner handles.
3. The right-click menu provides move left, move right, reset settings, export column as PNG, and remove snippet.
4. Menu and selection UI are excluded from export.
5. Columns can be reordered by drag or arrow actions.

### 4.6 Typography and code rendering

1. Language defaults to the VS Code document language and can be overridden per snippet.
2. Code uses syntax highlighting and a monospaced font.
3. Spaces, indentation, newlines, and tabs are preserved.
4. Code does not word-wrap or combine lines.
5. Width measurement includes the line-number gutter and code padding.
6. Font changes trigger a 180 ms debounced recalculation in Grid and Flow.
7. Columns using the default font share one ceiling derived from the strictest required fit.
8. Automatic fitting cannot create different inherited font sizes.
9. Different column font sizes exist only through manual overrides.
10. Default and selected-column sliders show and enforce applicable ceilings.
11. VS Code informs users when a requested font size is reduced.

### 4.7 Validation and errors

1. Page and column exports are blocked when measured code exceeds its viewport.
2. Stage errors identify the page, snippet, and whether code is too wide or tall.
3. Clicking an error selects and centers the affected column.
4. Multiple errors use compact previous/next navigation.
5. VS Code displays general notifications for validation and rendering failures.

### 4.8 Export

1. Export every page as a 2× PNG.
2. Multi-page export saves numbered files.
3. Export one column from its context menu.
4. Copy-image creates a PNG and copies its temporary path through VS Code's stable clipboard API.
5. Output excludes workspace outlines/shadows, selection outlines, handles, actions, context menus, and error UI.

### 4.9 Navigation

1. Workspace zoom ranges from 10% to 200% without changing export dimensions.
2. Fit Page resets scrolling to `0,0`.
3. Users can pan with Space-drag or middle mouse.
4. Ctrl/Cmd-wheel zoom is cursor-centered.
5. Keyboard shortcuts support zoom in, zoom out, fit, and 100%.

### 4.10 Persistence and architecture

1. State is stored in VS Code `workspaceState` under `snippetCanvas.state`.
2. No legacy versioned state keys or migration layer are required.
3. React and TypeScript power the Vite-built webview; the extension host uses TypeScript.
4. `acquireVsCodeApi()` and message transport remain behind React Context and custom hooks.
5. A pure layout utility derives immutable pages, rows, continuations, and dimensions.
6. Column interaction state remains local and avoids broad context-driven rerenders.

## 5. Non-goals for the current MVP

- SVG export
- PDF export
- Cloud synchronization
- Collaborative editing
- Arbitrary free-positioned layers
- Legacy state migration

## 6. Acceptance criteria

1. Users can capture selections and files without duplicates.
2. Snippets can be managed from the sidebar and composer.
3. Grid and Flow produce deterministic, page-constrained rows.
4. Long snippets continue without scrollbars or lost line numbers.
5. Default columns share consistent typography unless manually overridden.
6. No export proceeds with clipped code.
7. Page and individual-column PNG exports contain no editing UI.
8. Workspace state restores snippets, ordering, settings, pages, and overrides.
9. Type checking and production packaging complete successfully.
