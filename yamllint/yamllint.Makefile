#!make
# ─── Yamllint ─────────────────────────────────────────────────────────────────
YAMLLINT_CONTAINER_VERSION := $(shell grep "^YAMLLINT_CONTAINER_VERSION" .env | cut -d "=" -f2)

yamllint-tag-latest: ## Tag yamllint image as :latest
	@echo "=======>> tagging yamllint as latest"
	@docker tag $(DOCKER_REPO)/yamllint:$(YAMLLINT_CONTAINER_VERSION) $(DOCKER_REPO)/yamllint:latest

yamllint-packages-version: ## Show yamllint installed packages versions
	@echo "=======>> yamllint packages versions"
	@docker run --rm $(DOCKER_REPO)/yamllint:$(YAMLLINT_CONTAINER_VERSION) pip list
