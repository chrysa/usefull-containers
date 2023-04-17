FLAKE8_CONTAINER_VERSION=$(shell cat .env | grep "FLASK_CONTAINER_VERSION" | cut -d "=" -f2)

flask-tag-latest: ## tag flask services as latest
	$(info Make: tag flask latest)
	@echo "=======>> tag flask"
	@docker tag ${DOCKER_REPO}/flask:${FLASK_CONTAINER_VERSION} ${DOCKER_REPO}/flask:latest

flask-outdated-packages: ## list outdated package in flask service
	@echo "=======>> upgradable package for flask"
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" flask 

