#!make
# makefile-tier: infra
ifneq (,)
	$(error This Makefile requires GNU Make)
endif

# ─── Variables ────────────────────────────────────────────────────────────────
PROJECT_NAME   ?= satisfactory-factory-manager
DOCKER_COMPOSE := docker compose

.DEFAULT_GOAL := help

.PHONY: $(shell grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | cut -d":" -f1 | tr "\n" " ")

help: ## Display this help message
	@echo "==================================================================="
	@echo "  $(PROJECT_NAME)"
	@echo "==================================================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo "==================================================================="

# ─── Services ─────────────────────────────────────────────────────────────────

up: ## Start all services with Docker Compose
	$(DOCKER_COMPOSE) up -d

down: ## Stop all services
	$(DOCKER_COMPOSE) down

build: ## Build Docker images
	$(DOCKER_COMPOSE) build

logs: ## Tail service logs
	$(DOCKER_COMPOSE) logs -f

# ─── Development ──────────────────────────────────────────────────────────────

install: ## Install backend dev dependencies
	pip install -e ".[dev]"

install-dev: install ## Alias for install (dev dependencies are the default set)

dev: up ## Start all services in development mode
	$(DOCKER_COMPOSE) logs -f

typecheck: ## Run type checkers (mypy + tsc via Docker)
	$(DOCKER_COMPOSE) -f docker-compose.test.yml run --rm --no-deps api-test sh -c "mypy ."
	$(DOCKER_COMPOSE) -f docker-compose.test.yml run --rm --no-deps frontend-lint sh -c "npm run typecheck"

pre-commit: ## Install and run pre-commit hooks
	pre-commit install
	pre-commit run --all-files

# ─── Quality ──────────────────────────────────────────────────────────────────

lint: ## Run linters (ruff; ESLint parked — see DECISIONS.md D-0012)
	$(DOCKER_COMPOSE) -f docker-compose.test.yml run --rm --no-deps api-test sh -c "ruff check ."
	@echo "frontend: ESLint skipped — typescript-eslint does not run on TypeScript 7 (D-0012); tsc covers types via 'make typecheck'"

format: ## Run formatters (ruff via Docker)
	$(DOCKER_COMPOSE) -f docker-compose.test.yml run --rm --no-deps api-test sh -c "ruff format ."

format-check: ## Verify formatting without rewriting files
	$(DOCKER_COMPOSE) -f docker-compose.test.yml run --rm --no-deps api-test sh -c "ruff format --check ."

quality-gate-baseline: ## Record the current coverage as the local baseline
	$(DOCKER_COMPOSE) -f docker-compose.test.yml run --rm api-test
	@cp backend/coverage.xml .quality-gate-baseline.xml 2>/dev/null || cp coverage.xml .quality-gate-baseline.xml

quality-gate-verify: lint format-check typecheck test ## Full local gate (lint + format + types + tests)

ci: quality-gate-verify ## Alias for the full local gate, mirroring CI


# ─── Tests ────────────────────────────────────────────────────────────────────

test: ## Run all tests via Docker
	$(DOCKER_COMPOSE) -f docker-compose.test.yml run --rm api-test

test-cov: ## Run tests with coverage report
	$(DOCKER_COMPOSE) -f docker-compose.test.yml run --rm api-test

docker-test: ## Run tests in Docker (CI-compatible)
	$(DOCKER_COMPOSE) -f docker-compose.test.yml run --rm api-test

agent-test: ## Run agent (sfm-agent) tests in Docker
	$(DOCKER_COMPOSE) -f docker-compose.test.yml run --rm agent-test

docker-e2e: ## Run E2E tests in Docker (Playwright)
	$(DOCKER_COMPOSE) -f docker-compose.e2e.yml up --build -d backend frontend
	$(DOCKER_COMPOSE) -f docker-compose.e2e.yml run --rm playwright; \
	EXIT_CODE=$$?; \
	$(DOCKER_COMPOSE) -f docker-compose.e2e.yml down; \
	exit $$EXIT_CODE

# ─── Release ──────────────────────────────────────────────────────────────────

changelog: ## Regenerate CHANGELOG.md via git-cliff
	git cliff --output CHANGELOG.md

# ─── Cleanup ──────────────────────────────────────────────────────────────────

clean: ## Clean build artifacts
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	rm -rf .pytest_cache .mypy_cache .coverage coverage.xml dist build
