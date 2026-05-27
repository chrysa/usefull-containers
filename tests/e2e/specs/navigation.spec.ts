import { test, expect } from "./_setup-bypass";

test.describe("Navigation", () => {
  test("home page loads with Dashboard heading", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });

  test("blueprints page loads via nav link", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Blueprints", exact: true }).click();
    await expect(page).toHaveURL(/\/blueprints/);
    await expect(
      page.getByRole("heading", { name: "Blueprint Sync" }),
    ).toBeVisible();
  });

  test("plans page loads via nav link", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Plans", exact: true }).click();
    await expect(page).toHaveURL(/\/plans/);
    await expect(
      page.getByRole("heading", { name: "Factory Plans" }),
    ).toBeVisible();
  });

  test("game data page loads via nav link", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Game Data", exact: true }).click();
    await expect(page).toHaveURL(/\/gamedata/);
    await expect(
      page.getByRole("heading", { name: "Game Data" }),
    ).toBeVisible();
  });

  test("calculator page loads via nav link", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Calculator", exact: true }).click();
    await expect(page).toHaveURL(/\/calculator/);
    await expect(
      page.getByRole("heading", { name: "Production Calculator" }),
    ).toBeVisible();
  });

  test("unknown route shows 404 page", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.getByText("Page not found.")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Go back home" }),
    ).toBeVisible();
  });
});
