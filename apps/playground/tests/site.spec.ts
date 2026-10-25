import { test, expect } from "@playwright/test";

test("renders MoyaForge guides and the actual SnippetCanvas composer", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "SnippetCanvas", exact: true })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Documentation", exact: true });
  await nav.getByRole("link", { name: "Getting started" }).click();
  await expect(page.getByRole("heading", { name: "Getting started", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy code" })).toBeVisible();
  await nav.getByRole("link", { name: "Development", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Development", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Toggle appearance" }).click();
  await expect(page.locator(".mf-docs")).toHaveClass(/mf-docs-dark/);
  expect(await page.locator("main").evaluate((node) => node.getBoundingClientRect().width)).toBeGreaterThan(500);
  await page.screenshot({ path: testInfo.outputPath("playground.png"), fullPage: true });
  await nav.getByRole("link", { name: "Live composer" }).click();
  await expect(page.frameLocator("iframe").getByRole("heading", { name: "Page", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.frameLocator("iframe").locator("[data-column-id]")).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Live composer", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
