# SFM — Lot 7 : Hardening (couverture tests + a11y + passe visuelle)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Durcir l'UI réécrite sans nouveau lot métier (gate-safe) : couverture Vitest de la logique métier pure non testée, polish accessibilité, et correction des régressions visuelles réelles constatées en lançant l'app.

**Architecture:** Front-only, backend intact. Tests Vitest (env node, logique pure uniquement — convention repo : composants via Playwright, PAS de jsdom/Testing Library). Correctifs a11y et visuels ciblés, token-backed.

**Tech Stack:** React 19, Vite 8, TS 7, Tailwind v4, Vitest 4 (node), Playwright.

**Spec:** `docs/superpowers/specs/2026-08-26-sfm-ui-rewrite-design.md`

## Global Constraints

- Aucun changement backend ni contrat API. Ne pas modifier `domain/*`/`api/*` sauf micro-correctif révélé par un test (auquel cas préserver le comportement public).
- **Tests** : Vitest env node, logique PURE seulement ; **pas de jsdom, pas de Testing Library, pas de test de composant React** (convention repo — les composants sont couverts par Playwright). Fichiers de test SANS annotations de type. Mirror le style existant (`diff.test.ts`, `groupByFactory.test.ts`) : `describe`/`it`, assertions simples. Ne PAS utiliser `Math.random`/`Date.now` non déterministes.
- Token-backed only pour tout correctif visuel/a11y ; pas de couleur en dur. React19/TS7, pas de `React.FC`.
- Docker only : Vitest `docker compose -f docker-compose.test.yml run --rm frontend-test` ; typecheck `... frontend-lint sh -c "npm run typecheck"` ; build `make build` ; E2E `make docker-e2e` (baseline 36/36). Conventional Commits, PAS de co-auteur IA ; dépôt chrysa (ne pas toucher git author).

## File Structure

- Tests créés : `frontend/src/domain/gamedata/{calculator,power,logistics,vehicles}.test.ts`, `frontend/src/utils/{formatPlayTime,formatDate}.test.ts`, `frontend/src/domain/projects/store.test.ts`, `frontend/src/domain/blueprints/{mapper,download}.test.ts`.
- a11y : `frontend/src/pages/GameData.tsx` (roving-tabindex), audit labels des pages réécrites.
- Visuel : correctifs ponctuels selon findings de la passe screenshots (Task 4).

---

### Task 1: Tests logique métier gamedata (calculator/power/logistics/vehicles)

**Files:** Create `frontend/src/domain/gamedata/{calculator,power,logistics,vehicles}.test.ts`.

- [ ] **Step 1: Read** the 4 modules + their `types.ts` + an existing test (`diff.test.ts`) for style. Identify each exported pure function's contract.
- [ ] **Step 2:** Write Vitest tests (node env, no type annotations) covering the core behavior + edge cases (empty input, boundary quantities, multi-recipe) of each exported function. Real assertions on computed values (not mocks).
- [ ] **Step 3: RED→GREEN** — run `docker compose -f docker-compose.test.yml run --rm frontend-test`; tests must pass. Fix a test (not the source) if it reveals your own misunderstanding; if a test reveals a genuine source bug, STOP and report it (do not silently change domain logic).
- [ ] **Step 4: Commit** `test(frontend): cover gamedata calculator/power/logistics/vehicles logic`.

---

### Task 2: Tests utils + stores (formatPlayTime/formatDate, projects/store, blueprints mapper/download)

**Files:** Create `frontend/src/utils/{formatPlayTime,formatDate}.test.ts`, `frontend/src/domain/projects/store.test.ts`, `frontend/src/domain/blueprints/{mapper,download}.test.ts`.

- [ ] **Step 1: Read** each module. For `projects/store` note it uses `localStorage` (mock/stub it in tests — jsdom NOT available, so provide a minimal `globalThis.localStorage` stub in the test setup, or test the pure branches; keep it node-compatible). `formatDate` may use `Intl` — assert with a fixed locale/timezone-independent expectation.
- [ ] **Step 2:** Write Vitest tests (node, no annotations): formatPlayTime (seconds→`Hh MMm` formatting incl. 0, <1h, large), formatDate (fixed input→expected), projects/store (create/read/update/delete/active-selection with a localStorage stub), blueprints mapper (DTO→domain) + download (URL/blob construction — stub what's needed).
- [ ] **Step 3:** Run Vitest; green. Same rule: a real source bug → report, don't silently patch.
- [ ] **Step 4: Commit** `test(frontend): cover utils and project/blueprint domain helpers`.

---

### Task 3: Polish accessibilité

**Files:** `frontend/src/pages/GameData.tsx` (+ any rewritten page missing a label found by audit).

- [ ] **Step 1:** Implement the WAI-ARIA roving-tabindex on GameData tabs: only the active tab has `tabIndex=0`, inactive tabs `tabIndex=-1`; ArrowLeft/Right moves selection AND focus; keep existing role/aria-controls/aria-selected wiring.
- [ ] **Step 2:** Audit the rewritten pages/components (`Snapshots`, `Diff`, `Assistant`, `Home`, `Calculator` form controls, icon-only buttons) for missing accessible names; add `aria-label`/`htmlFor` where an interactive element lacks a name. Token-neutral, no behavior change.
- [ ] **Step 3:** Typecheck clean; `make docker-e2e` green (adjust selectors only if a11y attrs shifted them, no weakening).
- [ ] **Step 4: Commit** `fix(frontend): a11y polish (roving-tabindex tabs + accessible names)`.

---

### Task 4: Passe visuelle (screenshots) + correctifs — CONTROLLER-DRIVEN

> The controller runs this task itself (needs to visually inspect rendered screenshots), not a blind subagent. Steps recorded here for the ledger.

- [ ] **Step 1:** Bring up the app in the E2E stack and capture full-page screenshots of each route (`/`, `/gamedata`, `/calculator`, `/plans`, `/blueprints`, `/snapshots`, `/diff`, `/assistant`, `/login`) in dark + light, via a Playwright screenshot script.
- [ ] **Step 2:** Controller reads the PNGs, lists real visual/UX regressions (broken layout, unreadable contrast, overflow, missing ambiance accent).
- [ ] **Step 3:** Dispatch targeted fix subagent(s) per confirmed issue (token-backed only), then re-screenshot to confirm.
- [ ] **Step 4:** Commit any fixes `fix(frontend): visual regressions from rewrite (<area>)`; if none needed, record "visual pass clean" in the ledger.

---

## Self-Review

- Coverage: adds Vitest for all currently-untested pure-logic modules (gamedata math, utils, stores, blueprint helpers) respecting the node-only convention; a11y closes the deferred roving-tabindex item; visual pass catches what static review can't. Tasks independent (distinct new test files); T3/T4 touch product code in disjoint areas.
- Placeholders: none — concrete modules/files listed from the audit.
- Constraint: NO component tests / jsdom (repo convention) — only pure logic + Playwright.

## Notes de vérification

- Si un test Vitest révèle un vrai bug de `domain/*`, REMONTER (ne pas patcher la logique en douce sous couvert de test).
- localStorage/Intl : rendre les tests déterministes (stub localStorage, locale/timezone figée).
- Passe visuelle : lire réellement les PNG avant de conclure ; ne pas déclarer « clean » sans les avoir regardés.
