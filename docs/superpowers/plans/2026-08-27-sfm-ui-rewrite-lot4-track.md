# SFM UI Rewrite — Lot 4 : Suivre (Snapshots / Diff / Assistant) — cœur du gate

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Construire le parcours **Suivre** qui débloque le gate kill-test : importer une sauvegarde `.sav` → snapshot (historique par usine), comparer **prévu/réel** (diff plan↔snapshot) et obtenir une **recommandation** (assistant), le tout de premier niveau dans l'UI (routes dédiées), plus un dashboard **Vue d'ensemble** de l'usine active.

**Architecture:** Front-only, backend intact. Import `.sav` = pipeline client existant `parseSave` → `reduce` → `useCreateSnapshotMutation` (payload `SnapshotCreate = { name, data: CompactSnapshot }`). Diff = `diffPlanVsSnapshot(plan, snapshot): DiffRow[]` existant. Assistant = `useAssistantChat` + `useGeneratePlan` existants. On expose ces flux comme pages dédiées `/snapshots`, `/diff`, `/assistant` (protégées), on réécrit `Home` en dashboard « Vue d'ensemble » (section amber), et on retire le widget assistant flottant de `Layout` au profit de la page. Nouvelle ambiance : `/snapshots|/diff|/assistant` = section `track` (teal), `/` = `overview` (amber) — déjà mappées par le shell (Lot 1).

**Tech Stack:** React 19, Vite 8, TS 7, Tailwind v4, shadcn/ui, TanStack Query v5, `@etothepii/satisfactory-file-parser` (déjà dépendance, via `parseSave`), lucide-react, i18next, Playwright (E2E).

**Spec:** `docs/superpowers/specs/2026-08-26-sfm-ui-rewrite-design.md`

## Global Constraints

- Aucun changement backend ni contrat API. Réutiliser sans modifier : `domain/snapshots/queries.ts` (`useSnapshotsQuery({enabled})`, `useSnapshotQuery`, `useCreateSnapshotMutation`, `useDeleteSnapshotMutation`), `domain/savefile/{parseSave,reduce,diff}.ts`, `domain/plans/queries`, `api/assistant/queries.ts`, `context/FactoryContext` (`useFactory()` → factories/currentSaveName), `domain/factories/groupByFactory`.
- Import `.sav` reste 100% client : lire le fichier → `parseSave` → `reduce(raw, saveName)` → `useCreateSnapshotMutation`. Ne PAS ajouter d'endpoint.
- Token-backed only, aucune couleur en dur (statuts de diff via tokens : OK=`text-muted-foreground`/neutre, UNDER/MISSING=`text-destructive`, OVER/UNPLANNED=`text-warning`, matched OK=`text-primary` selon lisibilité ; `bg-black/50` scrim toléré). Ambiance section via le shell — ne pas régler `data-section`.
- React 19 / TS 7 : pas de `React.FC`, annotations complètes (hors tests). Tests sans annotations. Fichiers ≤ ~300 lignes (extraire au besoin).
- Routes nouvelles : `/snapshots`, `/diff`, `/assistant` sous `<ProtectedRoute>` (données utilisateur). Ajouter chaque route dans `App.tsx` dans la tâche qui crée la page.
- i18n via `useTranslation`, clés en + fr triées alpha.
- Docker only : typecheck `docker compose -f docker-compose.test.yml run --rm frontend-lint sh -c "npm run typecheck"` (clean), build `make build`, E2E `make docker-e2e` (baseline 33/33, ne pas affaiblir). Conventional Commits, PAS de co-auteur IA ; dépôt chrysa (ne pas toucher git author).

## File Structure

- Snapshots : `features/snapshots/ImportSaveButton.tsx` (nouveau, pipeline `.sav`→snapshot), `features/snapshots/SnapshotCard.tsx` (nouveau), `pages/Snapshots.tsx` (nouveau) + route.
- Diff : `features/diff/DiffTable.tsx` (nouveau — extraire le rendu de `components/plan/RealVsPlanned.tsx`), `pages/Diff.tsx` (nouveau, sélecteur plan + snapshot) + route. Faire consommer `DiffTable` par `RealVsPlanned.tsx` pour éviter la duplication.
- Assistant : `pages/Assistant.tsx` (nouveau — réutilise la logique de `components/Assistant/AssistantWidget.tsx` + `GeneratedPlanPreview.tsx`, en Tailwind) + route ; retirer le widget flottant de `components/layouts/Layout.tsx` ; supprimer `AssistantWidget.module.scss` (+ le composant si plus utilisé).
- Overview : rewrite `pages/Home.tsx` (Tailwind, dashboard usine) ; delete `Home.module.scss`.
- i18n locales (en + fr). E2E : `real-vs-planned.spec.ts`, `assistant-generate-plan.spec.ts` + éventuels nouveaux.

---

### Task 1: Import `.sav` + page Snapshots (`/snapshots`)

**Files:** Create `features/snapshots/ImportSaveButton.tsx`, `features/snapshots/SnapshotCard.tsx`, `pages/Snapshots.tsx`; modify `App.tsx` (add protected route + lazy import); i18n.

**Interfaces:**
- Consumes: `parseSave`, `reduce` (`@/domain/savefile/*`), `useCreateSnapshotMutation`/`useSnapshotsQuery`/`useDeleteSnapshotMutation` (`@/domain/snapshots/queries`), `useFactory` (`@/context/FactoryContext`), `groupByFactory`, shadcn Button, `cn`.
- Produces: `/snapshots` page — import `.sav` (client parse→reduce→create), snapshot history filtered to the active factory (`currentSaveName`), delete, loading/empty/error.

- [ ] **Step 1: Read** `parseSave.ts`, `reduce.ts` (exact signatures: `parseSave(file|buffer)`, `reduce(raw, saveName): CompactSnapshot`), `domain/snapshots/{queries,types}.ts`, `FactoryContext.tsx`, and how any existing code (e.g. SetupWizard) performs the `.sav`→snapshot pipeline — mirror it exactly.
- [ ] **Step 2:** `ImportSaveButton.tsx` — file input (accept `.sav`), read the file, `parseSave` → `reduce` → `useCreateSnapshotMutation.mutate({ name, data })`; disabled/spinner while pending; error surfaced (toast or inline `text-destructive`). Token-backed, shadcn Button.
- [ ] **Step 3:** `SnapshotCard.tsx` — one snapshot (name, `save_name`, `play_time`, `imported_at` via `formatDate`), delete action (`text-destructive`), token-backed.
- [ ] **Step 4:** `pages/Snapshots.tsx` — header + `ImportSaveButton`; list snapshots filtered to `useFactory().currentSaveName` (fallback: all, grouped), newest first; loading/empty ("no snapshot — import a save")/error. `wc -l` ≤300 (extract if needed).
- [ ] **Step 5:** `App.tsx` — add `const Snapshots = lazy(...)` and `<Route path="/snapshots" element={<Snapshots/>}/>` inside the `<ProtectedRoute>` block.
- [ ] **Step 6:** i18n `snapshots.*` (en+fr, alpha). Typecheck clean.
- [ ] **Step 7:** Commit `feat(frontend): snapshots page with client-side .sav import`.

---

### Task 2: Page Diff prévu/réel (`/diff`)

**Files:** Create `features/diff/DiffTable.tsx`, `pages/Diff.tsx`; refactor `components/plan/RealVsPlanned.tsx` to consume `DiffTable`; modify `App.tsx`; i18n.

**Interfaces:**
- Consumes: `diffPlanVsSnapshot` + `DiffRow`/`DiffStatus` (`@/domain/savefile/diff`), `usePlansQuery`/plan get, `useSnapshotsQuery`, `useFactory`, shadcn Button/select.
- Produces: `/diff` page — pick a plan + a snapshot (from the active factory), render the diff; shared `DiffTable` reused by `RealVsPlanned`.

- [ ] **Step 1: Read** `components/plan/RealVsPlanned.tsx` (how it calls `diffPlanVsSnapshot` and renders `DiffRow[]` + status styling) and `diff.ts` (`DiffStatus` values, `DiffRow` shape).
- [ ] **Step 2:** Extract the row-rendering into `features/diff/DiffTable.tsx` (`DiffTable({ rows }: { rows: DiffRow[] })`), token-backed status colors (OK neutral, UNDER/MISSING `text-destructive`, OVER/UNPLANNED `text-warning`, UNMATCHED muted), mono quantities.
- [ ] **Step 3:** Refactor `RealVsPlanned.tsx` to compute rows and render `<DiffTable rows=.../>` (behavior identical; it stays in PlanDetail).
- [ ] **Step 4:** `pages/Diff.tsx` — two selectors (plan, snapshot filtered to active factory), compute `diffPlanVsSnapshot`, render `DiffTable`; empty state when either not chosen; loading/error. ≤300 lines.
- [ ] **Step 5:** `App.tsx` — lazy `Diff` + `<Route path="/diff" .../>` under `<ProtectedRoute>`.
- [ ] **Step 6:** i18n `diff.*` (en+fr, alpha). Typecheck clean.
- [ ] **Step 7:** Commit `feat(frontend): first-class plan-vs-real diff page`.

---

### Task 3: Page Assistant (`/assistant`)

**Files:** Create `pages/Assistant.tsx` (+ optional `features/assistant/*` if extraction needed); modify `components/layouts/Layout.tsx` (remove floating `AssistantWidget`); rewrite `components/Assistant/GeneratedPlanPreview.tsx` in Tailwind; delete `AssistantWidget.module.scss`/`GeneratedPlanPreview.module.scss` and `AssistantWidget.tsx` if no longer used; modify `App.tsx`; i18n.

**Interfaces:**
- Consumes: `useAssistantChat`, `useGeneratePlan` (`@/api/assistant/queries`), `GeneratedPlanPreview`, shadcn Button, `cn`.
- Produces: `/assistant` page — chat (message → reply) + generate-plan (prompt → `GeneratedPlanPreview`), token-backed, in the `track` ambiance.

- [ ] **Step 1: Read** `AssistantWidget.tsx` (chat/generate logic, state) + `GeneratedPlanPreview.tsx` + their scss, and where `Layout.tsx` mounts the widget.
- [ ] **Step 2:** `pages/Assistant.tsx` — port the chat + generate-plan logic into a full-page Tailwind layout (message list, input, send; generate-plan prompt + `GeneratedPlanPreview`). Extract sub-components if > ~300 lines. Rewrite `GeneratedPlanPreview.tsx` in Tailwind.
- [ ] **Step 3:** Remove the floating `AssistantWidget` mount from `Layout.tsx`. If `AssistantWidget.tsx` is now unused, delete it + its scss (grep to confirm).
- [ ] **Step 4:** `App.tsx` — lazy `Assistant` + `<Route path="/assistant" .../>` under `<ProtectedRoute>`.
- [ ] **Step 5:** i18n `assistant.*` (en+fr, alpha). Typecheck clean + `make build` green.
- [ ] **Step 6:** Commit `feat(frontend): assistant page (chat + generate-plan), drop floating widget`.

---

### Task 4: Dashboard Vue d'ensemble (rewrite `Home`)

**Files:** Rewrite `pages/Home.tsx` in Tailwind; delete `Home.module.scss`; i18n.

**Interfaces:**
- Consumes: `useFactory` (active factory + latest snapshot via `groupByFactory`), `useSnapshotsQuery`, `usePlansQuery`, `useBlueprintsQuery`, `useHealthQuery`, shadcn Button/Link.
- Produces: `/` overview dashboard (section `overview`, amber) — active-factory summary (latest snapshot: `save_name`, `play_time`, `imported_at`, building/power counts if present in `CompactSnapshot`), shortcuts to Import/Diff/Assistant, and the existing plan/blueprint counts.

- [ ] **Step 1: Read** current `Home.tsx` + scss; preserve the counts/recent behavior it already shows.
- [ ] **Step 2:** Rewrite in Tailwind: a factory-overview card (latest snapshot summary for `currentSaveName`, or a "no snapshot yet — import a save" CTA when authed/empty) + shortcut buttons (Import → /snapshots, Compare → /diff, Ask → /assistant) + existing plan/blueprint/health tiles. The snapshot section only renders meaningfully when authenticated (FactoryContext gates the query on auth).
- [ ] **Step 3:** Delete `Home.module.scss` (grep). i18n `home.*`/`overview.*` (en+fr, alpha). Typecheck clean + `make build` green.
- [ ] **Step 4:** Commit `feat(frontend): factory overview dashboard (Home rewrite)`.

---

### Task 5: E2E du parcours Suivre + suite complète

**Files:** Modify `tests/e2e/specs/{real-vs-planned,assistant-generate-plan}.spec.ts` and add coverage for the new snapshot-import→diff flow; minimal `aria-label`s on new pages if needed.

**Interfaces:** Consumes the new DOM of Snapshots/Diff/Assistant/Home.

- [ ] **Step 1:** `find tests/e2e -name '*.spec.ts'`; read `real-vs-planned.spec.ts` + `assistant-generate-plan.spec.ts`; map their assertions to the new pages (diff now also at `/diff`; assistant now a page not a widget). Update selectors (prefer roles/labels).
- [ ] **Step 2:** Add a spec (or extend one) covering the gate-critical path at a UI level with the E2E backend: navigate to `/snapshots`, assert the import control + empty state; navigate to `/diff`, assert the plan/snapshot selectors; navigate to `/assistant`, assert chat input + generate control. Use stable role/label selectors; do NOT assert on real `.sav` parsing (no fixture) unless one already exists.
- [ ] **Step 3:** Run `make docker-e2e`. MUST stay green (baseline 33/33 + any new specs). Do not weaken assertions; fix selectors/markup. Report the final pass count + per-spec changes.
- [ ] **Step 4:** Commit `test(e2e): cover Suivre flow (snapshots/diff/assistant)`.

---

## Self-Review

- Spec coverage: §4 IA "Suivre = Snapshots + Diff + Assistant" → Tasks 1-3 (first-class routes); "Vue d'ensemble usine" → Task 4; gate journey import→diff→reco surfaced → Tasks 1,2,3 + dashboard shortcuts (Task 4); E2E → Task 5. Dependency order T1→T2→T3→T4→T5 (import exists before diff/overview reference snapshots; E2E last after all pages/routes).
- Placeholders: none — real hooks/functions with verified signatures; extraction/reuse (DiffTable from RealVsPlanned, page from AssistantWidget) decided at read-time.
- Type consistency: `DiffTable({rows: DiffRow[]})` produced in T2 and consumed by both Diff page and RealVsPlanned; `ImportSaveButton`/`SnapshotCard` in T1 consumed by Snapshots page; routes added per task in `App.tsx`.

## Notes de vérification

- Confirmer les signatures exactes de `parseSave`/`reduce` et le format `SnapshotCreate.data` (CompactSnapshot) avant Task 1 ; mirror the existing SetupWizard `.sav` pipeline if present.
- Confirmer les valeurs de `DiffStatus` et le mapping couleur-token avant Task 2.
- Assistant : vérifier `AssistantReply`/`GeneratePlanResponse` (api/assistant/types) et le comportement actuel du widget avant de porter en page.
- Home est public (`/`) : la section snapshot ne doit pas 401 en anonyme (FactoryContext gate déjà la query sur le token) ; afficher un CTA de connexion/plan si non authentifié.
- E2E baseline 33/33 ; régressions expliquées et corrigées via sélecteurs, pas en affaiblissant.
