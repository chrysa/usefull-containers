import { test as base, expect } from "@playwright/test";

/**
 * A-05 — auth flow E2E.
 *
 * Unlike the other specs, this one does NOT use `_setup-bypass` (which injects
 * a ready-made JWT). It drives the real register / sign-out / sign-in UI, so
 * the app must start UNAUTHENTICATED. We only pre-set the setup-wizard flag so
 * the wizard does not intercept navigation.
 */
const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem("sfm.setup.completed", "true");
      } catch {
        /* noop */
      }
    });
    await use(context);
  },
});

const PASSWORD = "e2e-password-123";

// Persistent E2E DB → usernames must be unique across runs (and across the two
// tests below, which run sequentially with workers: 1).
function uniqueUsername(suffix: string): string {
  return `e2e_auth_${suffix}_${Date.now()}`;
}

test.describe("Auth flow (A-05)", () => {
  test("register through the UI, then reach the plans page", async ({ page }) => {
    const username = uniqueUsername("reg");

    await page.goto("/login");
    await page.getByRole("button", { name: "Register" }).click();
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    // Registration auto-logs-in and redirects to Home: the header now shows the
    // username and a Sign out control — proof the session is authenticated.
    await expect(page.getByText(username)).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

    // The authenticated user can open the plans page (auth-gated since A-04).
    await page.goto("/plans");
    await expect(page.getByRole("heading", { name: "Factory Plans" })).toBeVisible();
  });

  test("register, sign out, then sign in again through the UI", async ({ page }) => {
    const username = uniqueUsername("login");

    // Arrange: create the account via the Register tab.
    await page.goto("/login");
    await page.getByRole("button", { name: "Register" }).click();
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

    // Act: sign out (clears the token, redirects to /login)…
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);

    // …then sign in with the same credentials. The form defaults to the
    // "Sign in" tab; the submit button carries type="submit" (the tab button
    // shares the "Sign in" label, so target the submit by type).
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText(username)).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

    await page.goto("/plans");
    await expect(page.getByRole("heading", { name: "Factory Plans" })).toBeVisible();
  });
});
