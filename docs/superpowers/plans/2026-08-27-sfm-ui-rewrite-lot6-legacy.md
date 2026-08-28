# SFM UI Rewrite — Lot 6 : Migration SCSS restante + retrait du pont legacy

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Migrer les 10 derniers `*.module.scss` vers Tailwind token-backed, puis **supprimer `frontend/src/styles/legacy-tokens.css`** (et son import) — plus aucun composant ne dépend du pont legacy. L'UI devient 100% Tailwind.

**Architecture:** Front-only, backend intact. Chaque composant/page encore en SCSS est réécrit en utilitaires Tailwind consommant les tokens sémantiques (`--background/foreground/card/primary/muted/border/ring/warning/destructive/success/overlay`). Correspondances legacy→sémantique : `--bg`/`--bg-secondary`→`bg-background`/`bg-card`, `--color-surface`→`bg-card`, `--text`→`text-foreground`, `--text-muted`→`text-muted-foreground`, `--border`→`border-border`, `--primary`→`text-primary`/`bg-primary`, `--danger`/`--color-danger`→`destructive`, `--success`→`success`, `--radius-sm`/`--radius`→`rounded-[var(--radius)]`, `--space-*`→échelle Tailwind, `--font-*`→`text-*`, `--shadow-*`→`shadow-*`, `--*-hover`→variantes `hover:`.

**Tech Stack:** React 19, Vite 8, TS 7, Tailwind v4, shadcn/ui, i18next, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-26-sfm-ui-rewrite-design.md`

## Global Constraints

- Aucun changement backend ni contrat API. Ne pas modifier `domain/*` ni `api/*`. Réutiliser les composants déjà migrés (DropZone, ImportZipButton, Skeleton, Button…) tels quels.
- Token-backed only, aucune couleur en dur (exceptions établies : `--swatch-*`, tokens `overlay`/etc.). React 19/TS 7, pas de `React.FC`, annotations complètes (hors tests). Tests sans annotations. **Fichiers ≤ ~300 lignes** — SetupWizard (408) doit être découpé en sous-composants.
- Préserver le comportement de chaque composant/page (props, flux, i18n, ARIA). Ne pas régler `data-section` (le shell le fait).
- `legacy-tokens.css` ne peut être supprimé qu'une fois **zéro** référence à ses variables (`--space-*`, `--bg*`, `--color-surface`, `--danger`, `--radius-sm`, `--font-*`, `--shadow-*`, `--surface*`, `--*-hover`, `--transition-*`) restante dans `frontend/src` (scss ET tsx). Vérifier par grep avant retrait (Task 6).
- Docker only : typecheck `docker compose -f docker-compose.test.yml run --rm frontend-lint sh -c "npm run typecheck"` (clean), build `make build`, E2E `make docker-e2e` (baseline 36/36, ne pas affaiblir). Conventional Commits, PAS de co-auteur IA ; dépôt chrysa (ne pas toucher git author).

## File Structure (10 modules à migrer)

Petits shell/annexes : `components/loaders/GlobalLoader`, `components/languages/LanguageSwitcher`, `components/layouts/DemoBanner`, `pages/NotFound`. Chrome : `components/common/BackendConnectionBanner`, `components/ui/Toast/Toast`, `components/layouts/ProjectSwitcher`. Métier/pages : `components/plan/RealVsPlanned`, `pages/Login`, `components/SetupWizard/SetupWizard` (+ extraction). Puis suppression de `frontend/src/styles/legacy-tokens.css` + son `@import` dans `frontend/src/index.css`.

---

### Task 1: Petits composants (GlobalLoader, LanguageSwitcher, DemoBanner, NotFound)

**Files:** Rewrite the 4 `.tsx` in Tailwind; delete their `.module.scss`.

- [ ] **Step 1: Read** the 4 `.tsx` + their `.module.scss`. Note props/behavior.
- [ ] **Step 2:** Rewrite each in Tailwind token-backed (`cn` where needed), preserving markup/props/i18n. Delete each `.module.scss`.
- [ ] **Step 3:** `grep` confirm no `styles.` refs remain in the 4; typecheck clean.
- [ ] **Step 4:** Commit `refactor(frontend): migrate GlobalLoader/LanguageSwitcher/DemoBanner/NotFound to Tailwind`.

---

### Task 2: Chrome (BackendConnectionBanner, Toast, ProjectSwitcher)

**Files:** Rewrite the 3 `.tsx` in Tailwind; delete their `.module.scss`.

**Interfaces:** These render in the shell (Header uses ProjectSwitcher; Toast is the global toast system) — props/behavior MUST stay drop-in.

- [ ] **Step 1: Read** the 3 `.tsx` + scss + their consumers (`grep -rn "ProjectSwitcher\|Toast\|BackendConnectionBanner"`). Note the Toast variant/status colors (map to `destructive`/`warning`/`success`/`primary` tokens).
- [ ] **Step 2:** Rewrite each in Tailwind token-backed, preserving props/behavior/ARIA. Toast status colors via tokens. Delete each `.module.scss`.
- [ ] **Step 3:** typecheck clean.
- [ ] **Step 4:** Commit `refactor(frontend): migrate shell chrome (banner/toast/project-switcher) to Tailwind`.

---

### Task 3: RealVsPlanned

**Files:** Rewrite `components/plan/RealVsPlanned.tsx` remaining SCSS→Tailwind; delete `RealVsPlanned.module.scss`.

**Interfaces:** Already renders diff via `DiffTable` (Lot 4). Only its container/controls markup still uses scss. Behavior (drag/drop parse, snapshot save, diff) must stay identical.

- [ ] **Step 1: Read** `RealVsPlanned.tsx` + scss. Identify scss-styled parts (container, upload control, headings).
- [ ] **Step 2:** Rewrite those in Tailwind token-backed; keep `DiffTable` usage + all handlers/hooks. Delete the scss.
- [ ] **Step 3:** typecheck clean.
- [ ] **Step 4:** Commit `refactor(frontend): migrate RealVsPlanned to Tailwind`.

---

### Task 4: Login page

**Files:** Rewrite `pages/Login.tsx` in Tailwind; delete `Login.module.scss`.

- [ ] **Step 1: Read** `Login.tsx` + scss. Preserve auth flow (Steam/OIDC buttons, redirects), i18n, states.
- [ ] **Step 2:** Rewrite in Tailwind token-backed. Delete scss. ≤300 lines.
- [ ] **Step 3:** typecheck clean + `make build` green.
- [ ] **Step 4:** Commit `refactor(frontend): migrate Login page to Tailwind`.

---

### Task 5: SetupWizard (+ extraction)

**Files:** Rewrite `components/SetupWizard/SetupWizard.tsx` (408 lines) in Tailwind, extracting step sub-components under `components/SetupWizard/` so no file > ~300 lines; delete `SetupWizard.module.scss`.

**Interfaces:** Consumes already-migrated `DropZone`/`ImportZipButton`/project store; preserve the wizard flow (steps, project create, game-data import, `.sav` handling) exactly.

- [ ] **Step 1: Read** `SetupWizard.tsx` + scss; map its steps/sections and the hooks/stores it uses. Do NOT change `domain/*`/project store.
- [ ] **Step 2:** Rewrite in Tailwind, extracting each wizard step into its own focused component. Preserve behavior/props/i18n. Delete the scss.
- [ ] **Step 3:** typecheck clean + `make build` green.
- [ ] **Step 4:** Commit `refactor(frontend): migrate SetupWizard to Tailwind (+ step extraction)`.

---

### Task 6: Retirer le pont legacy-tokens.css + sweep + E2E

**Files:** Delete `frontend/src/styles/legacy-tokens.css`; edit `frontend/src/index.css` (remove its `@import`). E2E specs if selectors shifted.

- [ ] **Step 1: Verify zero legacy-var usage** from the worktree root:
  `grep -rnE "var\(--(space|bg|color-surface|surface|danger|radius-sm|font-(xs|sm|md|lg|xl)|shadow|primary-hover|transition)" frontend/src` → MUST be empty (both `.scss` — none should remain — and `.tsx`). If any hit remains, migrate that spot to the semantic token/utility BEFORE deleting the bridge.
  Also `find frontend/src -name '*.module.scss'` → MUST be empty.
- [ ] **Step 2:** Delete `legacy-tokens.css` and remove its `@import "./styles/legacy-tokens.css";` line from `index.css`.
- [ ] **Step 3:** `docker compose -f docker-compose.test.yml run --rm frontend-lint sh -c "npm run typecheck"` → clean; `make build` → green.
- [ ] **Step 4:** `make docker-e2e` → all green (≥36/36). Fix any shifted selector (don't weaken). Report pass count.
- [ ] **Step 5:** Commit `refactor(frontend): drop legacy-tokens.css bridge — UI fully Tailwind`.

---

## Self-Review

- Coverage: all 10 remaining `.module.scss` migrated (T1-T5), bridge removed only after grep proves zero legacy-var usage (T6). Independent tasks (different files); T6 last (gate on all prior). No cross-task file conflict.
- Placeholders: none — concrete files + legacy→semantic token mapping given in Global Constraints.
- Type consistency: migrated components keep existing props (drop-in for consumers); SetupWizard step extraction stays internal.

## Notes de vérification

- Confirmer les consommateurs de ProjectSwitcher/Toast (shell) restent drop-in.
- SetupWizard : réutiliser DropZone/ImportZipButton déjà migrés ; ne pas dupliquer.
- Le retrait de `legacy-tokens.css` est bloquant tant qu'un `var(--legacy)` subsiste — grep d'abord (T6 Step 1).
- E2E 36/36 baseline ; régressions corrigées par sélecteur, pas en affaiblissant.
