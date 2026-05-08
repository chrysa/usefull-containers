#!make
# ─── Actionlint ───────────────────────────────────────────────────────────────
ACTIONLINT_CONTAINER_VERSION := $(shell grep "^ACTIONLINT_CONTAINER_VERSION" .env | cut -d "=" -f2)

actionlint-tag-latest: ## Tag actionlint image as :latest
	@echo "=======>> tagging actionlint as latest"
	@docker tag $(DOCKER_REPO)/actionlint:$(ACTIONLINT_CONTAINER_VERSION) $(DOCKER_REPO)/actionlint:latest

actionlint-packages-version: ## actionlint is a binary container (not applicable)
	@echo "actionlint is a binary container - no pip packages"
