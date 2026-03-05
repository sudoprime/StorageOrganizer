# StorageOrganizer

QR code-based inventory management system. k3s Kubernetes deployment on local machine.

## Stack

- **Backend:** FastAPI + SQLAlchemy + Alembic + PostgreSQL
- **Frontend:** Vite + React + Tailwind CSS + shadcn/ui
- **Infra:** k3s, Traefik ingress, Docker multi-stage builds

## Build & Deploy

```bash
make              # build + import + deploy (default target)
make build        # Docker build backend + frontend
make import       # docker save | k3s ctr images import
make deploy       # kubectl apply via kubernetes/apply-all.sh
make logs         # follow all service logs
```

After code changes: `make build && make import && kubectl rollout restart deployment/backend deployment/frontend -n storage-organizer`

## Key Documentation

- **[docs/rooms-grid.md](docs/rooms-grid.md)** — Rooms grid UI architecture, sizing algorithm, drag system, and data model. **Read this before modifying the rooms/grid code. Update it when making changes.**

## Alembic Migrations

Migrations auto-run on backend startup. To generate new migrations:

1. Build and deploy with model changes
2. `kubectl exec -n storage-organizer <pod> -- alembic revision --autogenerate -m "description"`
3. `kubectl cp` the migration file back to `backend/alembic/versions/`
4. Rebuild and redeploy

`backend/alembic/env.py` always uses `settings.DATABASE_URL` (not alembic.ini).

## Conventions

- Images stored as base64 data URIs in database (bin type photos)
- Bin IDs are auto-generated hashes: `BIN-A3F2` (letter-number-letter-number)
- All dimensions stored in mm internally, UI supports SAE/metric toggle
- Frontend uses `@/` path alias for imports (configured in vite.config.js)
