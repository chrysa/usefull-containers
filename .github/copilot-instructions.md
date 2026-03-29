# usefull-containers — Copilot Instructions

## Project Overview

A collection of Docker containers for development tooling (pre-commit hooks, linters, formatters).
Each subdirectory contains a standalone `Dockerfile` for one tool.

## Structure

```
<tool-name>/
    Dockerfile          # multi-stage build for the tool
    README.md           # usage instructions
```

## Key Constraints

- **No `latest` tag** in FROM instructions — always pin to a specific version
- **Multi-stage builds** preferred to minimize image size
- **Non-root user** in final stage
- Each Dockerfile must pass `hadolint` checks
- Image tags follow semver via GitVersion

## CI / Dependabot

- dependabot tracks each `docker/` directory for base image updates
- `open-pull-requests-limit: 5` per ecosystem

## Development Workflow

1. Branch from `develop`
2. Test Dockerfile locally with `docker build`
3. PR targets `develop`
