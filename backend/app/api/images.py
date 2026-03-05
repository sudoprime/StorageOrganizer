import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.config import settings
from app.models.models import Image

router = APIRouter()

UPLOADS_DIR = Path(os.environ.get("UPLOADS_DIR", "/data/uploads"))
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def _ensure_uploads_dir():
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def _image_to_dict(img: Image) -> dict:
    return {
        "id": img.id,
        "filename": img.filename,
        "url": f"/uploads/{img.path}",
        "bin_id": img.bin_id,
        "item_id": img.item_id,
        "created_at": img.created_at,
    }


@router.get("/")
def list_images(
    bin_id: Optional[int] = None,
    item_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """List images for a bin or item"""
    query = db.query(Image)
    if bin_id is not None:
        query = query.filter(Image.bin_id == bin_id)
    if item_id is not None:
        query = query.filter(Image.item_id == item_id)
    images = query.order_by(Image.created_at).all()
    return [_image_to_dict(img) for img in images]


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    bin_id: Optional[int] = Query(None),
    item_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Upload an image and attach to a bin or item"""
    if not bin_id and not item_id:
        raise HTTPException(status_code=400, detail="Must specify bin_id or item_id")

    # Validate extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed")

    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    # Save to disk
    _ensure_uploads_dir()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOADS_DIR / unique_name
    file_path.write_bytes(contents)

    # Save to DB
    db_image = Image(
        filename=file.filename,
        path=unique_name,
        bin_id=bin_id,
        item_id=item_id,
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)

    return _image_to_dict(db_image)


@router.delete("/{image_id}", status_code=204)
def delete_image(image_id: int, db: Session = Depends(get_db)):
    """Delete an image"""
    db_image = db.query(Image).filter(Image.id == image_id).first()
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Delete file from disk
    file_path = UPLOADS_DIR / db_image.path
    if file_path.exists():
        file_path.unlink()

    db.delete(db_image)
    db.commit()
    return None
