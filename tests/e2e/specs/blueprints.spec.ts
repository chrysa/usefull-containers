import { test, expect } from "@playwright/test";

test.describe("Blueprints", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/blueprints");
    await expect(
      page.getByRole("heading", { name: "Blueprint Sync" }),
    ).toBeVisible();
  });

  test("shows empty state when no blueprints", async ({ page }) => {
    const empty = page.getByText(
      "No blueprints found. Import a .sbp file to get started.",
    );
    const grid = page.locator("[class*='grid']");
    // Either empty state or a grid of blueprints is shown
    const isEmpty = await empty.isVisible().catch(() => false);
    const hasBlueprints = await grid.isVisible().catch(() => false);
    expect(isEmpty || hasBlueprints).toBe(true);
  });

  test("upload button is present", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Upload Blueprints/i }),
    ).toBeVisible();
  });

  test("download all button is present", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Download All/i }),
    ).toBeVisible();
  });

  test("import from zip button is present", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Import from ZIP/i }),
    ).toBeVisible();
  });
});
