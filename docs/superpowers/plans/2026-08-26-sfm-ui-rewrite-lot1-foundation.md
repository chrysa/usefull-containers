# SFM UI Rewrite — Lot 1 : Fondation (shell + Tailwind/shadcn + identité) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser la fondation de la nouvelle UI : Tailwind v4 + shadcn/ui installés, nouvelle identité visuelle en tokens, shell réécrit (Layout/Sidebar/Header) avec sélecteur d'usine dérivé des `save_name`, sur une app qui build/lint/typecheck vert et dont le E2E de navigation passe.

**Architecture:** Réécriture UI front-only, backend intact. On conserve la couche `src/api/*` + `src/domain/*` (client HTTP, hooks TanStack Query, diff `.sav` client). On remplace SCSS modules par Tailwind v4 (plugin Vite) + composants shadcn/ui. `Project` (localStorage) reste la connexion backend ; l'« usine » est un regroupement front des snapshots par `save_name` dans le Project actif.

**Tech Stack:** React 19, Vite 8, TypeScript 7, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui, TanStack Query v5, React Router 7, lucide-react, Vitest 4 (env node, logique pure), Playwright (E2E UI).

**Spec:** `docs/superpowers/specs/2026-08-26-sfm-ui-rewrite-design.md`

## Global Constraints

- **Aucun changement backend** ni migration ni contrat API. Endpoints figés.
- **Tests** : Vitest (`environment: "node"`, `src/**/*.test.ts`) pour logique pure UNIQUEMENT ; composants React validés par Playwright E2E. Ne pas ajouter jsdom ni Testing Library.
- **Alias** `@` → `src` (défini dans `vite.config.ts` et `vitest.config.ts`).
- **Commandes host interdites** : tout passe par Docker. Hook `warn-host-test-lint` actif. Cibles/commandes réelles du repo :
  - Typecheck (tsc) : `make typecheck`
  - Vitest frontend (logique) : `docker compose -f docker-compose.test.yml run --rm frontend-test` — **pas de cible Make dédiée** ; `make test` ne lance que le backend (`api-test`).
  - Build images : `make build`
  - Lancer l'app (preview prod) : `make up` → http://localhost:9109
  - E2E Playwright : `make docker-e2e`
  - ESLint : **parké (D-0012)** — ne pas ajouter d'étape lint frontend ; `tsc` couvre les types via `make typecheck`.
- **Lockfile bloqué en édition** : hook `block-lockfile-edits` interdit d'éditer `package-lock.json` via l'éditeur. Toute install de dépendance doit régénérer le lock **dans un conteneur** (voir Task 1), jamais via Edit/Write.
- **Français dans les fichiers de code** signalé par hook `warn-french-in-files` : code/commentaires/commits en anglais.
- **Commits** : Conventional Commits, sans co-auteur IA.
- **`Project` type** (existant, ne pas casser) : `{ id: string; name: string; backendUrl: string; createdAt: string }` dans `src/domain/projects/types.ts`.
- **Snapshot type** (existant) : `SnapshotRead` avec au moins `{ id: string; name: string; save_name: string; play_time: number; imported_at: string }` dans `src/domain/snapshots/types.ts`.

---

## File Structure

- `frontend/package.json` — ajoute `tailwindcss`, `@tailwindcss/vite`, shadcn deps (`class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`).
- `frontend/vite.config.ts` — ajoute le plugin `@tailwindcss/vite`.
- `frontend/src/styles/theme.css` — **nouveau** : tokens de la nouvelle identité (CSS variables `@theme` Tailwind v4, light `:root` + `.dark`).
- `frontend/src/styles/index.scss` → remplacé par `frontend/src/index.css` (import Tailwind + theme).
- `frontend/src/lib/utils.ts` — **nouveau** : helper `cn()` (shadcn standard).
- `frontend/components.json` — **nouveau** : config shadcn.
- `frontend/src/components/ui/*` — composants shadcn générés (button, dropdown-menu, etc.).
- `frontend/src/domain/factories/groupByFactory.ts` — **nouveau** : logique pure de regroupement snapshots → usines (testable Vitest).
- `frontend/src/domain/factories/groupByFactory.test.ts` — **nouveau** : test Vitest.
- `frontend/src/domain/factories/types.ts` — **nouveau** : type `Factory`.
- `frontend/src/context/FactoryContext.tsx` — **nouveau** : provider `currentSaveName`.
- `frontend/src/components/layouts/Layout.tsx` — réécrit (Tailwind, plus de `.module.scss`).
- `frontend/src/components/layouts/Sidebar.tsx` — réécrit (nav IA : Vue d'ensemble / Planifier / Suivre / Référence).
- `frontend/src/components/layouts/Header.tsx` — réécrit (Project switcher + Factory selector + thème).
- `frontend/src/components/layouts/FactorySelector.tsx` — **nouveau**.
- E2E : `frontend/e2e/` (ou emplacement Playwright existant) — adapter le test de navigation au nouveau shell.

---

### Task 1: Installer Tailwind v4 + wiring Vite

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Create: `frontend/src/index.css`
- Modify: `frontend/src/main.tsx:3` (remplace l'import `./styles/index.scss` par `./index.css`)

**Interfaces:**
- Produces: build Tailwind fonctionnel ; classes utilitaires disponibles globalement.

- [ ] **Step 1: Ajouter les dépendances**

Dans `frontend/`, éditer `package.json` `devDependencies` pour ajouter `"tailwindcss": "^4.1.0"` et `"@tailwindcss/vite": "^4.1.0"`, `dependencies` : `"class-variance-authority": "^0.7.1"`, `"clsx": "^2.1.1"`, `"tailwind-merge": "^3.0.0"`, `"tailwindcss-animate": "^1.0.7"`. Puis régénérer le lockfile **dans un conteneur** (l'édition host du lock est hook-bloquée) :

Run: `docker compose -f docker-compose.test.yml run --rm --entrypoint sh frontend-test -c "npm install"`
Expected: `package-lock.json` régénéré par le conteneur, 0 erreur. Puis `make build` pour cuire les deps dans les images.

- [ ] **Step 2: Brancher le plugin Vite**

Dans `frontend/vite.config.ts`, importer et ajouter le plugin :

```ts
import tailwindcss from "@tailwindcss/vite";
// ...
plugins: [react(), tailwindcss()],
```

- [ ] **Step 3: Créer l'entrée CSS**

Créer `frontend/src/index.css` :

```css
@import "tailwindcss";
@import "./styles/theme.css";
```

- [ ] **Step 4: Pointer main.tsx sur la nouvelle entrée**

Dans `frontend/src/main.tsx`, remplacer `import "./styles/index.scss";` par `import "./index.css";`.

- [ ] **Step 5: Vérifier le build**

Run: `make build` (ou cible build du repo)
Expected: build vert, aucune référence cassée à `index.scss`.

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/src/index.css frontend/src/main.tsx
git commit -m "chore(frontend): add Tailwind v4 via Vite plugin"
```

---

### Task 2: Tokens de la nouvelle identité (frontend-design)

**Files:**
- Create: `frontend/src/styles/theme.css`
- Modify: `frontend/index.html` (retire `data-persona="console"`, met à jour `<link>` polices selon l'identité, `theme-color`)

**Interfaces:**
- Produces: variables CSS de thème (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--radius`, familles de polices), light sur `:root`, dark sur `.dark` — noms consommés par shadcn (Task 3) et tout composant.

- [ ] **Step 1: Explorer l'identité**

Invoquer la compétence `frontend-design` pour définir la nouvelle direction visuelle SFM (palette, typo, radius, densité). **Output contract obligatoire** : un jeu de tokens complet remplissant EXACTEMENT les variables listées ci-dessous, en light et dark, contrastes WCAG AA vérifiés. Abandonner le persona Console.

- [ ] **Step 2: Écrire theme.css**

Créer `frontend/src/styles/theme.css` avec la structure (valeurs issues de l'étape 1 ; ne pas laisser de placeholder — reporter les hex réels) :

```css
:root {
  --background: <hex>;
  --foreground: <hex>;
  --card: <hex>;
  --card-foreground: <hex>;
  --primary: <hex>;
  --primary-foreground: <hex>;
  --muted: <hex>;
  --muted-foreground: <hex>;
  --border: <hex>;
  --ring: <hex>;
  --radius: <value>;
  --font-display: <stack>;
  --font-body: <stack>;
  --font-mono: <stack>;
}
.dark {
  --background: <hex>;
  --foreground: <hex>;
  --card: <hex>;
  --card-foreground: <hex>;
  --primary: <hex>;
  --primary-foreground: <hex>;
  --muted: <hex>;
  --muted-foreground: <hex>;
  --border: <hex>;
  --ring: <hex>;
}
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
  --color-muted: var(--muted);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --font-display: var(--font-display);
  --font-body: var(--font-body);
  --font-mono: var(--font-mono);
}
```

- [ ] **Step 3: Mettre à jour index.html**

Dans `frontend/index.html` : retirer `data-persona="console"` de `<html>`, ajuster `<link>` Google Fonts aux familles retenues, mettre `theme-color` à la couleur de fond dark.

- [ ] **Step 4: Vérification visuelle**

Run: `make up` puis ouvrir http://localhost:9109 — fond/texte/accent appliqués, bascule `.dark` OK.
Expected: identité visible, aucun style Console résiduel.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/styles/theme.css frontend/index.html
git commit -m "feat(frontend): new SFM visual identity tokens (drop Console persona)"
```

---

### Task 3: Initialiser shadcn/ui + helper cn()

**Files:**
- Create: `frontend/components.json`
- Create: `frontend/src/lib/utils.ts`
- Create: `frontend/src/components/ui/button.tsx` (premier composant, valide la chaîne)

**Interfaces:**
- Consumes: tokens de Task 2 (les composants shadcn lisent `--color-*`).
- Produces: `cn(...classes)` depuis `@/lib/utils` ; composants `@/components/ui/*`.

- [ ] **Step 1: Créer cn()**

Créer `frontend/src/lib/utils.ts` :

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Config shadcn**

Créer `frontend/components.json` (style tailwind v4, alias `@/components`, `@/lib/utils`, css `src/index.css`, baseColor neutral, cssVariables true). Aligner les alias sur `@`.

- [ ] **Step 3: Générer Button**

Ajouter `frontend/src/components/ui/button.tsx` (composant shadcn Button standard, variantes via `cva`, utilisant `cn`). Reporter le code shadcn officiel adapté aux tokens `--color-primary`, etc.

- [ ] **Step 4: Vérifier typecheck**

Run: `make typecheck` (ou cible typecheck)
Expected: PASS, `@/lib/utils` et `@/components/ui/button` résolus.

- [ ] **Step 5: Commit**

```bash
git add frontend/components.json frontend/src/lib/utils.ts frontend/src/components/ui/button.tsx
git commit -m "chore(frontend): init shadcn/ui (cn helper + Button)"
```

---

### Task 4: Logique de regroupement en usines (TDD Vitest)

**Files:**
- Create: `frontend/src/domain/factories/types.ts`
- Create: `frontend/src/domain/factories/groupByFactory.ts`
- Test: `frontend/src/domain/factories/groupByFactory.test.ts`

**Interfaces:**
- Consumes: `SnapshotRead[]` (de `@/domain/snapshots/types`).
- Produces: `type Factory = { saveName: string; snapshotCount: number; latest: SnapshotRead }` ; `groupByFactory(snapshots: SnapshotRead[]): Factory[]` trié par `latest.imported_at` décroissant.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `frontend/src/domain/factories/groupByFactory.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { groupByFactory } from "./groupByFactory";

describe("groupByFactory", () => {
  it("groups snapshots by save_name and keeps the latest as representative", () => {
    const snaps = [
      { id: "a", name: "s1", save_name: "Alpha", play_time: 1, imported_at: "2026-01-01T00:00:00Z" },
      { id: "b", name: "s2", save_name: "Alpha", play_time: 2, imported_at: "2026-02-01T00:00:00Z" },
      { id: "c", name: "s3", save_name: "Beta", play_time: 3, imported_at: "2026-01-15T00:00:00Z" },
    ];
    const result = groupByFactory(snaps as never);
    expect(result.map((f) => f.saveName)).toEqual(["Alpha", "Beta"]);
    expect(result[0].snapshotCount).toBe(2);
    expect(result[0].latest.id).toBe("b");
  });

  it("returns an empty array for no snapshots", () => {
    expect(groupByFactory([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `docker compose -f docker-compose.test.yml run --rm frontend-test` (ou `make tests` scoped frontend)
Expected: FAIL — `groupByFactory` introuvable.

- [ ] **Step 3: Implémenter**

Créer `frontend/src/domain/factories/types.ts` :

```ts
import type { SnapshotRead } from "@/domain/snapshots/types";

export interface Factory {
  saveName: string;
  snapshotCount: number;
  latest: SnapshotRead;
}
```

Créer `frontend/src/domain/factories/groupByFactory.ts` :

```ts
import type { SnapshotRead } from "@/domain/snapshots/types";
import type { Factory } from "./types";

export function groupByFactory(snapshots: SnapshotRead[]): Factory[] {
  const byName = new Map<string, SnapshotRead[]>();
  for (const snap of snapshots) {
    const list = byName.get(snap.save_name) ?? [];
    list.push(snap);
    byName.set(snap.save_name, list);
  }
  const factories = Array.from(byName.entries()).map(([saveName, list]) => {
    const latest = list.reduce((acc, cur) =>
      cur.imported_at > acc.imported_at ? cur : acc,
    );
    return { saveName, snapshotCount: list.length, latest };
  });
  return factories.sort((a, b) =>
    b.latest.imported_at.localeCompare(a.latest.imported_at),
  );
}
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run: `docker compose -f docker-compose.test.yml run --rm frontend-test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/domain/factories
git commit -m "feat(frontend): group snapshots into factories by save_name"
```

---

### Task 5: FactoryContext (usine active)

**Files:**
- Create: `frontend/src/context/FactoryContext.tsx`

**Interfaces:**
- Consumes: `useSnapshotsQuery()` (de `@/domain/snapshots/queries`), `groupByFactory` (Task 4).
- Produces: `FactoryProvider` ; hook `useFactory(): { factories: Factory[]; currentSaveName: string | null; setCurrentSaveName: (name: string | null) => void; }`. Persiste `currentSaveName` dans `localStorage` clé `sfm.currentSaveName` ; auto-sélectionne la première usine si aucune active.

- [ ] **Step 1: Implémenter le provider**

Créer `frontend/src/context/FactoryContext.tsx` (Context + Provider ; lit snapshots via TanStack Query, dérive `factories = groupByFactory(...)`, expose l'état ; garde-fou : reset si `currentSaveName` absent des usines). Utiliser `useState` + `useEffect` pour la persistance localStorage.

- [ ] **Step 2: Typecheck**

Run: `make typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/context/FactoryContext.tsx
git commit -m "feat(frontend): FactoryContext for active save selection"
```

---

### Task 6: Réécrire le shell (Layout + Sidebar + Header + FactorySelector)

**Files:**
- Modify: `frontend/src/components/layouts/Layout.tsx` (réécrit en Tailwind)
- Modify: `frontend/src/components/layouts/Sidebar.tsx` (réécrit ; nav IA)
- Modify: `frontend/src/components/layouts/Header.tsx` (réécrit)
- Create: `frontend/src/components/layouts/FactorySelector.tsx`
- Modify: `frontend/src/App.tsx` (wrappe les routes du Layout avec `FactoryProvider`)
- Delete: `frontend/src/components/layouts/*.module.scss` (Layout/Sidebar/Header), `frontend/src/styles/index.scss` (si plus référencé)

**Interfaces:**
- Consumes: `useFactory()` (Task 5), `useTheme` (`@/hooks/useTheme`), `useProjects`/`ProjectSwitcher` existants, `@/components/ui/button` (Task 3).
- Produces: shell responsive ; sidebar avec sections **Vue d'ensemble** (`/`), **Planifier** (`/calculator`, `/plans`, `/blueprints`), **Suivre** (`/snapshots`, `/diff`, `/assistant`), **Référence** (`/gamedata`). Les routes cibles inexistantes seront ajoutées aux lots 2-4 ; le lien pointe déjà dessus.

- [ ] **Step 1: FactorySelector**

Créer `frontend/src/components/layouts/FactorySelector.tsx` : dropdown (shadcn) listant `factories` (par `saveName`, badge `snapshotCount`), sélection → `setCurrentSaveName`. État vide : « Aucune usine — importez un save ».

- [ ] **Step 2: Réécrire Sidebar**

Réécrire `Sidebar.tsx` en Tailwind : liste des 4 sections ci-dessus avec `NavLink` (React Router), icônes lucide-react, état actif via classes `cn(...)`. Libellés i18n via `useTranslation` (clés existantes ou nouvelles dans `src/i18n/locales`).

- [ ] **Step 3: Réécrire Header**

Réécrire `Header.tsx` en Tailwind : `ProjectSwitcher` (connexion backend, existant), `FactorySelector`, bouton thème (`useTheme`), état backend (`useBackendStatus`).

- [ ] **Step 4: Réécrire Layout**

Réécrire `Layout.tsx` en Tailwind : grille sidebar + colonne principale (`<Outlet />`), header en haut. Retirer l'import du `.module.scss`.

- [ ] **Step 5: Câbler le provider**

Dans `App.tsx`, envelopper la route `element={<Layout />}` avec `<FactoryProvider>` (à l'intérieur d'`AuthProvider`).

- [ ] **Step 6: Supprimer les SCSS morts**

Supprimer les `.module.scss` des composants réécrits et `styles/index.scss` s'il n'est plus importé.

- [ ] **Step 7: Typecheck + lint + build**

Run: `make typecheck && make build` (pas de lint frontend — ESLint parké D-0012)
Expected: tous verts, aucune référence SCSS cassée.

- [ ] **Step 8: Commit**

```bash
git add -A frontend/src
git commit -m "feat(frontend): rewrite app shell with Tailwind (sidebar IA + factory selector)"
```

---

### Task 7: Adapter le E2E de navigation

**Files:**
- Modify: le test Playwright de navigation/layout (localiser via `find frontend -path '*e2e*' -name '*.spec.ts'` ou `docker-compose.e2e.yml`)

**Interfaces:**
- Consumes: nouveau DOM du shell (rôles/aria-labels des liens de nav, sélecteur d'usine).

- [ ] **Step 1: Localiser et lire le spec de navigation**

Run: `find frontend -path '*e2e*' -name '*.spec.ts'`
Puis lire le spec couvrant la nav/layout.

- [ ] **Step 2: Mettre à jour les sélecteurs**

Adapter les sélecteurs aux nouveaux libellés/rôles (sections Vue d'ensemble / Planifier / Suivre / Référence). Ajouter des `aria-label` stables dans le shell si nécessaire pour des sélecteurs robustes.

- [ ] **Step 3: Lancer le E2E**

Run: `make docker-e2e`
Expected: navigation verte sur le nouveau shell.

- [ ] **Step 4: Commit**

```bash
git add -A frontend
git commit -m "test(e2e): adapt navigation spec to rewritten shell"
```

---

## Self-Review

- **Spec coverage** : §2 stack/identité → Tasks 1-3 ; §4 IA (sidebar sections) → Task 6 ; objet usine `save_name` front-only → Tasks 4-5 ; §6 design system → Task 2 ; §8 tests (Vitest logique + Playwright) → Tasks 4, 7 ; §9 lot 1 (shell+identité) → ce plan. Lots 2-5 (GameData, Planifier, Suivre, polish) = plans séparés à venir.
- **Placeholders** : les seules valeurs différées sont les hex/typo de l'identité (Task 2), produites par la session frontend-design avec output contract explicite — pas un TODO libre.
- **Type consistency** : `Factory`/`groupByFactory` cohérents entre Tasks 4-5-6 ; `useFactory` signature identique en Tasks 5 et 6 ; `cn` de `@/lib/utils` en Tasks 3 et 6.

## Notes de vérification à faire à l'exécution

- Cibles/commandes confirmées (voir Global Constraints). Rappel : pas de cible Make pour le Vitest frontend — utiliser `docker compose -f docker-compose.test.yml run --rm frontend-test`.
- `SnapshotRead` confirmé : `{ id, name, save_name, play_time, imported_at, data }` (`data: CompactSnapshot`). Cohérent avec Task 4.
- Vérifier au moment de l'install que Tailwind v4.x + `@tailwindcss/vite` sont bien compatibles Vite 8 ; ajuster les bornes de version si besoin.
- Les services `frontend-test`/`frontend-lint` buildent le stage `deps` et montent `./frontend:/app` avec un volume anonyme `/app/node_modules` ; après `npm install`, refaire `make build` pour que les images embarquent les nouvelles deps.
