import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const demoDirectory = path.join(__dirname, "artifacts", "demo");

test.setTimeout(90_000);

test("@demo tour the SnippetCanvas composer", async ({ page }) => {
  const pause = (milliseconds = 850) => page.waitForTimeout(milliseconds);

  await page.goto("/webview-preview.html");
  await expect(page.getByRole("heading", { name: "Page" })).toBeVisible();
  await page.getByRole("slider", { name: "Workspace zoom" }).fill("85");
  await pause(1_200);

  // Demonstrate the three layout policies and their responsive controls.
  await page.getByRole("tab", { name: "Columns" }).click();
  await page.getByRole("button", { name: "Grid", exact: true }).click();
  await pause();
  await page.getByRole("slider", { name: "Maximum columns per row" }).fill("3");
  await pause();
  await page.getByRole("button", { name: "Flow", exact: true }).click();
  await pause();
  await page.getByRole("button", { name: "Fit", exact: true }).click();
  await pause();

  // Apply a polished preset that updates page and column presentation together.
  await page.getByLabel("Style preset").selectOption("Dracula");
  await pause(1_200);

  // Select a column and demonstrate its independent overrides.
  const column = page.locator("[data-column-id]").first();
  await column.click();
  await expect(page.getByRole("tab", { name: "Selected" })).toHaveAttribute("aria-selected", "true");
  await page.getByLabel("Title", { exact: true }).fill("Production-ready TypeScript");
  await page.getByLabel("Emphasize lines").fill("2, 4-6");
  await pause(1_100);
  await page.getByText("Decorations", { exact: true }).click();
  await page.getByLabel("Caption").fill("SnippetCanvas · composed in VS Code");
  await page.getByLabel("Icon or emoji").fill("✦");
  await pause(1_200);

  // Surface column-specific commands without executing destructive actions.
  await column.click({ button: "right" });
  await expect(page.getByRole("menuitem", { name: "Export this column as PNG" })).toBeVisible();
  await pause(1_200);
  await page.keyboard.press("Escape");

  // Show page background controls and multi-format export options.
  await page.getByRole("tab", { name: "Page" }).click();
  await page.getByText("Background", { exact: true }).click();
  await pause();
  await page.getByLabel("Format").selectOption("svg");
  await pause(1_200);

  // End with the distraction-free workspace and restore the controls.
  await page.getByRole("button", { name: "Collapse settings sidebar" }).click();
  await page.getByRole("slider", { name: "Workspace zoom" }).fill("100");
  await pause(1_200);
  await page.getByRole("button", { name: "Expand settings sidebar" }).click();
  await pause(900);

  const video = page.video();
  if (video) {
    await mkdir(demoDirectory, { recursive: true });
    await page.close();
    await video.saveAs(path.join(demoDirectory, "snippetcanvas-demo.webm"));
  }
});
