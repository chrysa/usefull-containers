#!make
# ─── Pytest ────────────────────────────────────────────────────────────────────
PYTEST_CONTAINER_VERSION := $(shell grep "^PYTEST_CONTAINER_VERSION" .env | cut -d "=" -f2)

pytest-tag-latest: ## Tag pytest image as :latest
	@echo "=======>> taggging pytest as latest"
	@docker tag $(DOCKER_REPO)/pytest:$(PYTEST_CONTAINER_VERSION) $(DOCKER_REPO)/pytest:latest

pytest-packages-version: ## List outdated packages in pytest
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" pytest
