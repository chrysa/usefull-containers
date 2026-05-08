#!make
# ─── Project ──────────────────────────────────────────────────────────────────

prune: down ## Remove containers and prune unused Docker resources
	@docker compose rm --force
	@docker rmi $$(docker images -f "dangling=true" -q) 2>/dev/null || true
	@docker volume prune --force 2>/dev/null || true

tag-latest: black-tag-latest flake8-tag-latest hadolint-tag-latest mypy-tag-latest \
	pre-commit-tag-latest pylint-tag-latest pytest-tag-latest python-dev-tag-latest \
	reorder-python-import-tag-latest sphinx-tag-latest \
	ruff-tag-latest bandit-tag-latest safety-tag-latest trivy-tag-latest \
	actionlint-tag-latest yamllint-tag-latest ## Tag all active service images as :latest
