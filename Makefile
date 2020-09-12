.DEFAULT_GOAL := help

.PHONY: build clean down help logs logs-f logs-tail pre-commit prune start status stop up up-detach
tail=10

COLOR[GREEN]=\e[1;92m
COLOR[RED]=\e[1;91m
COLOR[WHITE]=\e[39m
COLOR[YELLOW]=\e[1;93m

check-defined-% :
	@:$(call check_defined, $*, target-specific)

check_defined = $(strip $(foreach 1,$1, $(call __check_defined,$1,$(strip $(value 2)))))

__check_defined = $(if $(value $1),, $(error Undefined $1$(if $2, ($2))$(if $(value @), required by target $@)))

build: ## Build project => make build [service_name={service_name}]
	$(info Make: Build service)
	@docker-compose build --compress --force-rm
clean: ## clean project
	$(info Make: clean)
	@rm -rf .mypy_cache .pytest
down: clean ## Down project containers=> make down
	$(info Make: Down)
	@docker-compose down --remove-orphans
help: ## This help dialog => make help
	@IFS=$$'\n'
	@printf "%-30s %-30s %s\n" "Target" "Help"
	@printf "%-30s %-30s %s\n" "------" "----"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %-30s\n", $$1, $$2}'
logs: check-defined-service_name ## display logs
	$(info Make: Logs ${service_name})
	@docker-compose logs ${service_name}
logs-f: check-defined-service_name ## display logs with follow
	$(info Make: Follow logs ${service_name})
	@docker-compose logs -f ${service_name}
logs-tail: check-defined-service_name ## display logs tail => make logs-tail [tail=${tail}]
	$(info Make: Logs tail ${service_name})
	@docker-compose logs --tail=${tail} ${service_name}
pre-commit: ## run localy precommit=> make pre-commit
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
start: check-defined-service_name ## Start project containers=> make start [service_name={service_name}]
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
stop: check-defined-service_name ## Start project containers=> make start [service_name={service_name}]
	$(info Make: stop  ${service_name})
	docker-compose stop ${service_name}
up: ## Up project containers => make up [service_name={service_name}]
	$(info Make: Up detach ${service_name})
	@docker-compose up ${service_name}
up-detach: ## Up project containers => make up [service_name={service_name}]
	$(info Make: Up resume ${service_name})
	@docker-compose up --detach resume ${service_name}
