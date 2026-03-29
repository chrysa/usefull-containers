#!make
# ─── Python-Dev ────────────────────────────────────────────────────────────────────
PYTHON_DEV_CONTAINER_VERSION := $(shell grep "^PYTHON_DEV_CONTAINER_VERSION" .env | cut -d "=" -f2)

python-dev-tag-latest: ## Tag python-dev image as :latest
	@echo "=======>> taggging python-dev as latest"
	@docker tag $(DOCKER_REPO)/python-dev:$(PYTHON_DEV_CONTAINER_VERSION) $(DOCKER_REPO)/python-dev:latest

python-dev-packages-version: ## List outdated packages in python-dev
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" python-dev
