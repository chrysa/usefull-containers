# usefull-containers

[![CI — Analyse](https://github.com/chrysa/usefull-containers/actions/workflows/analyse.yml/badge.svg)](https://github.com/chrysa/usefull-containers/actions/workflows/analyse.yml)
[![CI — Build](https://github.com/chrysa/usefull-containers/actions/workflows/build-and-publish.yml/badge.svg)](https://github.com/chrysa/usefull-containers/actions/workflows/build-and-publish.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=chrysa_usefull-containers&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=chrysa_usefull-containers)
[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit)](https://pre-commit.com/)
[![Docker Hub](https://img.shields.io/badge/Docker%20Hub-chrysa-blue?logo=docker)](https://hub.docker.com/u/chrys4)

> A collection of ready-to-use Docker containers for Python code quality, testing, and development tooling.

---

## Table of Contents

- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Containers](#containers)
- [Makefile reference](#makefile-reference)
- [CI/CD](#cicd)
- [Contributing](#contributing)

---

## Requirements

- Docker >= 24
- Docker Compose >= 2.20
- GNU Make >= 4.3
- Python >= 3.13 (pre-commit local execution)

---

## Quick Start

```bash
# Copy and configure environment variables
cp .env.example .env

# Build all containers
make build

# Check container statuses
make status
```

---

## Containers

| Container | Base Image | Docker Hub | Description |
|---|---|---|---|
| [black](#black) | `pyfound/black:23.3.0` | `chrys4/black` | Python code formatter |
| [flake8](#flake8) | `python:3.11-alpine` | `chrys4/flake8` | PEP 8 style checker with reporting |
| [hadolint](#hadolint) | `hadolint/hadolint:latest-debian` | `chrys4/hadolint` | Dockerfile linter |
| [mypy](#mypy) | `python:3.11-alpine` | `chrys4/mypy` | Static type checker |
| [pre-commit](#pre-commit) | `python:3.11-slim` | `chrys4/pre-commit` | Git hook manager |
| [pylint](#pylint) | `python:3.11-alpine` | `chrys4/pylint` | Python static analyser with reporting |
| [pytest](#pytest) | `python:3.11-alpine` | `chrys4/pytest` | Test runner with coverage & reporting |
| [python-dev](#python-dev) | `python:3.11-slim` | `chrys4/python-dev` | Interactive dev shell (IPython + ipdb) |
| [reorder-python-imports](#reorder-python-imports) | `python:3.11-alpine` | `chrys4/reorder-python-imports` | Automatic import sorter |
| [sphinx](#sphinx) | `python:3.11-alpine` | `chrys4/sphinx` | Documentation generator |
| [ruff](#ruff) | `python:3.13-alpine` | `chrys4/ruff` | Fast Python linter and formatter |
| [bandit](#bandit) | `python:3.13-alpine` | `chrys4/bandit` | Python security vulnerability scanner |
| [safety](#safety) | `python:3.13-alpine` | `chrys4/safety` | Python dependency security checker |
| [trivy](#trivy) | `aquasec/trivy:0.61.0` | `chrys4/trivy` | Container and filesystem vulnerability scanner |
| [actionlint](#actionlint) | `rhysd/actionlint:latest` | `chrys4/actionlint` | GitHub Actions workflow static checker |
| [yamllint](#yamllint) | `python:3.13-alpine` | `chrys4/yamllint` | YAML files linter |

---

### Black

Python opinionated code formatter, zero-config.

**Packages:** `pyfound/black:23.3.0` (upstream)

```bash
alias my_black="docker run --rm -ti \
  --name=black \
  --volume ${PWD}:/app \
  chrys4/black:latest"
```

---

### Flake8

PEP 8 checker with HTML and JUnit XML output.

**Packages:** `flake8==6.0.0`, `flake8-black==0.3.6`, `flake8-html==0.4.3`, `flake8-junit-report==2.1.0`, `flake8-mypy==17.8.0`

```bash
alias my_flake8="docker run --rm -ti \
  --name=flake8 \
  --volume ${PWD}:/app \
  chrys4/flake8:latest"
```

---

### Hadolint

Dockerfile linter — enforces best practices and shell pitfalls.

```bash
alias my_hadolint="docker run --rm -ti \
  --name=hadolint \
  --volume ${PWD}:/app \
  chrys4/hadolint:latest \
  $(find . -name Dockerfile)"
```

---

### Mypy

Static type checker for Python with JUnit XML output.

**Packages:** `mypy==1.2.0`, `junit-xml==1.9`

```bash
alias my_mypy="docker run --rm -ti \
  --name=mypy \
  --volume ${PWD}:/app \
  chrys4/mypy:latest"
```

---

### Pre-commit

Git hook manager. Needs Docker socket access to run hooks that spin up containers.

**Packages:** `pre-commit==3.2.2`

```bash
alias my_pre_commit="docker run --rm -ti \
  --name=pre-commit \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume ${PWD}:/app \
  chrys4/pre-commit:latest"
```

---

### Pylint

Python static code analyser with HTML and JUnit output.

**Packages:** `pylint==2.17.2`, `pylint-junit==0.3.2`, `pylint-report==2.4.0`

```bash
alias my_pylint="docker run --rm -ti \
  --name=pylint \
  --volume ${PWD}:/app \
  chrys4/pylint:latest"
```

---

### Pytest

Full-featured test runner with coverage, benchmarks, HTML report, mocking.

**Packages:** `pytest==7.2.2`, `pytest-cov==4.0.0`, `pytest-html==3.2.0`, `pytest-benchmark==4.0.0`, `pytest-mock==3.10.0`, `faker==18.4.0`, `mock==5.0.1`

```bash
alias my_pytest="docker run --rm -ti \
  --name=pytest \
  --volume ${PWD}:/app \
  chrys4/pytest:latest pytest --rcfile=./setup.cfg"
```

---

### Python Dev

Interactive Python shell for development — IPython REPL + ipdb debugger.

**Packages:** `ipython==8.12.0`, `ipdb==0.13.13`, `prompt-toolkit==3.0.38`

```bash
alias my_python_dev="docker run --rm -ti \
  --name=python-dev \
  --volume ${PWD}:/app \
  chrys4/python-dev:latest"
```

---

### Reorder Python Imports

Automatically reorders and organises Python import statements.

**Packages:** `reorder-python-imports==3.9.0`

```bash
alias my_reorder="docker run --rm -ti \
  --name=reorder-python-imports \
  --volume ${PWD}:/app \
  chrys4/reorder-python-imports:latest"
```

---

### Sphinx

Python documentation generator with ReadTheDocs theme.

**Packages:** `sphinx==6.1.3`, `sphinx-rtd-theme==1.2.0`, `recommonmark==0.7.1`, `graphviz==0.20.1`

```bash
alias my_sphinx="docker run --rm -ti \
  --name=sphinx \
  --volume ${PWD}:/app \
  chrys4/sphinx:latest bash"
```

---

### Ruff

Extremely fast Python linter and formatter written in Rust. Replaces flake8, isort, and partially black.

**Packages:** `ruff==0.9.10`

```bash
alias my_ruff="docker run --rm -ti \
  --name=ruff \
  --volume ${PWD}:/app \
  chrys4/ruff:latest"
```

---

### Bandit

Security-oriented static analyser for Python code. Finds common security issues.

**Packages:** `bandit==1.8.3`, `bandit-junit==0.0.6`

```bash
alias my_bandit="docker run --rm -ti \
  --name=bandit \
  --volume ${PWD}:/app \
  chrys4/bandit:latest"
```

---

### Safety

Checks Python dependencies for known security vulnerabilities.

**Packages:** `safety==3.3.1`

```bash
alias my_safety="docker run --rm -ti \
  --name=safety \
  --volume ${PWD}:/app \
  chrys4/safety:latest"
```

---

### Trivy

Comprehensive vulnerability scanner for containers, filesystems, and git repositories.

**Base:** `aquasec/trivy:0.61.0` (binary upstream)

```bash
alias my_trivy="docker run --rm -ti \
  --name=trivy \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume ${PWD}:/app \
  chrys4/trivy:latest fs --exit-code 1 --severity HIGH,CRITICAL ."
```

---

### Actionlint

Static checker for GitHub Actions workflow files.

**Base:** `rhysd/actionlint:latest` (binary upstream)

```bash
alias my_actionlint="docker run --rm -ti \
  --name=actionlint \
  --volume ${PWD}:/app \
  chrys4/actionlint:latest .github/workflows/"
```

---

### Yamllint

Linter for YAML files with configurable rules.

**Packages:** `yamllint==1.35.1`

```bash
alias my_yamllint="docker run --rm -ti \
  --name=yamllint \
  --volume ${PWD}:/app \
  chrys4/yamllint:latest"
```

---

## Makefile reference

Run `make help` to see all available targets.

| Target | Description | Args |
|---|---|---|
| `build` | Build a service image | `service=<name>` |
| `up` | Start services (foreground) | `service=<name>` |
| `up-detach` | Start services (background) | `service=<name>` |
| `down` | Stop and remove all containers | |
| `start` | Start a stopped service | `service=<name>` |
| `stop` | Stop a running service | `service=<name>` |
| `status` | Show all service statuses | |
| `logs` | Show service logs | `service=<name>` |
| `logs-f` | Follow service logs | `service=<name>` |
| `logs-tail` | Show last N log lines | `service=<name> tail=10` |
| `hadolint-analyse` | Lint all Dockerfiles | |
| `pre-commit` | Run pre-commit on all files | |
| `packages-version` | List outdated packages in all services | |
| `prune` | Remove containers + prune Docker resources | |
| `tag-latest` | Tag all service images as `:latest` | |

---

## CI/CD

| Workflow | Trigger | Description |
|---|---|---|
| [`analyse.yml`](.github/workflows/analyse.yml) | push / pull_request | pre-commit hooks + hadolint per service |
| [`build-and-publish.yml`](.github/workflows/build-and-publish.yml) | push `main`/`develop` | GitVersion → build → push to Docker Hub |
| [`sonar.yml`](.github/workflows/sonar.yml) | push `main` / weekly | SonarCloud quality scan |

Versioning follows [GitVersion](https://gitversion.net/) in `GitHubFlow` mode (configured in [`GitVersion.yml`](GitVersion.yml)).

### Required secrets / variables

| Name | Where | Description |
|---|---|---|
| `DOCKER_HUB_TOKEN` | Secret | Docker Hub access token |
| `SONAR_TOKEN` | Secret | SonarCloud token |
| `DOCKER_HUB_USERNAME` | Variable | Docker Hub username (e.g. `chrys4`) |

---

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Install pre-commit: `pip install "pre-commit>=4.1.0" && pre-commit install`
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
5. Open a pull request

See [ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE/) for bug reports and feature requests.
