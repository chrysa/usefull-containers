FLASK_CONTAINER_VERSION := $(shell grep "^FLASK_CONTAINER_VERSION" .env | cut -d "=" -f2)

flask-tag-latest: ## Tag flask image as :latest
	@echo "=======>> tag flask"
	@docker tag $(DOCKER_REPO)/flask:$(FLASK_CONTAINER_VERSION) $(DOCKER_REPO)/flask:latest

flask-packages-version: ## List outdated packages in flask
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" flask

