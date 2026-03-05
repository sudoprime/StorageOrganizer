#!/bin/bash
# Delete all Kubernetes resources for StorageOrganizer

set -e

echo "🗑️  Deleting StorageOrganizer from Kubernetes..."

# Delete in reverse order
echo "🎨 Deleting Frontend..."
kubectl delete -f frontend-service.yaml --ignore-not-found=true
kubectl delete -f frontend-deployment.yaml --ignore-not-found=true

echo "🔧 Deleting Backend..."
kubectl delete -f backend-service.yaml --ignore-not-found=true
kubectl delete -f backend-deployment.yaml --ignore-not-found=true

echo "🐘 Deleting PostgreSQL..."
kubectl delete -f postgres-service.yaml --ignore-not-found=true
kubectl delete -f postgres-deployment.yaml --ignore-not-found=true

echo "💾 Deleting persistent storage..."
kubectl delete -f postgres-pvc.yaml --ignore-not-found=true
kubectl delete -f postgres-pv.yaml --ignore-not-found=true

echo "🔧 Deleting ConfigMap and Secrets..."
kubectl delete -f secret.yaml --ignore-not-found=true
kubectl delete -f configmap.yaml --ignore-not-found=true

echo "📦 Deleting namespace..."
kubectl delete -f namespace.yaml --ignore-not-found=true

echo ""
echo "✅ All resources deleted!"
echo ""
echo "⚠️  Note: Data in /var/lib/storage_organizer/postgres is preserved."
echo "   To delete data, run: sudo rm -rf /var/lib/storage_organizer/postgres"
