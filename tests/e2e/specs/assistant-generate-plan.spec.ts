import { test, expect } from "./_setup-bypass";

test.describe("Assistant — generate a factory plan", () => {
  test("plan mode submits a prompt through generate-plan and renders the reply", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open assistant" }).click();

    const modeBtn = page.getByTestId("assistant-plan-mode");
    await modeBtn.click();
    await expect(modeBtn).toHaveAttribute("aria-pressed", "true");

    await page
      .getByRole("dialog")
      .getByRole("textbox")
      .fill("120 iron plate per minute");
    await page.keyboard.press("Enter");

    // The e2e backend has no imported game data, so the deterministic pipeline
    // returns a clarification (it never invents recipes). Asserting it proves
    // the full round-trip: toggle -> POST /assistant/generate-plan -> reply bubble.
    await expect(page.getByText(/import a satisfactory data zip/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
