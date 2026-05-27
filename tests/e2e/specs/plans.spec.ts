import { test, expect } from "./_setup-bypass";

const TEST_PLAN_NAME = "E2E Test Plan";
const TEST_PLAN_DESC = "Created by Playwright E2E test suite";
const DELETE_PLAN_NAME = "E2E Delete Me";

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
  // Wait for dialog to close — confirms the API call succeeded.
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10_000 });
}

test.describe("Plans — page elements", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/plans");
    await expect(
      page.getByRole("heading", { name: "Factory Plans" }),
    ).toBeVisible();
  });

  test("shows New Plan button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "New Plan" })).toBeVisible();
  });

  test("shows search input", async ({ page }) => {
    await expect(
      page.getByRole("searchbox", { name: "Search plans\u2026" }),
    ).toBeVisible();
  });

  test("shows plans list or empty state", async ({ page }) => {
    const empty = page.getByText(
      "No plans yet. Create a plan to start organising your production.",
    );
    const planCards = page.locator("article");
    const isEmpty = await empty.isVisible().catch(() => false);
    const hasPlans = (await planCards.count()) > 0;
    expect(isEmpty || hasPlans).toBe(true);
  });
});

test.describe.serial("Plans — CRUD flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/plans");
    await expect(
      page.getByRole("heading", { name: "Factory Plans" }),
    ).toBeVisible();
  });

  test("opens the create form via New Plan button", async ({ page }) => {
    await page.getByRole("button", { name: "New Plan" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "New Factory Plan" }),
    ).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Description")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("creates a new plan", async ({ page }) => {
    await createPlan(page, TEST_PLAN_NAME, TEST_PLAN_DESC);
    await expect(
      page.locator("article").filter({ hasText: TEST_PLAN_NAME }).first(),
    ).toBeVisible();
  });

  test("searches for a plan by name", async ({ page }) => {
    const search = page.getByRole("searchbox", { name: "Search plans\u2026" });
    await search.fill(TEST_PLAN_NAME);
    await expect(
      page.locator("article").filter({ hasText: TEST_PLAN_NAME }).first(),
    ).toBeVisible();

    await search.fill("zzz_nonexistent_zzz");
    await expect(page.getByText("No plans match your search.")).toBeVisible();

    await search.fill("");
  });

  test("opens plan detail page", async ({ page }) => {
    const card = page
      .locator("article")
      .filter({ hasText: TEST_PLAN_NAME })
      .first();
    await card.getByRole("link", { name: "Open" }).click();
    await expect(page).toHaveURL(/\/plans\/\S+/);
    // Use heading to avoid matching the breadcrumb which also contains the plan name.
    await expect(
      page.getByRole("heading", { name: TEST_PLAN_NAME }),
    ).toBeVisible();
  });

  test("duplicates a plan", async ({ page }) => {
    const countBefore = await page
      .locator("article")
      .filter({ hasText: TEST_PLAN_NAME })
      .count();
    const card = page
      .locator("article")
      .filter({ hasText: TEST_PLAN_NAME })
      .first();
    await card.getByRole("button", { name: "Duplicate" }).click();
    await expect(
      page.locator("article").filter({ hasText: TEST_PLAN_NAME }),
    ).toHaveCount(countBefore + 1);
  });

  test("deletes a plan", async ({ page }) => {
    await createPlan(page, DELETE_PLAN_NAME);

    // Count before deletion (may be > 1 on serial test retries due to data contamination).
    const countBefore = await page
      .locator("article")
      .filter({ hasText: DELETE_PLAN_NAME })
      .count();

    // Override window.confirm in the browser to auto-accept without a native dialog.
    // page.on("dialog") is unreliable with globalThis.confirm() in headless Docker runs.
    await page.evaluate(() => {
      window.confirm = () => true;
    });

    const card = page
      .locator("article")
      .filter({ hasText: DELETE_PLAN_NAME })
      .first();
    // Use regex /^Delete / to avoid matching Edit/Duplicate buttons whose aria-labels also contain the plan name.
    await card.getByRole("button", { name: /^Delete / }).click();

    await expect(
      page.locator("article").filter({ hasText: DELETE_PLAN_NAME }),
    ).toHaveCount(countBefore - 1, { timeout: 10_000 });
  });
});
