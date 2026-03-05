# Kubernetes Deployment

This directory contains Kubernetes manifests for deploying StorageOrganizer.

## Quick Start

```bash
# Build images
cd ..
make build-all

# Deploy
make deploy

# Check status
make status
```

## Manifests

| File | Description |
|------|-------------|
| `namespace.yaml` | Creates the `storage-organizer` namespace |
| `configmap.yaml` | Non-sensitive configuration (database name, etc.) |
| `secret.yaml` | Sensitive data (passwords, secret keys) |
| `postgres-pv.yaml` | PersistentVolume for PostgreSQL data at `/var/lib/storage_organizer/postgres` |
| `postgres-pvc.yaml` | PersistentVolumeClaim for PostgreSQL |
| `postgres-deployment.yaml` | PostgreSQL database deployment (1 replica) |
| `postgres-service.yaml` | PostgreSQL ClusterIP service |
| `backend-deployment.yaml` | FastAPI backend deployment (2 replicas) |
| `backend-service.yaml` | Backend NodePort service (port 30800) |
| `frontend-deployment.yaml` | React frontend deployment (2 replicas) |
| `frontend-service.yaml` | Frontend NodePort service (port 30300) |

## Scripts

- `apply-all.sh` - Deploy all resources in correct order
- `delete-all.sh` - Delete all resources (preserves data)

## Resource Configuration

### PostgreSQL
- **Replicas:** 1 (StatefulSet not needed for single replica)
- **Storage:** 10Gi PersistentVolume at `/var/lib/storage_organizer/postgres`
- **Resources:** 256Mi-512Mi RAM, 250m-500m CPU
- **Image:** postgres:15-alpine

### Backend (FastAPI)
- **Replicas:** 2 (can scale horizontally)
- **Resources:** 256Mi-512Mi RAM, 250m-500m CPU
- **Image:** storage-organizer-backend:latest (local)
- **Exposed:** NodePort 30800

### Frontend (React)
- **Replicas:** 2 (can scale horizontally)
- **Resources:** 256Mi-512Mi RAM, 250m-500m CPU
- **Image:** storage-organizer-frontend:latest (local)
- **Exposed:** NodePort 30300

## Persistent Storage

PostgreSQL data is stored in a PersistentVolume backed by a hostPath:

```
/var/lib/storage_organizer/postgres
```

This directory:
- Is created automatically if it doesn't exist (type: DirectoryOrCreate)
- Persists data across pod restarts
- Survives deployments being deleted/recreated
- Is NOT deleted when running `make delete` or `delete-all.sh`

### Backup Strategy

**Manual backup:**
```bash
kubectl exec -n storage-organizer deployment/postgres -- \
  pg_dump -U storage_user storage_organizer > backup.sql
```

**Restore:**
```bash
kubectl exec -i -n storage-organizer deployment/postgres -- \
  psql -U storage_user storage_organizer < backup.sql
```

**Automated backup (recommended for production):**
Set up a CronJob to backup to cloud storage regularly.

## Scaling

**Scale backend:**
```bash
kubectl scale deployment backend -n storage-organizer --replicas=3
```

**Scale frontend:**
```bash
kubectl scale deployment frontend -n storage-organizer --replicas=3
```

**Note:** PostgreSQL is configured as a single replica. For HA PostgreSQL, use a StatefulSet or managed database service.

## Monitoring

**Watch pods:**
```bash
kubectl get pods -n storage-organizer -w
```

**Resource usage:**
```bash
kubectl top pods -n storage-organizer
kubectl top nodes
```

**Events:**
```bash
kubectl get events -n storage-organizer --sort-by='.lastTimestamp'
```

## Troubleshooting

**Pod stuck in Pending:**
```bash
kubectl describe pod <pod-name> -n storage-organizer
# Check PVC binding, resource limits, node capacity
```

**Pod CrashLoopBackOff:**
```bash
kubectl logs <pod-name> -n storage-organizer --previous
# Check previous logs to see why it crashed
```

**PersistentVolume not binding:**
```bash
kubectl get pv
kubectl get pvc -n storage-organizer
# Ensure labels match between PV and PVC
# Ensure /var/lib/storage_organizer exists and is writable
```

**Cannot pull image:**
```bash
# Images are local (imagePullPolicy: Never)
# Rebuild images: make build-all
# If using minikube: eval $(minikube docker-env) && make build-all
```

## Network

**Services:**
- postgres: ClusterIP (internal only)
- backend: NodePort 30800 (accessible from host)
- frontend: NodePort 30300 (accessible from host)

**Access from outside cluster:**
- Frontend: http://localhost:30300 (or http://<node-ip>:30300)
- Backend: http://localhost:30800 (or http://<node-ip>:30800)

**Access from within cluster:**
- postgres: `postgres.storage-organizer.svc.cluster.local:5432`
- backend: `backend.storage-organizer.svc.cluster.local:8000`
- frontend: `frontend.storage-organizer.svc.cluster.local:3000`

## Security Notes

**Current configuration (development):**
- Passwords in plain text in Secret (use base64 in production)
- imagePullPolicy: Never (use Always in production with registry)
- NodePort exposed (use Ingress with TLS in production)
- No NetworkPolicies (add in production)
- No resource quotas (add in production)

**For production:**
1. Use Sealed Secrets or external secret management (Vault)
2. Push images to container registry
3. Set up Ingress with cert-manager for HTTPS
4. Add NetworkPolicies to restrict pod-to-pod traffic
5. Set ResourceQuotas and LimitRanges
6. Enable Pod Security Standards
7. Use managed PostgreSQL service instead of in-cluster
