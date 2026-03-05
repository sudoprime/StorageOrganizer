K3S_CTR = k3s ctr --address /run/k3s/containerd/containerd.sock --namespace k8s.io
BACKEND_IMAGE = docker.io/library/storage-organizer-backend:latest
FRONTEND_IMAGE = docker.io/library/storage-organizer-frontend:latest

.PHONY: all help build import deploy delete status clean \
        logs logs-backend logs-frontend logs-postgres \
        restart-backend restart-frontend restart-postgres

all: build import deploy restart ## Build, import to k3s, deploy, and restart

build: ## Build Docker images
	docker build -t storage-organizer-backend:latest ./backend
	docker build -t storage-organizer-frontend:latest ./frontend

import: ## Import Docker images into k3s containerd
	docker save $(BACKEND_IMAGE) | $(K3S_CTR) images import -
	docker save $(FRONTEND_IMAGE) | $(K3S_CTR) images import -

deploy: ## Deploy to Kubernetes
	cd kubernetes && ./apply-all.sh

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

delete: ## Delete from Kubernetes
	cd kubernetes && ./delete-all.sh

status: ## Show deployment status
	@kubectl get pods -n storage-organizer
	@echo ""
	@kubectl get svc -n storage-organizer

clean: ## Remove all images
	docker rmi storage-organizer-backend:latest || true
	docker rmi storage-organizer-frontend:latest || true

logs: ## Follow logs for all services
	kubectl logs -f -l 'app in (backend,frontend,postgres)' --all-containers --prefix --max-log-requests=10 -n storage-organizer

logs-backend: ## View backend logs
	kubectl logs -f -l app=backend -n storage-organizer

logs-frontend: ## View frontend logs
	kubectl logs -f -l app=frontend -n storage-organizer

logs-postgres: ## View postgres logs
	kubectl logs -f -l app=postgres -n storage-organizer

restart: ## Restart backend and frontend pods
	kubectl rollout restart deployment/backend deployment/frontend -n storage-organizer

restart-backend: ## Restart backend pods
	kubectl rollout restart deployment/backend -n storage-organizer

restart-frontend: ## Restart frontend pods
	kubectl rollout restart deployment/frontend -n storage-organizer

restart-postgres: ## Restart postgres pod
	kubectl rollout restart deployment/postgres -n storage-organizer
