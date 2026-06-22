# satisfactory-factory-manager — Design

Adopts the chrysa **Console** persona —
`shared-standards/docs/DESIGN-SYSTEM.md` §2 + `docs/adr/0002-design-personas.md`.
This file records only what is SFM-specific. (Was Neon Brutalist; migrated to
Console persona per the 2026-06 design audit.)

## Identity

Dense factory-planner tool. Console persona — a compact, readable dev-tool
surface: 4px radius, 1px hairline borders, soft blurred shadows, **Inter body**
with monospace reserved for data/numeric/recipe tables, Space Grotesk display,
and an **industrial orange** accent (`--primary: #ff8a00` dark / `#c2410c` light).
Identity = Console + orange, not the accent hue alone.

## Information architecture (IA brief)

> Per `shared-standards/docs/UX-UI-GUIDELINES.md` §3.0 + DESIGN-SYSTEM §1.1: the
> Console persona is the *surface*; this layout is designed for SFM's job. The
> persona does not prescribe a layout — the layout serves the planner's job.

- **Job-to-be-done** — plan and manage Satisfactory factory production chains
  (calculator, blueprints, production plans, game-data reference).
- **Primary objects** — production nodes / blueprints / plans.
- **Primary view** — the **Calculator** (recipe tree / production graph): a
  sidebar-input + main-canvas split, dense and functional like an industrial IDE.
  Blueprint and Plan views are dense card/list grids. Game data is a filterable
  two-panel reference list (search + card detail).
- **Primary action** — add a target item to the calculator and solve the graph.
- **Density** — compact (Console `h-9` control height). Tables use monospace
  figures for quantities; copy labels uppercase short. The layout is a multi-page
  dense planner — NOT restructured to a generic stat-cards shell.

## Typography

| Role | Stack | Usage |
|---|---|---|
| Display | `"Space Grotesk", system-ui, sans-serif` | `h1–h3`, page titles |
| Body | `"Inter", system-ui, -apple-system, sans-serif` | All body copy, normal case |
| Data / Mono | `"JetBrains Mono", "Fira Code", ui-monospace, monospace` | Quantities, IDs, recipe tables, numeric values |

All three loaded via `<link>` + preconnect in `frontend/index.html`. Body is
Inter in normal case; uppercase reserved for short eyebrow labels only.

## Tokens

Single source of truth: `src/styles/_theme.scss` (palette) and
`_variables.scss` (radius / shadow / font / border).

`:root` = **light** (the no-class default). `html.dark` = **dark** (canonical
reference — dark values meet the same WCAG AA bar as light). This is the SFM
convention matched to `useTheme.ts` which toggles the `.dark` class. DO NOT flip
`:root` to dark.

`data-persona="console"` is set on `<html>` in `frontend/index.html`.

Console axes vs. the prior Neon Brutalist:

| Axis | Neon Brutalist | Console (now) |
|---|---|---|
| Radius | `0px` | `4px / 4px / 6px` |
| Border weight | `2px` FG-colored | `1px` hairline (`#d4d4d8` light / `#2e2e33` dark) |
| Shadow | `3px 3px 0` hard offset | `0 1px 2px rgb(0 0 0/.22)` soft blur |
| Body font | `var(--font-mono)` (mono-forward) | `var(--font-body)` = Inter, normal case |
| `--primary` dark | `#ff8a00` | `#ff8a00` (unchanged) |
| `--primary` light | `#d97400` | `#c2410c` (aligned to §4 authoritative) |

## Theme mechanism

`useTheme.ts` reads OS preference (`prefers-color-scheme`) and toggles the
`.dark` class on `<html>`. `:root` holds light values (the no-class default);
`html.dark` holds dark. This is OS-adaptive and correct — DO NOT touch
`useTheme.ts`, DO NOT add a `.light` class, DO NOT move dark values into `:root`.

## Conformance

- Shared neutral frame present (`:root` light + `html.dark` dark), no hardcoded
  hex in components.
- `data-persona="console"` on `<html>`.
- Body is `--font-body` (Inter) in normal case; display = Space Grotesk;
  mono = JetBrains for data/IDs/recipe figures only.
- Per-app accent from DESIGN-SYSTEM §4: `#ff8a00` dark / `#c2410c` light.
- Console radius/border/shadow axes applied via `_variables.scss` tokens;
  inherited by all `*.module.scss` components.
- WCAG AA verified both themes (fg 18:1 on bg; muted 7:1; accent as fill with
  `--accent-ink` text).
- `prefers-reduced-motion` respected in `index.scss`.
- All `data-testid` selectors and component logic untouched.
