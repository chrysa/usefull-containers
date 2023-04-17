#!make

svelte-compile: ## build application
	$(info Make: Build application)
	@make --quiet -s run-cmd service_name=svelte-app-dev cmd="npm run build"
svelte-connect-dev:
	@${__docker_compose_base_cmd} run --rm svelte-app-dev bash
svelte-connect-prod:
	@${__docker_compose_base_cmd} run --rm svelte-app bash
svelte-dev: ## run svelte-app app for dev
	@${__docker_compose_base_cmd} run --service-ports --rm --env FQDN=${FQDN} svelte-app-dev
svelte-lint: ## analyse base code
	$(info Make: Lint)
	@make --quiet -s run-cmd service_name=svelte-app-dev cmd="npm run lint"
svelte-lint-fix: ## lint base code
	$(info Make: Lint fix)
	@make --quiet -s run-cmd service_name=svelte-app-dev cmd="npm run lint:js:fix"
svelte-outdated-dev: ## check outdated packages
	$(info Make: Check outdated packages on dev)
	@make --quiet -s run-cmd service_name=svelte-app-dev cmd="npm run outdated"
svelte-outdated-prod: ## check outdated packages
	$(info Make: Check outdated packages on prod)
	@make --quiet -s run-cmd service_name=svelte-app cmd="npm run outdated"
svelte-prod: ## run svelte-app app for dev 
	@${__docker_compose_base_cmd} run --service-ports --rm --env FQDN=${FQDN} svelte-app
run-cmd: check-defined-service_name check-defined-cmd ## run commande on image => service_name={service_name} cmd={cmd}
	$(info Make: "${cmd}" on ${service_name})
	@if [ -z $(shell docker compose ps -q ${service_name}) ]; then \
		docker compose run --rm ${service_name} bash -c "${cmd}" ; \
	else \
		docker compose exec ${service_name} bash -c "${cmd}" ; \
	fi
