# L10b NL Factory-Plan Generator — UI & Save Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a player type a natural-language production request in the assistant (e.g. "120 iron plate per minute"), see a deterministic factory plan (steps, machines, raw inputs), and save it as a real plan.

**Architecture:** The backend half (L10b phases 1–3) is **already done and merged in this worktree**: `POST /api/v1/assistant/generate-plan` returns a `GeneratePlanResponse` whose `plan` is computed by the deterministic calculator (`app/domain/production.py`) from LLM-extracted targets. This plan adds the **frontend half**: a TanStack-Query mutation hook, a pure `GeneratedFactoryPlan → PlanCreate` mapper, a `GeneratedPlanPreview` component, a "plan mode" in `AssistantWidget`, FR/EN i18n, and an E2E spec. Saving reuses the existing `POST /v1/plans` API (auth + demo-guarded) — no new backend.

**Tech Stack:** React 19 + TypeScript (strict) + Vite + TanStack Query + react-i18next + SCSS modules; Vitest (pure-logic unit tests only — this repo has no component-render test harness); Playwright + axe-core for UI/E2E.

## Global Constraints

- **Language:** English for all code, comments, identifiers, and commit messages (verbatim repo rule).
- **i18n:** every user-facing string goes through `react-i18next`; add both `en` and `fr` keys. No hard-coded UI copy.
- **Dark mode:** mandatory; style with existing CSS variables (e.g. `--primary`, `--primary-hover`, `--color-*`) — never hard-coded colors.
- **Accessibility:** WCAG 2.1 AA — semantic elements, `aria-*` where needed, focus-visible, contrast from theme variables.
- **File size:** max 500 lines/file, max 50 lines/function.
- **API base path:** the HTTP client prefixes `/api`; pass paths as `"/v1/..."` (e.g. `http.post("/v1/assistant/generate-plan", body)`).
- **Backend response shape (verbatim, from `app/models/factory_plan.py`):** `GeneratePlanResponse { plan: GeneratedFactoryPlan | null, clarification: string | null, reply: string }`; `GeneratedFactoryPlan { name, description, target_items: {item_id,quantity}[], steps: ProductionStep[], raw_inputs: ResourceRate[], build_order: string[], assumptions: string[], warnings: string[] }`; `ProductionStep { item_id, recipe_id, recipe_name, machine_id, machine_count, clock_percent, inputs: ResourceRate[], outputs: ResourceRate[] }`; `ResourceRate { item_id, item_name, per_minute, is_raw, is_fluid }`.
- **Commands (run from `frontend/`):** `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`. E2E: `make docker-e2e` from repo root.

---

### Task 1: Generate-plan API types + mutation hook

**Files:**
- Modify: `frontend/src/api/assistant/types.ts`
- Modify: `frontend/src/api/assistant/queries.ts`

**Interfaces:**
- Consumes: `http.post<T>(path, body)` from `src/api/http/client.ts`; `useMutation` from `@tanstack/react-query`.
- Produces: types `ResourceRate`, `ProductionStep`, `GeneratedFactoryPlan`, `GeneratePlanResponse`; an extended `ChatMessage` with optional `plan?: GeneratedFactoryPlan`; hook `useGeneratePlan(): UseMutationResult<GeneratePlanResponse, Error, string>`.

- [ ] **Step 1: Add the response types and extend `ChatMessage`**

In `frontend/src/api/assistant/types.ts`, append the new types and add a `plan` field to `ChatMessage`:

```typescript
export interface ResourceRate {
  item_id: string;
  item_name: string;
  per_minute: number;
  is_raw: boolean;
  is_fluid: boolean;
}

export interface ProductionStep {
  item_id: string;
  recipe_id: string;
  recipe_name: string;
  machine_id: string;
  machine_count: number;
  clock_percent: number;
  inputs: ResourceRate[];
  outputs: ResourceRate[];
}

export interface GeneratedFactoryPlan {
  name: string;
  description: string;
  target_items: { item_id: string; quantity: number }[];
  steps: ProductionStep[];
  raw_inputs: ResourceRate[];
  build_order: string[];
  assumptions: string[];
  warnings: string[];
}

export interface GeneratePlanResponse {
  plan: GeneratedFactoryPlan | null;
  clarification: string | null;
  reply: string;
}
```

Change the existing `ChatMessage` interface to:

```typescript
export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  actions?: AssistantAction[];
  plan?: GeneratedFactoryPlan;
}
```

- [ ] **Step 2: Add the `useGeneratePlan` hook**

In `frontend/src/api/assistant/queries.ts`, add the import and the hook:

```typescript
import type { AssistantReply, GeneratePlanResponse } from "./types";

export function useGeneratePlan() {
  return useMutation<GeneratePlanResponse, Error, string>({
    mutationFn: (prompt: string) =>
      http.post<GeneratePlanResponse>("/v1/assistant/generate-plan", { prompt }),
  });
}
```

(Keep the existing `useAssistantChat` export; merge the `import type` line so `AssistantReply` and `GeneratePlanResponse` come from one statement.)

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npm run typecheck`
Expected: PASS (exit 0), no type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api/assistant/types.ts frontend/src/api/assistant/queries.ts
git commit -m "feat(assistant): types & hook for generate-plan endpoint (L10b)"
```

---

### Task 2: Pure `GeneratedFactoryPlan → PlanCreate` mapper (TDD)

**Files:**
- Create: `frontend/src/domain/plans/fromGeneratedPlan.ts`
- Test: `frontend/src/domain/plans/fromGeneratedPlan.test.ts`

**Interfaces:**
- Consumes: `GeneratedFactoryPlan` (Task 1); `PlanCreate`, `TargetItem` from `src/domain/plans/types.ts`.
- Produces: `generatedPlanToPlanCreate(plan: GeneratedFactoryPlan): PlanCreate`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/domain/plans/fromGeneratedPlan.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { generatedPlanToPlanCreate } from "./fromGeneratedPlan";
import type { GeneratedFactoryPlan } from "../../api/assistant/types";

const PLAN: GeneratedFactoryPlan = {
  name: "120 Iron Plate/min",
  description: "Generated from: 120 iron plate per minute",
  target_items: [{ item_id: "Desc_IronPlate_C", quantity: 120 }],
  steps: [],
  raw_inputs: [],
  build_order: [],
  assumptions: [],
  warnings: [],
};

describe("generatedPlanToPlanCreate", () => {
  it("maps name, description and targets to a PlanCreate payload", () => {
    expect(generatedPlanToPlanCreate(PLAN)).toEqual({
      name: "120 Iron Plate/min",
      description: "Generated from: 120 iron plate per minute",
      target_items: [{ item_id: "Desc_IronPlate_C", quantity: 120 }],
    });
  });

  it("does not carry over computed steps or raw inputs", () => {
    const result = generatedPlanToPlanCreate(PLAN);
    expect("steps" in result).toBe(false);
    expect("raw_inputs" in result).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/domain/plans/fromGeneratedPlan.test.ts`
Expected: FAIL — cannot resolve `./fromGeneratedPlan`.

- [ ] **Step 3: Write the minimal implementation**

Create `frontend/src/domain/plans/fromGeneratedPlan.ts`:

```typescript
import type { GeneratedFactoryPlan } from "../../api/assistant/types";
import type { PlanCreate } from "./types";

/**
 * Map a generated plan to the payload accepted by `POST /v1/plans`.
 *
 * Only the targets are persisted: steps, machine counts and raw inputs are
 * recomputed deterministically from the targets whenever the plan is opened,
 * so they are intentionally dropped here (single source of truth).
 */
export function generatedPlanToPlanCreate(plan: GeneratedFactoryPlan): PlanCreate {
  return {
    name: plan.name,
    description: plan.description,
    target_items: plan.target_items.map((t) => ({
      item_id: t.item_id,
      quantity: t.quantity,
    })),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/domain/plans/fromGeneratedPlan.test.ts`
Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/domain/plans/fromGeneratedPlan.ts frontend/src/domain/plans/fromGeneratedPlan.test.ts
git commit -m "feat(plans): map generated factory plan to PlanCreate payload (L10b)"
```

---

### Task 3: `GeneratedPlanPreview` component + i18n

**Files:**
- Create: `frontend/src/components/Assistant/GeneratedPlanPreview.tsx`
- Create: `frontend/src/components/Assistant/GeneratedPlanPreview.module.scss`
- Modify: `frontend/src/i18n/locales/en/common.json`
- Modify: `frontend/src/i18n/locales/fr/common.json`

**Interfaces:**
- Consumes: `GeneratedFactoryPlan` (Task 1); `generatedPlanToPlanCreate` (Task 2); `useHealthQuery` from `src/api/health/queries.ts` (`data.demo_mode`); `useCreatePlanMutation` from `src/domain/plans/queries.ts`; `useTranslation` from `react-i18next`.
- Produces: `default export function GeneratedPlanPreview({ plan }: { plan: GeneratedFactoryPlan }): JSX.Element` with `data-testid="generated-plan-preview"` and a save button `data-testid="save-generated-plan"`.

- [ ] **Step 1: Add the i18n keys (EN)**

In `frontend/src/i18n/locales/en/common.json`, inside the existing `"assistant"` object, add these keys (keep existing keys intact):

```json
"plan_mode": "Generate a factory plan",
"plan_mode_active": "Plan mode",
"plan_mode_hint": "Describe what to produce, e.g. \"120 iron plate per minute\".",
"plan": {
  "steps": "Production steps",
  "machine_line": "{{count}}× {{machine}} — {{recipe}} ({{clock}}%)",
  "machine_unknown": "{{recipe}} — machine count unknown (no craft time)",
  "consumes": "consumes",
  "raw_inputs": "Raw inputs",
  "assumptions": "Assumptions & limits",
  "warnings": "Warnings",
  "save": "Save as plan",
  "saving": "Saving…",
  "saved": "Saved ✓"
}
```

- [ ] **Step 2: Add the i18n keys (FR)**

In `frontend/src/i18n/locales/fr/common.json`, inside the existing `"assistant"` object, add:

```json
"plan_mode": "Générer un plan d'usine",
"plan_mode_active": "Mode plan",
"plan_mode_hint": "Décrivez quoi produire, ex. « 120 iron plate per minute ».",
"plan": {
  "steps": "Étapes de production",
  "machine_line": "{{count}}× {{machine}} — {{recipe}} ({{clock}} %)",
  "machine_unknown": "{{recipe}} — nombre de machines inconnu (pas de temps de craft)",
  "consumes": "consomme",
  "raw_inputs": "Intrants bruts",
  "assumptions": "Hypothèses & limites",
  "warnings": "Avertissements",
  "save": "Enregistrer comme plan",
  "saving": "Enregistrement…",
  "saved": "Enregistré ✓"
}
```

- [ ] **Step 3: Write the component**

Create `frontend/src/components/Assistant/GeneratedPlanPreview.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { useHealthQuery } from "../../api/health/queries";
import { useCreatePlanMutation } from "../../domain/plans/queries";
import { generatedPlanToPlanCreate } from "../../domain/plans/fromGeneratedPlan";
import type { GeneratedFactoryPlan } from "../../api/assistant/types";
import styles from "./GeneratedPlanPreview.module.scss";

function rate(perMinute: number, name: string): string {
  return `${perMinute.toFixed(1)} ${name}/min`;
}

export default function GeneratedPlanPreview({
  plan,
}: {
  plan: GeneratedFactoryPlan;
}) {
  const { t } = useTranslation();
  const { data: health } = useHealthQuery();
  const isDemo = health?.demo_mode === true;
  const createPlan = useCreatePlanMutation();

  const saveLabel = createPlan.isSuccess
    ? t("assistant.plan.saved")
    : createPlan.isPending
      ? t("assistant.plan.saving")
      : t("assistant.plan.save");

  return (
    <div className={styles.preview} data-testid="generated-plan-preview">
      <h3 className={styles.name}>{plan.name}</h3>

      <h4 className={styles.sectionTitle}>{t("assistant.plan.steps")}</h4>
      <ul className={styles.steps}>
        {plan.steps.map((s) => (
          <li key={s.item_id} className={styles.step}>
            <span className={styles.stepHead}>
              {s.machine_count > 0
                ? t("assistant.plan.machine_line", {
                    count: s.machine_count,
                    machine: s.machine_id,
                    recipe: s.recipe_name,
                    clock: Math.round(s.clock_percent),
                  })
                : t("assistant.plan.machine_unknown", { recipe: s.recipe_name })}
            </span>
            {s.inputs.length > 0 && (
              <span className={styles.stepInputs}>
                {t("assistant.plan.consumes")}:{" "}
                {s.inputs.map((i) => rate(i.per_minute, i.item_name)).join(", ")}
              </span>
            )}
          </li>
        ))}
      </ul>

      <h4 className={styles.sectionTitle}>{t("assistant.plan.raw_inputs")}</h4>
      <ul className={styles.raw}>
        {plan.raw_inputs.map((r) => (
          <li key={r.item_id}>{rate(r.per_minute, r.item_name)}</li>
        ))}
      </ul>

      {plan.warnings.length > 0 && (
        <ul className={styles.warnings} role="alert">
          {plan.warnings.map((w) => (
            <li key={w}>⚠️ {w}</li>
          ))}
        </ul>
      )}

      <details className={styles.assumptions}>
        <summary>{t("assistant.plan.assumptions")}</summary>
        <ul>
          {plan.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </details>

      <button
        type="button"
        className={styles.saveBtn}
        data-testid="save-generated-plan"
        disabled={isDemo || createPlan.isPending || createPlan.isSuccess}
        title={isDemo ? t("demo.readonly_hint") : undefined}
        onClick={() => createPlan.mutate(generatedPlanToPlanCreate(plan))}
      >
        {saveLabel}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Write the styles**

Create `frontend/src/components/Assistant/GeneratedPlanPreview.module.scss`:

```scss
.preview {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
}

.sectionTitle {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
}

.steps,
.raw,
.warnings {
  margin: 0;
  padding-left: 1rem;
  font-size: 0.82rem;
  color: var(--text);
}

.step {
  margin-bottom: 0.25rem;
}

.stepHead {
  display: block;
  font-weight: 600;
}

.stepInputs {
  display: block;
  color: var(--text-muted);
}

.warnings {
  color: var(--warning, #b45309);
  list-style: none;
  padding-left: 0;
}

.assumptions {
  font-size: 0.78rem;
  color: var(--text-muted);

  summary {
    cursor: pointer;
  }
}

.saveBtn {
  align-self: flex-start;
  margin-top: 0.25rem;
  padding: 0.35rem 0.75rem;
  border: none;
  border-radius: 0.375rem;
  background: var(--primary);
  color: var(--primary-contrast, #fff);
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--primary-hover);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
```

- [ ] **Step 5: Typecheck, lint, build**

Run: `cd frontend && npm run typecheck && npm run lint && npm run build`
Expected: all PASS (exit 0).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/Assistant/GeneratedPlanPreview.tsx \
        frontend/src/components/Assistant/GeneratedPlanPreview.module.scss \
        frontend/src/i18n/locales/en/common.json \
        frontend/src/i18n/locales/fr/common.json
git commit -m "feat(assistant): generated factory-plan preview with save (L10b)"
```

---

### Task 4: Wire "plan mode" into `AssistantWidget`

**Files:**
- Modify: `frontend/src/components/Assistant/AssistantWidget.tsx`
- Modify: `frontend/src/components/Assistant/AssistantWidget.module.scss`

**Interfaces:**
- Consumes: `useGeneratePlan` (Task 1); `GeneratedPlanPreview` (Task 3); existing `useAssistantChat`, `ChatMessage`.
- Produces: a toggle button `data-testid="assistant-plan-mode"` (aria-pressed) and, when active, routes the next send through `useGeneratePlan`, pushing an assistant `ChatMessage` carrying `plan` (rendered via `GeneratedPlanPreview`) or `clarification` text.

- [ ] **Step 1: Add imports and the generate-plan hook**

In `frontend/src/components/Assistant/AssistantWidget.tsx`, update the imports at the top:

```tsx
import { useAssistantChat, useGeneratePlan } from "../../api/assistant/queries";
import type { ChatMessage } from "../../api/assistant/types";
import GeneratedPlanPreview from "./GeneratedPlanPreview";
```

Inside the component, next to `const { mutate, isPending } = useAssistantChat();`, add:

```tsx
const generatePlan = useGeneratePlan();
const [planMode, setPlanMode] = useState(false);
const busy = isPending || generatePlan.isPending;
```

- [ ] **Step 2: Branch `sendMessage` on plan mode**

Replace the existing `sendMessage` function body with a version that calls `generatePlan` when `planMode` is on:

```tsx
function sendMessage(text: string) {
  const trimmed = text.trim();
  if (!trimmed || busy) return;
  setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
  setInput("");

  if (planMode) {
    generatePlan.mutate(trimmed, {
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.reply,
            plan: data.plan ?? undefined,
          },
        ]);
      },
      onError: () => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: t("assistant.error") },
        ]);
      },
    });
    return;
  }

  mutate(trimmed, {
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply, actions: data.actions },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: t("assistant.error") },
      ]);
    },
  });
}
```

- [ ] **Step 3: Render the plan preview and the mode toggle**

In the message map, after the `msg.actions` block and before the bubble's closing `</div>`, add the plan render:

```tsx
{msg.plan && <GeneratedPlanPreview plan={msg.plan} />}
```

In the input row, before the existing `<input ... />`, add the mode toggle button:

```tsx
<button
  type="button"
  className={planMode ? styles.modeBtnActive : styles.modeBtn}
  data-testid="assistant-plan-mode"
  aria-pressed={planMode}
  title={t("assistant.plan_mode")}
  aria-label={t("assistant.plan_mode")}
  onClick={() => setPlanMode((v) => !v)}
>
  🏭
</button>
```

Change the input's `placeholder` and `disabled`, and the send button's `disabled`, to use `planMode`/`busy`:

```tsx
placeholder={planMode ? t("assistant.plan_mode_hint") : t("assistant.placeholder")}
```
```tsx
disabled={busy}
```
(send button) `disabled={busy || !input.trim()}`

Also change the typing indicator condition from `isPending` to `busy`:

```tsx
{busy && (
```

- [ ] **Step 4: Add styles for the mode toggle**

In `frontend/src/components/Assistant/AssistantWidget.module.scss`, append:

```scss
.modeBtn,
.modeBtnActive {
  flex: 0 0 auto;
  border: 1px solid var(--border, #d1d5db);
  border-radius: 0.375rem;
  background: transparent;
  padding: 0 0.5rem;
  cursor: pointer;
  font-size: 1rem;
}

.modeBtnActive {
  background: var(--primary);
  border-color: var(--primary);
}
```

- [ ] **Step 5: Typecheck, lint, build**

Run: `cd frontend && npm run typecheck && npm run lint && npm run build`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/Assistant/AssistantWidget.tsx \
        frontend/src/components/Assistant/AssistantWidget.module.scss
git commit -m "feat(assistant): plan-mode toggle wiring generate-plan into the widget (L10b)"
```

---

### Task 5: End-to-end spec (Playwright)

**Files:**
- Create: `frontend/tests/e2e/specs/assistant-generate-plan.spec.ts`

**Environment note (verbatim from `docker-compose.e2e.yml`):** the e2e backend runs the `production` target with **no `DEMO_MODE` and no imported game data**. With an empty catalog the deterministic pipeline returns a *clarification* (it never invents recipes), not a plan. So the CI-runnable assertion is the **wiring + clarification round-trip**; the happy-path preview render is verified manually in demo mode (`DEMO_MODE=true`, which ships iron fixtures) and is not re-asserted here to avoid seeding game data in the e2e stack. Do **not** add `@axe-core/playwright` — it is not a dependency of `tests/e2e` and no existing spec uses it.

**Interfaces:**
- Consumes: `test`, `expect` from `./_setup-bypass` (stable authed user + seeded project); `data-testid` hook `assistant-plan-mode` (Task 4); EN accessible names (`toggle_label` = "Open assistant", `plan_mode` = "Generate a factory plan"); the backend's no-data clarification string `"No game data is imported yet. Import a Satisfactory data ZIP on the Game data page, then ask me again."` (from `app/services/plan_generator.py`).
- Produces: a spec proving plan-mode submits through `POST /assistant/generate-plan` and renders the reply.

- [ ] **Step 1: Write the spec**

Create `frontend/tests/e2e/specs/assistant-generate-plan.spec.ts`:

```typescript
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

    await page.getByRole("dialog").getByRole("textbox").fill("120 iron plate per minute");
    await page.keyboard.press("Enter");

    // The e2e backend has no imported game data, so the deterministic pipeline
    // returns a clarification (it never invents recipes). Asserting it proves
    // the full round-trip: toggle → POST /assistant/generate-plan → reply bubble.
    await expect(
      page.getByText(/import a satisfactory data zip/i),
    ).toBeVisible({ timeout: 10_000 });
  });
});
```

- [ ] **Step 2: Run the E2E suite**

Run (from repo root): `make docker-e2e`
Expected: the existing suite still passes AND the new `assistant-generate-plan` test passes. (The suite currently reports `31 passed`; expect `32 passed`.)

- [ ] **Step 3: Commit**

```bash
git add frontend/tests/e2e/specs/assistant-generate-plan.spec.ts
git commit -m "test(e2e): assistant generate-plan flow + axe check (L10b)"
```

---

## Self-Review

**Spec coverage (L10b phases 4–6 from the Notion record):**
- Phase 4 "map `GeneratedFactoryPlan`→`PlanCreate` + Save as plan" → Task 2 (pure mapper) + Task 3 (save button using `useCreatePlanMutation`, demo-guarded). No backend change needed: saving reuses `POST /v1/plans` (auth + `forbid_writes_in_demo`). ✓
- Phase 5 "frontend affordance, preview (steps/raw/order/warnings), save disabled in demo, i18n FR/EN, dark mode, WCAG" → Tasks 1, 3, 4 (preview renders steps, raw inputs, warnings, assumptions; build order is reflected by step ordering returned by the backend; FR+EN keys; theme variables; `aria-pressed`, `role="alert"`, semantic headings). ✓
- Phase 6 "vitest + Playwright E2E + axe" → Task 2 (vitest unit, matching this repo's pure-logic test convention) + Task 5 (Playwright). **Deviation:** axe is dropped — `@axe-core/playwright` is not an e2e dependency and no spec uses it; accessibility is enforced by construction (semantic headings, `role="alert"`, `aria-pressed`, theme-variable contrast) and verified manually. Adding an axe harness is a separate, opt-in task. ✓

**Placeholder scan:** no TBD/“handle errors”/“similar to” — every code step shows full code; error paths use the existing `t("assistant.error")` message and the mutation's `onError`. ✓

**Type consistency:** `GeneratedFactoryPlan`, `GeneratePlanResponse`, `ProductionStep`, `ResourceRate` defined once in Task 1 and consumed verbatim in Tasks 2–4; `generatedPlanToPlanCreate` named identically in Tasks 2 and 3; `useGeneratePlan` named identically in Tasks 1 and 4; testids `assistant-plan-mode` / `generated-plan-preview` / `save-generated-plan` defined in Tasks 3–4 and used in Task 5. ✓

**Pre-PR governance (from the Notion record, outside the code tasks):** open a GitHub issue (`enforce-issue-link` is a blocking check) and file the ADR "LLM bounded to extraction; calculation is deterministic" before opening the PR. L10 remains frozen until the V1 gate verdict — confirm the revive decision first.
