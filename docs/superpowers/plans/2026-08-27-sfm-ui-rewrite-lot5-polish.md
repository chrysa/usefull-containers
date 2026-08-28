# SFM UI Rewrite — Lot 5 : Polish & dette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Solder la dette différée des lots 1-4 : finir la migration Tailwind des composants partagés encore en SCSS, supprimer le code mort, ajouter les tokens/patterns manquants (overlay, confirmations, a11y tabs), réduire le bruit réseau, et clôturer par la suite E2E + build verts.

**Architecture:** Front-only, backend intact. Migrations Tailwind ciblées de composants partagés (`DropZone`, `Skeleton`) + petits correctifs a11y/UX + nettoyage. Aucune régression fonctionnelle.

**Tech Stack:** React 19, Vite 8, TS 7, Tailwind v4, shadcn/ui, i18next, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-26-sfm-ui-rewrite-design.md`

## Global Constraints

- Aucun changement backend ni contrat API. Ne pas modifier `domain/*` ni `api/*`.
- Token-backed only, aucune couleur en dur (exceptions établies : `--swatch-*` dynamiques, `bg-black/…` ou le nouveau `--overlay`). React 19/TS 7, pas de `React.FC`, annotations complètes (hors tests). Tests sans annotations. Fichiers ≤ ~300 lignes.
- Préserver le comportement de chaque composant touché (props drop-in) — `DropZone` et `ImportZipButton`/`Skeleton` sont consommés par des pages hors-scope (SetupWizard, Blueprints, GameData, listes) : ne pas casser leurs consommateurs.
- Docker only : typecheck `docker compose -f docker-compose.test.yml run --rm frontend-lint sh -c "npm run typecheck"` (clean), build `make build`, E2E `make docker-e2e` (baseline 36/36, ne pas affaiblir). Conventional Commits, PAS de co-auteur IA ; dépôt chrysa (ne pas toucher git author).

## File Structure

- `frontend/src/components/DropZone/DropZone.tsx` (rewrite Tailwind) + delete `DropZone.module.scss`.
- `frontend/src/components/ui/Skeleton.tsx` (rewrite Tailwind) + delete its `.module.scss` if any.
- Delete dead `frontend/src/features/blueprints/BatchUploadButton.tsx` (+ its re-export in `features/blueprints/index.ts`).
- `frontend/src/styles/theme.css` — add `--overlay` token (+ `@theme` mapping); `frontend/src/features/plans/PlanForm.tsx` — use it for the scrim.
- `frontend/src/pages/BlueprintDetail.tsx` — add `confirm()` to delete (parity with PlanDetail).
- `frontend/src/features/gamedata/{ItemsList,RecipesList}.tsx` — error branch → `text-destructive`.
- `frontend/src/pages/GameData.tsx` — complete WAI-ARIA tabs (role="tabpanel" + aria-controls/id + arrow-key nav).
- `frontend/src/pages/Home.tsx` — gate `useBlueprintsQuery`/`usePlansQuery` on auth (remove anon 401 noise).
- Remove orphaned i18n keys (`assistant.close`, `assistant.plan_mode_active`, `assistant.toggle_label`) from en+fr.
- Optional helper: promote play-time formatting to `frontend/src/utils/` and reuse in Home + SnapshotCard.

---

### Task 1: Migrer les composants partagés restants (DropZone, Skeleton) + supprimer le code mort

**Files:** Rewrite `components/DropZone/DropZone.tsx`, `components/ui/Skeleton.tsx`; delete their scss; delete `features/blueprints/BatchUploadButton.tsx` + its re-export.

**Interfaces:** Consumes: `cn`. Produces: token-backed `DropZone`/`Skeleton`, drop-in for all current consumers.

- [ ] **Step 1: Read** `DropZone.tsx` + scss, `Skeleton.tsx` (+ scss), and grep all consumers (`grep -rn "DropZone\|Skeleton\|BatchUploadButton" frontend/src`). Note the exact props each exposes.
- [ ] **Step 2:** Rewrite `DropZone.tsx` in Tailwind (drag states via `cn`, token colors: `border-border`, drag-active `border-primary`/`bg-muted`), same props/behavior. Delete `DropZone.module.scss`.
- [ ] **Step 3:** Rewrite `Skeleton.tsx` in Tailwind (`animate-pulse bg-muted rounded-[var(--radius)]`), same props. Delete its scss if present.
- [ ] **Step 4:** Delete `features/blueprints/BatchUploadButton.tsx` and remove its re-export from `features/blueprints/index.ts` (confirm no other reference via grep).
- [ ] **Step 5:** Typecheck clean.
- [ ] **Step 6:** Commit `refactor(frontend): migrate shared DropZone/Skeleton to Tailwind, drop dead BatchUploadButton`.

---

### Task 2: Tokens & correctifs UX/a11y (overlay, confirm, error color, tabs)

**Files:** `styles/theme.css`, `features/plans/PlanForm.tsx`, `pages/BlueprintDetail.tsx`, `features/gamedata/{ItemsList,RecipesList}.tsx`, `pages/GameData.tsx`; i18n as needed.

**Interfaces:** Consumes existing tokens/components. Produces: `--overlay` token; confirmed blueprint delete; destructive error text; accessible GameData tabs.

- [ ] **Step 1:** `theme.css` — add `--overlay: rgb(0 0 0 / 0.5);` in `:root` and `.dark` (same), and `--color-overlay: var(--overlay)` in `@theme inline`. In `PlanForm.tsx` replace the scrim `bg-black/50` with `bg-overlay`.
- [ ] **Step 2:** `BlueprintDetail.tsx` — wrap the delete action in `globalThis.confirm(t("blueprint_detail.confirm_delete", ...))` (mirror PlanDetail). Add the i18n key en+fr (alpha).
- [ ] **Step 3:** `ItemsList.tsx`/`RecipesList.tsx` — change the error-branch text from muted to `text-destructive` (keep `role="alert"`).
- [ ] **Step 4:** `GameData.tsx` — complete the WAI-ARIA tabs pattern: give each panel `role="tabpanel"` with `id`/`aria-labelledby`, each tab `aria-controls` + `id`, and add left/right arrow-key navigation between the two tabs. Keep behavior otherwise identical.
- [ ] **Step 5:** Typecheck clean + `make build` green.
- [ ] **Step 6:** Commit `feat(frontend): overlay token, blueprint delete confirm, destructive errors, accessible gamedata tabs`.

---

### Task 3: Réduire le bruit réseau + nettoyage i18n + helper

**Files:** `pages/Home.tsx`, `utils/` (new play-time helper), `SnapshotCard.tsx`, i18n locales.

**Interfaces:** Produces: auth-gated Home queries, shared play-time formatter, cleaned i18n.

- [ ] **Step 1:** `Home.tsx` — gate `useBlueprintsQuery()`/`usePlansQuery()` on authentication (pass `enabled: isAuthenticated`, mirroring how snapshots are gated) so anonymous `/` visits don't 401. Verify the auth signal used (e.g. `useAuth`/`readToken`) matches the app pattern. Preserve authed behavior.
- [ ] **Step 2:** Create `frontend/src/utils/formatPlayTime.ts` (port the existing helper), and use it in both `Home.tsx` and `features/snapshots/SnapshotCard.tsx` (remove the duplicated local copies).
- [ ] **Step 3:** Remove orphaned i18n keys `assistant.close`, `assistant.plan_mode_active`, `assistant.toggle_label` from `en` + `fr` locale files (confirm unused via grep first).
- [ ] **Step 4:** Typecheck clean.
- [ ] **Step 5:** Commit `refactor(frontend): gate Home queries on auth, share play-time helper, drop dead i18n keys`.

---

### Task 4: Sweep final + E2E

**Files:** E2E specs if any selector shifted; no product code expected.

- [ ] **Step 1: Sweep** — from the worktree root confirm the rewrite is clean:
  - `grep -rn "red-[0-9]\|#[0-9a-fA-F]\{3,6\}" frontend/src --include=*.tsx` → only allowed `--swatch-*`/none.
  - `grep -rln "module.scss" frontend/src` → only genuinely out-of-scope legacy (Login/NotFound/AuthCallback if still) — list what remains.
  - `find frontend/src -name '*.module.scss'` → report the remaining set (should be minimal).
- [ ] **Step 2:** `docker compose -f docker-compose.test.yml run --rm frontend-lint sh -c "npm run typecheck"` → clean; `make build` → green.
- [ ] **Step 3:** `make docker-e2e` → all green (≥36/36). Fix any selector that shifted from Task 2's tab a11y changes; do not weaken assertions. Report pass count.
- [ ] **Step 4:** Commit `test(e2e): keep suite green after polish` (only if e2e files changed; otherwise skip).

---

## Self-Review

- Coverage: clears every deferred item recorded in the Lot 1-4 ledgers (DropZone restyle, Skeleton, dead BatchUploadButton, --overlay token, blueprint delete confirm, list error color, gamedata tabs a11y, Home 401 gating, orphaned i18n keys, play-time helper). Task order: T1 (shared components) → T2 (tokens/a11y) → T3 (network/cleanup) → T4 (sweep+E2E). No shared-file conflict between tasks except i18n (T2 adds, T3 removes different keys — disjoint).
- Placeholders: none — each step names a concrete file + change from the ledgers.
- Type consistency: `formatPlayTime` util consumed by Home + SnapshotCard; `--color-overlay`/`bg-overlay` defined in T2 before use.

## Notes de vérification

- Confirmer les consommateurs de `DropZone`/`Skeleton` avant migration (props drop-in ; SetupWizard notamment).
- Confirmer le signal d'auth exact pour gater les requêtes Home (mirror FactoryContext `readToken`).
- Vérifier qu'aucune clé i18n supprimée n'est référencée (grep) avant suppression.
- E2E : les changements de tabs (aria) peuvent déplacer des sélecteurs GameData — ajuster sans affaiblir.
