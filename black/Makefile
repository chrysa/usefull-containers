BLACK_CONTAINER_VERSION=$(shell cat .env | grep "BLACK_CONTAINER_VERSION" | cut -d "=" -f2)

black-tag-latest: ## tag black services as latest
	$(info Make: tag black latest)
	@echo "=======>> tag black"
	@docker tag ${DOCKER_REPO}/black:${BLACK_CONTAINER_VERSION} ${DOCKER_REPO}/black:latest

black-packages-version: ## list outdated package in black service
	@echo "=======>> upgradable package for black"
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" black 

