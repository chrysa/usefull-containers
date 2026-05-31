# CLAUDE.md — usefull-containers

## Project

**Name:** usefull-containers
**Stack:** Mixed / to document
**Purpose:** [![CI — Analyse](https://github.com/chrysa/usefull-containers/actions/workflows/analyse.yml/badge.svg)](https://github.com/chrysa/usefull-containers/actions/workflows/analyse.yml).

## Working Rules

- Language: English — all code, comments, documentation, instructions, and configuration files must be in English.
- Commits: Conventional Commits (`type(scope): description`).
- Prefer repository make targets when a Makefile is available.
- Read `.github/instructions/*.instructions.md` when present before starting task-specific work.

## Claude Compatibility

- Claude Code hooks are configured in `.claude/settings.json`.
- Shared hooks, thresholds and skills are vendored from `chrysa/shared-standards` into this repository.
- Keep repository-specific overrides in this file and keep generic automation in `.claude/`.

## Read Order

1. `~/.claude/CLAUDE.md` (private user preferences)
2. `CLAUDE.md` (this repository)
3. `.github/copilot-instructions.md`
4. `.github/instructions/*.instructions.md` when present

## Available Skills

Local Claude skills in `.claude/skills/`:
- `testing-pytest` for Python test work
- `dockerfile-multistage` for Dockerfile authoring
- `api-design` for REST and FastAPI/API design tasks

## Repository Notes

- Add repository-specific architecture, operational constraints, or domain rules here when needed.
- If this repository needs extra Claude skills, add them under `.claude/skills/`.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **usefull-containers** (145 symbols, 118 relationships, 0 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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
| `gitnexus://repo/usefull-containers/context` | Codebase overview, check index freshness |
| `gitnexus://repo/usefull-containers/clusters` | All functional areas |
| `gitnexus://repo/usefull-containers/processes` | All execution flows |
| `gitnexus://repo/usefull-containers/process/{name}` | Step-by-step execution trace |

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
