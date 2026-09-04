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


<!-- chrysa:standards:start · managed by distribute-standards.sh · DO NOT EDIT -->
# chrysa — Transverse Standards (core)

> The **slim always-on core**. The canonical, tool-agnostic source of truth is `standards/STANDARDS.chrysa.md`; the normative annexes live under `standards/annexes/`. Each rule below is a one-line pointer — its full text lives in the per-domain file named beside the heading (`standards/rules/<domain>.md`), read on demand.

**Where an annexe and the canon disagree, the canon wins.**

### Governance, language & compliance · `standards/rules/governance.md`
- Normative annexes
- Language
- Compliance targets
- Governance — strategic pillars & ADR format

### Cross-cutting stack · `standards/rules/stack.md`
- Cross-cutting stack (settled ADRs — do not relitigate)

### SCM — branches, commits & pull requests · `standards/rules/scm.md`
- Commits
- Branches
- Branch model — `main` is production, `develop` is the workspace
- Merge
- One PR per issue
- Issues and PRs are type-driven

### Architecture, decoupling & portability · `standards/rules/architecture.md`
- Repo provenance — every code repo depends on `project-init`
- Every repo declares its profile and DDD level
- Projects talk through versioned contracts only
- Everything is machine-agnostic and portable — no rule, repo, or script is bound to one machine
- Every external server the service talks to is addressed through the environment — never hardcoded
- Every tracked file and folder must earn its place — a repo holds only what is useful to it now
- The repository architecture is legible to an agent — optimised for Claude, not only for humans
- Deferred work is a governed job, not a fire-and-forget

### Testing · `standards/rules/testing.md`
- Tests: pytest only
- Frontend tests: Vitest + Testing Library + MSW — from the scaffold, not later

### Frontend & web semantics · `standards/rules/frontend.md`
- TypeScript is strict by contract
- The JS/TS package manager is `pnpm` — `npm` and `yarn` are forbidden
- React is a presentation layer, not the domain
- The frontend says when the backend is unreachable or unstable
- The frontend is reactive and real-time by default
- UI state survives reload & focus
- Everything is semantic — the markup, the data, and the URLs
- URL-addressable frontend navigation — mandatory

### APIs, contracts & real-time · `standards/rules/api.md`
- A real-time backend has channel contracts and never blocks
- APIs, SDKs & public contracts follow the `STD-API-001` contract

### Accessibility · `standards/rules/accessibility.md`
- Dark mode
- Every site is usable by the majority of disabilities — not only the screen-reader case

### Documentation & session state · `standards/rules/docs.md`
- Notion logging
- Documentation and Notion are maintained in lockstep with the code — a change that leaves them stale is unfinished
- Session lifecycle (primer + memory + hindsight)

### AI agents & features · `standards/rules/agents.md`
- Agent actions are governed
- An AI feature is evaluated, not just shipped
- An agent writes only where the owner owns

### Security, identity & sessions · `standards/rules/security.md`
- Per-person data implies a user account — no exceptions dressed up as simplicity
- Identity goes through the cluster SSO first
- A session is secured and it expires
- Every form is a hostile input surface — validate on the server, always

### Code quality & anti-patterns · `standards/rules/code-quality.md`
- No hardcoded constants
- No literal HTTP status codes — use the constants the framework already ships
- No code duplication — the second occurrence is an extraction order
- Raised errors are typed
- Failures are contained, and observable
- Prefer a lookup table to a state machine
- Decompose into small, independently unit-testable methods
- Code is read far more often than it is written — optimise for the reader, and standardise the form
- Avoid lambdas and anonymous constructs — a named function is the default
- Basic optimisations and known anti-patterns are caught in review and in CI
- A cache is a correctness contract, not a sprinkle of speed
- Quality gates
- Error handling pattern (all automations)

### Backend Python · `standards/rules/backend-python.md`
- Python packaging — `pyproject.toml` is the single source of truth
- Python is written object-oriented, one class per file
- Import the item, not the module — `from x import y; y()`
- Functions and methods are called with named arguments — positional call sites are the exception, not the rule

### Data, persistence & migrations · `standards/rules/data.md`
- Data, persistence & migrations follow the `STD-DATA-001` contract

### Observability & operations · `standards/rules/observability.md`
- Observability & production readiness follow the `STD-OPS-001` contract
- The container is versioned separately from the application it hosts, and an admin can see what is actually deployed
- Observability — error-tracking → GitHub issues (norm)

### Containers & compose · `standards/rules/containers.md`
- Everything runs in a container — the only exception is the slice of a repo genuinely bound to the host OS
- External dependencies are installed in containers, never on the host
- No virtualenv in a repo — ever
- Tool caches & deps never touch the project tree
- Dockerfiles are multi-stage, with a `production` and a `dev` stage — mandatory
- App containers ship the app only — the platform layer is the owner's responsibility
- Only a publicly useful port is published — everything else stays on the container network
- A compose file is minimal — declare only what the stack needs, default the rest
- Dev stage must hot-reload
- Local dev runs the code in-container, live, in debug mode — never the production server
- Default to dev mode when starting an app locally — any other mode only when explicitly asked
- `.dockerignore` mandatory & exhaustive
- Container-runtime policy

### Product surfaces · `standards/rules/product.md`
- Setup wizard & config panel
- A game is DRM-free and fully playable solo offline
- Every product that is operated ships a management backoffice
- If a user can supply a file, the product accepts an upload
- A floating assistant where it earns its place — never as decoration

### Design system · `standards/rules/design.md`
- Design system

### Developer loop & tooling · `standards/rules/dev-loop.md`
- Makefile targets
- Shared skills (load on demand from shared-standards/.claude/skills/)

### CI/CD, pre-commit & release · `standards/rules/ci-cd.md`
- Release & changelog config (canonical)
- GitHub Actions (reuse first · custom actions centralised · thin workflows)
- Pre-commit & git hooks (native, via pre-commit.com — never wrapped in make)
<!-- chrysa:standards:end -->
