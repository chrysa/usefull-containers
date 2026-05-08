#!make
ifneq (,)
	$(error This Makefile requires GNU Make)
endif

# ─── Variables ────────────────────────────────────────────────────────────────
PROJECT_NAME ?= usefull-containers

include $(shell find . -type f \( -name "*.Makefile" -o -name "*.makefile" \) \
	-not -path "*/\.*" 2>/dev/null | sort | xargs -I{} echo " {}" | tr -d '\n')

.DEFAULT_GOAL := help

.PHONY: $(shell grep -hE '^[a-zA-Z0-9_-]+:.*?## .*$$' \
	$(shell find . -type f \( -name "*.Makefile" -o -name "*.makefile" \) \
		-not -path "*/\.*" 2>/dev/null) \
	$(MAKEFILE_LIST) 2>/dev/null | sort -u | cut -d":" -f1 | tr "\n" " ")

help: ## Display this help message
	@echo "==================================================================="
	@echo "  $(PROJECT_NAME)"
	@echo "==================================================================="
	@echo ""
	@echo "Available commands:"
	@echo ""
	@for file in $$(find . -type f \( -name "*.Makefile" -o -name "*.makefile" \) \
			-not -path "*/\.*" 2>/dev/null | sort); do \
		category=$$(basename "$$file" .Makefile); \
		case "$$category" in \
			development) icon="⚡" ;; \
			docker)      icon="🐳" ;; \
			quality)     icon="🔍" ;; \
			tests)       icon="🧪" ;; \
			tools)       icon="🔧" ;; \
			project)     icon="🚀" ;; \
			ci|cicd)     icon="⚙️ " ;; \
			lint)        icon="🧹" ;; \
			secrets)     icon="🔐" ;; \
			*)           icon="📌" ;; \
		esac; \
		matches=$$(grep -cE '^[a-zA-Z0-9_-]+:.*?## .*$$' "$$file" 2>/dev/null || echo 0); \
		if [ "$$matches" -gt 0 ]; then \
			echo "$$icon $$(echo $$category | tr '[:lower:]' '[:upper:]'):"; \
			grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' "$$file" 2>/dev/null | sort | \
				awk 'BEGIN {FS = ":.*?## "}; { \
printf "  \033[36m%-35s\033[0m %s\n", $$1, $$2; \
}'; \
			echo ""; \
		fi; \
	done
	@echo "==================================================================="

help-%: ## Show help for a specific target
	@grep -hE '^$*:.*?## .*$$' \
		$$(find . -type f \( -name "*.Makefile" -o -name "*.makefile" \) \
			-not -path "*/\.*" 2>/dev/null) \
		$(MAKEFILE_LIST) 2>/dev/null | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-35s\033[0m %s\n", $$1, $$2}'
