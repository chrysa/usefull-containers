import { test as base } from "@playwright/test";

/**
 * Shared fixture that pre-sets the setup-wizard flag so the wizard
 * does not block existing flows. Import and use this `test` in any spec
 * that is NOT about the wizard itself.
 */
export const test = base.extend({
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

export { expect } from "@playwright/test";
