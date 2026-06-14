# satisfactory-factory-manager — Design

Visual identity for the factory-manager UI. Implements the chrysa **Neon
Brutalist** design system (`shared-standards/docs/DESIGN-SYSTEM.md`).

## DNA

- **Radius 0** (`--radius-sm/md/lg = 0`; genuine pills/dots keep `999px`/`50%`).
- **2px FG-colored borders** as structure (`--border-width`, `--border-light`).
- **Hard offset shadows** (`--shadow-sm/md = 3px/4px 4px 0`, no blur).
- **Flat fills, no gradients/glow.**
- **Mono-forward:** JetBrains Mono (UI/data) + Space Grotesk (display), loaded
  via `frontend/index.html`.
- **One acid accent:** **orange** — `#ff8a00` (dark), `#d97400` (light) — used as
  a block with `--accent-ink` on top (WCAG AA), never thin acid text.

## Tokens

Single source of truth: `src/styles/_theme.scss` (palette; `:root` is the light
default and `html.dark` is canonical) and `_variables.scss`
(radius/shadow/font/border).
Every `*.module.scss` and the `@mixin card` consume these vars, so the re-skin
propagates without per-component rewrites. Alias tokens (`--color-primary`,
`--color-accent`, `--color-danger`, `--color-success`…) map the names some
modules referenced with literal fallbacks onto the canonical palette.

| role | dark | light |
|---|---|---|
| `--bg` | `#0e0e10` | `#fafafa` |
| `--bg-secondary` | `#18181b` | `#ffffff` |
| `--border` (loud) | `#fafafa` | `#0e0e10` |
| `--primary` (orange) | `#ff8a00` | `#d97400` |
| `--accent-ink` | `#0e0e10` | `#ffffff` |

## Constraints kept

- No framework migration (SCSS + CSS modules retained).
- All `data-testid` selectors and the `html.dark` switch preserved — no
  component logic or test changed.
- `prefers-reduced-motion` respected. Deviation recorded as **D-0008** in
  `DECISIONS.md`.
