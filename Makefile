ifneq (,)
	$(error "This Makefile requires GNU Make")
endif

include $(shell find . -mindepth 2 -type f -name Makefile -exec echo " {}" \;)

.DEFAULT_GOAL := help

.PHONY: $(shell grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | cut -d":" -f1 | tr "\n" " ")

DOCKER_REPO=$(shell cat .env | grep "DOCKER_REPO" | cut -d "=" -f2)

__project_directory=$(dir $(abspath $(lastword $(MAKEFILE_LIST))))

tail=10

COLOR[GREEN]=\e[1;92m
COLOR[RED]=\e[1;91m
COLOR[WHITE]=\e[39m
COLOR[YELLOW]=\e[1;93m

check-defined-% :
	@:$(call check_defined, $*, target-specific)

check_defined = $(strip $(foreach 1,$1, $(call __check_defined,$1,$(strip $(value 2)))))

__check_defined = $(if $(value $1),, $(error Undefined $1$(if $2, ($2))$(if $(value @), required by target $@)))

build: ## Build project => [service_name={service_name}]
	$(info Make: Build service  ${service_name})
	@docker compose build --compress --force-rm ${service_name}

config:
	@docker compose config

down: ## Down project containers
	$(info Make: Down)
	@docker compose down --remove-orphans

help: ## display help
	@len_col_1=50; len_col_2=60; len_col_3=50; len_col_4=60; len_col_5=30; \
	echo -e "Hello to the \`$(shell basename "$$(pwd)")\` Makefile\n \
	Base command:\n \
	\t- \`__docker_compose_base_cmd\` is a ${__docker_compose_base_cmd}\n\n \
	Variables:\n \
	\t- \`__docker_compose_build_args\` list les argument de build des services as ${__docker_compose_build_args} \n \
	\t- \`CI_PROJECT_NAMESPACE\` define NAMESPACE for pull from gitlab registry\n \
	\t- \`FQDN\` define FQDN to use\n" \
	\t- \`profiles\` docker compose profile to launche default `$(shell cat .env | grep 'COMPOSE_PROFILES' | cut -d'-' -f1)`\n \
	\t- \`remove_remote\` remove le remote on make remote-send\n \
	\t- \`service_name\` is a docker-compose service name or a list of services separate by space default: ''\n\n" \
	Usage:\n \
	\tmake [target] [args]\n\n"; \
	printf "| %0-*s | %0-*s | %0-*s | %0-*s | %0-*s |\n" "$${len_col_1}" "Rule"  "$${len_col_2}" "Help" "$${len_col_3}" "Usage" "$${len_col_4}" "dependencies" "$${len_col_5}" "Service" ; \
	printf "+%0-*s  +%0-*s  +%0-*s  +%0-*s  +%0-*s  +\n" "$${len_col_1}" "====" "$${len_col_2}" "====" "$${len_col_3}" "====" "$${len_col_4}" "====" "$${len_col_5}" "====" ; \
	for makefile in $(shell echo $(MAKEFILE_LIST) | sort); do \
		dir_name=$$(dirname $$makefile | rev | cut -d"/" -f1 | rev) ; \
		if [ "$$dir_name" = "." ] || [ "$$dir_name" = "makefiles" ]; then dir_name=""; fi; \
		cat $$makefile | grep -v "^#" | grep -E "^[a-zA-Z_-]+:.*?## .*$$|^[a-zA-Z_-]+:.*?$$|^\s+=> .*$$" | while read line; do \
			name=$$(echo $$line | awk  -F ':' '{print $$1}'); \
			if echo "$$line" | grep -q "=>" ; then \
				help=$$(echo "$$line" | awk -F '##' '{print $$2}' | awk -F '=>' '{print $$1}' | sed -e 's/^[[:space:]]*//'); \
				usage=$$(echo "$$line" | awk -F '=>' '{print $$2}' | sed -e 's/^[[:space:]]*//'); \
			else \
				help=$$(echo "$$line" | awk -F '##' '{print $$2}' | sed -e 's/^[[:space:]]*//'); \
				usage=""; \
			fi ; \
			deps="" ;\
			for dep in `grep -E "^$$name:" $(MAKEFILE_LIST) | awk -F ': ' '{print $$2}' | awk -F '##' '{print $$1}'`; do \
				if [[ ! "$$dep" = "check-defined-"* ]]; then \
					deps="$${deps}$${dep}\n"; \
				fi ; \
			done ; \
			dependencies=$$(if [ "$$deps" ]; then echo "$$deps"; else echo ""; fi); \
			printf "| %0-*s | %0-*s | %0-*s | %0-*s | %0-*s |\n" "$${len_col_1}" "$$name" "$${len_col_2}" "$$help" "$${len_col_3}" "$$usage" "$${len_col_4}" "$$dependencies" "$${len_col_5}" "$${dir_name}" ; \
		done \
	done

logs: check-defined-service_name ## display logs
	$(info Make: Logs ${service_name})
	@docker compose logs ${service_name}

logs-f: check-defined-service_name ## display logs with follow
	$(info Make: Follow logs ${service_name})
	@docker compose logs -f ${service_name}

logs-tail: check-defined-service_name ## display logs tail => [tail=$(shell echo ${tail})]
	$(info Make: Logs tail ${service_name})
	@docker compose logs --tail=${tail} ${service_name}

packages-version: black-packages-version flake8-packages-version mypy-packages-version pre-commit-packages-version python-dev-packages-version pylint-packages-version pytest-packages-version reorder-python-import-packages-version sphinx-packages-version ## list outdated package in service

run-pre-commit: ## run localy precommit
	$(info Make: pre-commit)
	@pip install --quiet --no-cache-dir pre-commit
	@pre-commit autoupdate --bleeding-edge
	@pre-commit run --all-files --verbose --hook-stage manual

prune: down ## remove service on the host and prune volume image and network unused
	$(info Make: Prune)
	@docker compose rm
	@docker rm `docker compose ps --filter status=created --filter status=exited -q` || true
	@docker rmi `docker compose images ls -q` || true
	@docker rmi `docker images -f "dangling=true" -q` || true
run-local-ci: ## run ci pipeline locally
	$(info Make: run CI localy)
	@pip install --quiet --upgrade gitlabci-local ipython
	@gitlabci-local
start: check-defined-service_name ## Start project containers => [service_name={service_name}]
	$(info Make: start ${service_name})
	@docker compose start ${service_name} || make --quiet -s up service_name=${service_name}

status: ## display status of all service
	@docker compose ps --services | sort | while read service; do \
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
	@docker compose stop ${service_name}

tag-latest: $(shell grep -E '^[a-zA-Z_-]+-tag-latest:.*?## .*$$' $(MAKEFILE_LIST) | sort | cut -d":" -f1 | tr "\n" " ") ## tag services as latest

up: ## Up project containers => [service_name={service_name}]
	$(info Make: Up detach ${service_name})
	@docker compose up ${service_name}

up-detach: ## Up project containers => [service_name={service_name}]
	$(info Make: Up ${service_name})
	@docker compose up --detach ${service_name}
