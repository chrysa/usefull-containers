ifneq (,)
	$(error "This Makefile requires GNU Make")
endif

.DEFAULT_GOAL := help

.PHONY: $(shell grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | cut -d":" -f1 | tr "\n" " ")

BLACK_CONTAINER_VERSION=$(shell cat .env | grep "BLACK_CONTAINER_VERSION" | cut -d "=" -f2)
DOCKER_REPO=$(shell cat .env | grep "DOCKER_REPO" | cut -d "=" -f2)
FLAKE8_CONTAINER_VERSION=$(shell cat .env | grep "FLAKE8_CONTAINER_VERSION" | cut -d "=" -f2)
HADOLINT_CONTAINER_VERSION=$(shell cat .env | grep "HADOLINT_CONTAINER_VERSION" | cut -d "=" -f2)
MYPY_CONTAINER_VERSION=$(shell cat .env | grep "MYPY_CONTAINER_VERSION" | cut -d "=" -f2)
PRE_COMMIT_CONTAINER_VERSION=$(shell cat .env | grep "PRE_COMMIT_CONTAINER_VERSION" | cut -d "=" -f2)
PYLINT_CONTAINER_VERSION=$(shell cat .env | grep "PYLINT_CONTAINER_VERSION" | cut -d "=" -f2)
PYTHON_DEV_CONTAINER_VERSION=$(shell cat .env | grep "PYTHON_DEV_CONTAINER_VERSION" | cut -d "=" -f2)
PYTEST_CONTAINER_VERSION=$(shell cat .env | grep "PYTEST_CONTAINER_VERSION" | cut -d "=" -f2)
REORDER_PYTHON_IMPORTS_CONTAINER_VERSION=$(shell cat .env | grep "REORDER_PYTHON_IMPORTS_CONTAINER_VERSION" | cut -d "=" -f2)
SPHINX_CONTAINER_VERSION=$(shell cat .env | grep "SPHINX_CONTAINER_VERSION" | cut -d "=" -f2)

tail=10

COLOR[GREEN]=\e[1;92m
COLOR[RED]=\e[1;91m
COLOR[WHITE]=\e[39m
COLOR[YELLOW]=\e[1;93m

check-defined-% :
	@:$(call check_defined, $*, target-specific)

check_defined = $(strip $(foreach 1,$1, $(call __check_defined,$1,$(strip $(value 2)))))

__check_defined = $(if $(value $1),, $(error Undefined $1$(if $2, ($2))$(if $(value @), required by target $@)))

build: ## Build project => build [service_name={service_name}]
	$(info Make: Build service  ${service_name})
	@docker-compose build --compress --force-rm ${service_name}
build-parallel: ## build service in parallel
	$(info Make: Building ${service_name})
	@docker-compose build --compress --force-rm --parallel --quiet ${service_name}
config:
	@docker-compose config
down: ## Down project containers => down
	$(info Make: Down)
	@docker-compose down --remove-orphans
hadolint: ## lint dockerfiles => hadolint
	$(info Make: hadolint)
	@for f in $(shell find . -name "Dockerfile"); do \
		echo "analyse $${f}"; \
		docker run --rm --interactive --volume ${PWD}/.hadolint.yaml:/bin/hadolint.yaml -e XDG_CONFIG_HOME=/bin hadolint/hadolint < $${f}; \
	done
help: ## This help dialog. => make help
	@echo "Variables:"
	@echo "\t- \"service_name\" is a docker-compose service name or a list of services separate by space as string ($(shell ${__docker_compose_cmd} ps --services | tr '\n' ' '))"
	@echo "\n"
	@IFS=$$'\n'
	@printf "%-50s %-80s %-60s\n" "target" "help" "usage"
	@printf "%-50s %-80s %-60s\n" "------" "----" "----"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | sed 's/:.*##/##/g' | tr ':' ' ' | tr '=>' '##'| awk 'BEGIN {FS = "##"}; {printf "\033[36m%-50s\033[0m %-80s %-60s\n", $$1, $$2, $$3}'
logs: check-defined-service_name ## display logs
	$(info Make: Logs ${service_name})
	@docker-compose logs ${service_name}
logs-f: check-defined-service_name ## display logs with follow
	$(info Make: Follow logs ${service_name})
	@docker-compose logs -f ${service_name}
logs-tail: check-defined-service_name ## display logs tail => [tail=`echo ${tail}`]
	$(info Make: Logs tail ${service_name})
	@docker-compose logs --tail=${tail} ${service_name}
pre-commit: ## run localy precommit
	$(info Make: pre-commit)
	@pip install --quiet --no-cache-dir pre-commit
	@pre-commit autoupdate --bleeding-edge || true
	@pre-commit run --all-files --verbose --hook-stage manual || true
prune: down ## remove service on the host and prune volume image and network unused
	$(info Make: Prune)
	@docker-compose rm
	@docker rm `docker-compose ps --filter status=created --filter status=exited -q` || true
	@docker rmi `docker-compose images ls -q` || true
	@docker rmi `docker images -f "dangling=true" -q` || true
start: check-defined-service_name ## Start project containers => [service_name={service_name}]
	$(info Make: start ${service_name})
	docker-compose start ${service_name} || make --quiet -s up service_name=${service_name}
status: ## display status of all service
	@docker-compose ps --services | sort | while read service; do \
		status=`docker inspect --format='{{.State.Status}}' $$service`; \
		echo "$$service $$status\n" ;\
		if [ "$$status" = "starting" ] || [ "$$status" = "restarting" ] ; then \
			color_status="${COLOR[YELLOW]}"; \
		elif [ "$$status" = "running" ]; then \
			color_status="${COLOR[GREEN]}"; \
		else \
			color_status="${COLOR[RED]}"; \
		fi; \
		echo "$$color_status====>${COLOR[WHITE]} $$service: $$color_status $$status ${COLOR[WHITE]}"; \
	done
stop: ## Start project containers => [service_name={service_name}]
	$(info Make: stop  ${service_name})
	@docker-compose stop ${service_name}
tag-latest: ## tag services as latest => make tag-latest
	$(info Make: tag latest)
	@echo "=======>> tag black"
	@docker tag ${DOCKER_REPO}/black:${BLACK_CONTAINER_VERSION} ${DOCKER_REPO}/black:latest
	@echo "=======>> tag flake8"
	@docker tag ${DOCKER_REPO}/flake8:${FLAKE8_CONTAINER_VERSION} ${DOCKER_REPO}/flake8:latest
	@echo "=======>> tag hadolint"
	@docker tag ${DOCKER_REPO}/hadolint:${HADOLINT_CONTAINER_VERSION} ${DOCKER_REPO}/hadolint:latest
	@echo "=======>> tag mypy"
	@docker tag ${DOCKER_REPO}/mypy:${MYPY_CONTAINER_VERSION} ${DOCKER_REPO}/mypy:latest
	@echo "=======>> tag pre-commit"
	@docker tag ${DOCKER_REPO}/pre-commit:${PRE_COMMIT_CONTAINER_VERSION} ${DOCKER_REPO}/pre-commit:latest
	@echo "=======>> tag pylint"
	@docker tag ${DOCKER_REPO}/pylint:${PYLINT_CONTAINER_VERSION} ${DOCKER_REPO}/pylint:latest
	@echo "=======>> tag python-dev"
	@docker tag ${DOCKER_REPO}/python-dev:${PYTHON_DEV_CONTAINER_VERSION} ${DOCKER_REPO}/python-dev:latest
	@echo "=======>> tag pytest"
	@docker tag ${DOCKER_REPO}/pytest:${PYTEST_CONTAINER_VERSION} ${DOCKER_REPO}/pytest:latest
	@echo "=======>> tag reorder-python-imports"
	@docker tag ${DOCKER_REPO}/reorder-python-imports:${REORDER_PYTHON_IMPORTS_CONTAINER_VERSION} ${DOCKER_REPO}/reorder-python-imports:latest
	@echo "=======>> tag sphinx"
	@docker tag ${DOCKER_REPO}/sphinx:${SPHINX_CONTAINER_VERSION} ${DOCKER_REPO}/sphinx:latest
up: ## Up project containers => [service_name={service_name}]
	$(info Make: Up detach ${service_name})
	@docker-compose up ${service_name}
up-detach: ## Up project containers =>  [service_name={service_name}]
	$(info Make: Up ${service_name})
	@docker-compose up --detach ${service_name}
upgradable-packages: ## list outdated package in service
	@echo "=======>> upgradable package for black"
	@docker-compose run --rm black bash -c "pip list --outdated --format columns" || true
	@echo "=======>> upgradable package for flake8"
	@docker-compose run --rm flake8 bash -c "pip list --outdated --format columns" || true
	@echo "=======>> upgradable package for mypy"
	@docker-compose run --rm mypy bash -c "pip list --outdated --format columns" || true
	@echo "=======>> upgradable package for pre-commit"
	@docker-compose run --rm pre-commit bash -c "pip list --outdated --format columns" || true
	@echo "=======>> upgradable package for pylint"
	@docker-compose run --rm pylint bash -c "pip list --outdated --format columns" || true
	@echo "=======>> upgradable package for pytest"
	@docker-compose run --rm pytest bash -c "pip list --outdated --format columns" || true
	@echo "=======>> upgradable package for python-dev"
	@docker-compose run --rm python-dev bash -c "pip list --outdated --format columns" || true
	@echo "=======>> upgradable package for reorder-python-imports"
	@docker-compose run --rm reorder-python-imports bash -c "pip list --outdated --format columns" || true
	@echo "=======>> upgradable package for sphinx"
	@docker-compose run --rm sphinx bash -c "pip list --outdated --format columns" || true
