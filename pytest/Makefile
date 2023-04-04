PYTEST_CONTAINER_VERSION=$(shell cat .env | grep "PYTEST_CONTAINER_VERSION" | cut -d "=" -f2)

pytest-tag-latest: ## tag pytest services as latest
	$(info Make: tag pytest latest)
	@echo "=======>> tag pytest"
	@docker tag ${DOCKER_REPO}/pytest:${PYTEST_CONTAINER_VERSION} ${DOCKER_REPO}/pytest:latest

pytest-packages-version: ## list outdated package in pytest service
	@echo "=======>> upgradable package for pytest"
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" pytest 

