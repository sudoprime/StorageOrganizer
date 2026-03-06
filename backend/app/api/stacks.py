from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.core.database import get_db
from app.models.models import Stack, Bin
from app.schemas.schemas import Stack as StackSchema, StackCreate, StackUpdate, StackWithBins

router = APIRouter()

@router.get("/", response_model=List[StackWithBins])
def get_stacks(room_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all stacks in a room with their bins"""
    return db.query(Stack).options(joinedload(Stack.bins), joinedload(Stack.layout_slots)).filter(Stack.room_id == room_id).offset(skip).limit(limit).all()

@router.get("/{stack_id}", response_model=StackWithBins)
def get_stack(stack_id: int, db: Session = Depends(get_db)):
    """Get a stack with its bins"""
    stack = db.query(Stack).options(joinedload(Stack.bins), joinedload(Stack.layout_slots)).filter(Stack.id == stack_id).first()
    if not stack:
        raise HTTPException(status_code=404, detail="Stack not found")
    return stack

@router.post("/", response_model=StackSchema, status_code=201)
def create_stack(stack: StackCreate, db: Session = Depends(get_db)):
    """Create a new stack (floor position) in a room"""
    db_stack = Stack(**stack.model_dump())
    db.add(db_stack)
    db.commit()
    db.refresh(db_stack)
    return db_stack

@router.put("/{stack_id}", response_model=StackSchema)
def update_stack(stack_id: int, stack_update: StackUpdate, db: Session = Depends(get_db)):
    """Update a stack"""
    db_stack = db.query(Stack).filter(Stack.id == stack_id).first()
    if not db_stack:
        raise HTTPException(status_code=404, detail="Stack not found")

    update_data = stack_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_stack, field, value)

    db.commit()
    db.refresh(db_stack)
    return db_stack

@router.delete("/{stack_id}", status_code=204)
def delete_stack(stack_id: int, db: Session = Depends(get_db)):
    """Delete a stack and unassign its bins (bins are NOT deleted)"""
    db_stack = db.query(Stack).filter(Stack.id == stack_id).first()
    if not db_stack:
        raise HTTPException(status_code=404, detail="Stack not found")

    # Unassign bins so they survive the cascade delete
    db.query(Bin).filter(Bin.stack_id == stack_id).update(
        {Bin.stack_id: None, Bin.bottom_id: None},
        synchronize_session="fetch"
    )

    db.delete(db_stack)
    db.commit()
    return None
