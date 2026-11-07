# ROADMAP — usefull-containers

> Reconstructed from repo signals (documentation-only). Not an owner-authored
> roadmap. Tags: INFERENCE/UNKNOWN/PROPOSAL.

## Signalled / in-flight

- **Svelte container (INFERENCE).** `SVELTE_CONTAINER_VERSION=` exists (empty)
  in `.env`/`.env.example`, suggesting a planned frontend tooling/runtime
  container not yet built.
- **live-platform maturation (INFERENCE).** Present as a runtime app image;
  depth of features (endpoints, SSE channels) not source-verified here.

## Proposals (from REVIEW.md; owner to accept/reject)

- **PROPOSAL:** Fix the git `origin` remote (D-CONTRA-001).
- **PROPOSAL:** Reconcile the README "analyse" badge — the workflow file is
  `ci.yml`, not `analyse.yml` (confirmed absent), so that badge is broken.
- **PROPOSAL:** Improve CLAUDE.md/handover Purpose line (currently a badge blob).
- **PROPOSAL:** Add functional image smoke-tests (see TESTING.md gap).

## UNKNOWN

- Release cadence, deprecation policy for tooling images, and consumer inventory
  are not recorded in-repo.
