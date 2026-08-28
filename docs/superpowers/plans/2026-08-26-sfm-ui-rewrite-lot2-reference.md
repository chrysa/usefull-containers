# SFM UI Rewrite — Lot 2 : Référence (GameData) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruire la page **Référence (GameData)** dans le nouveau système Tailwind/shadcn : recherche + deux listes (items/recipes) + cartes détail + import ZIP, sur l'ambiance section `reference` (accent violet), en réutilisant la couche `domain/gamedata`.

**Architecture:** Front-only, backend intact. On réécrit `pages/GameData.tsx` et les composants `features/gamedata/*` en composants Tailwind consommant les tokens (`bg-card`, `text-foreground`, `text-primary`, `border-border`, `text-muted-foreground`), avec `cn` + shadcn Button. On réutilise **sans les modifier** les hooks TanStack Query `domain/gamedata/queries.ts` (`useGameDataStatsQuery`, `useItemsQuery(query, hasData)`, `useRecipesQuery(query, hasData)`, `useImportGameDataMutation`) et les types `domain/gamedata/types.ts`.

**Tech Stack:** React 19, Vite 8, TS 7, Tailwind v4, shadcn/ui, TanStack Query v5, lucide-react, i18next, Vitest (node, logique pure), Playwright (E2E).

**Spec:** `docs/superpowers/specs/2026-08-26-sfm-ui-rewrite-design.md`

## Global Constraints

- Aucun changement backend ni contrat API. Endpoints `/v1/gamedata/{stats,items,recipes,import}` figés.
- **Réutiliser** `domain/gamedata/queries.ts` + `types.ts` tels quels (ne pas modifier leurs signatures).
- Tailwind uniquement (pas de `.module.scss` neuf) ; token-backed, **aucun hex/couleur codée en dur** (utiliser `text-primary`/`bg-card`/etc.). L'accent violet vient automatiquement de `data-section="reference"` posé par le shell (Lot 1) sur la route `/gamedata` — ne pas re-déclarer l'accent.
- React 19 / TS 7 : pas de `React.FC`, annotations complètes (hors fichiers de test) ; fichiers de test sans annotations.
- i18n : libellés via `useTranslation`, clés ajoutées dans `frontend/src/i18n/locales` (en + fr), triées alphabétiquement dans chaque objet.
- Commandes Docker uniquement : typecheck `make typecheck` (frontend tsc via container ; ignorer l'échec backend mypy pré-existant `tests/test_config.py`) ou isolé `docker compose -f docker-compose.test.yml run --rm frontend-lint sh -c "npm run typecheck"` ; build `make build` ; Vitest `docker compose -f docker-compose.test.yml run --rm frontend-test` ; E2E `make docker-e2e`. Pas d'ESLint (D-0012).
- Conventional Commits, PAS de co-auteur IA ; dépôt perso `chrysa` (ne pas toucher la config git author).
- Lockfile en édition bloqué par hook ; pas de nouvelle dépendance attendue dans ce lot.

## File Structure

- Rewrite `frontend/src/pages/GameData.tsx` — page à deux panneaux (colonne recherche/listes + panneau détail carte).
- Rewrite `frontend/src/features/gamedata/ItemsList.tsx`, `RecipesList.tsx`, `ItemCard.tsx`, `RecipeCard.tsx`, `ImportZipButton.tsx` (Tailwind).
- Rewrite/replace the shared search input (current `SearchList.module.scss` / search UI) as a small Tailwind `SearchInput` if one is needed — keep it local to the gamedata feature.
- Delete the corresponding dead `.module.scss` files once unreferenced.
- Modify `frontend/src/i18n/locales/*` — add `gamedata.*` copy keys.
- E2E: `tests/e2e/specs/gamedata*.spec.ts` if present (else `home`/`navigation` coverage) — adapt selectors to the new DOM.

---

### Task 1: Cartes de référence (ItemCard + RecipeCard) en Tailwind

**Files:**
- Rewrite: `frontend/src/features/gamedata/ItemCard.tsx`, `RecipeCard.tsx`
- Delete (if unreferenced after): `ItemCard.module.scss`, `RecipeCard.module.scss`

**Interfaces:**
- Consumes: `ItemSummary`, `RecipeSummary` from `@/domain/gamedata/types`; `cn` from `@/lib/utils`.
- Produces: `ItemCard({ item }: { item: ItemSummary })`, `RecipeCard({ recipe }: { recipe: RecipeSummary })` — token-backed card components.

- [ ] **Step 1: Read the current components + types**
Read `ItemCard.tsx`, `RecipeCard.tsx`, their `.module.scss`, and `@/domain/gamedata/types.ts` to learn the exact fields rendered (name, icon/description, recipe inputs/outputs, etc.). Preserve the same displayed information.

- [ ] **Step 2: Rewrite ItemCard in Tailwind**
Rewrite `ItemCard.tsx` using Tailwind utilities (card surface `bg-card`, `border border-border rounded-[var(--radius)]`, `text-foreground`, secondary text `text-muted-foreground`, mono figures via `font-mono` where numeric). Same props/fields as before. No hardcoded color.

- [ ] **Step 3: Rewrite RecipeCard in Tailwind**
Same treatment; render recipe inputs/outputs/rates with `font-mono` for quantities. Keep any lucide icon usage consistent with the shell.

- [ ] **Step 4: Delete dead scss + typecheck**
Delete the two `.module.scss` if nothing else imports them (`grep -rn "ItemCard.module\|RecipeCard.module" frontend/src`). Run isolated frontend typecheck (must be clean).
Run: `docker compose -f docker-compose.test.yml run --rm frontend-lint sh -c "npm run typecheck"`

- [ ] **Step 5: Commit**
```bash
git add frontend/src/features/gamedata/ItemCard.tsx frontend/src/features/gamedata/RecipeCard.tsx
git commit -m "feat(frontend): rewrite gamedata cards in Tailwind"
```

---

### Task 2: Listes + import (ItemsList, RecipesList, ImportZipButton, SearchInput)

**Files:**
- Rewrite: `frontend/src/features/gamedata/ItemsList.tsx`, `RecipesList.tsx`, `ImportZipButton.tsx`
- Create/rewrite: a small Tailwind search input used by the lists (replace `SearchList.module.scss` usage)
- Modify: `frontend/src/i18n/locales/*` (add `gamedata.*` keys)

**Interfaces:**
- Consumes: `useItemsQuery(query, hasData)`, `useRecipesQuery(query, hasData)`, `useImportGameDataMutation` from `@/domain/gamedata/queries`; `ItemCard`/`RecipeCard` (Task 1); shadcn Button.
- Produces: `ItemsList`, `RecipesList` (search + rendered card grid, loading/empty/error states), `ImportZipButton`.

- [ ] **Step 1: Read current lists + import + search**
Read `ItemsList.tsx`, `RecipesList.tsx`, `ImportZipButton.tsx`, and the current search UI (`SearchList.module.scss` + wherever it's used) to preserve behavior (query wiring, `hasData` gating, upload flow).

- [ ] **Step 2: Rewrite the search input**
Create a small Tailwind search input (local to gamedata) with a lucide `Search` icon, `bg-card border border-border`, focus `ring-ring`, i18n placeholder. Wire it to the list's query string state exactly as before.

- [ ] **Step 3: Rewrite ItemsList / RecipesList**
Rewrite both in Tailwind: search input + results grid of `ItemCard`/`RecipeCard`, with explicit **loading** (skeleton or muted text), **empty** ("no results"), and **error** states. Keep `useItemsQuery`/`useRecipesQuery` usage (including the `hasData` argument) unchanged.

- [ ] **Step 4: Rewrite ImportZipButton**
Rewrite in Tailwind using the shadcn Button; keep the `useImportGameDataMutation` flow, file-input handling, and success/error feedback (toast if the app uses one). i18n labels.

- [ ] **Step 5: i18n keys**
Add the `gamedata.*` keys you referenced to `frontend/src/i18n/locales/en*` and `fr*`, alphabetized within each object.

- [ ] **Step 6: Delete dead scss + typecheck**
Delete now-unreferenced `.module.scss` (`ItemsList/RecipesList/ImportZipButton/SearchList`), verify by grep. Run isolated frontend typecheck (clean).

- [ ] **Step 7: Commit**
```bash
git add frontend/src/features/gamedata frontend/src/i18n
git commit -m "feat(frontend): rewrite gamedata lists, search and import in Tailwind"
```

---

### Task 3: Page GameData (assemblage) + E2E

**Files:**
- Rewrite: `frontend/src/pages/GameData.tsx`
- Delete (if unreferenced): `GameData.module.scss`
- Modify: `tests/e2e/specs/` gamedata/home spec selectors if the DOM changed

**Interfaces:**
- Consumes: `useGameDataStatsQuery`, `ItemsList`, `RecipesList`, `ImportZipButton` (Task 2).
- Produces: the rewritten `/gamedata` page — tabs/toggle between Items and Recipes, stats header, import action; two-panel dense reference layout per the spec IA.

- [ ] **Step 1: Read current page**
Read `GameData.tsx` + `GameData.module.scss` to preserve behavior: tabs/toggle Items↔Recipes, stats display (`useGameDataStatsQuery`), and the `hasData` gating passed to the lists.

- [ ] **Step 2: Rewrite the page in Tailwind**
Rewrite `GameData.tsx`: a header with game-data stats + `ImportZipButton`, a tab/segmented control to switch Items/Recipes, and the selected list below. Use tokens only; the violet ambiance comes from the shell's `data-section="reference"` — do not set it here. Keep loading/empty (no data imported yet) states.

- [ ] **Step 3: Delete dead scss + typecheck + build**
Delete `GameData.module.scss` if unreferenced (grep). Run:
`docker compose -f docker-compose.test.yml run --rm frontend-lint sh -c "npm run typecheck"` (clean) then `make build` (green).

- [ ] **Step 4: E2E**
Locate any gamedata E2E spec (`find tests/e2e -iname '*gamedata*' -o -iname '*game-data*'`; else check `home.spec.ts`/`navigation.spec.ts` for gamedata assertions). Update selectors to the new DOM (prefer roles/labels; add minimal `aria-label`s if needed). Run the full suite once:
`make docker-e2e` → must stay green (or same pass set as Lot 1's 33/33 baseline; report any delta).

- [ ] **Step 5: Commit**
```bash
git add frontend/src/pages/GameData.tsx tests/e2e
git commit -m "feat(frontend): rewrite GameData reference page in Tailwind"
```

---

## Self-Review

- Spec coverage: §4 IA "Référence = GameData filterable two-panel" → Tasks 1-3; token/ambiance discipline → Global Constraints + Task 2/3; reuse domain layer → Global Constraints. Tasks 1→2→3 dependency chain (cards → lists → page) is linear and non-conflicting.
- Placeholders: none — steps reference real files/hooks with exact signatures verified against the worktree.
- Type consistency: `ItemCard({item})`/`RecipeCard({recipe})` produced in Task 1 consumed in Task 2; lists produced in Task 2 consumed in Task 3; query hook signatures copied verbatim from `domain/gamedata/queries.ts`.

## Notes de vérification à l'exécution

- Confirmer les champs exacts de `ItemSummary`/`RecipeSummary` avant de réécrire les cartes (Task 1 Step 1).
- Vérifier si un composant `SearchList` partagé existe et est réutilisé ailleurs avant de supprimer son scss.
- E2E baseline Lot 1 = 33/33 ; toute régression doit être expliquée (DOM changé) et corrigée dans le spec, pas en affaiblissant l'assertion.
