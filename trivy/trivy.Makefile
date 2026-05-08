#!make
# ─── Trivy ────────────────────────────────────────────────────────────────────
TRIVY_CONTAINER_VERSION := $(shell grep "^TRIVY_CONTAINER_VERSION" .env | cut -d "=" -f2)

trivy-tag-latest: ## Tag trivy image as :latest
	@echo "=======>> tagging trivy as latest"
	@docker tag $(DOCKER_REPO)/trivy:$(TRIVY_CONTAINER_VERSION) $(DOCKER_REPO)/trivy:latest

trivy-packages-version: ## trivy is a binary container (not applicable)
	@echo "trivy is a binary container - no pip packages"
