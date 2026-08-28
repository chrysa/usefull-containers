# SFM UI Rewrite — Lot 3 : Planifier (Calculator / Plans / Blueprints) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Réécrire toute la zone **Planifier** dans le système Tailwind/shadcn : Calculator (graphe de production ReactFlow), Plans (liste + détail), Blueprints (liste + détail), sur l'ambiance section `plan` (accent cyan), en réutilisant les couches `domain/plans`, `domain/blueprints`, `domain/gamedata` et `features/calculator/graphLayout`.

**Architecture:** Front-only, backend intact. On réécrit les pages `Calculator/Plans/PlanDetail/Blueprints/BlueprintDetail` et les composants `features/{calculator,plans,blueprints}/*` en Tailwind token-backed. On réutilise **sans modifier** les hooks TanStack Query et la logique (`domain/plans/queries`, `domain/blueprints/queries`, `domain/gamedata/*`, `features/calculator/graphLayout.ts`). Le graphe ReactFlow garde `@xyflow/react` + `dagre` ; seul le style des nœuds/arêtes/contrôles passe aux tokens.

**Tech Stack:** React 19, Vite 8, TS 7, Tailwind v4, shadcn/ui, TanStack Query v5, `@xyflow/react` + `@dagrejs/dagre`, lucide-react, i18next, Playwright (E2E).

**Spec:** `docs/superpowers/specs/2026-08-26-sfm-ui-rewrite-design.md`

## Global Constraints

- Aucun changement backend ni contrat API. Réutiliser `domain/*` et `features/calculator/graphLayout.ts` sans modifier leurs signatures.
- Tailwind only, token-backed, **aucune couleur en dur** (utiliser `bg-card`/`text-foreground`/`text-primary`/`text-muted-foreground`/`border-border`/`text-destructive`/`bg-primary` + `font-mono` pour les quantités). Tokens dispo : background/foreground/card/primary/muted/border/ring/warning/destructive (+ accents section via `data-section`, posé par le shell — ne pas le régler dans les composants).
- Pour ReactFlow : styliser les nœuds via des composants de nœud custom en Tailwind (ou `style` mappé sur `var(--...)`), pas de hex en dur ; garder la logique de layout (`graphLayout.ts`) intacte.
- React 19 / TS 7 : pas de `React.FC`, annotations complètes (hors tests). Fichiers de test sans annotations.
- i18n via `useTranslation`, clés ajoutées en + fr, triées alpha.
- **Fichiers > 300 lignes** (`Calculator.tsx` 471, `PlanDetail.tsx` 601) : profiter de la réécriture pour extraire des sous-composants focalisés (viser < 300 lignes/fichier), sans sur-découper.
- Docker only : typecheck isolé `docker compose -f docker-compose.test.yml run --rm frontend-lint sh -c "npm run typecheck"` (doit être clean), build `make build`, E2E `make docker-e2e` (baseline 33/33 — ne pas affaiblir les assertions). Pas d'ESLint (D-0012).
- Conventional Commits, PAS de co-auteur IA ; dépôt perso `chrysa` (ne pas toucher git author). Lockfile édition bloquée ; pas de nouvelle dépendance attendue.

## File Structure

- Calculator : `pages/Calculator.tsx` (rewrite + extract sous-composants), `features/calculator/ProductionGraph.tsx`, `SaveToPlanPanel.tsx`. Node/edge styling: add small custom node components under `features/calculator/` if needed.
- Plans : `pages/Plans.tsx`, `pages/PlanDetail.tsx` (rewrite + extract), `features/plans/PlanCard.tsx`, `PlanForm.tsx`.
- Blueprints : `pages/Blueprints.tsx`, `pages/BlueprintDetail.tsx`, `features/blueprints/{BlueprintCard,TagEditor,TagFilterBar,UploadButton,BatchUploadButton}.tsx`.
- Delete matching dead `*.module.scss` once unreferenced.
- i18n locales (en + fr). E2E specs : `plans.spec.ts`, `blueprints.spec.ts`, `real-vs-planned.spec.ts`, `assistant-generate-plan.spec.ts`, `setup-wizard.spec.ts` (adapt selectors as needed).

---

### Task 1: Calculator — graphe de production + SaveToPlanPanel

**Files:** Rewrite `features/calculator/ProductionGraph.tsx`, `SaveToPlanPanel.tsx`; create custom ReactFlow node component(s) under `features/calculator/` if needed. Delete their `.module.scss`.

**Interfaces:**
- Consumes: `graphLayout.ts` (layout, unchanged), `domain/gamedata/calculator.ts` + `domain/plans` hooks as currently used; `cn`, shadcn Button.
- Produces: token-styled production graph (nodes = `bg-card border-border`, accent `text-primary`, mono quantities; ReactFlow `<Background>`/`<Controls>` themed via tokens) and a Tailwind `SaveToPlanPanel`.

- [ ] **Step 1: Read** `ProductionGraph.tsx`, `SaveToPlanPanel.tsx`, their scss, and `graphLayout.ts` to learn node/edge data shape and the save-to-plan flow. Do not change `graphLayout.ts`.
- [ ] **Step 2:** Rewrite the node rendering as a custom ReactFlow node (Tailwind, token-backed); wire it via `nodeTypes`. Keep layout, zoom/pan, edges. Theme `Controls`/`Background` with token colors (via CSS vars, not hex).
- [ ] **Step 3:** Rewrite `SaveToPlanPanel.tsx` in Tailwind (shadcn Button, token inputs), preserving the mutation/save flow.
- [ ] **Step 4:** Delete dead scss (grep). Typecheck isolated → clean.
- [ ] **Step 5:** Commit `feat(frontend): rewrite production graph and save-to-plan in Tailwind`.

---

### Task 2: Calculator page (assemblage + extraction)

**Files:** Rewrite `pages/Calculator.tsx` (extract sub-components to keep < 300 lines); delete `Calculator.module.scss`.

**Interfaces:** Consumes Task 1 `ProductionGraph`/`SaveToPlanPanel`, gamedata queries, calculator domain. Produces the `/calculator` page: sidebar-input (target item + rate) + main graph canvas per the spec IA.

- [ ] **Step 1: Read** current `Calculator.tsx` + scss; note behavior (target selection, solve, graph render, save).
- [ ] **Step 2:** Rewrite in Tailwind: input sidebar + graph canvas split; extract logical sub-parts (e.g. target-input form, results panel) into focused components under `features/calculator/` if it keeps files < 300 lines. Preserve all behavior/hooks.
- [ ] **Step 3:** Delete `Calculator.module.scss` (grep). Typecheck clean + `make build` green.
- [ ] **Step 4:** Commit `feat(frontend): rewrite Calculator page in Tailwind`.

---

### Task 3: Plans — liste (Plans page + PlanCard + PlanForm)

**Files:** Rewrite `pages/Plans.tsx`, `features/plans/PlanCard.tsx`, `PlanForm.tsx`; delete their scss; i18n.

**Interfaces:** Consumes `domain/plans/queries` (list/create/delete), shadcn Button. Produces the `/plans` list (card grid + create form) with loading/empty/error states.

- [ ] **Step 1: Read** current files + scss; preserve create/delete/list flows and validation.
- [ ] **Step 2:** Rewrite `PlanCard`, `PlanForm`, `Plans` page in Tailwind, token-backed; loading/empty/error states.
- [ ] **Step 3:** i18n keys (en+fr, alpha). Delete dead scss (grep). Typecheck clean.
- [ ] **Step 4:** Commit `feat(frontend): rewrite Plans list in Tailwind`.

---

### Task 4: Plan detail (PlanDetail page + extraction)

**Files:** Rewrite `pages/PlanDetail.tsx` (601 lines → extract focused sub-components); delete `PlanDetail.module.scss`; i18n.

**Interfaces:** Consumes `domain/plans` (get/update), possibly the production graph. Produces `/plans/:id` detail (targets, generated plan/steps, edit, save).

- [ ] **Step 1: Read** current `PlanDetail.tsx` + scss; map its sections (header, targets editor, generated steps/results, actions).
- [ ] **Step 2:** Rewrite in Tailwind, extracting each major section into its own component under `features/plans/` so no file exceeds ~300 lines. Preserve all hooks/flows (generate, update, delete).
- [ ] **Step 3:** i18n keys. Delete dead scss. Typecheck clean + `make build` green.
- [ ] **Step 4:** Commit `feat(frontend): rewrite Plan detail in Tailwind`.

---

### Task 5: Blueprints — liste + upload + tags

**Files:** Rewrite `pages/Blueprints.tsx`, `features/blueprints/{BlueprintCard,TagFilterBar,UploadButton,BatchUploadButton}.tsx`; delete their scss; i18n.

**Interfaces:** Consumes `domain/blueprints/queries` (list, upload, batch, tags). Produces `/blueprints` list (card grid, tag filter bar, upload + batch upload) with states.

- [ ] **Step 1: Read** current files + scss; preserve upload/batch/tag-filter/list flows.
- [ ] **Step 2:** Rewrite all five in Tailwind, token-backed, shadcn Button; loading/empty/error.
- [ ] **Step 3:** i18n keys. Delete dead scss. Typecheck clean.
- [ ] **Step 4:** Commit `feat(frontend): rewrite Blueprints list, upload and tag filter in Tailwind`.

---

### Task 6: Blueprint detail (+ TagEditor) + E2E for the whole lot

**Files:** Rewrite `pages/BlueprintDetail.tsx`, `features/blueprints/TagEditor.tsx`; delete scss; adapt E2E specs.

**Interfaces:** Consumes `domain/blueprints` (get, tags update, download). Produces `/blueprints/:name` detail + tag editing. Then E2E across the lot.

- [ ] **Step 1: Read** current `BlueprintDetail.tsx` + `TagEditor.tsx` + scss; preserve download/tag-edit flows.
- [ ] **Step 2:** Rewrite in Tailwind, token-backed. Delete dead scss.
- [ ] **Step 3:** Typecheck clean + `make build` green.
- [ ] **Step 4: E2E** — update selectors in `tests/e2e/specs/{plans,blueprints,real-vs-planned,assistant-generate-plan,setup-wizard}.spec.ts` to the new DOM (prefer roles/labels; add minimal `aria-label`s where needed). Run `make docker-e2e`; MUST stay green (baseline 33/33) without weakening assertions. Report pass count + any spec deltas.
- [ ] **Step 5:** Commit `feat(frontend): rewrite Blueprint detail + adapt Planifier E2E`.

---

## Self-Review

- Spec coverage: §4 Planifier (Calculator graph, Plans, Blueprints) → Tasks 1-6; token/ambiance discipline + file-size extraction → Global Constraints; domain reuse → Global Constraints. Dependency order: T1→T2 (graph before page), T3→T4 (list before detail), T5→T6 (list before detail); E2E last (T6) after all pages exist.
- Placeholders: none — real files/hooks referenced; exact node/section extraction decided at read-time per task.
- Type consistency: Task 1 produces `ProductionGraph`/`SaveToPlanPanel` consumed by Task 2; plans/blueprints feature components produced then consumed by their pages.

## Notes de vérification

- Confirmer les signatures des hooks `domain/plans/queries` et `domain/blueprints/queries` avant réécriture (chaque Task Step 1).
- ReactFlow : ne pas casser `graphLayout.ts` ni la logique dagre ; seul le rendu passe aux tokens.
- E2E baseline 33/33 ; toute régression expliquée (DOM) et corrigée dans le spec, pas en affaiblissant l'assertion.
- Fichiers cibles > 300 lignes : extraire, mais rester drop-in pour les consommateurs.
