#!make
# ─── Django-DRF ────────────────────────────────────────────────────────────────────
DANGO_DRF_CONTAINER_VERSION := $(shell grep "^DANGO_DRF_CONTAINER_VERSION" .env | cut -d "=" -f2)

django-drf-tag-latest: ## Tag django-drf image as :latest
	@echo "=======>> taggging django-drf as latest"
	@docker tag $(DOCKER_REPO)/django-drf:$(DANGO_DRF_CONTAINER_VERSION) $(DOCKER_REPO)/django-drf:latest

django-drf-packages-version: ## List outdated packages in django-drf
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" django-drf
