import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./_setup-bypass";

/**
 * Accessibility gate (CLAUDE.md: WCAG 2.1 AA + dark mode are both mandatory).
 * Runs axe-core in a real browser over the rewritten pages, in BOTH themes,
 * failing on serious/critical violations — the contrast / ARIA / name checks
 * only a runtime engine can make. Uses the shared authed context so protected
 * pages (Plans, Snapshots, Diff, Assistant) are reachable.
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

const THEMES = ["light", "dark"] as const;

for (const theme of THEMES) {
  for (const route of ROUTES) {
    test(`a11y (${theme}): ${route} has no serious or critical violations`, async ({
      page,
    }) => {
      if (theme === "dark") {
        // useTheme reads this override before first paint and adds `.dark` to <html>.
        await page.addInitScript(() => {
          try {
            localStorage.setItem("sfm:theme:override", "dark");
          } catch {
            /* storage unavailable */
          }
        });
      }

      await page.goto(route);
      await page.getByRole("main").waitFor({ state: "visible" });
      if (theme === "dark") {
        await page.waitForFunction(() =>
          document.documentElement.classList.contains("dark"),
        );
      }

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

      expect(blocking, `axe violations on ${route} (${theme}):\n${summary}`).toEqual([]);
    });
  }
}
