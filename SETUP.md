# StorageOrganizer - Setup Guide (Kubernetes)

## Quick Start with Kubernetes

The application runs on Kubernetes with persistent storage for the PostgreSQL database.

### Prerequisites

- Kubernetes cluster (minikube, Docker Desktop with K8s, or other)
- kubectl installed and configured
- Docker installed (for building images)
- PT-E560BTVP label printer (for QR code printing)

### Initial Setup

1. **Clone and navigate to project:**
   ```bash
   cd /home/pseudo/StorageOrganizer
   ```

2. **Ensure Kubernetes is running:**
   ```bash
   kubectl version
   kubectl cluster-info
   ```

   If using minikube:
   ```bash
   minikube start
   ```

3. **Build Docker images:**
   ```bash
   make build-all
   # Or individually:
   # make build-backend
   # make build-frontend
   ```

4. **Deploy to Kubernetes:**
   ```bash
   make deploy
   ```

   This will:
   - Create the `storage-organizer` namespace
   - Create ConfigMaps and Secrets
   - Create PersistentVolume at `/var/lib/storage_organizer/postgres`
   - Deploy PostgreSQL with persistent storage
   - Deploy FastAPI backend (2 replicas)
   - Deploy React frontend (2 replicas)

5. **Access the application:**
   - Frontend: http://localhost:30300
   - Backend API: http://localhost:30800
   - API Documentation: http://localhost:30800/docs

### Persistent Storage

PostgreSQL data is stored on the host at:
```
/var/lib/storage_organizer/postgres
```

This directory will be created automatically if it doesn't exist. Data persists across pod restarts and deployments.

**To backup database:**
```bash
# Create backup directory
sudo mkdir -p /var/lib/storage_organizer/backups

# Backup
kubectl exec -n storage-organizer deployment/postgres -- \
  pg_dump -U storage_user storage_organizer > backup.sql
```

**To restore database:**
```bash
kubectl exec -i -n storage-organizer deployment/postgres -- \
  psql -U storage_user storage_organizer < backup.sql
```

### Database Migrations

The database schema is managed with Alembic. To run migrations:

```bash
# Get backend pod name
BACKEND_POD=$(kubectl get pod -n storage-organizer -l app=backend -o jsonpath='{.items[0].metadata.name}')

# Run migrations
kubectl exec -n storage-organizer $BACKEND_POD -- alembic upgrade head

# Create new migration
kubectl exec -n storage-organizer $BACKEND_POD -- \
  alembic revision --autogenerate -m "description"
```

### Development Workflow

**View deployment status:**
```bash
make status
# Or: kubectl get pods -n storage-organizer
```

**View logs:**
```bash
make logs-backend    # Backend logs
make logs-frontend   # Frontend logs
make logs-postgres   # PostgreSQL logs

# Or directly:
kubectl logs -f -l app=backend -n storage-organizer
```

**Restart services:**
```bash
make restart-backend
make restart-frontend
make restart-postgres
```

**Update after code changes:**
```bash
# 1. Rebuild images
make build-backend   # If backend changed
make build-frontend  # If frontend changed

# 2. Restart pods to use new images
make restart-backend
make restart-frontend
```

**Delete everything:**
```bash
make delete
# Or: cd kubernetes && ./delete-all.sh
```

**Delete everything including data:**
```bash
make delete
sudo rm -rf /var/lib/storage_organizer/postgres
```

## Project Structure

```
StorageOrganizer/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API route handlers
│   │   │   ├── bins.py
│   │   │   ├── containers.py
│   │   │   ├── items.py
│   │   │   └── rooms.py
│   │   ├── core/           # Core configuration
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/         # SQLAlchemy models
│   │   │   └── models.py
│   │   ├── schemas/        # Pydantic schemas
│   │   │   └── schemas.py
│   │   └── main.py         # FastAPI app
│   ├── scripts/            # Utility scripts
│   │   └── generate_hashes.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/               # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── App.js
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
│
├── kubernetes/             # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── postgres-pv.yaml
│   ├── postgres-pvc.yaml
│   ├── postgres-deployment.yaml
│   ├── postgres-service.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── apply-all.sh
│   └── delete-all.sh
│
├── Makefile               # Build and deployment commands
├── .env                   # Environment variables (not used in K8s)
├── README.md              # Project overview
├── BINS.md               # Bin system documentation
├── HARDWARE.md           # Hardware recommendations
├── MARKET_RESEARCH.md    # Market analysis
├── UI_DESIGN.md          # UI/UX design doc
└── SETUP.md              # This file
```

## Makefile Commands

```bash
make help              # Show all available commands
make build-all         # Build all Docker images
make deploy            # Deploy to Kubernetes
make delete            # Remove from Kubernetes
make status            # Show deployment status
make logs-backend      # View backend logs
make logs-frontend     # View frontend logs
make logs-postgres     # View postgres logs
make restart-backend   # Restart backend pods
make restart-frontend  # Restart frontend pods
make all               # Build and deploy everything
```

## API Endpoints

### Rooms
- `GET /api/rooms` - List all rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms/{id}` - Get room details
- `PUT /api/rooms/{id}` - Update room
- `DELETE /api/rooms/{id}` - Delete room

### Bins
- `GET /api/bins` - List all bins (optional: ?room_id=1)
- `POST /api/bins` - Create bin
- `GET /api/bins/{bin_id}` - Get bin with items
- `PUT /api/bins/{bin_id}` - Update bin
- `DELETE /api/bins/{bin_id}` - Delete bin
- `GET /api/bins/{bin_id}/qr-code` - Generate QR code image

### Containers
- `GET /api/containers` - List all containers
- `POST /api/containers` - Create container
- `GET /api/containers/{container_id}` - Get container with items
- `PUT /api/containers/{container_id}` - Update container
- `DELETE /api/containers/{container_id}` - Delete container

### Items
- `GET /api/items` - List all items
- `GET /api/items/search?q={query}` - Search items
- `POST /api/items` - Create item
- `GET /api/items/{id}` - Get item
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item
- `GET /api/items/categories/list` - Get all categories

## Data Model

### Hierarchy
```
Room (storage unit)
  └── Bins (main containers with QR codes)
        ├── Items (loose in bin)
        └── Containers (sub-containers with QR codes)
              └── Items (in sub-container)
```

### QR Code IDs
- **Bins:** 4-character hashes (e.g., A3F2, B7K9)
- **Containers:** 5-character hashes (e.g., X4K2P, Y7M3Q)

## Generating Hash IDs

Use the included Python script to generate random hash IDs:

```bash
# Get backend pod
BACKEND_POD=$(kubectl get pod -n storage-organizer -l app=backend -o jsonpath='{.items[0].metadata.name}')

# Generate IDs
kubectl exec -n storage-organizer $BACKEND_POD -- \
  python scripts/generate_hashes.py --bins 102 --containers 50
```

Or run locally:
```bash
cd backend
python scripts/generate_hashes.py --bins 102 --containers 50 --output ids.txt
```

## Troubleshooting

**Pods not starting:**
```bash
# Check pod status
kubectl get pods -n storage-organizer

# Describe pod to see issues
kubectl describe pod <pod-name> -n storage-organizer

# Check logs
kubectl logs <pod-name> -n storage-organizer
```

**Database connection errors:**
```bash
# Verify postgres is running
kubectl get pods -n storage-organizer -l app=postgres

# Check postgres logs
make logs-postgres

# Restart backend pods
make restart-backend
```

**PersistentVolume issues:**
```bash
# Check PV and PVC status
kubectl get pv
kubectl get pvc -n storage-organizer

# Ensure directory exists and has correct permissions
sudo mkdir -p /var/lib/storage_organizer/postgres
sudo chmod 755 /var/lib/storage_organizer
```

**Image not found (imagePullPolicy: Never):**
```bash
# Rebuild images
make build-all

# If using minikube, ensure images are in minikube's Docker daemon
eval $(minikube docker-env)
make build-all
```

**Port already in use (NodePort 30300 or 30800):**
- Edit the service YAML files to use different NodePorts
- Or stop other services using those ports

**Reset everything:**
```bash
make delete
sudo rm -rf /var/lib/storage_organizer/postgres
make build-all
make deploy
```

## Accessing Services from Outside Cluster

**Using NodePort (current configuration):**
- Frontend: http://localhost:30300
- Backend: http://localhost:30800

**Using Port Forwarding:**
```bash
# Frontend
kubectl port-forward -n storage-organizer svc/frontend 3000:3000

# Backend
kubectl port-forward -n storage-organizer svc/backend 8000:8000
```

**Using Ingress (for production):**
Create an Ingress resource to expose services with a domain name.

## Next Steps

1. **Verify deployment:**
   ```bash
   make status
   ```

2. **Generate hash IDs** for your bins and containers

3. **Print QR labels** using PT-E560BTVP

4. **Create a room** for your storage unit via API

5. **Create bins** with generated IDs

6. **Start packing** and adding items via the web app

7. **Scan QR codes** to quickly access bin contents

## Production Deployment

For production deployment:
- Use managed Kubernetes (GKE, EKS, AKS)
- Use managed PostgreSQL instead of in-cluster
- Set up proper Secrets management (Vault, Sealed Secrets)
- Configure Ingress with TLS/SSL
- Set resource limits appropriately
- Enable horizontal pod autoscaling
- Set up monitoring (Prometheus, Grafana)
- Configure backup automation
- Use proper image registry (not local images)
- Set `imagePullPolicy: Always` in deployments
