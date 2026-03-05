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
│   │   │   ├── items.py
│   │   │   ├── rooms.py
│   │   │   └── stacks.py
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
├── .env.example           # Environment variables template
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

## Data Model

### Hierarchy

```
Room (storage unit)
  └── Stack (floor position, e.g. "A3")
        └── Bin (at a level in the stack, e.g. level 1 = bottom)
              ├── Items (directly in this bin)
              └── Bins (nested child bins, e.g. Plano box inside a tote)
                    └── Items
```

### QR Code IDs

All bins get an auto-generated ID in the format `BIN-A3F2` (prefix + 4-char hash). The ID is:
- Generated server-side on `POST /api/bins` with collision checking
- Used as QR code data (just the ID string, not a URL)
- The lookup key for all bin API endpoints

### Location Rules

- **Top-level bins** (no `parent_id`) must have `stack_id` and `level` set
- **Child bins** (with `parent_id`) must NOT have `stack_id` or `level` — their location is inherited from the parent bin
- Multiple bins can share the same level in a stack (e.g. two small bins side-by-side on one large bin)
- Level 1 = bottom of stack, higher numbers = higher in the stack

## API Endpoints

### Rooms
- `GET /api/rooms` - List all rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms/{id}` - Get room details
- `PUT /api/rooms/{id}` - Update room
- `DELETE /api/rooms/{id}` - Delete room (cascades to stacks)

### Stacks
- `GET /api/stacks?room_id={id}` - List stacks in a room (room_id required)
- `POST /api/stacks` - Create stack (requires room_id and position)
- `GET /api/stacks/{id}` - Get stack with bins (ordered by level)
- `PUT /api/stacks/{id}` - Update stack
- `DELETE /api/stacks/{id}` - Delete stack

### Bins
- `GET /api/bins` - List bins (optional filters: `?stack_id=1`, `?parent_id=1`, `?top_level=true`)
- `POST /api/bins` - Create bin (bin_id auto-generated)
- `GET /api/bins/{bin_id}` - Get bin with items and child bins (e.g. `GET /api/bins/BIN-A3F2`)
- `PUT /api/bins/{bin_id}` - Update bin
- `DELETE /api/bins/{bin_id}` - Delete bin (cascades to items and child bins)
- `GET /api/bins/{bin_id}/qr-code` - Generate QR code image (base64 PNG)
- `GET /api/bins/{bin_id}/items` - Get items directly in this bin

### Items
- `GET /api/items` - List all items (optional: `?category=Electronics`)
- `GET /api/items/search?q={query}` - Search items (returns item + bin + stack + room)
- `POST /api/items` - Create item
- `GET /api/items/{id}` - Get item
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item
- `GET /api/items/categories/list` - Get all unique categories

## Generating Hash IDs

The API auto-generates `BIN-XXXX` IDs when you create bins. You don't need to pre-generate them.

If you want to preview what IDs look like, or pre-generate a batch for planning:

```bash
cd backend
python scripts/generate_hashes.py --count 102
python scripts/generate_hashes.py --count 200 --output ids.txt
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

2. **Create a room** for your storage unit via API

3. **Create stacks** for each floor position in the room

4. **Create bins** (IDs auto-generated, assign to stack + level)

5. **Add items** to bins

6. **Print QR labels** using PT-E560BTVP

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
