PYTHON_DEV_CONTAINER_VERSION=$(shell cat .env | grep "PYTHON_DEV_CONTAINER_VERSION" | cut -d "=" -f2)

python-dev-tag-latest: ## tag python-dev services as latest
	$(info Make: tag python-dev latest)
	@echo "=======>> tag python-dev"
	@docker tag ${DOCKER_REPO}/python-dev:${PYTHON_DEV_CONTAINER_VERSION} ${DOCKER_REPO}/python-dev:latest

python-dev-packages-version: ## list outdated package in python-dev service
	@echo "=======>> upgradable package for python-dev"
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" python-dev 

