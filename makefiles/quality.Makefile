#!make
# ─── Quality ──────────────────────────────────────────────────────────────────

hadolint-analyse: ## Run hadolint on all Dockerfiles
	@for f in $$(find . -name "Dockerfile" -not -path "*/.git/*"); do \
		echo "Analysing $$f..."; \
		docker run --rm --interactive \
			--volume $(CURDIR)/.hadolint.yaml:/bin/hadolint.yaml \
			-e XDG_CONFIG_HOME=/bin \
			hadolint/hadolint < $$f; \
	done

packages-version: black-packages-version flake8-packages-version mypy-packages-version \
	pre-commit-packages-version python-dev-packages-version pylint-packages-version \
	pytest-packages-version reorder-python-import-packages-version \
	sphinx-packages-version ## List outdated packages in all active services

pre-commit: ## Run pre-commit checks on all files
	@pip install --quiet --no-cache-dir "pre-commit>=4.1.0"
	@pre-commit autoupdate --bleeding-edge
	@pre-commit run --all-files --verbose --hook-stage manual
