DANGO_DRF_CONTAINER_VERSION=$(shell cat .env | grep "DANGO_DRF_CONTAINER_VERSION" | cut -d "=" -f2)

django-drf-tag-latest: ## tag django-drf services as latest
	$(info Make: tag django-drf latest)
	@echo "=======>> tag django-drf"
	@docker tag ${DOCKER_REPO}/django-drf:${DANGO_DRF_CONTAINER_VERSION} ${DOCKER_REPO}/django-drf:latest

django-drf-packages-version: ## list outdated package in django-drf service
	@echo "=======>> upgradable package for django-drf"
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" django-drf 

