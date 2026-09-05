import { test as base, request as playwrightRequest } from "@playwright/test";
import type { BrowserContext } from "@playwright/test";

/**
 * Shared fixture for specs that are NOT about the setup wizard.
 *
 * Since the nginx→vite-preview switch there is no `/api` proxy on the frontend
 * origin: the SPA talks to the backend cross-origin. This fixture:
 *   1. authenticates a STABLE shared user against the BACKEND (register, or log
 *      in if it already exists) and grabs a JWT;
 *   2. seeds an active project whose backendUrl points at that same backend, so
 *      the app's HTTP client targets it;
 *   3. marks that project's setup complete (the wizard flag is per-project since
 *      the multi-project change) and injects the JWT.
 *
 * A *stable* user is required: plan/blueprint storage is partitioned per user
 * (A-04b), and the CRUD specs run as `describe.serial` chains that share state
 * across tests (e.g. "create" then "search"/"open"/"delete"). A fresh user per
 * test would give each test an empty, isolated store and break those chains.
 *
 * `authToken` and `seedAuthedContext` are exported so a spec that needs an
 * *isolated* user (e.g. the gate import scenario, whose snapshot must not
 * pollute another spec's empty-state assertions) reuses the exact same setup
 * with a different username — without duplicating the localStorage seed.
 */
const API_URL = process.env.API_URL ?? "http://backend:8000";
const USERNAME = "e2e_shared_user";
const PASSWORD = "e2e-password-123"; // pragma: allowlist secret
const PROJECT_ID = "e2e";

export async function authToken(
  username: string = USERNAME,
  password: string = PASSWORD,
): Promise<string> {
  const api = await playwrightRequest.newContext({ baseURL: API_URL });
  try {
    const body = { username, password };
    let resp = await api.post("/api/v1/auth/register", { data: body });
    // 409 → the user already exists from a previous run: log in instead.
    if (resp.status() === 409) {
      resp = await api.post("/api/v1/auth/login", { data: body });
    }
    return resp.ok() ? ((await resp.json()).access_token as string) : "";
  } finally {
    await api.dispose();
  }
}

export async function seedAuthedContext(
  context: BrowserContext,
  token: string,
  projectId: string = PROJECT_ID,
): Promise<void> {
  await context.addInitScript(
    ({ tok, apiUrl, pid }) => {
      try {
        const project = {
          id: pid,
          name: "E2E",
          backendUrl: apiUrl,
          createdAt: "2026-01-01T00:00:00.000Z",
        };
        window.localStorage.setItem("sfm.projects", JSON.stringify([project]));
        window.localStorage.setItem("sfm.activeProjectId", pid);
        window.localStorage.setItem(`sfm.project.${pid}.setup.completed`, "true");
        // Legacy global flag — harmless to keep for older code paths.
        window.localStorage.setItem("sfm.setup.completed", "true");
        if (tok) {
          window.localStorage.setItem("sfm.auth.token", tok);
        }
      } catch {
        /* noop */
      }
    },
    { tok: token, apiUrl: API_URL, pid: projectId },
  );
}

export const test = base.extend({
  context: async ({ context }, use) => {
    const token = await authToken();
    await seedAuthedContext(context, token);
    await use(context);
  },
});

export { expect } from "@playwright/test";
