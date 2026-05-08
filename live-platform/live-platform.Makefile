LIVE_PLATFORM_CONTAINER_VERSION := $(shell grep "^LIVE_PLATFORM_CONTAINER_VERSION" .env | cut -d "=" -f2)

live-platform-tag-latest: ## Tag live-platform image as :latest
	@echo "=======>> tagging live-platform as latest"
	@docker tag $(DOCKER_REPO)/live-platform:$(LIVE_PLATFORM_CONTAINER_VERSION) $(DOCKER_REPO)/live-platform:latest

live-platform-packages-version: ## List outdated packages in live-platform
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" live-platform

live-platform-up: ## Start live-platform container
	@docker compose --env-file .env -f live-platform/docker-compose.yaml up -d live-platform

live-platform-down: ## Stop live-platform container
	@docker compose --env-file .env -f live-platform/docker-compose.yaml down

live-platform-logs: ## Follow live-platform logs
	@docker compose --env-file .env -f live-platform/docker-compose.yaml logs -f live-platform

live-platform-build: ## Build live-platform image
	@docker compose --env-file .env -f live-platform/docker-compose.yaml build live-platform

live-platform-push: ## Push live-platform image to registry
	@docker compose --env-file .env -f live-platform/docker-compose.yaml push live-platform
