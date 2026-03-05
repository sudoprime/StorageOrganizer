from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Room Schemas
class RoomBase(BaseModel):
    name: str
    dimensions_length: Optional[float] = None
    dimensions_width: Optional[float] = None
    max_stack_height: Optional[int] = 6
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    dimensions_length: Optional[float] = None
    dimensions_width: Optional[float] = None
    max_stack_height: Optional[int] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class Room(RoomBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Bin Schemas
class BinBase(BaseModel):
    bin_id: str = Field(..., description="4-character hash ID")
    name: str
    size: Optional[str] = None
    room_id: Optional[int] = None
    grid_position: Optional[str] = None
    stack_level: Optional[int] = None
    location_description: Optional[str] = None
    weight_estimate: Optional[str] = None
    is_fragile: Optional[bool] = False
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class BinCreate(BinBase):
    qr_code: Optional[str] = None  # Auto-generated if not provided

class BinUpdate(BaseModel):
    name: Optional[str] = None
    size: Optional[str] = None
    room_id: Optional[int] = None
    grid_position: Optional[str] = None
    stack_level: Optional[int] = None
    location_description: Optional[str] = None
    weight_estimate: Optional[str] = None
    is_fragile: Optional[bool] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class Bin(BinBase):
    id: int
    qr_code: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BinWithItems(Bin):
    """Bin with nested items and containers"""
    items: List['Item'] = []
    containers: List['Container'] = []

# Container Schemas
class ContainerBase(BaseModel):
    container_id: str = Field(..., description="5-character hash ID")
    name: str
    bin_id: int
    container_type: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None

class ContainerCreate(ContainerBase):
    qr_code: Optional[str] = None  # Auto-generated if not provided

class ContainerUpdate(BaseModel):
    name: Optional[str] = None
    container_type: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None

class Container(ContainerBase):
    id: int
    qr_code: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ContainerWithItems(Container):
    """Container with nested items"""
    items: List['Item'] = []

# Item Schemas
class ItemBase(BaseModel):
    name: str
    quantity: Optional[int] = 1
    category: Optional[str] = None
    bin_id: int
    container_id: Optional[int] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[int] = None
    category: Optional[str] = None
    bin_id: Optional[int] = None
    container_id: Optional[int] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class Item(ItemBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Search result schema
class SearchResult(BaseModel):
    item: Item
    bin: Bin
    container: Optional[Container] = None
    room: Optional[Room] = None

# QR Code generation request
class QRCodeRequest(BaseModel):
    data: str
    size: Optional[int] = 200  # pixels

class QRCodeResponse(BaseModel):
    qr_code_base64: str
    data: str
