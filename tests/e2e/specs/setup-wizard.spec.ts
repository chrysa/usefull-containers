import { test, expect } from "@playwright/test";

test.describe("Setup Wizard", () => {
  test.beforeEach(async ({ context }) => {
    // Ensure first-run state: clear the completed flag before each test.
    await context.addInitScript(() => {
      try {
        window.localStorage.removeItem("sfm.setup.completed");
      } catch {
        /* noop */
      }
    });
  });

  test("appears on first visit with welcome step", async ({ page }) => {
    await page.goto("/");
    const wizard = page.getByTestId("setup-wizard");
    await expect(wizard).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Welcome to Factory Manager/i }),
    ).toBeVisible();
    await expect(page.getByTestId("setup-next")).toBeVisible();
  });

  test("Skip button dismisses the wizard and persists the choice", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("setup-wizard")).toBeVisible();
    await page.getByRole("button", { name: /Skip/i }).click();
    await expect(page.getByTestId("setup-wizard")).toBeHidden();

    // Reload — wizard should NOT reappear because the flag is set.
    await page.reload();
    await expect(page.getByTestId("setup-wizard")).toBeHidden();
  });

  test("walks through welcome → backend → first-plan → done", async ({
    page,
  }) => {
    await page.goto("/");
    const wizard = page.getByTestId("setup-wizard");
    await expect(wizard).toBeVisible();

    // Step 1: welcome
    await page.getByTestId("setup-next").click();

    // Step 2: backend status (should reach a terminal state quickly).
    const status = page.getByTestId("setup-backend-status");
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute("data-status", /online|offline/, {
      timeout: 10_000,
    });
    await page.getByTestId("setup-next").click();

    // Step 3: first plan — skip to keep the test resilient when the API is unavailable.
    await expect(
      page.getByRole("heading", { name: /Create your first plan/i }),
    ).toBeVisible();
    await page.getByTestId("setup-skip-plan").click();

    // Step 4: done
    await expect(page.getByRole("heading", { name: /All set/i })).toBeVisible();
    await page.getByTestId("setup-finish").click();

    // Wizard closed and navigation happened.
    await expect(page.getByTestId("setup-wizard")).toBeHidden();
    await expect(page).toHaveURL(/\/plans/);
  });

  test("creates a plan when a name is provided", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("setup-next").click(); // welcome → backend

    const status = page.getByTestId("setup-backend-status");
    await expect(status).toHaveAttribute("data-status", /online|offline/, {
      timeout: 10_000,
    });

    // If backend is offline, skip the create-plan branch — it can't succeed.
    const backendStatus = await status.getAttribute("data-status");
    test.skip(
      backendStatus !== "online",
      "Backend not online — cannot create a plan",
    );

    await page.getByTestId("setup-next").click(); // backend → first-plan

    const planName = `Setup Wizard Plan ${Date.now()}`;
    await page.getByTestId("setup-plan-name-input").fill(planName);
    await page.getByTestId("setup-create-plan").click();

    // After successful creation we land on the "done" step.
    await expect(page.getByRole("heading", { name: /All set/i })).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId("setup-finish").click();

    // Should redirect to the created plan's detail page.
    await expect(page).toHaveURL(/\/plans\/[^/]+/);
  });
});
