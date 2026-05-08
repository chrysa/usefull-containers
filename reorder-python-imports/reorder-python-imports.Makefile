#!make
# ─── Reorder-Python-Imports ────────────────────────────────────────────────────────────────────
REORDER_PYTHON_IMPORTS_CONTAINER_VERSION := $(shell grep "^REORDER_PYTHON_IMPORTS_CONTAINER_VERSION" .env | cut -d "=" -f2)

reorder-python-imports-tag-latest: ## Tag reorder-python-imports image as :latest
	@echo "=======>> taggging reorder-python-imports as latest"
	@docker tag $(DOCKER_REPO)/reorder-python-imports:$(REORDER_PYTHON_IMPORTS_CONTAINER_VERSION) $(DOCKER_REPO)/reorder-python-imports:latest

reorder-python-imports-packages-version: ## List outdated packages in reorder-python-imports
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" reorder-python-imports
