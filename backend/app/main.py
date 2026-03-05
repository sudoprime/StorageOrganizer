from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import bins, containers, items, rooms

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

# Include routers
app.include_router(rooms.router, prefix="/api/rooms", tags=["rooms"])
app.include_router(bins.router, prefix="/api/bins", tags=["bins"])
app.include_router(containers.router, prefix="/api/containers", tags=["containers"])
app.include_router(items.router, prefix="/api/items", tags=["items"])

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
