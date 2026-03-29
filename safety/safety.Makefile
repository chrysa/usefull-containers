#!make
# ─── Safety ───────────────────────────────────────────────────────────────────
SAFETY_CONTAINER_VERSION := $(shell grep "^SAFETY_CONTAINER_VERSION" .env | cut -d "=" -f2)

safety-tag-latest: ## Tag safety image as :latest
	@echo "=======>> tagging safety as latest"
	@docker tag $(DOCKER_REPO)/safety:$(SAFETY_CONTAINER_VERSION) $(DOCKER_REPO)/safety:latest

safety-packages-version: ## List outdated packages in safety
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" safety
