# DECISIONS — satisfactory-factory-manager

> Repository-local ADRs (Architectural Decision Records). Numbering: D-XXXX.
> Any deviation from [CODE_MANIFEST.md](../../CODE_MANIFEST.md) must be documented here.
> No active deviation → this project follows all chrysa global standards.

---

## D-0001 — Scaffold pending — no code yet

**Date**: 2026-04-29
**Status**: accepted

This project is at scaffold-needed stage (phase S2). Backend and frontend code will be generated from:
- Backend: `chrysa/project-init` Python template
- Frontend: `Forge-Stack-Workshop/react-app-generator`

Until scaffold is generated, the project only contains configuration and CI setup files.
All chrysa standards apply from day one of code generation.

## D-0002 — Adherence to chrysa global standards

**Date**: 2026-04-29
**Status**: accepted

This project follows all conventions defined in `CODE_MANIFEST.md` (chrysa portfolio standards).
No active deviation is in effect beyond D-0001.

## D-0003 — Scope pivot: offline optimizer, not live monitoring

**Date**: 2026-05-23 (recorded 2026-05-24 at V1 closure)
**Status**: accepted (supersedes the live-monitoring scope in the Notion canonical record)

The Notion record described a two-layer product: (1) an offline factory optimizer and
(2) a live monitoring dashboard ingesting from the FRM mod and Dedicated Server HTTPS
API into TimescaleDB, with Discord alerts, deployed on Kimsufi. **Only layer (1) was
built.** V1 (SFM-1→21) delivers:

- Game data import (static ZIP from community wiki) — not FRM mod / DS API polling.
- Blueprint CRUD + tags + search.
- Recursive recipe calculator.
- ReactFlow production-chain graph with dagre layout.
- Factory plans CRUD with target items, duplicate, import/export JSON.
- Floating AI assistant widget routed through `ai-aggregator`.
- Local sync agent (SFM-7) **deferred** — not part of V1.

Rationale:

- Live monitoring is only justified if the offline tool is itself used (P3 / Opportuniste).
  Without that signal, ingestion + hosting + alerts are speculative infrastructure.
- The offline product is self-contained and useful without a server (single-user,
  local-first), matching the chrysa local-first principle.
- TimescaleDB / Kimsufi deployment, Discord alerting, and FRM mod ingestion are deferred
  behind the V1 gate (see [`docs/gate-v1-validation.md`](docs/gate-v1-validation.md)).

If the gate fails, the live-monitoring scope is **abandoned permanently**.

## D-0004 — Persistence: SQLite local-first, not TimescaleDB

**Date**: 2026-05-23 (recorded 2026-05-24 at V1 closure)
**Status**: accepted

V1 uses **SQLite** as the persistence layer for blueprints, plans, tags, and game data
imports. The Notion record specified TimescaleDB + hypertables + retention policies — that
choice was tied to live time-series ingestion (see [D-0003](#d-0003--scope-pivot-offline-optimizer-not-live-monitoring))
and does not apply.

Consequences:

- No external database to host or back up; the app is fully self-contained.
- A future Postgres migration remains possible (SQLAlchemy 2.0 async abstracts the dialect)
  if multi-user mode is ever needed — but only if D-0003's gate passes and the product
  proves load-bearing for more than one player.
- No retention policy or compaction needed: data volume is bounded by the number of
  blueprints and plans a single user creates.

## D-0005 — Game data via static ZIP import, not live ingestion

**Date**: 2026-05-23 (recorded 2026-05-24 at V1 closure)
**Status**: accepted

Recipes, items, and machine data come from a **user-uploaded ZIP** of static JSON sourced
from the community wiki (Satisfactory Tools API). The Notion record proposed live
ingestion through the FRM mod HTTP poller and the Dedicated Server HTTPS API; that path
was not taken (see [D-0003](#d-0003--scope-pivot-offline-optimizer-not-live-monitoring)).

Consequences:

- The data layer is **versioned by game patch**, refreshed manually when the user uploads
  a new ZIP. No mod dependency, no dedicated server required.
- No real-time bottleneck detection (the optimizer is fed by static recipes and
  user-entered targets, not by live machine throughput).
- If the gate passes and live ingestion is reopened, the static data layer remains
  authoritative for recipes; live data would only feed the dashboard layer.
