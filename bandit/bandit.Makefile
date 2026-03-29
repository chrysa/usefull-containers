#!make
# ─── Bandit ───────────────────────────────────────────────────────────────────
BANDIT_CONTAINER_VERSION := $(shell grep "^BANDIT_CONTAINER_VERSION" .env | cut -d "=" -f2)

bandit-tag-latest: ## Tag bandit image as :latest
	@echo "=======>> tagging bandit as latest"
	@docker tag $(DOCKER_REPO)/bandit:$(BANDIT_CONTAINER_VERSION) $(DOCKER_REPO)/bandit:latest

bandit-packages-version: ## List outdated packages in bandit
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" bandit
