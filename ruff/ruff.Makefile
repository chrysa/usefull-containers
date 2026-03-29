#!make
# ─── Ruff ─────────────────────────────────────────────────────────────────────
RUFF_CONTAINER_VERSION := $(shell grep "^RUFF_CONTAINER_VERSION" .env | cut -d "=" -f2)

ruff-tag-latest: ## Tag ruff image as :latest
	@echo "=======>> tagging ruff as latest"
	@docker tag $(DOCKER_REPO)/ruff:$(RUFF_CONTAINER_VERSION) $(DOCKER_REPO)/ruff:latest

ruff-packages-version: ## List outdated packages in ruff
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" ruff
