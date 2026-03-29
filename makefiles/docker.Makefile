#!make
# ─── Docker ────────────────────────────────────────────────────────────────────
DOCKER_REPO ?= $(shell grep "^DOCKER_REPO" .env | cut -d "=" -f2)

build: ## Build a Docker service image (service=<name>)
	@docker compose build --pull --no-cache $(service)

config: ## Display docker-compose configuration
	@docker compose config

down: ## Stop and remove all containers
	@docker compose down --remove-orphans

logs: ## Display logs for a service (service=<name>)
	@docker compose logs $(service)

logs-f: ## Follow logs for a service (service=<name>)
	@docker compose logs -f $(service)

logs-tail: ## Display last N log lines (service=<name> tail=10)
	@docker compose logs --tail=$(or $(tail),10) $(service)

start: ## Start a service, or bring it up if not created (service=<name>)
	@docker compose start $(service) || $(MAKE) --quiet up service=$(service)

status: ## Display status of all services
	@docker compose ps

stop: ## Stop a service (service=<name>)
	@docker compose stop $(service)

up: ## Start services in foreground (service=<name>)
	@docker compose up $(service)

up-detach: ## Start services in background (service=<name>)
	@docker compose up --detach $(service)
