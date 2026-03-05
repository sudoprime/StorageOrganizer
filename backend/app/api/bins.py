from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Bin, Item, Container
from app.schemas.schemas import Bin as BinSchema, BinCreate, BinUpdate, BinWithItems
import qrcode
from io import BytesIO
import base64

router = APIRouter()

@router.get("/", response_model=List[BinSchema])
def get_bins(
    skip: int = 0,
    limit: int = 100,
    room_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all bins, optionally filtered by room"""
    query = db.query(Bin)
    if room_id:
        query = query.filter(Bin.room_id == room_id)
    bins = query.offset(skip).limit(limit).all()
    return bins

@router.get("/{bin_id}", response_model=BinWithItems)
def get_bin(bin_id: str, db: Session = Depends(get_db)):
    """Get a single bin by its bin_id (QR code)"""
    bin = db.query(Bin).filter(Bin.bin_id == bin_id).first()
    if not bin:
        raise HTTPException(status_code=404, detail="Bin not found")
    return bin

@router.post("/", response_model=BinSchema, status_code=201)
def create_bin(bin: BinCreate, db: Session = Depends(get_db)):
    """Create a new bin"""
    # Check if bin_id already exists
    existing = db.query(Bin).filter(Bin.bin_id == bin.bin_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bin ID already exists")

    # Auto-generate QR code if not provided
    qr_code = bin.qr_code or bin.bin_id

    db_bin = Bin(
        **bin.model_dump(exclude={'qr_code'}),
        qr_code=qr_code
    )
    db.add(db_bin)
    db.commit()
    db.refresh(db_bin)
    return db_bin

@router.put("/{bin_id}", response_model=BinSchema)
def update_bin(bin_id: str, bin_update: BinUpdate, db: Session = Depends(get_db)):
    """Update a bin"""
    db_bin = db.query(Bin).filter(Bin.bin_id == bin_id).first()
    if not db_bin:
        raise HTTPException(status_code=404, detail="Bin not found")

    update_data = bin_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_bin, field, value)

    db.commit()
    db.refresh(db_bin)
    return db_bin

@router.delete("/{bin_id}", status_code=204)
def delete_bin(bin_id: str, db: Session = Depends(get_db)):
    """Delete a bin and all its contents"""
    db_bin = db.query(Bin).filter(Bin.bin_id == bin_id).first()
    if not db_bin:
        raise HTTPException(status_code=404, detail="Bin not found")

    db.delete(db_bin)
    db.commit()
    return None

@router.get("/{bin_id}/qr-code")
def get_bin_qr_code(bin_id: str, size: int = Query(200, ge=100, le=1000), db: Session = Depends(get_db)):
    """Generate QR code image for a bin"""
    bin = db.query(Bin).filter(Bin.bin_id == bin_id).first()
    if not bin:
        raise HTTPException(status_code=404, detail="Bin not found")

    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(bin.qr_code)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # Convert to base64
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()

    return {
        "bin_id": bin.bin_id,
        "qr_code": bin.qr_code,
        "qr_code_base64": f"data:image/png;base64,{img_str}"
    }

@router.get("/{bin_id}/items", response_model=List)
def get_bin_items(bin_id: str, db: Session = Depends(get_db)):
    """Get all items in a bin (including items in sub-containers)"""
    bin = db.query(Bin).filter(Bin.bin_id == bin_id).first()
    if not bin:
        raise HTTPException(status_code=404, detail="Bin not found")

    items = db.query(Item).filter(Item.bin_id == bin.id).all()
    return items
