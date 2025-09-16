# Carendar — common development tasks.
# Run `make help` to list them.

.PHONY: help dev build start typecheck lint test test-go build-go vet docker-up docker-down migrate

help: ## List available targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

dev: ## Start the Next.js dev server (:3000). Backend must run separately.
	npm run dev

build: ## Production build of the frontend (standalone output)
	npm run build

start: ## Run the built frontend server
	npm run start

typecheck: ## TypeScript check (frontend)
	npm run typecheck

lint: ## ESLint (frontend)
	npm run lint

build-go: ## Compile the backend binary
	cd apps/backend && go build ./...

test: test-go ## Run all backend tests (race detector on)
test-go:
	cd apps/backend && go test -race -timeout 5m ./...

vet: ## go vet the backend
	cd apps/backend && go vet ./...

