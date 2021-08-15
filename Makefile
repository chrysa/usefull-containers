ifneq (,)
	$(error "This Makefile requires GNU Make")*
endif

tail=10

.DEFAULT_GOAL := help

.PHONY: $(shell grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | cut -d":" -f1 | tr "\n" " ")

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
build-parallel: ## Build project parallel => make build-parallel [service_name={service_name}]
	$(info Make: Build service  ${service_name})
	@docker-compose build --compress --force-rm --quiet --parallel ${service_name}
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
up: ## Up project containers => [service_name={service_name}]
	$(info Make: Up detach ${service_name})
	@docker-compose up ${service_name}
up-detach: ## Up project containers =>  [service_name={service_name}]
	$(info Make: Up ${service_name})
	@docker-compose up --detach ${service_name}
upgradable-packages: check-defined-service_name ## list outdated package in service
	@for service in $(shell echo ${service_name}); do \
		echo "=======>> upgradable package for ${service}"
		docker-compose run --rm ${service} sh -c "pip list --outdated --format columns" ; \
	done
