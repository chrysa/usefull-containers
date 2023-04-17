FLAKE8_CONTAINER_VERSION=$(shell cat .env | grep "FLASK_DB_MIGRATIONS_CONTAINER_VERSION" | cut -d "=" -f2)

flask-db-migrations-tag-latest: ## tag flask-db-migrations services as latest
	$(info Make: tag flask-db-migrations latest)
	@echo "=======>> tag flask-db-migrations"
	@docker tag ${DOCKER_REPO}/flask-db-migrations:${FLASK_DB_MIGRATIONS_CONTAINER_VERSION} ${DOCKER_REPO}/flask-db-migrations:latest

flask-db-migrations-outdated-packages: ## list outdated package in flask-db-migrations service
	@echo "=======>> upgradable package for flask-db-migrations"
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" flask-db-migrations 

