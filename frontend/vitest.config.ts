import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure-logic unit tests only (reduce.ts / diff.ts). React components are
    // covered by Playwright E2E, so we use the lightweight "node" env and do
    // not pull in jsdom. Add jsdom + ".test.tsx" to include if that ever changes.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
