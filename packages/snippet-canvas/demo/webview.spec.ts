import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

class SnippetCanvasBrowser {
  readonly errors: string[] = [];

  constructor(readonly page: Page) {
    page.on("pageerror", (error) => this.errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") this.errors.push(message.text());
    });
  }

  async open() {
    await this.page.goto("/webview-preview.html");
    await expect(this.page.getByText("Opening pages…")).toBeHidden();
    await expect(this.page.getByRole("heading", { name: "Page" })).toBeVisible();
  }

  async openTab(name: "Page" | "Columns" | "Selected") {
    await this.page.getByRole("tab", { name }).click();
  }

  async chooseMode(mode: "Fit" | "Grid" | "Flow") {
    await this.page.getByRole("button", { name: mode, exact: true }).click();
    await expect(this.page.getByRole("button", { name: mode, exact: true })).toHaveClass(/active/);
  }

  async expectHealthy() {
    expect(this.errors, "browser console and page errors").toEqual([]);
    await expect(this.page.locator(".stage-errors")).toBeEmpty();
  }
}

test("loads host defaults and preserves the complete preview snippet", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await browser.openTab("Columns");
  await expect(page.getByRole("button", { name: "Fit", exact: true })).toHaveClass(/active/);
  await expect(page.locator("[data-column-id]")).toHaveCount(1);
  await expect(page.locator(".column-snippet")).toContainText("console.log(greet");
  const dimensions = await page.locator(".page").evaluate((pageElement) => {
    const column = pageElement.querySelector<HTMLElement>("[data-column-id]");
    return { pageWidth: pageElement.offsetWidth, columnWidth: column?.offsetWidth ?? 0 };
  });
  expect(dimensions.pageWidth).toBeLessThan(1400);
  expect(dimensions.pageWidth).toBeGreaterThanOrEqual(dimensions.columnWidth + 79);
  await browser.expectHealthy();
});

test("starts Fit mode at its content size instead of the exact-page default", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  const dimensions = await page.locator(".page").evaluate((element) => ({
    width: element.offsetWidth,
    height: element.offsetHeight,
  }));
  expect(dimensions).not.toEqual({ width: 1400, height: 900 });
  await expect(page.locator(".export-summary")).toContainText(`${dimensions.width * 2} × ${dimensions.height * 2} px per page`);
  await browser.expectHealthy();
});

test("uses CSS defaults when VS Code theme variables are unavailable", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await page.evaluate(() => {
    for (const element of [document.documentElement, document.body]) {
      for (const property of Array.from(element.style)) {
        if (property.startsWith("--vscode-")) element.style.removeProperty(property);
      }
    }
  });
  await expect(page.locator(".stage")).toHaveCSS("background-color", "rgb(24, 24, 27)");
  await expect(page.locator("aside.controls")).toHaveCSS("color", "rgb(228, 228, 231)");
  await expect(page.getByRole("button", { name: "Fit", exact: true })).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.locator(".slider-bounds").first()).toHaveCSS("color", "rgba(255, 255, 255, 0.4)");
  await browser.expectHealthy();
});

test("maps muted slider text to the VS Code disabled foreground", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--vscode-disabledForeground", "rgb(12, 34, 56)");
  });
  await expect(page.locator(".slider-bounds").first()).toHaveCSS("color", "rgb(12, 34, 56)");
  await browser.expectHealthy();
});

test("uses a normalized interface typography scale", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  const sizes = await page.locator(".controls").evaluate((controls) => {
    const selectors = [
      ".brand strong",
      ".brand small",
      ".control-heading strong",
      ".control-heading small",
      ".control-tabs button",
      "h3",
      ".hint",
      "label",
      ".slider-value",
    ];
    return Object.fromEntries(selectors.map((selector) => {
      const element = controls.querySelector<HTMLElement>(selector)!;
      return [selector, parseFloat(getComputedStyle(element).fontSize)];
    }));
  });
  expect(sizes).toEqual({
    ".brand strong": 14,
    ".brand small": 11,
    ".control-heading strong": 11,
    ".control-heading small": 10,
    ".control-tabs button": 10,
    h3: 11,
    ".hint": 11,
    label: 11,
    ".slider-value": 10,
  });
  await browser.expectHealthy();
});

test("does not apply value-chip styles to generic label spans", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await browser.chooseMode("Grid");
  const checkText = page.locator("label.export-fit > span");
  await expect(checkText).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const spacing = await checkText.evaluate((element) => {
    const style = getComputedStyle(element);
    return { left: style.paddingLeft, right: style.paddingRight };
  });
  expect(spacing).toEqual({ left: "0px", right: "0px" });
  await browser.expectHealthy();
});

test("switches deterministically between Fit, Grid, and Flow", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await browser.chooseMode("Grid");
  await expect(page.getByRole("button", { name: "Grid", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Fit", exact: true })).toHaveAttribute("aria-pressed", "false");
  await browser.openTab("Columns");
  await expect(page.getByText("Maximum columns per row")).toBeVisible();
  await browser.chooseMode("Flow");
  await expect(page.getByText("Maximum columns per row")).toBeHidden();
  await browser.chooseMode("Fit");
  await browser.openTab("Page");
  await expect(page.getByLabel("Size preset")).toBeVisible();
  await expect(page.getByLabel("Size preset")).toHaveValue("custom");
  await expect(page.getByRole("slider", { name: "Minimum page width (px)" })).toBeEnabled();
  await expect(page.getByRole("slider", { name: "Minimum page height (px)" })).toBeEnabled();
  await browser.expectHealthy();
});

test("resets all Fit page settings when explicitly requested", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  const width = page.getByRole("slider", { name: "Minimum page width (px)" });
  const padding = page.getByRole("slider", { name: "Page padding" });
  await width.fill("2000");
  await padding.fill("100");
  await expect(width).toHaveValue("2000");
  await expect(padding).toHaveValue("100");

  await page.getByRole("button", { name: "Reset all Fit page settings" }).click();
  await expect(width).toHaveValue("730");
  await expect(page.locator("label.slider-field").filter({ has: page.getByText("Minimum page width (px)", { exact: true }) }).locator("output")).toHaveText("730 px");
  await expect(padding).toHaveValue("40");
  await browser.expectHealthy();
});

test("matches Fit page sliders to the exported page dimensions", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await page.getByRole("button", { name: "Reset all Fit page settings" }).click();
  const dimensions = await page.locator(".page").evaluate((element) => ({ width: element.offsetWidth, height: element.offsetHeight }));
  const width = page.getByRole("slider", { name: "Minimum page width (px)" });
  await expect(width).toHaveValue(String(dimensions.width));
  await expect(width).toHaveAttribute("step", "1");
  await expect(width.locator("xpath=following-sibling::*[contains(@class, 'slider-bounds')]")).toHaveText("15000");
  await expect(page.getByRole("slider", { name: "Minimum page height (px)" })).toHaveValue(String(dimensions.height));
  await page.getByLabel("Resolution").selectOption("1");
  await expect(page.getByText(`${dimensions.width} × ${dimensions.height} px per page`, { exact: true })).toBeVisible();
  await browser.expectHealthy();
});

test("allows Fit columns and pages to shrink below their old floors", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await page.getByRole("button", { name: "Reset all Fit page settings" }).click();
  const column = page.locator("[data-column-id]").first();
  await column.click();
  await browser.openTab("Selected");
  const width = page.getByRole("slider", { name: "Column width" });
  const height = page.getByRole("slider", { name: "Column height" });
  await expect(width).toHaveAttribute("min", "1");
  await expect(height).toHaveAttribute("min", "1");
  await width.fill("80");
  await height.fill("80");
  await expect.poll(() => page.locator(".page").evaluate((element) => ({
    width: element.offsetWidth,
    height: element.offsetHeight,
  }))).toEqual({ width: 160, height: 160 });
  await expect(width).toHaveValue("80");
  await browser.expectHealthy();
});

test("applies default column width without hidden per-column sizing", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  const column = page.locator("[data-column-id]").first();

  for (const mode of ["Fit", "Flow", "Grid"] as const) {
    await browser.chooseMode(mode);
    await browser.openTab("Columns");
    await page.getByRole("slider", { name: "Default column width" }).fill("700");
    await expect.poll(() => column.evaluate((element) => element.offsetWidth)).toBe(700);
  }
  await browser.expectHealthy();
});

test("returns an individual size override to automatic inheritance", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  const column = page.locator("[data-column-id]").first();
  await column.click();
  await browser.openTab("Selected");
  const width = page.getByRole("slider", { name: "Column width" });

  await width.fill("800");
  await expect.poll(() => column.evaluate((element) => element.offsetWidth)).toBe(800);
  await page.getByRole("button", { name: "Use automatic column width" }).click();
  await expect(page.getByRole("button", { name: "Use automatic column width" })).toHaveCount(0);

  await browser.openTab("Columns");
  await page.getByRole("slider", { name: "Default column width" }).fill("650");
  await expect.poll(() => column.evaluate((element) => element.offsetWidth)).toBe(650);
  await browser.expectHealthy();
});

test("collapses, expands, and remembers the settings sidebar", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await page.getByRole("button", { name: "Collapse settings sidebar" }).click();
  await expect(page.locator("aside.controls")).toHaveClass(/collapsed/);
  await page.reload();
  await expect(page.getByRole("button", { name: "Expand settings sidebar" })).toBeVisible();
  await page.getByRole("button", { name: "Expand settings sidebar" }).click();
  await expect(page.getByRole("tab", { name: "Page" })).toBeVisible();
  await browser.expectHealthy();
});

test("keeps the stage header pinned while the canvas scrolls", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await expect(page.locator(".composer-shell > aside.controls")).toHaveCount(1);
  await expect(page.locator(".composer-shell > main.workspace > section.stage > .stage-head")).toHaveCount(1);
  await expect(page.locator(".composer-shell > main.workspace > section.stage > .zoom-viewport")).toHaveCount(1);
  const stage = page.locator(".stage");
  const header = page.locator(".stage-head");
  const initial = await header.boundingBox();
  expect(initial).not.toBeNull();

  await stage.evaluate((element) => element.scrollTo({ left: 300, top: 300 }));
  await expect.poll(async () => {
    const bounds = await header.boundingBox();
    return bounds ? { x: Math.round(bounds.x), y: Math.round(bounds.y) } : null;
  }).toEqual({ x: Math.round(initial!.x), y: Math.round(initial!.y) });
  await expect(header).toHaveCSS("position", "sticky");
  await browser.expectHealthy();
});

test("contains the zoomed canvas in the zoom viewport", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await page.getByRole("slider", { name: "Workspace zoom" }).fill("200");
  const dimensions = await page.locator(".zoom-viewport").evaluate((viewport) => {
    const layer = viewport.querySelector<HTMLElement>(".zoom-layer")!;
    const pageElement = layer.querySelector<HTMLElement>(".page")!;
    return {
      viewportScrollWidth: viewport.scrollWidth,
      viewportScrollHeight: viewport.scrollHeight,
      layerRight: layer.offsetLeft + layer.offsetWidth,
      layerBottom: layer.offsetTop + layer.offsetHeight,
      displayedPageWidth: pageElement.getBoundingClientRect().width,
      pageWidth: pageElement.offsetWidth,
    };
  });
  expect(dimensions.viewportScrollWidth).toBeGreaterThanOrEqual(dimensions.layerRight);
  expect(dimensions.viewportScrollHeight).toBeGreaterThanOrEqual(dimensions.layerBottom);
  expect(dimensions.displayedPageWidth).toBe(dimensions.pageWidth * 2);
  await browser.expectHealthy();
});

test("resizes a column at workspace zoom and preserves the manual dimensions", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  const column = page.locator("[data-column-id]").first();
  await column.click();
  await expect(column).toHaveClass(/selected/);

  const initial = await column.evaluate((element) => ({ width: element.offsetWidth, height: element.offsetHeight }));
  const initialFontSize = await column.locator(".highlighted-code").evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  const rightHandle = column.locator(".resize-right");
  const rightBounds = await rightHandle.boundingBox();
  expect(rightBounds).not.toBeNull();
  expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.className, {
    x: rightBounds!.x + rightBounds!.width * .25,
    y: rightBounds!.y + rightBounds!.height / 2,
  })).toContain("resize-right");
  await page.mouse.move(rightBounds!.x + rightBounds!.width * .25, rightBounds!.y + rightBounds!.height / 2);
  await page.mouse.down();
  await expect(column).toHaveClass(/resizing/);
  await page.mouse.move(rightBounds!.x + rightBounds!.width * .25 + 60, rightBounds!.y + rightBounds!.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect.poll(() => column.evaluate((element) => element.offsetWidth)).toBe(initial.width + 120);

  const bottomHandle = column.locator(".resize-bottom");
  const bottomBounds = await bottomHandle.boundingBox();
  expect(bottomBounds).not.toBeNull();
  await page.mouse.move(bottomBounds!.x + bottomBounds!.width / 2, bottomBounds!.y + bottomBounds!.height * .25);
  await page.mouse.down();
  await page.mouse.move(bottomBounds!.x + bottomBounds!.width / 2, bottomBounds!.y + bottomBounds!.height * .25 + 40, { steps: 4 });
  await page.mouse.up();
  await expect.poll(() => column.evaluate((element) => element.offsetHeight)).toBe(initial.height + 80);

  await page.waitForTimeout(300);
  expect(await column.evaluate((element) => ({ width: element.offsetWidth, height: element.offsetHeight }))).toEqual({
    width: initial.width + 120,
    height: initial.height + 80,
  });
  expect(await column.locator(".highlighted-code").evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThan(initialFontSize);
  await browser.expectHealthy();
});

test("toggles proportional font scaling from the Columns UI", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await browser.openTab("Columns");
  const scaleFont = page.getByLabel("Scale font with column size");
  await expect(scaleFont).toBeChecked();
  await scaleFont.uncheck();
  await expect(scaleFont).not.toBeChecked();
  await scaleFont.check();
  await expect(scaleFont).toBeChecked();
  const column = page.locator("[data-column-id]").first();
  await column.click();
  const initialFontSize = await column.locator(".highlighted-code").evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  const handle = column.locator(".resize-right");
  const bounds = await handle.boundingBox();
  expect(bounds).not.toBeNull();
  const startX = bounds!.x + bounds!.width * .25;
  const startY = bounds!.y + bounds!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 60, startY, { steps: 4 });
  await page.mouse.up();
  await expect.poll(() => column.locator(".highlighted-code").evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThan(initialFontSize);
  const fit = await column.evaluate((element) => {
    const viewport = element.querySelector<HTMLElement>("[data-code-height='true']")!;
    const code = element.querySelector<HTMLElement>("[data-code-width='true']")!;
    return code.scrollWidth <= code.clientWidth + 1 && viewport.scrollHeight <= viewport.clientHeight + 1;
  });
  expect(fit).toBe(true);
  await browser.expectHealthy();
});

test("scales a selected column's font when its size slider changes", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  const column = page.locator("[data-column-id]").first();
  await column.click();
  const initial = await column.evaluate((element) => ({
    fontSize: parseFloat(getComputedStyle(element.querySelector<HTMLElement>(".highlighted-code")!).fontSize),
  }));
  await browser.openTab("Selected");
  const scaleFont = page.getByLabel("Scale font with column size");
  await expect(scaleFont).toBeChecked();
  await page.getByRole("slider", { name: "Column width" }).fill("800");
  await expect.poll(() => column.locator(".highlighted-code").evaluate(
    (element) => parseFloat(getComputedStyle(element).fontSize),
  )).toBeGreaterThan(initial.fontSize);
  const sizing = await column.evaluate((element) => {
    const viewport = element.querySelector<HTMLElement>("[data-code-height='true']")!;
    const code = element.querySelector<HTMLElement>("[data-code-width='true']")!;
    const current = parseFloat(getComputedStyle(viewport).fontSize);
    const fits = code.scrollWidth <= code.clientWidth + 1 && viewport.scrollHeight <= viewport.clientHeight + 1;
    viewport.style.fontSize = `${current + 1}px`;
    const nextFits = code.scrollWidth <= code.clientWidth + 1 && viewport.scrollHeight <= viewport.clientHeight + 1;
    viewport.style.fontSize = `${current}px`;
    return { fits, nextFits };
  });
  expect(sizing).toEqual({ fits: true, nextFits: false });
  await browser.expectHealthy();
});

test("allows a selected column to override and restore global font scaling", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  const column = page.locator("[data-column-id]").first();
  await column.click();
  await browser.openTab("Selected");
  const scaleFont = page.getByLabel("Scale font with column size");
  const fontSize = page.getByRole("slider", { name: "Column font size" });
  const width = page.getByRole("slider", { name: "Column width" });
  await expect(scaleFont).toBeChecked();
  await expect(page.getByText("Using the global on setting.")).toBeVisible();

  await scaleFont.uncheck();
  await expect(page.getByText("This column overrides the global setting.")).toBeVisible();
  const originalFontSize = await fontSize.inputValue();
  await width.fill("800");
  await expect(fontSize).toHaveValue(originalFontSize);

  await page.getByRole("button", { name: "Use global font scaling" }).click();
  await expect(scaleFont).toBeChecked();
  await expect(page.getByRole("button", { name: "Use global font scaling" })).toHaveCount(0);
  await width.fill("900");
  await expect.poll(async () => Number(await fontSize.inputValue())).toBeGreaterThan(Number(originalFontSize));
  await browser.expectHealthy();
});

test("resets individual controls without changing unrelated values", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  const pageWidth = page.getByRole("slider", { name: "Minimum page width (px)" });
  await pageWidth.fill("1200");
  await page.getByText("Background", { exact: true }).click();
  await page.getByRole("button", { name: /^Paint/ }).click();
  await page.locator(".default-color-panel_item").nth(4).click();
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: "Reset background" }).click();
  await expect(pageWidth).toHaveValue("1200");
  await expect(page.locator(".page")).toHaveCSS("background-color", "rgb(17, 24, 39)");

  await browser.openTab("Columns");
  const width = page.getByRole("slider", { name: "Default column width" });
  const gap = page.getByRole("slider", { name: "Column gap" });
  await width.fill("800");
  await gap.fill("50");
  await page.getByRole("button", { name: "Use automatic default column width" }).click();
  await expect(width).toHaveValue("650");
  await expect(gap).toHaveValue("50");
  await page.getByRole("button", { name: "Reset column gap" }).click();
  await expect(gap).toHaveValue("20");
  await browser.expectHealthy();
});

test("keeps large user-selected font sizes without applying a content-derived cap", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  const column = page.locator("[data-column-id]").first();
  await column.click();
  await browser.openTab("Selected");

  const fontSize = page.getByRole("slider", { name: "Column font size" });
  await expect(fontSize).toHaveAttribute("max", "200");
  await fontSize.fill("120");
  await page.waitForTimeout(300);

  await expect(fontSize).toHaveValue("120");
  await expect.poll(() => column.locator(".highlighted-code").evaluate(
    (element) => parseFloat(getComputedStyle(element).fontSize),
  )).toBe(120);
  await browser.expectHealthy();
});

test("reports the selected column's actual 1x rendered size", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  const column = page.locator("[data-column-id]").first();
  await column.click();
  await browser.openTab("Selected");

  const rendered = await column.evaluate((element) => ({ width: element.offsetWidth, height: element.offsetHeight }));
  await expect(page.getByRole("slider", { name: "Column width" })).toHaveValue(String(rendered.width));
  await expect(page.getByRole("slider", { name: "Column height" })).toHaveValue(String(rendered.height));
  await expect(page.locator("label.slider-field").filter({ has: page.getByText("Column width", { exact: true }) }).locator("output")).toContainText(`${rendered.width} px`);
  await expect(page.locator("label.slider-field").filter({ has: page.getByText("Column height", { exact: true }) }).locator("output")).toContainText(`${rendered.height} px`);
  await browser.expectHealthy();
});

test("restores a column's saved width when the page becomes large enough", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await browser.chooseMode("Grid");
  const column = page.locator("[data-column-id]").first();
  await column.click();
  await page.getByRole("slider", { name: "Column width" }).fill("1200");
  await expect.poll(() => column.evaluate((element) => element.offsetWidth)).toBe(1200);

  await browser.openTab("Page");
  await page.getByRole("slider", { name: "Page width (px)" }).fill("800");
  await expect.poll(() => column.evaluate((element) => element.offsetWidth)).toBe(720);

  await browser.openTab("Selected");
  await expect(page.locator("label.slider-field").filter({ has: page.getByText("Column width", { exact: true }) }).locator("output")).toHaveText("720 px");
  await browser.openTab("Page");
  await page.getByRole("slider", { name: "Page width (px)" }).fill("1400");
  await expect.poll(() => column.evaluate((element) => element.offsetWidth)).toBe(1200);
  await browser.expectHealthy();
});

test("uses the configured theme catalog", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await browser.openTab("Columns");
  await page.getByText("Code appearance").click();
  await page.getByLabel("Syntax theme").selectOption("midnight");
  await expect(page.getByLabel("Syntax theme")).toHaveValue("midnight");
  await expect(page.getByText("Themes include the code background")).toBeVisible();
  await browser.expectHealthy();
});

test("persists page and column color-picker changes", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await page.getByText("Background", { exact: true }).click();
  const pageColor = page.getByRole("button", { name: /^Paint/ });
  await pageColor.click();
  await expect(page.getByRole("dialog", { name: "Paint" })).toBeVisible();
  await expect(page.locator(".color-modal-backdrop")).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Paint" })).toHaveCSS("resize", "both");
  await expect(page.getByText("Changes are saved as you edit.")).toBeVisible();
  await page.locator(".default-color-panel_item").nth(4).click();
  await expect(page.locator(".page")).toHaveCSS("background-color", "rgb(139, 92, 246)");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(pageColor).toContainText("#8b5cf6");

  await browser.openTab("Columns");
  await page.getByText("Code appearance", { exact: true }).click();
  const columnColor = page.getByRole("button", { name: /^Column/ });
  await columnColor.click();
  const colorBoard = page.locator(".color-picker-panel-board");
  const boardBounds = await colorBoard.boundingBox();
  expect(boardBounds).not.toBeNull();
  await page.mouse.click(boardBounds!.x + boardBounds!.width * .7, boardBounds!.y + boardBounds!.height * .35);
  await expect(page.locator(".snippet")).not.toHaveCSS("background-color", "rgb(11, 16, 32)");
  const selectedColumnColor = await page.locator(".snippet").evaluate((column) => getComputedStyle(column).backgroundColor);
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.locator(".snippet")).toHaveCSS("background-color", selectedColumnColor);
  await expect(columnColor.locator(".color-field-value")).not.toHaveText("#0b1020");

  const textColor = page.getByRole("button", { name: /^Text/ });
  await textColor.click();
  await page.locator(".default-color-panel_item").nth(0).click();
  await expect(page.locator(".snippet")).toHaveCSS("color", "rgb(11, 16, 32)");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Color" })).toBeHidden();
  await expect(textColor).toContainText("#0b1020");
  await browser.expectHealthy();
});

test("lays out the page gradient editor without horizontal clipping", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await page.getByText("Background", { exact: true }).click();
  await page.getByRole("button", { name: /^Paint/ }).click();
  await page.getByText("Gradient", { exact: true }).click();

  const modal = page.getByRole("dialog", { name: "Paint" });
  await expect(modal).toHaveClass(/gradient-modal/);
  await expect(modal.locator(".gradient-result")).toBeVisible();
  await expect(modal.locator(".gradient-stops")).toBeVisible();
  await expect(modal.locator(".color-picker-panel")).toBeVisible();
  const layout = await modal.evaluate((element) => {
    const body = element.querySelector<HTMLElement>(".color-modal-body")!;
    const bounds = element.getBoundingClientRect();
    return {
      width: bounds.width,
      height: bounds.height,
      right: bounds.right,
      bottom: bounds.bottom,
      bodyClientWidth: body.clientWidth,
      bodyScrollWidth: body.scrollWidth,
    };
  });
  expect(layout.width).toBeGreaterThanOrEqual(460);
  expect(layout.height).toBeGreaterThanOrEqual(650);
  expect(layout.right).toBeLessThanOrEqual(1600);
  expect(layout.bottom).toBeLessThanOrEqual(1000);
  expect(layout.bodyScrollWidth).toBeLessThanOrEqual(layout.bodyClientWidth);
  await browser.expectHealthy();
});

test("accepts a typed CSS gradient value", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await page.getByText("Background", { exact: true }).click();
  await page.getByRole("button", { name: /^Paint/ }).click();
  await page.getByText("Gradient", { exact: true }).click();
  const value = "linear-gradient(90deg, rgb(255, 0, 0) 0%, rgb(0, 0, 255) 100%)";
  await page.getByLabel("CSS gradient").fill(value);
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.locator(".page")).toHaveCSS("background-image", value);

  await page.getByLabel("CSS gradient").fill("not a gradient");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "valid CSS" })).toBeVisible();
  await expect(page.locator(".page")).toHaveCSS("background-image", value);
  await browser.expectHealthy();
});

test("handles transparency through Paint instead of a separate source", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await page.getByText("Background", { exact: true }).click();
  const source = page.getByLabel("Background source");
  await expect(source.locator("option")).toHaveCount(2);
  await expect(source.locator("option")).toHaveText(["Paint", "Image URL"]);
  await page.getByRole("button", { name: /^Paint/ }).click();
  await expect(page.locator(".color-picker-panel-alpha")).toBeVisible();
  await browser.expectHealthy();
});

test("offers scoped multi-format export controls", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await browser.chooseMode("Grid");
  const toolbar = page.locator(".export-actions");
  const options = page.locator(".export-options");
  const fitContent = page.locator(".export-fit");
  const bounds = await Promise.all([toolbar, options, fitContent].map((element) => element.boundingBox()));
  expect(bounds.every(Boolean)).toBe(true);
  expect(bounds[1]!.width).toBeGreaterThan(bounds[0]!.width * .9);
  expect(bounds[2]!.width).toBeGreaterThan(bounds[0]!.width * .9);
  await page.getByLabel("Format").selectOption("pdf");
  await page.getByLabel("Pages").selectOption("current");
  await page.getByLabel("Resolution").selectOption("3");
  await expect(page.getByRole("button", { name: "Export PDF" })).toBeVisible();
  await page.getByLabel("Expand page to fit all code").check();
  await expect(page.getByLabel("Expand page to fit all code")).toBeChecked();
  await browser.expectHealthy();
});

test("downloads and copies exports in the standalone browser preview", async ({ page }) => {
  const browser = new SnippetCanvasBrowser(page);
  await browser.open();
  await page.getByRole("slider", { name: "Minimum page width (px)" }).fill("1000");
  await page.getByRole("slider", { name: "Minimum page height (px)" }).fill("700");
  const fitDimensions = await page.locator(".page").evaluate((element) => ({ width: element.offsetWidth, height: element.offsetHeight }));
  expect(fitDimensions).toEqual({ width: 1000, height: 700 });
  await expect(page.locator(".export-summary")).toContainText(`${fitDimensions.width * 2} × ${fitDimensions.height * 2} px per page`);

  for (const [format, extension] of [["png", "png"], ["jpeg", "jpg"], ["svg", "svg"], ["pdf", "pdf"]] as const) {
    await page.getByLabel("Format").selectOption(format);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: `Export ${format.toUpperCase()}` }).click();
    const completedDownload = await download;
    expect(completedDownload.suggestedFilename()).toMatch(new RegExp(`^snippetcanvas-\\d{4}-\\d{2}-\\d{2}\\.${extension}$`));
    const downloadedPath = await completedDownload.path();
    expect(downloadedPath).not.toBeNull();
    if (format === "png") {
      const png = await readFile(downloadedPath!);
      expect({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) }).toEqual({ width: fitDimensions.width * 2, height: fitDimensions.height * 2 });
    }
    if (format === "svg") {
      const svg = await readFile(downloadedPath!, "utf8");
      expect(svg).toContain(`width="${fitDimensions.width}"`);
      expect(svg).toContain(`height="${fitDimensions.height}"`);
    }
    if (format === "pdf") {
      const pdf = await PDFDocument.load(await readFile(downloadedPath!));
      const pdfPage = pdf.getPage(0);
      expect(pdfPage.getWidth()).toBeCloseTo(fitDimensions.width * .24, 5);
      expect(pdfPage.getHeight()).toBeCloseTo(fitDimensions.height * .24, 5);
    }
  }

  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { write: async (items: ClipboardItem[]) => { (window as Window & { previewClipboardItems?: ClipboardItem[] }).previewClipboardItems = items; } },
    });
  });
  await page.getByRole("button", { name: "Copy current page" }).click();
  await expect.poll(() => page.evaluate(() => (window as Window & { previewClipboardItems?: ClipboardItem[] }).previewClipboardItems?.length ?? 0)).toBe(1);
  await browser.expectHealthy();
});
