from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Room
from app.schemas.schemas import Room as RoomSchema, RoomCreate, RoomUpdate

router = APIRouter()

@router.get("/", response_model=List[RoomSchema])
def get_rooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all rooms/storage units"""
    rooms = db.query(Room).offset(skip).limit(limit).all()
    return rooms

@router.get("/{room_id}", response_model=RoomSchema)
def get_room(room_id: int, db: Session = Depends(get_db)):
    """Get a single room by ID"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.post("/", response_model=RoomSchema, status_code=201)
def create_room(room: RoomCreate, db: Session = Depends(get_db)):
    """Create a new room/storage unit"""
    db_room = Room(**room.model_dump())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@router.put("/{room_id}", response_model=RoomSchema)
def update_room(room_id: int, room_update: RoomUpdate, db: Session = Depends(get_db)):
    """Update a room"""
    db_room = db.query(Room).filter(Room.id == room_id).first()
    if not db_room:
        raise HTTPException(status_code=404, detail="Room not found")

    update_data = room_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_room, field, value)

    db.commit()
    db.refresh(db_room)
    return db_room

@router.delete("/{room_id}", status_code=204)
def delete_room(room_id: int, db: Session = Depends(get_db)):
    """Delete a room"""
    db_room = db.query(Room).filter(Room.id == room_id).first()
    if not db_room:
        raise HTTPException(status_code=404, detail="Room not found")

    db.delete(db_room)
    db.commit()
    return None
