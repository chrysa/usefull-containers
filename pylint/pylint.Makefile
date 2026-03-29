#!make
# ─── Pylint ────────────────────────────────────────────────────────────────────
PYLINT_CONTAINER_VERSION := $(shell grep "^PYLINT_CONTAINER_VERSION" .env | cut -d "=" -f2)

pylint-tag-latest: ## Tag pylint image as :latest
	@echo "=======>> taggging pylint as latest"
	@docker tag $(DOCKER_REPO)/pylint:$(PYLINT_CONTAINER_VERSION) $(DOCKER_REPO)/pylint:latest

pylint-packages-version: ## List outdated packages in pylint
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" pylint
