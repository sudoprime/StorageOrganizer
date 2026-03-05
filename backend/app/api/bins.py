import random
import string
from io import BytesIO
import base64

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import qrcode

from app.core.database import get_db
from app.models.models import Bin, Item
from app.schemas.schemas import Bin as BinSchema, BinCreate, BinUpdate, BinWithContents, Item as ItemSchema

router = APIRouter()

BIN_ID_PREFIX = "BIN"

def _generate_hash() -> str:
    """Generate a 4-character hash: Letter-Number-Letter-Number (e.g., A3F2)"""
    return ''.join([
        random.choice(string.ascii_uppercase),
        str(random.randint(1, 9)),
        random.choice(string.ascii_uppercase),
        str(random.randint(1, 9))
    ])

def _generate_unique_bin_id(db: Session) -> str:
    """Generate a BIN-XXXX id that doesn't collide with existing ones."""
    for _ in range(100):
        bin_id = f"{BIN_ID_PREFIX}-{_generate_hash()}"
        if not db.query(Bin).filter(Bin.bin_id == bin_id).first():
            return bin_id
    raise HTTPException(status_code=500, detail="Failed to generate unique bin ID")

@router.get("/", response_model=List[BinSchema])
def get_bins(
    skip: int = 0,
    limit: int = 100,
    stack_id: Optional[int] = None,
    parent_id: Optional[int] = None,
    top_level: Optional[bool] = None,
    unassigned: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get bins. Filter by stack, parent, top-level only, or unassigned."""
    query = db.query(Bin)
    if stack_id is not None:
        query = query.filter(Bin.stack_id == stack_id)
    if parent_id is not None:
        query = query.filter(Bin.parent_id == parent_id)
    if top_level:
        query = query.filter(Bin.parent_id.is_(None))
    if unassigned:
        query = query.filter(Bin.stack_id.is_(None), Bin.parent_id.is_(None))
    return query.offset(skip).limit(limit).all()

@router.get("/{bin_id}", response_model=BinWithContents)
def get_bin(bin_id: str, db: Session = Depends(get_db)):
    """Get a single bin by its bin_id (e.g. BIN-A3F2). Returns items and child bins."""
    bin = db.query(Bin).filter(Bin.bin_id == bin_id).first()
    if not bin:
        raise HTTPException(status_code=404, detail="Bin not found")
    return bin

@router.post("/", response_model=BinSchema, status_code=201)
def create_bin(bin: BinCreate, db: Session = Depends(get_db)):
    """Create a new bin. A unique BIN-XXXX id is auto-generated.

    Top-level bins (no parent_id) must have stack_id.
    Child bins (with parent_id) must NOT have stack_id or bottom_id.
    """
    if bin.parent_id is not None and (bin.stack_id is not None or bin.bottom_id is not None):
        raise HTTPException(status_code=400, detail="Child bins cannot have stack_id or bottom_id (location is inherited from parent)")

    bin_id = _generate_unique_bin_id(db)
    db_bin = Bin(**bin.model_dump(), bin_id=bin_id)
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

    # If changing bin_id, check uniqueness
    new_bin_id = update_data.get('bin_id')
    if new_bin_id and new_bin_id != db_bin.bin_id:
        existing = db.query(Bin).filter(Bin.bin_id == new_bin_id).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Bin ID '{new_bin_id}' already exists")

    for field, value in update_data.items():
        setattr(db_bin, field, value)

    db.commit()
    db.refresh(db_bin)
    return db_bin

@router.delete("/{bin_id}", status_code=204)
def delete_bin(bin_id: str, db: Session = Depends(get_db)):
    """Delete a bin and all its contents (items + child bins)"""
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

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(bin.bin_id)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()

    return {
        "bin_id": bin.bin_id,
        "qr_code_base64": f"data:image/png;base64,{img_str}"
    }

@router.get("/{bin_id}/items", response_model=List[ItemSchema])
def get_bin_items(bin_id: str, db: Session = Depends(get_db)):
    """Get all items directly in this bin (not in child bins)"""
    bin = db.query(Bin).filter(Bin.bin_id == bin_id).first()
    if not bin:
        raise HTTPException(status_code=404, detail="Bin not found")

    return db.query(Item).filter(Item.bin_id == bin.id).all()
