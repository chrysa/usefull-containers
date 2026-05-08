#!make
# ─── Black ────────────────────────────────────────────────────────────────────
BLACK_CONTAINER_VERSION := $(shell grep "^BLACK_CONTAINER_VERSION" .env | cut -d "=" -f2)

black-tag-latest: ## Tag black image as :latest
	@echo "=======>> taggging black as latest"
	@docker tag $(DOCKER_REPO)/black:$(BLACK_CONTAINER_VERSION) $(DOCKER_REPO)/black:latest

black-packages-version: ## List outdated packages in black
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" black
