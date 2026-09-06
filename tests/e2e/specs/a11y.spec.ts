import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./_setup-bypass";

/**
 * Accessibility gate (CLAUDE.md: WCAG 2.1 AA is mandatory). The static sweep
 * covers markup shape; this runs axe-core in a real browser over the rewritten
 * pages and fails on serious/critical violations — the contrast / ARIA / name
 * checks that only a runtime engine can make. Uses the shared authed context so
 * protected pages (Plans, Snapshots, Diff, Assistant) are reachable.
 */
const ROUTES = [
  "/",
  "/gamedata",
  "/calculator",
  "/plans",
  "/snapshots",
  "/diff",
  "/assistant",
] as const;

for (const route of ROUTES) {
  test(`a11y: ${route} has no serious or critical violations`, async ({ page }) => {
    await page.goto(route);
    // Let the SPA render its main region before scanning (single, stable match).
    await page.getByRole("main").waitFor({ state: "visible" });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    const summary = blocking
      .map(
        (v) =>
          `${v.id} (${v.impact}): ${v.help}\n` +
          v.nodes
            .map((n) => `    target=${n.target.join(" ")}\n    ${n.failureSummary ?? ""}`)
            .join("\n"),
      )
      .join("\n");

    expect(blocking, `axe violations on ${route}:\n${summary}`).toEqual([]);
  });
}
