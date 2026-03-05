.PHONY: help build-backend build-frontend build-all deploy delete logs status clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

build-backend: ## Build backend Docker image
	@echo "🔨 Building backend image..."
	docker build -t storage-organizer-backend:latest ./backend

build-frontend: ## Build frontend Docker image
	@echo "🔨 Building frontend image..."
	docker build -t storage-organizer-frontend:latest ./frontend

build-all: build-backend build-frontend ## Build all Docker images
	@echo "✅ All images built successfully!"

deploy: ## Deploy to Kubernetes
	@echo "🚀 Deploying to Kubernetes..."
	cd kubernetes && ./apply-all.sh

delete: ## Delete from Kubernetes
	@echo "🗑️  Deleting from Kubernetes..."
	cd kubernetes && ./delete-all.sh

logs-backend: ## View backend logs
	kubectl logs -f -l app=backend -n storage-organizer

logs-frontend: ## View frontend logs
	kubectl logs -f -l app=frontend -n storage-organizer

logs-postgres: ## View postgres logs
	kubectl logs -f -l app=postgres -n storage-organizer

status: ## Show deployment status
	@echo "📊 Deployment Status:"
	@kubectl get pods -n storage-organizer
	@echo ""
	@echo "🌐 Services:"
	@kubectl get svc -n storage-organizer

clean: ## Remove all images
	@echo "🧹 Removing Docker images..."
	docker rmi storage-organizer-backend:latest || true
	docker rmi storage-organizer-frontend:latest || true

all: build-all deploy ## Build and deploy everything
	@echo "✅ Build and deployment complete!"
	@echo ""
	@echo "🎯 Access the application:"
	@echo "   Frontend: http://localhost:30300"
	@echo "   Backend:  http://localhost:30800"
	@echo "   API Docs: http://localhost:30800/docs"

restart-backend: ## Restart backend pods
	kubectl rollout restart deployment/backend -n storage-organizer

restart-frontend: ## Restart frontend pods
	kubectl rollout restart deployment/frontend -n storage-organizer

restart-postgres: ## Restart postgres pod
	kubectl rollout restart deployment/postgres -n storage-organizer
