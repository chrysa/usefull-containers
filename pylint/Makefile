PYLINT_CONTAINER_VERSION=$(shell cat .env | grep "PYLINT_CONTAINER_VERSION" | cut -d "=" -f2)

pylint-tag-latest: ## tag pylint services as latest
	$(info Make: tag pylint latest)
	@echo "=======>> tag pylint"
	@docker tag ${DOCKER_REPO}/pylint:${PYLINT_CONTAINER_VERSION} ${DOCKER_REPO}/pylint:latest

pylint-packages-version: ## list outdated package in pylint service
	@echo "=======>> upgradable package for pylint"
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" pylint 

