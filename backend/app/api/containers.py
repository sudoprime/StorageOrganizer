from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Container
from app.schemas.schemas import Container as ContainerSchema, ContainerCreate, ContainerUpdate, ContainerWithItems

router = APIRouter()

@router.get("/", response_model=List[ContainerSchema])
def get_containers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all sub-containers"""
    containers = db.query(Container).offset(skip).limit(limit).all()
    return containers

@router.get("/{container_id}", response_model=ContainerWithItems)
def get_container(container_id: str, db: Session = Depends(get_db)):
    """Get a single container by its container_id"""
    container = db.query(Container).filter(Container.container_id == container_id).first()
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    return container

@router.post("/", response_model=ContainerSchema, status_code=201)
def create_container(container: ContainerCreate, db: Session = Depends(get_db)):
    """Create a new sub-container"""
    # Check if container_id already exists
    existing = db.query(Container).filter(Container.container_id == container.container_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Container ID already exists")

    # Auto-generate QR code if not provided
    qr_code = container.qr_code or container.container_id

    db_container = Container(
        **container.model_dump(exclude={'qr_code'}),
        qr_code=qr_code
    )
    db.add(db_container)
    db.commit()
    db.refresh(db_container)
    return db_container

@router.put("/{container_id}", response_model=ContainerSchema)
def update_container(container_id: str, container_update: ContainerUpdate, db: Session = Depends(get_db)):
    """Update a container"""
    db_container = db.query(Container).filter(Container.container_id == container_id).first()
    if not db_container:
        raise HTTPException(status_code=404, detail="Container not found")

    update_data = container_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_container, field, value)

    db.commit()
    db.refresh(db_container)
    return db_container

@router.delete("/{container_id}", status_code=204)
def delete_container(container_id: str, db: Session = Depends(get_db)):
    """Delete a container and all its items"""
    db_container = db.query(Container).filter(Container.container_id == container_id).first()
    if not db_container:
        raise HTTPException(status_code=404, detail="Container not found")

    db.delete(db_container)
    db.commit()
    return None
