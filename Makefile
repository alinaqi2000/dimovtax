.PHONY: up down logs seed setup rebuild clean help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

up: ## Start PostgreSQL + app
	docker compose up -d

down: ## Stop all containers
	docker compose down

logs: ## Follow logs
	docker compose logs -f

seed: ## Seed the database (runs in a container, no host deps needed)
	docker compose --profile seed run --rm seed

setup: up seed ## Start stack + seed

rebuild: ## Rebuild from scratch (wipes database)
	docker compose down -v
	docker compose up -d --build

clean: ## Stop and wipe all data
	docker compose down -v
