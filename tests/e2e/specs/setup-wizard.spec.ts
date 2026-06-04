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

    // Wizard closed; with the plan skipped we land on the public dashboard
    // (the /plans route is auth-guarded since A-04 / the login-first model).
    await expect(page.getByTestId("setup-wizard")).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });

  // The onboarding wizard runs unauthenticated; A-04 made plans auth-mandatory
  // and we adopted a login-first model, so the first-plan step offers a sign-in
  // prompt instead of creating a plan (which would 401). Creating a plan from
  // the wizard while authenticated is covered indirectly by the plans specs.
  test("first-plan step prompts sign-in when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("setup-next").click(); // project → backend

    const status = page.getByTestId("setup-backend-status");
    await expect(status).toHaveAttribute("data-status", /online|offline/, {
      timeout: 10_000,
    });
    await page.getByTestId("setup-next").click(); // backend → first-plan

    await expect(
      page.getByRole("heading", { name: /Create your first plan/i }),
    ).toBeVisible();
    // Unauthenticated: a sign-in prompt replaces the create-plan control.
    const prompt = page.getByTestId("setup-plan-auth-required");
    await expect(prompt).toBeVisible();
    // Scope to the prompt: the header also has a "Sign in" link.
    await expect(prompt.getByRole("link", { name: /Sign in/i })).toBeVisible();
    await expect(page.getByTestId("setup-create-plan")).toHaveCount(0);
  });
});
