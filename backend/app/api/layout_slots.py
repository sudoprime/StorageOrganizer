from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.models import LayoutSlot, Stack
from app.schemas.schemas import (
    LayoutSlot as LayoutSlotSchema,
    LayoutSlotCreate,
    LayoutSlotUpdate,
)

router = APIRouter()


@router.get("/", response_model=List[LayoutSlotSchema])
def get_layout_slots(stack_id: int, db: Session = Depends(get_db)):
    """Get all layout slots for a stack"""
    return db.query(LayoutSlot).filter(LayoutSlot.stack_id == stack_id).all()


@router.post("/", response_model=LayoutSlotSchema, status_code=201)
def create_layout_slot(slot: LayoutSlotCreate, db: Session = Depends(get_db)):
    """Create a new layout slot in a stack"""
    stack = db.query(Stack).filter(Stack.id == slot.stack_id).first()
    if not stack:
        raise HTTPException(status_code=404, detail="Stack not found")

    db_slot = LayoutSlot(**slot.model_dump())
    db.add(db_slot)
    db.commit()
    db.refresh(db_slot)
    return db_slot


@router.put("/{slot_id}", response_model=LayoutSlotSchema)
def update_layout_slot(slot_id: int, slot_update: LayoutSlotUpdate, db: Session = Depends(get_db)):
    """Update a layout slot"""
    db_slot = db.query(LayoutSlot).filter(LayoutSlot.id == slot_id).first()
    if not db_slot:
        raise HTTPException(status_code=404, detail="Layout slot not found")

    update_data = slot_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_slot, field, value)

    db.commit()
    db.refresh(db_slot)
    return db_slot


@router.delete("/{slot_id}", status_code=204)
def delete_layout_slot(slot_id: int, db: Session = Depends(get_db)):
    """Delete a layout slot"""
    db_slot = db.query(LayoutSlot).filter(LayoutSlot.id == slot_id).first()
    if not db_slot:
        raise HTTPException(status_code=404, detail="Layout slot not found")

    db.delete(db_slot)
    db.commit()
    return None
