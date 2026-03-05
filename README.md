# StorageOrganizer

A QR code-based inventory management system for tracking items in storage containers. Designed for household moves, long-term storage, and warehouse organization.

## The Problem

Moving your household into storage is chaotic. You pack dozens (or hundreds) of containers, stack them in a storage unit, and then can't find anything when you need it. Traditional labeling methods break down at scale:

- **Handwritten labels** are time-consuming and hard to search
- **Spreadsheets** get out of sync with reality
- **Memory** fails when you have 100+ identical-looking bins
- **"I think it's in that stack somewhere"** becomes your most common phrase

## The Solution

StorageOrganizer uses QR codes to create a digital inventory system:

1. **Generate QR labels** for each bin (auto-generated `BIN-A3F2` style IDs)
2. **Scan the code** with your phone to add/view items
3. **Search** across all bins to find what you need
4. **Track locations** by room, stack position, and level
5. **Attach photos** for visual reference

Built with a real use case: organizing a household move into a 10x10 storage unit with 100+ containers. See [BINS.md](./BINS.md) for the container system details.

## Data Model

```
Room (storage unit, garage, etc.)
  └── Stack (floor position in the room, e.g. "A3")
        └── Bin (physical container at a level in the stack)
              ├── Item (loose in bin)
              └── Bin (nested sub-bin, e.g. a Plano box inside a Sterilite tote)
                    └── Item
```

- **Room** - A physical space with dimensions (e.g. "10x10 Storage Unit")
- **Stack** - A floor position in a room identified by a grid coordinate (e.g. "A3", "B2"). Holds a vertical column of bins.
- **Bin** - Any physical container, from a 27-gallon Sterilite tote to a small Plano organizer box. Bins can nest inside other bins via `parent_id`. Each bin gets an auto-generated `BIN-XXXX` ID used as QR code data.
- **Item** - An individual thing stored in a bin.

### QR Code IDs

Every bin gets a unique ID in the format `BIN-A3F2` (prefix + 4-character hash). This ID is:
- Auto-generated on bin creation with collision checking
- Stored as the QR code data (just the ID, not a URL — so it survives hosting changes)
- Used as the lookup key in the API (`GET /api/bins/BIN-A3F2`)

### Location Rules

- **Top-level bins** (no parent) must be assigned to a stack with a level (1 = bottom)
- **Child bins** (nested inside a parent) inherit their location from the parent — they don't have their own stack/level
- Multiple bins can share the same level in a stack (e.g. two small bins side-by-side on top of one large bin)

## Features

### MVP (In Development)

- [x] Bin management with auto-generated QR IDs
- [x] Nested bins (bins inside bins, arbitrary depth)
- [x] Stack-based location tracking (room > stack position > level)
- [x] Item inventory (add items to bins)
- [x] Search across all items with location context
- [x] QR code generation (base64 PNG)
- [x] RESTful API with full CRUD
- [ ] Mobile-friendly QR scanning (PWA with camera access)
- [ ] Photo attachments for items
- [ ] Responsive web interface (frontend is scaffolded, pages are stubs)

### Future Enhancements

- [ ] Spatial grid view (drag-and-drop bin placement)
- [ ] Multi-user support (family members, moving crews)
- [ ] Packing suggestions (weight distribution, fragile items)
- [ ] Import/export (CSV, JSON)
- [ ] Label printing integration (Brother PT-E560BTVP)
- [ ] Mobile app (native iOS/Android if commercial traction)

## Tech Stack

**Frontend:**
- React 18
- PWA capabilities (planned)
- html5-qrcode + qrcode.react (installed, not yet wired up)

**Backend:**
- FastAPI (Python)
- PostgreSQL
- SQLAlchemy 2.x + Alembic migrations

**Infrastructure:**
- Docker images for backend and frontend
- Kubernetes deployment (namespace, ConfigMaps, Secrets, PV/PVC, health checks)

## Project Structure

```
StorageOrganizer/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── api/          # Route handlers (rooms, stacks, bins, items)
│   │   ├── core/         # Config and database
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── main.py
│   ├── scripts/          # Utility scripts (generate_hashes.py)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/             # React application
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service layer
│   │   ├── App.js
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
├── kubernetes/           # Kubernetes manifests
├── BINS.md               # Container system reference (Sterilite selection)
├── HARDWARE.md           # Label printer and hardware decisions
├── UI_DESIGN.md          # UI/UX design doc (spatial grid vision)
├── MARKET_RESEARCH.md    # Commercial viability analysis
├── SETUP.md              # Kubernetes setup and API reference
└── README.md             # This file
```

## Getting Started

See [SETUP.md](./SETUP.md) for full Kubernetes deployment instructions.

### Quick Local Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm start
```

Requires a running PostgreSQL instance. Set `DATABASE_URL` in your environment or `.env` file.

## Use Cases

### Personal
- Household moves with intermediate storage
- Long-term storage organization
- Garage/basement/attic inventory

### Commercial
- Moving companies (client inventory tracking)
- Self-storage facilities (customer service)
- Warehouse management (small-scale)

## Roadmap

**Phase 1: MVP for Personal Use** (Current)
- Core inventory features
- QR scanning
- Single-user deployment

**Phase 2: Enhanced Features**
- Photo management
- Spatial grid view
- Label printing

**Phase 3: Multi-User & Sharing**
- User authentication
- Shared inventories
- Access controls

## License

(TBD - likely MIT for open source release)
