PRE-COMMIT_CONTAINER_VERSION=$(shell cat .env | grep "PRE-COMMIT_CONTAINER_VERSION" | cut -d "=" -f2)

pre-commit-tag-latest: ## tag pre-commit services as latest
	$(info Make: tag pre-commit latest)
	@echo "=======>> tag pre-commit"
	@docker tag ${DOCKER_REPO}/pre-commit:${PRE-COMMIT_CONTAINER_VERSION} ${DOCKER_REPO}/pre-commit:latest

pre-commit-packages-version: ## list outdated package in pre-commit service
	@echo "=======>> upgradable package for pre-commit"
	@docker compose run --rm --entrypoint "pip list --outdated --format columns" pre-commit 

