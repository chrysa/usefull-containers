#!make
# ─── Hadolint ─────────────────────────────────────────────────────────────────
HADOLINT_CONTAINER_VERSION := $(shell grep "^HADOLINT_CONTAINER_VERSION" .env | cut -d "=" -f2)

hadolint-tag-latest: ## Tag hadolint image as :latest
	@echo "=======>> tagging hadolint as latest"
	@docker tag $(DOCKER_REPO)/hadolint:$(HADOLINT_CONTAINER_VERSION) $(DOCKER_REPO)/hadolint:latest

hadolint-packages-version: ## hadolint has no pip packages (not applicable)
	@echo "hadolint is a binary container - no pip packages"
