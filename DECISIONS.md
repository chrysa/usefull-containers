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
- Local sync agent (SFM-7) **deferred** — not part of V1. *(Delivered post-V1: see [D-0009](#d-0009--blueprint-sync-in-repo-agent-feeds-the-web-hub-syncthing-stays-separate).)*

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

## D-0006 — Authentication: local accounts + Steam OpenID; Epic deferred

**Date**: 2026-05-30
**Status**: accepted

### D-0006 context

The deployed instance (Kimsufi, `sfm.ducal.me`) is protected at the infrastructure
level by TinyAuth (Traefik ForwardAuth middleware). However, an application-level
auth layer adds value:

1. **Game platform integration** — Steam OpenID lets a user prove ownership of
   Satisfactory (AppID 526870) and pulls profile stats (playtime, achievements)
   without storing credentials.
2. **Per-user identity** — multi-project support (D-0003, PR #80) becomes richer
   when projects are associated with a user rather than a browser localStorage.
3. **Optional** in V1 — all existing routes remain publicly accessible behind the
   Traefik SSO wall; auth only gates the `/auth` routes themselves and enriches
   the user experience.

### D-0006 decision

- **Local auth**: username + hashed password (bcrypt), JWT access token (HS256,
  24 h expiry). No email required for V1; no refresh token (kept simple).
- **Steam**: OpenID 2.0 login → verify via `check_authentication` POST → extract
  SteamID64 → call Steam Web API (`GetPlayerSummaries`) → upsert user row →
  redirect to frontend with JWT. Requires `STEAM_API_KEY` env var.
  After link: `GET /api/v1/auth/steam/game-data` returns Satisfactory (AppID 526870)
  playtime + achievements from Steam Web API.
- **Epic Games**: deferred. Epic OAuth 2.0 requires a registered developer application
  (`EPIC_CLIENT_ID`/`EPIC_CLIENT_SECRET`). A placeholder endpoint returns HTTP 501
  until credentials are configured.
- **Persistence**: new `users` table in `auth.db` (SQLite at `$DATA_DIR/auth.db`),
  managed via SQLAlchemy 2.0 async + aiosqlite. `create_all` in lifespan for V1;
  Alembic migrations are tracked as future work.

### New env vars (secrets)

| Variable | Required | Purpose |
|---|---|---|
| `JWT_SECRET_KEY` | **yes** | Signing key for HS256 tokens (min 32 chars) |
| `STEAM_API_KEY` | optional | Steam Web API key (profile + achievements) |
| `FRONTEND_URL` | optional | Redirect base after Steam callback (default `http://localhost:5173`) |

### D-0006 consequences

- Adds deps: `sqlalchemy[asyncio]`, `aiosqlite`, `python-jose[cryptography]`,
  `passlib[bcrypt]`, `httpx`.
- Existing file-based services (blueprints, plans, gamedata) are unaffected.
- `JWT_SECRET_KEY` must be added to SealedSecrets (`secrets/dev/sfm-secrets.yaml`)
  before production deployment — update `secrets/dev/sfm-secrets.README.md` in server repo.
- Epic auth can be activated without an ADR amendment: add `EPIC_CLIENT_ID` /
  `EPIC_CLIENT_SECRET` env vars and the stub endpoint promotes itself.

## D-0007 — Schema migrations via Alembic, not create_all()

**Date**: 2026-05-31
**Status**: accepted (supersedes "Alembic tracked as future work" in D-0006)

The V1 auth feature (D-0006) bootstrapped the `users` table via
`Base.metadata.create_all()` called from the FastAPI lifespan. This is fine
for the very first deploy but becomes fatal as soon as the schema evolves:
`create_all()` only adds **new** tables — it never alters existing ones,
never drops columns, never migrates data.

Discordium hit the exact same wall (D-0005 there) and committed Alembic
later under pressure. We do it now while there is only one table and one
user (me).

### D-0007 decision

- Add `alembic>=1.13.0` to backend deps.
- Ship the Alembic env at `backend/alembic/` with an async-aware `env.py`.
- Add `0001_baseline_users.py` capturing the V1 schema (one table: `users`).
- Replace `init_db()` lifespan logic: in production it runs
  `alembic upgrade head` in a worker thread; in tests it keeps using
  `create_all()` (gated by `settings.test_mode`, set in `conftest.py`).
- Future schema changes MUST be new revisions — **never edit existing
  migrations**, **never reintroduce `create_all()` in production paths**.

### Why a `test_mode` shortcut

Running Alembic in every test would add ~200ms × N tests + a filesystem
dependency on the alembic/ directory, breaking test isolation when tests
relocate the data dir under `tmp_path`. `create_all()` from the model
metadata is equivalent for tests since they always start from an empty DB.

### D-0007 consequences

- Adds dep: `alembic>=1.13.0`.
- Adds files: `backend/alembic.ini`, `backend/alembic/env.py`,
  `backend/alembic/script.py.mako`, `backend/alembic/versions/0001_*.py`.
- New schema change workflow: `alembic revision --autogenerate -m "<msg>"`
  → review the generated script → commit.
- Docker images must include the `alembic/` directory and `alembic.ini`
  (already covered by `COPY app/ ./app` ↔ no, **action item**: extend the
  backend Dockerfile to copy `alembic/` and `alembic.ini` too).
- Production deploy is unchanged for users: migrations run automatically on
  pod start. Rollback uses `alembic downgrade -1` (or a deploy of the
  previous image, which downgrades implicitly).

---

## D-0008 — Frontend visual identity: chrysa "Neon Brutalist" (orange)

**Date**: 2026-06-10
**Status**: accepted

The factory-manager UI adopts the ecosystem Neon Brutalist design system
(`shared-standards/docs/DESIGN-SYSTEM.md`): radius 0, 2px FG-colored borders,
hard offset shadows (`4px 4px 0`, no blur), flat fills, mono-forward (JetBrains
Mono + Space Grotesk display), one acid accent — **orange `#ff8a00`**.

The re-skin is driven through the SCSS token layer
(`src/styles/_theme.scss`, `_variables.scss`, `_mixins.scss`, `index.scss`): the
CSS custom-property names (`--bg`, `--primary`, `--border`, `--radius-*`…) and
the `html.dark` switch are preserved, so every `*.module.scss` and `@mixin card`
inherits. Modules that hardcoded radius/blur-shadow/hex were swept onto the
tokens, and alias tokens (`--color-primary`, `--color-accent`, `--color-danger`,
`--color-success`…) were added so the modules that referenced those undefined
names (with literal fallbacks) now resolve to the brutalist palette. No
component logic, route, or `data-testid` changed.

**Documented deviation.** Genuine circular elements (status dots, pill chips
using `999px`/`50%`) keep their radius; everything else is radius 0.

## D-0009 — Blueprint sync: in-repo agent feeds the web hub; Syncthing stays separate

**Date**: 2026-06-10
**Status**: accepted (lifts the "SFM-7 deferred" note in [D-0003](#d-0003--scope-pivot-offline-optimizer-not-live-monitoring))

### D-0009 context

Two things sync Satisfactory blueprints in the chrysa portfolio, and they were
easy to conflate:

1. **BP Sync — Syncthing** (separate Notion project, pivoted 2026-05-15 from a
   custom hub to Syncthing 3 nodes). It replicates the raw `.sbp`/`.sbpcfg`
   **files** peer-to-peer between PC, Steam Deck, and a Kimsufi backup node. It is
   explicitly *independent of satisfactory-factory-manager*: no web UI, no
   tags/metadata, no awareness of plans or the recipe graph.
2. **The in-repo sync agent (SFM-7)** — `agent/sfm_agent/`, shipped in PR #146
   (endpoint + API-key auth) and hardened in PR #148 (empty-inventory guard). It
   pushes the local blueprint folder **into the factory-manager web hub** via
   `POST /api/v1/blueprints/sync`, so blueprints surface in `/blueprints` with
   tags, search, description editing, and the ReactFlow chain view.

The canonical Notion record describes blueprint sync "via Syncthing", which read
as if the custom agent was redundant. It is not — the two operate at different
layers.

### D-0009 decision

**Keep both; they do not overlap in function.**

- **Syncthing (BP Sync)** owns raw file replication and off-site backup/versioning
  across machines. It is the source of truth for the `.sbp` files on disk.
- **The SFM-7 agent** owns ingestion of those on-disk files into the web hub. It
  is a one-directional mirror (local game folder is authoritative): new/changed
  blueprints upload, locally-removed ones are pruned server-side. It does **not**
  attempt cross-machine replication — that is Syncthing's job.

A typical setup runs both: Syncthing keeps the blueprint folder identical on PC
and Deck; the SFM-7 agent (on whichever machine) feeds that folder into the web
tool for browsing/tagging/planning.

### Why not fold the agent into Syncthing

Syncthing cannot populate the web hub's per-user store, tag sidecars
(`.meta.json`), or audit log — it only moves files between Syncthing nodes. The
web tool's value (search, tags, recipe graph, plans) requires the blueprints to
exist *in the hub*, which only an HTTP client (the agent, or a manual upload) can
do.

### D-0009 consequences

- The agent is **not** a competitor to Syncthing and must not grow cross-machine
  P2P features — that scope stays in BP Sync.
- The agent's mirror semantics are safe by default: an empty/misconfigured local
  folder never wipes the hub (the `allow_empty_prune` guard, PR #148).
- Multi-agent / per-key ownership (an `ApiKey` table) is **out of scope** for the
  single-user deployment; the shared `AGENT_API_KEY` maps to the owner user.
  Revisit only if multi-user mode is opened (gated by [D-0003](#d-0003--scope-pivot-offline-optimizer-not-live-monitoring)).
- The Notion canonical record should be read with this split in mind: "via
  Syncthing" describes file replication, not web-hub ingestion.

## D-0010 — Client-side .sav parsing via esm.sh CDN dynamic import

**Date**: 2026-06-22
**Status**: superseded by [D-0013](#d-0013--vendor-the-sav-parser-parsing-works-with-no-outbound-network)

### D-0010 context

Satisfactory save files (`.sav`) are a proprietary binary format. Parsing them
requires a dedicated library (`@etothepii/satisfactory-file-parser`). The L9
feature (planned-vs-actual diff) needs to parse these files before uploading a
compact snapshot to the backend.

### D-0010 decision

The parser library is **loaded at runtime in the browser** via a dynamic ESM
import from `esm.sh` (a CDN that serves npm packages as ESM):

```
https://esm.sh/@etothepii/satisfactory-file-parser@4.1.1
```

The import is deferred to the moment the user drops a `.sav` file; the parser
is never bundled into the application chunk, keeping the initial JS payload
unaffected (~3–5 MB library).

Parsing runs entirely client-side; the backend only receives the already-reduced
`CompactSnapshot` JSON (a few KB), not the raw binary.

### D-0010 offline / self-hosted limitation

When the host has no outbound internet access (air-gapped self-hosting, offline
LAN play) the CDN import will fail and `.sav` parsing will be unavailable.
The rest of the application (blueprints, plans, game-data) continues to work.

**Vendoring is deferred to a future iteration.** When vendoring is implemented,
the parser module should be bundled as a web worker or lazy chunk via
`vite-plugin-comlink` or a manual `new Worker()` to keep the main-thread bundle
size unchanged.

### D-0010 why not bundle it now

- The library is large (~3–5 MB) and only needed for one feature.
- `@etothepii/satisfactory-file-parser` has its own transitive deps (including
  wasm); bundling it correctly (especially wasm assets) requires non-trivial
  Vite configuration that is out of scope for V1.
- For the target use case (home server on LAN with internet access) the CDN
  import is reliable and introduces no additional latency on the hot path.

### D-0010 consequences

- `.sav` parsing requires internet access (or a local CDN mirror) at parse time.
- The CDN URL is pinned to a specific package version; upgrades require an
  intentional change to `PARSER_URL` in `parseSave.ts`.
- File size is gated at 200 MiB before the `ArrayBuffer` is allocated (see PR
  #186 follow-up) to prevent browser OOM on malformed payloads.
- A user-visible error must be shown (and is) when the CDN import fails, so the
  offline limitation is never a silent failure.

## D-0011 — Assistant L10: LLM via ai-aggregator with rule-based fallback

**Date**: 2026-06-25
**Status**: accepted

### Context

The `/api/v1/assistant/chat` endpoint shipped in V1 as a deterministic keyword
intent engine: it can report counts and link to pages, but cannot answer an open
question like *"comment optimiser ma prod de rotor ?"*. L10 (ROADMAP P3) asks for
a genuine natural-language assistant routed through the chrysa **ai-aggregator**
gateway. The product brief (CLAUDE.md) lists an "AI Q&A assistant" as a core
feature, so the keyword stub was a placeholder, not the intended end state.

### Decision

Add an LLM path that the assistant prefers when configured, falling back to the
existing rule engine otherwise.

- **Gateway contract**: `POST {AI_AGGREGATOR_URL}/api/v1/completions`, header
  `X-API-Key`, body `{prompt, max_tokens, temperature, model?}` → `{text, ...}`.
  The thin async client lives in `app/services/ai_client.py`.
- **Grounding**: the prompt injects a Satisfactory-expert system message plus a
  game-data context block — imported item/recipe counts and the recipes whose
  name matches a significant word in the question (ingredients/products resolved
  to readable item names). The model is told to use *only* that data.
- **Graceful degradation is mandatory**: an empty `AI_AGGREGATOR_URL` disables the
  LLM entirely; any network error, timeout, non-200, or empty completion returns
  `None` and the assistant answers with the deterministic rule engine. Nothing in
  the app depends on a live gateway — the feature is purely additive and the
  offline build keeps working.
- **Response contract unchanged**: replies stay `{reply, actions}`, so the
  frontend widget needed no change. LLM replies still get contextual nav actions
  via the same intent detector.

### Why route through ai-aggregator (not call a provider SDK directly)

The chrysa standard is one gateway for all LLM access (provider-agnostic routing,
prompt history, quota). Calling Anthropic/Ollama directly here would duplicate
key management and break the portfolio's single point of control. The gateway
also lets the deployment pick Ollama as a local fallback without code changes.

### Consequences

- `assistant_service.py` is now covered by tests (removed from the coverage
  `omit` list); both modules sit at 100%/86% line coverage.
- Config gains `ai_aggregator_url`, `ai_aggregator_api_key`, `assistant_model`,
  `assistant_max_tokens`, `assistant_temperature`, `assistant_timeout_seconds`.
- The gateway API key is a secret: provision via SealedSecret when SFM is
  deployed (see [D-0003](#d-0003--scope-pivot-offline-optimizer-not-live-monitoring)).
  V1 stays offline-capable with the LLM off.

## D-0012 — ESLint parked while TypeScript 7 has no typescript-eslint support

**Date**: 2026-07-31
**Status**: accepted

### Context

The chrysa stack pins **TypeScript 7** (settled ADR) and **ESLint** as the TS
linter. Those two are currently incompatible: `typescript-eslint` refuses to run
on TS 7 — the peer range caps at `<6.1.0`, `npm ci` fails ERESOLVE, and even the
canary (`8.65.1-alpha.19`) aborts at load with
`Error: typescript-eslint does not support TS 7.0.` There is no released version
that parses TS 7, and ESLint cannot parse `.ts`/`.tsx` without a parser.

So the repo can satisfy the TS-7 pin or the ESLint gate, not both.

### Decision

Keep TypeScript 7 and park the ESLint gate until upstream ships TS 7 support.
`eslint.config.js` and the `lint` script stay in the repo, unchanged, so
re-enabling is a dependency bump and nothing else. `make lint` reports the
skip explicitly rather than passing silently.

Type safety is not suspended in the meantime — it moves to `tsc`, which was
tightened in the same batch to the full mandated strict set
(`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
`noImplicitReturns`, `useUnknownInCatchVariables`, `isolatedModules`). That
covers the type-correctness rules; it does not cover the style and
React-hooks rules ESLint carried, which are unguarded until it returns.

### Fatal hypothesis

typescript-eslint ships TS 7 support within a release cycle or two, so the gap
is temporary and no alternative linter needs adopting.

### Kill-test

Checked at each dependency review, and at the latest **2026-10-31**: if no
released `typescript-eslint` supports TS 7 by then, the gap has stopped being
temporary — open an ADR to adopt a TS-native linter that does not depend on the
compiler API (oxlint or Biome) rather than leaving the frontend unlinted.

### Validation gate

Re-enabling requires: `npm ci` without `--legacy-peer-deps`, `npm run lint`
green over `src`, and the `lint` target failing on a seeded violation.

### Consequences

- `npm ci` runs with `--legacy-peer-deps` (see `frontend/Dockerfile`) — the
  conflict is lint-only, build and runtime dependencies resolve cleanly.
- The frontend half of `make lint` prints the skip and its reason; CI is not
  gated on a check that cannot run.

## D-0013 — Vendor the .sav parser: parsing works with no outbound network

**Date**: 2026-07-31
**Status**: accepted
**Supersedes**: [D-0010](#d-0010--client-side-sav-parsing-via-esmsh-cdn-dynamic-import)

### D-0013 context

D-0010 loaded `@etothepii/satisfactory-file-parser` at runtime from `esm.sh`
and deferred vendoring, on three premises: the library is 3–5 MB, it carries
wasm assets that Vite cannot bundle without non-trivial configuration, and the
target deployment always has internet access.

Measured against version 4.1.2, the first two are false. The package's only
dependency is `pako`; there is no wasm. Declared as a normal dependency behind
a dynamic `import()`, it builds into a single lazy chunk of **280 kB
(55 kB gzipped)** and leaves the entry chunk unchanged at 284 kB.

The third premise conflicts with the project's own definition of done, which
requires an `.sav` import that works from a real save on a self-hosted install,
and with the portfolio rule that a third-party service has a documented
self-hosted exit path. A CDN on the hot path of the headline feature is that
service, and "vendor it later" was the exit path.

### D-0013 decision

`@etothepii/satisfactory-file-parser` is a declared dependency, imported by
module specifier:

```ts
const [mod, buffer] = await Promise.all([
  import("@etothepii/satisfactory-file-parser"),
  file.arrayBuffer(),
]);
```

Vite emits it as its own chunk, fetched the first time a user drops a `.sav`.
The version is pinned by the lockfile instead of by a URL string in the source,
so upgrades go through the normal dependency review.

### D-0013 fatal hypothesis

The parser stays small enough to ship as a lazy chunk — under roughly 1 MB
gzipped — so vendoring never costs the user a perceptible wait on first parse.

### D-0013 kill-test

Measured at every parser upgrade, from the `vite build` chunk report: if the
parser chunk exceeds **1 MB gzipped**, move it behind a web worker (the
mechanism D-0010 anticipated) so the main thread is never blocked, and record
the change here. Current value: 55 kB gzipped.

### D-0013 validation gate

`.sav` import succeeds from a real save on a host with outbound network
disabled — the parcours the V1 gate documents.

### D-0013 consequences

- Parsing no longer depends on `esm.sh` being reachable, resolvable, or
  serving the pinned version; an air-gapped install keeps the feature.
- The entry chunk is unchanged: the parser is still loaded on demand.
- The CDN-failure error path in the UI is now a parse-failure path only.
- Type definitions ship with the package, so `Parser.ParseSave` is typed
  instead of cast through a hand-written `ParserModule` interface.
