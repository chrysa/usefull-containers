import { test, expect } from "@playwright/test";

test.describe("Home Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible();
  });

  test("displays stat cards", async ({ page }) => {
    await expect(page.getByText("Blueprints").first()).toBeVisible();
    await expect(page.getByText("Unique Tags")).toBeVisible();
    await expect(page.getByText("Plans").first()).toBeVisible();
    await expect(page.getByText("Hub Status")).toBeVisible();
  });

  test("shows hub status indicator", async ({ page }) => {
    const hub = page.getByText(/Online|Offline|Checking/);
    await expect(hub.first()).toBeVisible();
  });

  test("shows quick access section", async ({ page }) => {
    await expect(page.getByText("Quick Access")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Manage Blueprints" })
    ).toBeVisible();
  });

  test("Manage Blueprints link navigates to blueprints", async ({ page }) => {
    await page.getByRole("link", { name: "Manage Blueprints" }).click();
    await expect(page).toHaveURL(/\/blueprints/);
  });
});
