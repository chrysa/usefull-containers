import { test as base, request as playwrightRequest } from "@playwright/test";

/**
 * Shared fixture for specs that are NOT about the setup wizard.
 *
 * It pre-sets the setup-wizard flag and, since plans/blueprints endpoints are
 * auth-gated (A-04), registers a throwaway user against the live backend and
 * injects the resulting JWT into localStorage so the app loads authenticated.
 */
export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    // Register a unique throwaway user and grab a real bearer token.
    const api = await playwrightRequest.newContext({ baseURL });
    const username = `e2e_user_${Date.now()}`;
    let token = "";
    try {
      const resp = await api.post("/api/v1/auth/register", {
        data: { username, password: "e2e-password-123" },
      });
      if (resp.ok()) {
        token = (await resp.json()).access_token as string;
      }
    } finally {
      await api.dispose();
    }

    await context.addInitScript((tok) => {
      try {
        window.localStorage.setItem("sfm.setup.completed", "true");
        if (tok) {
          window.localStorage.setItem("sfm.auth.token", tok);
        }
      } catch {
        /* noop */
      }
    }, token);

    await use(context);
  },
});

export { expect } from "@playwright/test";
