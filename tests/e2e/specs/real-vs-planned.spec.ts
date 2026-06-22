import { test, expect } from "./_setup-bypass";

const TEST_PLAN_NAME = "E2E RvP Plan";
const TEST_PLAN_DESC = "Created by real-vs-planned E2E spec";

async function createPlan(
  page: import("@playwright/test").Page,
  name: string,
  description = "",
) {
  await page.getByRole("button", { name: "New Plan" }).click();
  await expect(
    page.getByRole("heading", { name: "New Factory Plan" }),
  ).toBeVisible();
  await page.getByLabel("Name").fill(name);
  if (description) {
    await page.getByLabel("Description").fill(description);
  }
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10_000 });
}

test.describe.serial("Real vs Planned — view toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/plans");
    await expect(
      page.getByRole("heading", { name: "Factory Plans" }),
    ).toBeVisible();

    // Ensure the test plan exists — create it if absent.
    const existing = page
      .locator("article")
      .filter({ hasText: TEST_PLAN_NAME });
    if ((await existing.count()) === 0) {
      await createPlan(page, TEST_PLAN_NAME, TEST_PLAN_DESC);
    }

    // Open the plan detail page.
    await page
      .locator("article")
      .filter({ hasText: TEST_PLAN_NAME })
      .first()
      .getByRole("link", { name: "Open" })
      .click();
    await expect(page).toHaveURL(/\/plans\/\S+/);
    await expect(
      page.getByRole("heading", { name: TEST_PLAN_NAME }),
    ).toBeVisible();
  });

  test("plan detail exposes the Actual-vs-planned view", async ({ page }) => {
    // The tablist toggle renders two tabs: "Target Items" and "Actual vs planned".
    const tab = page.getByRole("tab", { name: /actual vs planned/i });
    await expect(tab).toBeVisible();
    await tab.click();

    // The RealVsPlanned panel is now active.
    // Depending on whether game data was imported in this E2E run, one of two
    // outcomes is expected:
    //   (a) game data present   → the .sav dropzone button is visible
    //   (b) no game data        → "Import game data first" message is visible
    // Both outcomes confirm the panel rendered correctly after the tab switch.
    const dropzone = page.getByRole("button", {
      name: /drop a satisfactory \.sav/i,
    });
    const needsGameData = page.getByText(
      /import game data first/i,
    );

    await expect(dropzone.or(needsGameData)).toBeVisible({ timeout: 10_000 });
  });
});
