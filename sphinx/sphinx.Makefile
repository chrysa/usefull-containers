#!make
# ─── Sphinx ────────────────────────────────────────────────────────────────────
SPHINX_CONTAINER_VERSION := $(shell grep "^SPHINX_CONTAINER_VERSION" .env | cut -d "=" -f2)

sphinx-tag-latest: ## Tag sphinx image as :latest
	@echo "=======>> taggging sphinx as latest"
	@docker tag $(DOCKER_REPO)/sphinx:$(SPHINX_CONTAINER_VERSION) $(DOCKER_REPO)/sphinx:latest

sphinx-packages-version: ## List outdated packages in sphinx
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" sphinx
