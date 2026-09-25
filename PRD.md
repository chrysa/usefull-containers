# PRD — usefull-containers

> Documentation-only, reconstructed from repo evidence. This project ships no
> formal PRD; this is an inferred product framing. Tags: FACT/INFERENCE/UNKNOWN.

## Problem (INFERENCE)

Python developers and CI pipelines need lint/type/security/test tooling and
application base images without installing and version-managing that toolchain on
every host or in every project.

## Solution (FACT, `README.md`)

Package each tool and each app runtime as a disposable Docker container run
one-shot against the current working directory (`${PWD}:/app`). Publish the
quality tools to Docker Hub (`chrys4`) for drop-in reuse; keep the application
base images as local build images.

## Target users (FACT)

Python developers and CI pipelines wanting containerised, disposable tooling.

## In scope (FACT)

- 16 quality/tooling containers (see ARCHITECTURE.md §4.1).
- 4 application/runtime base images (django-drf, flask, flask-db-migrations,
  live-platform).
- Make-driven build/run/status/publish workflow; GitVersion+SonarCloud CI.

## Out of scope / non-goals (INFERENCE)

- Not a general self-hosted-service stack (despite the repo family); focused on
  dev tooling + Python app runtimes.
- No orchestration/deploy layer (k8s/helm) in-repo. (UNKNOWN whether app images
  are deployed elsewhere.)

## Success criteria (INFERENCE)

- `make build` / `make status` work out of the box after `cp .env.example .env`.
- Tooling images are pullable from `chrys4/*`.
- live-platform serves `/health` on :7891.

## Open questions (UNKNOWN)

- Consumer projects of the app base images (django-drf/flask) — not in repo.
- Whether `SVELTE_CONTAINER_VERSION` (empty in `.env`) signals a planned Svelte
  container. See ROADMAP.md.
