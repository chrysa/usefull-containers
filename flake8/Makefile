FLAKE8_CONTAINER_VERSION=$(shell cat .env | grep "FLAKE8_CONTAINER_VERSION" | cut -d "=" -f2)

flake8-tag-latest: ## tag flake8 services as latest
	$(info Make: tag flake8 latest)
	@echo "=======>> tag flake8"
	@docker tag ${DOCKER_REPO}/flake8:${FLAKE8_CONTAINER_VERSION} ${DOCKER_REPO}/flake8:latest

flake8-packages-version: ## list outdated package in flake8 service
	@echo "=======>> upgradable package for flake8"
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" flake8 

