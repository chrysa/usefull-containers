#!make
# ─── Mypy ────────────────────────────────────────────────────────────────────
MYPY_CONTAINER_VERSION := $(shell grep "^MYPY_CONTAINER_VERSION" .env | cut -d "=" -f2)

mypy-tag-latest: ## Tag mypy image as :latest
	@echo "=======>> taggging mypy as latest"
	@docker tag $(DOCKER_REPO)/mypy:$(MYPY_CONTAINER_VERSION) $(DOCKER_REPO)/mypy:latest

mypy-packages-version: ## List outdated packages in mypy
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" mypy
