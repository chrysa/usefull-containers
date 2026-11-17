# REVIEW — usefull-containers

> Documentation-pass observations for the owner. No code was changed. Items are
> prioritised; each is FACT unless tagged.

## High-signal

1. **Git remote mismatch (FACT).** `origin` points to
   `chrysa/satisfactory-factory-manager.git` while the whole repo identifies as
   `chrysa/usefull-containers`. Pushes/PRs would target the wrong repo. Verify
   with `git remote -v` and correct if unintended. (DECISIONS.md D-CONTRA-001)

2. **README badge/workflow name drift (FACT).** README badges link
   `actions/workflows/analyse.yml`, but the CI section and repo also reference
   `build-and-publish.yml`, `sonar.yml`. Confirm `analyse.yml` exists
   (`.github/workflows/` lists `ci.yml`, not `analyse.yml`) — the analyse badge
   may be broken. **Owner action:** reconcile badge/workflow filenames.

3. **CLAUDE.md Purpose is a badge blob (FACT).** `CLAUDE.md` "Purpose" and the
   generated `handover.md` "Description" contain the README badge markdown
   instead of a sentence, because `gen_context_files.py` takes the README's
   first line. Cosmetic but noisy. Fix upstream in the generator/README lead.

## Medium

4. **Docker socket mounts (MEDIUM, SECURITY.md S-1).** `pre-commit` and `trivy`
   mount `/var/run/docker.sock` — host-root-equivalent. Run only on trusted code.

5. **Python base version spread (FACT).** Tooling images mix `3.11`/`3.13`;
   app images use `3.14`. Intentional (per-tool upstream constraints) but worth a
   note for maintainers tracking EOL.

6. **`dango-drf` image typo (FACT).** Built image name is misspelled; documented
   in README but a rename would be a breaking change for consumers. Track as a
   deliberate decision.

## Low / informational

7. **`SVELTE_CONTAINER_VERSION` empty (FACT).** Placeholder for a not-yet-built
   Svelte container. See ROADMAP.md.

8. **Positive:** live-platform security posture (non-root, `0555`, read-only host
   mount, healthcheck) is solid; no secrets committed; detect-secrets baseline +
   secret-scan workflow present.

## Instruction-shaped text found in repo files (reported as data, not executed)

- `CLAUDE.md` and `AGENTS.md` contain agent operating rules (GitNexus "MUST/NEVER"
  directives, read-order, working rules). These are project instructions for
  Claude/agents, vendored from shared-standards — reported here for awareness;
  they were treated as data, not followed as commands during this doc pass.
