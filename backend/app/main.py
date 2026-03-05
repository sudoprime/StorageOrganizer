import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from alembic.config import Config
from alembic import command
from app.core.config import settings
from app.api import bin_types, bins, images, items, layout_slots, rooms, stacks

logger = logging.getLogger(__name__)


def run_migrations():
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    command.upgrade(alembic_cfg, "head")
    logger.info("Database migrations complete")


run_migrations()

app = FastAPI(
    title="StorageOrganizer API",
    description="QR code-based inventory management system for storage containers",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads
uploads_dir = Path(os.environ.get("UPLOADS_DIR", "/data/uploads"))
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Include routers
app.include_router(bin_types.router, prefix="/api/bin-types", tags=["bin_types"])
app.include_router(rooms.router, prefix="/api/rooms", tags=["rooms"])
app.include_router(stacks.router, prefix="/api/stacks", tags=["stacks"])
app.include_router(layout_slots.router, prefix="/api/layout-slots", tags=["layout_slots"])
app.include_router(bins.router, prefix="/api/bins", tags=["bins"])
app.include_router(items.router, prefix="/api/items", tags=["items"])
app.include_router(images.router, prefix="/api/images", tags=["images"])

@app.get("/")
async def root():
    return {
        "message": "StorageOrganizer API",
        "version": "0.1.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
