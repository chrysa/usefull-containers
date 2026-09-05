import { test as base } from "@playwright/test";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { authToken, seedAuthedContext, expect } from "./_setup-bypass";

/**
 * Gate scenario (spec §8): the product's kill-test is that a *real* Satisfactory
 * `.sav` can be imported through the browser, parsed 100% client-side, and turned
 * into a persisted snapshot. This is the one leg the unit tests (parse/reduce/diff)
 * and the render-only track spec cannot cover — the wired file-input → parse →
 * mutation → UI integration.
 *
 * The `.sav` is NOT committed (large binary + personal data). Drop one into
 * `tests/e2e/.local-fixtures/` (git-ignored) and it runs; otherwise it skips.
 * Uses a dedicated, unique user so the created snapshot cannot pollute the
 * shared-user empty-state assertions in track.spec.
 */
const FIXTURE_DIR = join(process.cwd(), ".local-fixtures");

function findLocalSave(): string | null {
  try {
    const name = readdirSync(FIXTURE_DIR).find((f) => f.toLowerCase().endsWith(".sav"));
    return name ? join(FIXTURE_DIR, name) : null;
  } catch {
    return null;
  }
}

const test = base.extend({
  context: async ({ context }, use) => {
    const unique = `gate_${Date.now()}`;
    const token = await authToken(unique);
    await seedAuthedContext(context, token, unique);
    await use(context);
  },
});

test.describe("Gate parcours — real .sav import", () => {
  test("importing a real .sav creates a snapshot", async ({ page }) => {
    const save = findLocalSave();
    test.skip(
      save === null,
      "Drop a .sav into tests/e2e/.local-fixtures/ to run the gate import scenario",
    );

    await page.goto("/snapshots");
    await expect(page.getByRole("button", { name: "Import save" })).toBeVisible();
    await expect(page.getByText(/no snapshot/i)).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles(save!);

    // Client-side parse + reduce + persist + refetch can take a while on a real
    // save; the empty state disappearing is the definitive success signal.
    await expect(page.getByText(/no snapshot/i)).toHaveCount(0, { timeout: 60_000 });
    await expect(page.getByRole("button", { name: "Import save" })).toBeVisible();
  });
});
