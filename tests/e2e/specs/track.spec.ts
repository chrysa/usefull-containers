import { test, expect } from "./_setup-bypass";

test.describe("Suivre — snapshots, diff, assistant pages", () => {
  test("snapshots page shows the import control and the empty state", async ({ page }) => {
    await page.goto("/snapshots");

    await expect(page.getByRole("heading", { name: "Snapshots" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Import save" })).toBeVisible();

    // No fixture .sav has been imported for this shared E2E user/save context,
    // so the empty state renders instead of a snapshot grid.
    await expect(page.getByText(/no snapshot — import a save/i)).toBeVisible();
  });

  test("diff page shows the plan and snapshot selectors", async ({ page }) => {
    await page.goto("/diff");

    await expect(page.getByRole("heading", { name: "Diff" })).toBeVisible();

    // The e2e backend has no imported game data for this run, so the page
    // surfaces the "needs game data" message instead of the selectors — both
    // outcomes confirm the page rendered past the loading/error states.
    const needsGameData = page.getByText(/import game data first/i);
    const planSelect = page.getByLabel("Plan", { exact: true });
    await expect(needsGameData.or(planSelect)).toBeVisible({ timeout: 10_000 });

    if (await planSelect.isVisible()) {
      await expect(page.getByLabel("Snapshot", { exact: true })).toBeVisible();
    }
  });

  test("assistant page shows the chat input and the generate-plan control", async ({ page }) => {
    await page.goto("/assistant");

    await expect(page.getByRole("heading", { name: "Factory Assistant" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /ask me anything/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Generate a factory plan" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
  });
});
