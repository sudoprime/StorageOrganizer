from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Item, Bin, Stack
from app.schemas.schemas import Item as ItemSchema, ItemCreate, ItemUpdate, SearchResult

router = APIRouter()

@router.get("/", response_model=List[ItemSchema])
def get_items(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all items, optionally filtered by category"""
    query = db.query(Item)
    if category:
        query = query.filter(Item.category == category)
    return query.offset(skip).limit(limit).all()

@router.get("/count")
def count_items(category: Optional[str] = None, db: Session = Depends(get_db)):
    """Get total item count"""
    query = db.query(Item)
    if category:
        query = query.filter(Item.category == category)
    return {"count": query.count()}


@router.get("/search", response_model=List[SearchResult])
def search_items(
    q: str = Query(..., min_length=1, description="Search query"),
    db: Session = Depends(get_db)
):
    """
    Search for items by name, description, or notes.
    Returns items with their bin, stack, and room information.
    """
    items = db.query(Item).options(
        joinedload(Item.bin).joinedload(Bin.stack).joinedload(Stack.room),
    ).filter(
        or_(
            Item.name.ilike(f"%{q}%"),
            Item.description.ilike(f"%{q}%"),
            Item.notes.ilike(f"%{q}%"),
            Item.category.ilike(f"%{q}%")
        )
    ).all()

    return [
        SearchResult(
            item=item,
            bin=item.bin,
            stack=item.bin.stack if item.bin else None,
            room=item.bin.stack.room if item.bin and item.bin.stack else None
        )
        for item in items
    ]

@router.get("/{item_id}", response_model=ItemSchema)
def get_item(item_id: int, db: Session = Depends(get_db)):
    """Get a single item by ID"""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.post("/", response_model=ItemSchema, status_code=201)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    """Create a new item"""
    db_item = Item(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{item_id}", response_model=ItemSchema)
def update_item(item_id: int, item_update: ItemUpdate, db: Session = Depends(get_db)):
    """Update an item"""
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    update_data = item_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)

    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    """Delete an item"""
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(db_item)
    db.commit()
    return None

@router.get("/categories/list", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    """Get list of all unique categories"""
    categories = db.query(Item.category).distinct().filter(Item.category.isnot(None)).all()
    return [cat[0] for cat in categories]
