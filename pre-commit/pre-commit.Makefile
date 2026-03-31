PRE_COMMIT_CONTAINER_VERSION := $(shell grep "^PRE_COMMIT_CONTAINER_VERSION" .env | cut -d "=" -f2)

pre-commit-tag-latest: ## Tag pre-commit image as :latest
	@echo "=======>> tag pre-commit"
	@docker tag $(DOCKER_REPO)/pre-commit:$(PRE_COMMIT_CONTAINER_VERSION) $(DOCKER_REPO)/pre-commit:latest

pre-commit-packages-version: ## List outdated packages in pre-commit
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" pre-commit
