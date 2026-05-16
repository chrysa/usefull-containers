#!make
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

dev: up ## Start all services in development mode
	$(DOCKER_COMPOSE) logs -f

typecheck: ## Run type checkers (mypy + tsc via Docker)
	$(DOCKER_COMPOSE) run --rm backend mypy .
	$(DOCKER_COMPOSE) run --rm frontend npm run type-check

pre-commit: ## Install and run pre-commit hooks
	pre-commit install
	pre-commit run --all-files

# ─── Quality ──────────────────────────────────────────────────────────────────

lint: ## Run linters (ruff + eslint via Docker)
	$(DOCKER_COMPOSE) run --rm backend ruff check .
	$(DOCKER_COMPOSE) run --rm frontend npm run lint

format: ## Run formatters (ruff + prettier via Docker)
	$(DOCKER_COMPOSE) run --rm backend ruff format .
	$(DOCKER_COMPOSE) run --rm frontend npm run format

type-check: typecheck ## Legacy alias

# ─── Tests ────────────────────────────────────────────────────────────────────

test: ## Run all tests via Docker
	$(DOCKER_COMPOSE) -f docker-compose.test.yml run --rm backend-test

test-cov: ## Run tests with coverage report
	$(DOCKER_COMPOSE) -f docker-compose.test.yml run --rm backend-test

docker-test: ## Run tests in Docker (CI-compatible)
	$(DOCKER_COMPOSE) -f docker-compose.test.yml run --rm backend-test
# ─── Release ──────────────────────────────────────────────────────────────────

changelog: ## Regenerate CHANGELOG.md via git-cliff
	git cliff --output CHANGELOG.md

# ─── Cleanup ──────────────────────────────────────────────────────────────────

clean: ## Clean build artifacts
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	rm -rf .pytest_cache .mypy_cache .coverage coverage.xml dist build
