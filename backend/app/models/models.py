from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Room(Base):
    """Storage unit / room / space"""
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # "10x10 Storage Unit", "Garage", etc.
    dimensions_length = Column(Float)  # feet
    dimensions_width = Column(Float)  # feet
    max_stack_height = Column(Integer, default=6)
    grid_rows = Column(Integer, default=1)
    grid_cols = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    notes = Column(Text)
    photo_url = Column(String)

    # Relationships
    stacks = relationship("Stack", back_populates="room", cascade="all, delete-orphan")

class Stack(Base):
    """A floor position in a room that holds a vertical column of bins"""
    __tablename__ = "stacks"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    position = Column(String, nullable=False)  # Grid coordinate, e.g. "A3", "B2"
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    room = relationship("Room", back_populates="stacks")
    layout_slots = relationship("LayoutSlot", back_populates="stack", cascade="all, delete-orphan")
    bins = relationship("Bin", back_populates="stack", cascade="all, delete-orphan")


class LayoutSlot(Base):
    """Blueprint slot defining what bin type goes at a position in a stack"""
    __tablename__ = "layout_slots"

    id = Column(Integer, primary_key=True, index=True)
    stack_id = Column(Integer, ForeignKey("stacks.id"), nullable=False)
    bin_type_id = Column(Integer, ForeignKey("bin_types.id"), nullable=False)
    orientation = Column(String, default="updown")  # "updown" or "leftright"
    offset_x = Column(Float, default=0.5)  # 0=left, 0.5=center, 1=right
    offset_y = Column(Float, default=0.5)  # 0=top, 0.5=center, 1=bottom
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    stack = relationship("Stack", back_populates="layout_slots")
    bin_type = relationship("BinType")

class BinType(Base):
    """A type/template for bins with standard dimensions"""
    __tablename__ = "bin_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # "19gal Tote", "Plano 3700"
    width_mm = Column(Float, nullable=False)   # x
    depth_mm = Column(Float, nullable=False)   # y
    height_mm = Column(Float, nullable=False)  # z
    image_data = Column(Text, nullable=True)  # base64 data URI
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    bins = relationship("Bin", back_populates="bin_type")


class Bin(Base):
    """Storage bin/container - can be nested via parent_id"""
    __tablename__ = "bins"

    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(String, unique=True, nullable=False, index=True)  # "BIN-A3F2" - prefixed 4-char hash, used as QR code data
    name = Column(String, nullable=False)  # "Kitchen Gadgets", "Red Plano Box - Props"
    size = Column(String)  # legacy free-text size field
    bin_type_id = Column(Integer, ForeignKey("bin_types.id"), nullable=True)

    # Nesting - top-level bins have parent_id=NULL
    parent_id = Column(Integer, ForeignKey("bins.id"), nullable=True)

    # Location - top-level bins are placed in a stack
    stack_id = Column(Integer, ForeignKey("stacks.id"), nullable=True)
    bottom_id = Column(Integer, ForeignKey("bins.id"), nullable=True)  # bin this sits on (NULL = floor/bottom)

    # Grid layout
    orientation = Column(String, default="updown")  # "updown" or "leftright"
    offset_x = Column(Float, default=0.5)  # 0=left, 0.5=center, 1=right within cell
    offset_y = Column(Float, default=0.5)  # 0=top, 0.5=center, 1=bottom within cell

    # Metadata
    weight_estimate = Column(String)  # "Light", "Medium", "Heavy"
    is_fragile = Column(Boolean, default=False)
    color = Column(String)  # "Red", "Blue", "Clear"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    notes = Column(Text)
    photo_url = Column(String)

    # Relationships
    bin_type = relationship("BinType", back_populates="bins")
    stack = relationship("Stack", back_populates="bins")
    parent = relationship("Bin", back_populates="children", remote_side=[id], foreign_keys=[parent_id])
    children = relationship("Bin", back_populates="parent", cascade="all, delete-orphan", foreign_keys="[Bin.parent_id]")
    bottom = relationship("Bin", remote_side=[id], foreign_keys=[bottom_id])
    items = relationship("Item", back_populates="bin", cascade="all, delete-orphan")
    images = relationship("Image", back_populates="bin", cascade="all, delete-orphan")

class Image(Base):
    """Uploaded image attached to a bin or item"""
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    path = Column(String, nullable=False)  # relative path under uploads dir
    bin_id = Column(Integer, ForeignKey("bins.id", ondelete="CASCADE"), nullable=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    bin = relationship("Bin", back_populates="images")
    item = relationship("Item", back_populates="images")


class Item(Base):
    """Individual item in inventory"""
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)  # "Vitamix Blender", "5 inch Props"
    quantity = Column(Integer, default=1)
    category = Column(String, index=True)  # "Appliance", "Electronics", "FPV", "Tool", etc.

    # Location
    bin_id = Column(Integer, ForeignKey("bins.id"), nullable=False)

    # Details
    description = Column(Text)
    notes = Column(Text)
    photo_url = Column(String)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    bin = relationship("Bin", back_populates="items")
    images = relationship("Image", back_populates="item", cascade="all, delete-orphan")
