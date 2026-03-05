from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# BinType Schemas
class BinTypeBase(BaseModel):
    name: str
    width_mm: float
    depth_mm: float
    height_mm: float
    image_data: Optional[str] = None

class BinTypeCreate(BinTypeBase):
    pass

class BinTypeUpdate(BaseModel):
    name: Optional[str] = None
    width_mm: Optional[float] = None
    depth_mm: Optional[float] = None
    height_mm: Optional[float] = None
    image_data: Optional[str] = None

class BinType(BinTypeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Room Schemas
class RoomBase(BaseModel):
    name: str
    dimensions_length: Optional[float] = None
    dimensions_width: Optional[float] = None
    max_stack_height: Optional[int] = 6
    grid_rows: Optional[int] = 1
    grid_cols: Optional[int] = 1
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    dimensions_length: Optional[float] = None
    dimensions_width: Optional[float] = None
    max_stack_height: Optional[int] = None
    grid_rows: Optional[int] = None
    grid_cols: Optional[int] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class Room(RoomBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Stack Schemas
class StackBase(BaseModel):
    room_id: int
    position: str = Field(description="Grid coordinate, e.g. A3, B2")
    notes: Optional[str] = None

class StackCreate(StackBase):
    pass

class StackUpdate(BaseModel):
    position: Optional[str] = None
    notes: Optional[str] = None

class Stack(StackBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# LayoutSlot Schemas
class LayoutSlotBase(BaseModel):
    stack_id: int
    bin_type_id: int
    orientation: Optional[str] = "updown"
    offset_x: Optional[float] = 0.5
    offset_y: Optional[float] = 0.5

class LayoutSlotCreate(LayoutSlotBase):
    pass

class LayoutSlotUpdate(BaseModel):
    bin_type_id: Optional[int] = None
    orientation: Optional[str] = None
    offset_x: Optional[float] = None
    offset_y: Optional[float] = None

class LayoutSlot(LayoutSlotBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StackWithBins(Stack):
    """Stack with its bins and layout slots"""
    bins: List['Bin'] = []
    layout_slots: List[LayoutSlot] = []

# Bin Schemas
class BinBase(BaseModel):
    name: str
    size: Optional[str] = None
    bin_type_id: Optional[int] = None
    parent_id: Optional[int] = None
    stack_id: Optional[int] = None
    bottom_id: Optional[int] = None
    orientation: Optional[str] = "updown"
    offset_x: Optional[float] = 0.5
    offset_y: Optional[float] = 0.5
    weight_estimate: Optional[str] = None
    is_fragile: Optional[bool] = False
    color: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class BinCreate(BinBase):
    pass

class BinUpdate(BaseModel):
    name: Optional[str] = None
    bin_id: Optional[str] = None
    size: Optional[str] = None
    bin_type_id: Optional[int] = None
    parent_id: Optional[int] = None
    stack_id: Optional[int] = None
    bottom_id: Optional[int] = None
    orientation: Optional[str] = None
    offset_x: Optional[float] = None
    offset_y: Optional[float] = None
    weight_estimate: Optional[str] = None
    is_fragile: Optional[bool] = None
    color: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class Bin(BinBase):
    id: int
    bin_id: str = Field(description="Prefixed hash ID, e.g. BIN-A3F2")
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BinWithContents(Bin):
    """Bin with nested items and child bins"""
    items: List['Item'] = []
    children: List['Bin'] = []

# Item Schemas
class ItemBase(BaseModel):
    name: str
    quantity: Optional[int] = 1
    category: Optional[str] = None
    bin_id: int
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
    description: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class Item(ItemBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Image Schemas
class ImageSchema(BaseModel):
    id: int
    filename: str
    url: str
    bin_id: Optional[int] = None
    item_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

StackWithBins.model_rebuild()
BinWithContents.model_rebuild()

# Search result schema
class SearchResult(BaseModel):
    item: Item
    bin: Bin
    stack: Optional[Stack] = None
    room: Optional[Room] = None
