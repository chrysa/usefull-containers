HADOLINT_CONTAINER_VERSION=$(shell cat .env | grep "HADOLINT_CONTAINER_VERSION" | cut -d "=" -f2)

hadolint: ## lint dockerfiles
	$(info Make: hadolint)
	@for f in $(shell find . -name "Dockerfile"); do \
		echo "analyse $${f}"; \
		docker run --rm --interactive --volume ${PWD}/.hadolint.yaml:/bin/hadolint.yaml -e XDG_CONFIG_HOME=/bin hadolint/hadolint < $${f}; \
	done
hadolint-tag-latest: ## tag hadolint services as latest
	$(info Make: tag hadolint latest)
	@echo "=======>> tag hadolint"
	@docker tag ${DOCKER_REPO}/hadolint:${HADOLINT_CONTAINER_VERSION} ${DOCKER_REPO}/hadolint:latest
