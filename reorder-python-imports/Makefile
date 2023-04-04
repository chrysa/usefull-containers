REORDER_PYTHON_IMPORTS_CONTAINER_VERSION=$(shell cat .env | grep "REORDER_PYTHON_IMPORTS_CONTAINER_VERSION" | cut -d "=" -f2)

reorder-python-import-tag-latest: ## tag reorder-python-import services as latest
	$(info Make: tag reorder-python-import latest)
	@echo "=======>> tag reorder-python-import"
	@docker tag ${DOCKER_REPO}/reorder-python-import:${REORDER_PYTHON_IMPORTS_CONTAINER_VERSION} ${DOCKER_REPO}/reorder-python-import:latest

reorder-python-import-packages-version: ## list outdated package in reorder-python-import service
	@echo "=======>> upgradable package for reorder-python-import"
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" reorder-python-import 

