import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.models import BinType
from app.schemas.schemas import BinType as BinTypeSchema, BinTypeCreate, BinTypeUpdate

router = APIRouter()


@router.get("/", response_model=List[BinTypeSchema])
def get_bin_types(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(BinType).offset(skip).limit(limit).all()


@router.get("/{bin_type_id}", response_model=BinTypeSchema)
def get_bin_type(bin_type_id: int, db: Session = Depends(get_db)):
    bt = db.query(BinType).filter(BinType.id == bin_type_id).first()
    if not bt:
        raise HTTPException(status_code=404, detail="Bin type not found")
    return bt


@router.post("/", response_model=BinTypeSchema, status_code=201)
def create_bin_type(bin_type: BinTypeCreate, db: Session = Depends(get_db)):
    existing = db.query(BinType).filter(BinType.name == bin_type.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bin type with this name already exists")
    db_bt = BinType(**bin_type.model_dump())
    db.add(db_bt)
    db.commit()
    db.refresh(db_bt)
    return db_bt


@router.put("/{bin_type_id}", response_model=BinTypeSchema)
def update_bin_type(bin_type_id: int, update: BinTypeUpdate, db: Session = Depends(get_db)):
    db_bt = db.query(BinType).filter(BinType.id == bin_type_id).first()
    if not db_bt:
        raise HTTPException(status_code=404, detail="Bin type not found")
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(db_bt, field, value)
    db.commit()
    db.refresh(db_bt)
    return db_bt


@router.post("/{bin_type_id}/image", response_model=BinTypeSchema)
async def upload_bin_type_image(bin_type_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_bt = db.query(BinType).filter(BinType.id == bin_type_id).first()
    if not db_bt:
        raise HTTPException(status_code=404, detail="Bin type not found")
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5MB")
    b64 = base64.b64encode(contents).decode()
    db_bt.image_data = f"data:{file.content_type};base64,{b64}"
    db.commit()
    db.refresh(db_bt)
    return db_bt


@router.delete("/{bin_type_id}/image", response_model=BinTypeSchema)
def delete_bin_type_image(bin_type_id: int, db: Session = Depends(get_db)):
    db_bt = db.query(BinType).filter(BinType.id == bin_type_id).first()
    if not db_bt:
        raise HTTPException(status_code=404, detail="Bin type not found")
    db_bt.image_data = None
    db.commit()
    db.refresh(db_bt)
    return db_bt


@router.delete("/{bin_type_id}", status_code=204)
def delete_bin_type(bin_type_id: int, db: Session = Depends(get_db)):
    db_bt = db.query(BinType).filter(BinType.id == bin_type_id).first()
    if not db_bt:
        raise HTTPException(status_code=404, detail="Bin type not found")
    db.delete(db_bt)
    db.commit()
    return None
