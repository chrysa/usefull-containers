#!make
# ─── Flake8 ────────────────────────────────────────────────────────────────────
FLAKE8_CONTAINER_VERSION := $(shell grep "^FLAKE8_CONTAINER_VERSION" .env | cut -d "=" -f2)

flake8-tag-latest: ## Tag flake8 image as :latest
	@echo "=======>> taggging flake8 as latest"
	@docker tag $(DOCKER_REPO)/flake8:$(FLAKE8_CONTAINER_VERSION) $(DOCKER_REPO)/flake8:latest

flake8-packages-version: ## List outdated packages in flake8
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" flake8
