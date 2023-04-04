MYPY_CONTAINER_VERSION=$(shell cat .env | grep "MYPY_CONTAINER_VERSION" | cut -d "=" -f2)

mypy-tag-latest: ## tag mypy services as latest
	$(info Make: tag mypy latest)
	@echo "=======>> tag mypy"
	@docker tag ${DOCKER_REPO}/mypy:${MYPY_CONTAINER_VERSION} ${DOCKER_REPO}/mypy:latest

mypy-packages-version: ## list outdated package in mypy service
	@echo "=======>> upgradable package for mypy"
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" mypy 

