# satisfactory-factory-manager — Claude context

> **Claude Code**: also read `.github/copilot-instructions.md` and `.github/instructions/*.instructions.md` for code specifications.

## What does this project do?

Factory planning tool for Satisfactory (Coffee Stain Studios). Replaces spreadsheets for production chain optimization: resource flow visualization, factory layout planning, AI Q&A assistant (in-game context). Phase 4 project — Gaming/OSS.

## Language Rules

- Language: English — all code, comments, documentation, instructions, and configuration files must be in English.

## Tech stack

| Layer      | Tech                                           |
| ---------- | ---------------------------------------------- |
| Backend    | FastAPI + Python 3.12 (async)                  |
| Frontend   | React 19 + TypeScript 5 (strict) + Vite 6      |
| Styling    | Tailwind CSS v4 + shadcn/ui                    |
| Graph viz  | ReactFlow (factory node graph)                 |
| AI         | ai-aggregator (chrysa) — local Ollama fallback |
| DB         | SQLite (local-first) → Postgres if multi-user  |
| Container  | Docker (multi-stage), Traefik reverse proxy    |
| CI         | GitHub Actions (reusable chrysa workflows)     |
| Versioning | GitVersion (SemVer)                            |
| Pre-commit | pre-commit hooks (chrysa/pre-commit-tools)     |

## Status

Early stage — no code yet. Scaffold to be generated from:
- Backend: `chrysa/project-init` Python template
- Frontend: `Forge-Stack-Workshop/react-app-generator`

## Key decisions

- Local-first: SQLite default, no cloud dependency
- Game data source: static JSON from community Wiki (Satisfactory Tools API)
- AI integration: route through `ai-aggregator` for consistent LLM access
- ReactFlow for factory graph — same lib as container-webview dependency graph

## Development workflow (to be set up)

```bash
make install     # install backend + frontend deps
make dev         # start API + frontend
make test        # pytest + vitest
make build       # production build
```

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **satisfactory-factory-manager** (8 symbols, 7 relationships, 0 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/satisfactory-factory-manager/context` | Codebase overview, check index freshness |
| `gitnexus://repo/satisfactory-factory-manager/clusters` | All functional areas |
| `gitnexus://repo/satisfactory-factory-manager/processes` | All execution flows |
| `gitnexus://repo/satisfactory-factory-manager/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

## Skills

Shared skills from `shared-standards/.claude/skills/`:

- `ui-ux/SKILL.md` — UX/UI/ergonomics across ALL surfaces (web, CLI, VS Code, Discord, desktop, game, agent) + WCAG 2.1 AA + dark mode + i18n FR+EN (load when building any human-facing surface)
