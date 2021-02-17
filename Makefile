ifneq (,)
	$(error "This Makefile requires GNU Make")*
endif

BLACK_CONTAINER_VERSION=$(shell cat .env | grep "^BLACK_CONTAINER_VERSION" | cut -d "=" -f2)
FLAKE8_CONTAINER_VERSION=$(shell cat .env | grep "^FLAKE8_CONTAINER_VERSION" | cut -d "=" -f2)
HADOOLINT_CONTAINER_VERSION=$(shell cat .env | grep "^HADOOLINT_CONTAINER_VERSION" | cut -d "=" -f2)
MYPY_CONTAINER_VERSION=$(shell cat .env | grep "^MYPY_CONTAINER_VERSION" | cut -d "=" -f2)
PRE_COMMIT_CONTAINER_VERSION=$(shell cat .env | grep "^PRE_COMMIT_CONTAINER_VERSION" | cut -d "=" -f2)
PYLINT_CONTAINER_VERSION=$(shell cat .env | grep "^PYLINT_CONTAINER_VERSION" | cut -d "=" -f2)
PYTEST_CONTAINER_VERSION=$(shell cat .env | grep "^PYTEST_CONTAINER_VERSION" | cut -d "=" -f2)
SPHINX_CONTAINER_VERSION=$(shell cat .env | grep "^SPHINX_CONTAINER_VERSION" | cut -d "=" -f2)
PROJECT_NAME=$(shell cat .env | grep "^PROJECT_NAME" | cut -d "=" -f2)

tail=10

.DEFAULT_GOAL := help

.PHONY: build clean down help logs logs-f logs-tail pre-commit prune start status stop tag-latest up up-detach

COLOR[GREEN]=\e[1;92m
COLOR[RED]=\e[1;91m
COLOR[WHITE]=\e[39m
COLOR[YELLOW]=\e[1;93m

check-defined-% :
	@:$(call check_defined, $*, target-specific)

check_defined = $(strip $(foreach 1,$1, $(call __check_defined,$1,$(strip $(value 2)))))

__check_defined = $(if $(value $1),, $(error Undefined $1$(if $2, ($2))$(if $(value @), required by target $@)))

build: ## Build project => make build [service_name={service_name}]
	$(info Make: Build service  ${service_name})
	@docker-compose build --compress --force-rm ${service_name}
clean: ## clean project
	$(info Make: clean)
	@rm -rf .mypy_cache .pytest
config:
	@docker-compose config
down: clean ## Down project containers=> make down
	$(info Make: Down)
	@docker-compose down --remove-orphans
hadolint: ## lint dockerfiles => make hadolint
	$(info Make: hadolint)
	@for f in $(shell find . -name "Dockerfile"); do \
		echo "analyse $${f}"; \
		docker run --rm --interactive --volume ${PWD}/.hadolint.yaml:/bin/hadolint.yaml -e XDG_CONFIG_HOME=/bin hadolint/hadolint < $${f}; \
	done
help: ## This help dialog. => make help
	@echo "Hello to the usefull-containers Makefile\n"
	@echo "Usage: 	[rules] [variables]"
	@IFS=$$'\n'
	@printf "%-30s %-80s %-60s\n" "rule" "help" "variable"
	@printf "%-30s %-80s %-60s\n" "------" "----" "----"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | sed 's/:.*##/##/g' | tr ':' ' ' | tr '=>' '##'| awk 'BEGIN {FS = "##"}; {printf "\033[36m%-30s\033[0m %-80s %-60s\n", $$1, $$2, $$3}'
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
	@pip install --quiet pre-commit
	@pre-commit autoupdate --bleeding-edge || true
	@pre-commit run --all-files --verbose || true
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
stop: check-defined-service_name ## Start project containers => [service_name={service_name}]
	$(info Make: stop  ${service_name})
	@docker-compose stop ${service_name}
up: ## Up project containers => [service_name={service_name}]
	$(info Make: Up detach ${service_name})
	@docker-compose up ${service_name}
up-detach: ## Up project containers =>  [service_name={service_name}]
	$(info Make: Up ${service_name})
	@docker-compose up --detach ${service_name}
upgradable-packages: check-defined-service_name ## list outdated package in service
	@for service in $(shell echo ${service_name}); do \
		echo "=======>> upgradable package for ${service}"
		docker-compose run --rm ${service} sh -c "set -ex && pip install --quiet pip-upgrade-outdated==1.5 && pip list --outdated" ; \
	done
