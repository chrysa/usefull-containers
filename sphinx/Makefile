SPHINX_CONTAINER_VERSION=$(shell cat .env | grep "SPHINX_CONTAINER_VERSION" | cut -d "=" -f2)

sphinx-tag-latest: ## tag sphinx services as latest
	$(info Make: tag sphinx latest)
	@echo "=======>> tag sphinx"
	@docker tag ${DOCKER_REPO}/sphinx:${SPHINX_CONTAINER_VERSION} ${DOCKER_REPO}/sphinx:latest

sphinx-packages-version: ## list outdated package in sphinx service
	@echo "=======>> upgradable package for sphinx"
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" sphinx 

