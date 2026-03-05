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

1. **Generate QR labels** for each container
2. **Scan the code** with your phone to add/view items
3. **Search** across all containers to find what you need
4. **Track locations** within your storage unit
5. **Attach photos** for visual reference

Built with a real use case: organizing a household move into a 10×10 storage unit with 100+ containers. See [BINS.md](./BINS.md) for the container system details.

## Features

### MVP (In Development)

- [ ] QR code generation and printing
- [ ] Mobile-friendly QR scanning (PWA with camera access)
- [ ] Container management (create, edit, delete)
- [ ] Item inventory (add items to containers, bulk operations)
- [ ] Search and filtering across all items
- [ ] Photo attachments for items
- [ ] Location tracking (storage unit, stack position, row/column)
- [ ] Responsive web interface

### Future Enhancements

- [ ] Multi-user support (family members, moving crews)
- [ ] Packing suggestions (weight distribution, fragile items)
- [ ] Analytics (utilization, most-accessed containers)
- [ ] Import/export (CSV, JSON)
- [ ] Label templates (different sizes, formats)
- [ ] Barcode support (in addition to QR)
- [ ] Mobile app (native iOS/Android if commercial traction)
- [ ] Multi-tenant SaaS version

## Tech Stack

**Frontend:**
- React or Vue.js (TBD)
- PWA capabilities (offline support, installable)
- QR scanner library (html5-qrcode or similar)
- Responsive design (mobile-first)

**Backend:**
- FastAPI (Python)
- PostgreSQL database
- RESTful API

**Infrastructure:**
- Docker for development/deployment
- (Production hosting TBD)

## Project Structure

```
StorageOrganizer/
├── backend/          # FastAPI application
│   ├── app/
│   ├── models/
│   ├── routes/
│   └── requirements.txt
├── frontend/         # React/Vue application
│   ├── src/
│   ├── public/
│   └── package.json
├── docs/            # Documentation
├── BINS.md          # Container system reference
└── README.md        # This file
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker (optional, recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/StorageOrganizer.git
cd StorageOrganizer

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Database setup
# (Instructions coming soon)
```

### Development

```bash
# Run backend (from backend/)
uvicorn app.main:app --reload

# Run frontend (from frontend/)
npm run dev
```

## Use Cases

### Personal
- Household moves with intermediate storage
- Long-term storage organization
- Garage/basement/attic inventory
- Estate management

### Commercial
- Moving companies (client inventory tracking)
- Self-storage facilities (customer service)
- Warehouse management (small-scale)
- Estate sale organizers

## Roadmap

**Phase 1: MVP for Personal Use** (Current)
- Core inventory features
- QR scanning
- Single-user deployment

**Phase 2: Enhanced Features**
- Photo management
- Advanced search
- Location visualization

**Phase 3: Multi-User & Sharing**
- User authentication
- Shared inventories
- Access controls

**Phase 4: Commercial SaaS** (If validated)
- Multi-tenant architecture
- Subscription billing
- White-label options
- Mobile apps

## Contributing

This project is currently in early development for personal use. Contributions, ideas, and feedback are welcome!

## License

(TBD - likely MIT for open source release)

## Contact

(Your contact information)

---

**Note:** This is an active project under development. The tech stack and features may evolve as the project progresses. See [BINS.md](./BINS.md) for detailed information about the container system being used.
