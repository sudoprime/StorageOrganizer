#!/bin/bash
# Apply all Kubernetes manifests in the correct order

set -e

echo "🚀 Deploying StorageOrganizer to Kubernetes..."

# Create namespace first
echo "📦 Creating namespace..."
kubectl apply -f namespace.yaml

# Create ConfigMap and Secrets
echo "🔧 Creating ConfigMap and Secrets..."
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml

# Create PersistentVolume and PersistentVolumeClaim
echo "💾 Creating persistent storage..."
kubectl apply -f postgres-pv.yaml
kubectl apply -f postgres-pvc.yaml

# Deploy PostgreSQL
echo "🐘 Deploying PostgreSQL..."
kubectl apply -f postgres-deployment.yaml
kubectl apply -f postgres-service.yaml

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n storage-organizer --timeout=120s

# Deploy Backend
echo "🔧 Deploying Backend..."
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml

# Deploy Frontend
echo "🎨 Deploying Frontend..."
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Checking status..."
kubectl get pods -n storage-organizer
echo ""
echo "🌐 Services:"
kubectl get svc -n storage-organizer
echo ""
echo "🎯 Access the application:"
echo "   Frontend: http://localhost:30300"
echo "   Backend:  http://localhost:30800"
echo "   API Docs: http://localhost:30800/docs"
echo ""
echo "📝 View logs:"
echo "   kubectl logs -f -l app=backend -n storage-organizer"
echo "   kubectl logs -f -l app=frontend -n storage-organizer"
echo "   kubectl logs -f -l app=postgres -n storage-organizer"
