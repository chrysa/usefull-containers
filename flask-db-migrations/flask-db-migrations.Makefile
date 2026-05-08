FLASK_DB_MIGRATIONS_CONTAINER_VERSION := $(shell grep "^FLASK_DB_MIGRATIONS_CONTAINER_VERSION" .env | cut -d "=" -f2)

flask-db-migrations-tag-latest: ## Tag flask-db-migrations image as :latest
	@echo "=======>> tag flask-db-migrations"
	@docker tag $(DOCKER_REPO)/flask-db-migrations:$(FLASK_DB_MIGRATIONS_CONTAINER_VERSION) $(DOCKER_REPO)/flask-db-migrations:latest

flask-db-migrations-packages-version: ## List outdated packages in flask-db-migrations
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" flask-db-migrations
