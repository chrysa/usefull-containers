# usefull-containers

## Project Overview
Useful Docker containers for local development tooling across all chrysa projects.

## Repository Structure
See README.md for detailed structure.

## Development Setup
```bash
make install
make dev
```

## Testing
```bash
make test
```

## CI/CD
- Pre-commit hooks: `.pre-commit-config.yaml`
- CI: `.github/workflows/ci.yml`
- PR dependency check: `.github/workflows/dependencies.yml`
- Auto-labeler: `.github/workflows/labeler.yml`
- Release: `.github/workflows/release.yml`

## Code Standards
- All commits must follow conventional commit format
- Pre-commit hooks must pass before push
- CI must be green before merge

## Git Conventions
- Branch naming: `feat/`, `fix/`, `chore/`, `refactor/`, `docs/`
- Commits: conventional commits (`feat:`, `fix:`, `chore:`, etc.)
- Changelog: auto-generated via `cliff.toml`

## Key Decisions
See CHANGELOG.md for version history and notable changes.
