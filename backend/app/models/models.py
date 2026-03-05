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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    notes = Column(Text)
    photo_url = Column(String)

    # Relationships
    bins = relationship("Bin", back_populates="room", cascade="all, delete-orphan")

class Bin(Base):
    """Main storage bin/container"""
    __tablename__ = "bins"

    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(String, unique=True, nullable=False, index=True)  # "A3F2" - 4-char hash
    qr_code = Column(String, unique=True, nullable=False)  # Usually same as bin_id
    name = Column(String, nullable=False)  # "Kitchen Gadgets", "FPV Drone Parts"
    size = Column(String)  # "10gal", "19gal", "27gal"

    # Location in room
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    grid_position = Column(String)  # "A3", "B2", etc.
    stack_level = Column(Integer)  # 1-6
    location_description = Column(String)  # "S3-L2" or free text

    # Metadata
    weight_estimate = Column(String)  # "Light", "Medium", "Heavy"
    is_fragile = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    notes = Column(Text)
    photo_url = Column(String)

    # Relationships
    room = relationship("Room", back_populates="bins")
    containers = relationship("Container", back_populates="bin", cascade="all, delete-orphan")
    items = relationship("Item", back_populates="bin", cascade="all, delete-orphan")

class Container(Base):
    """Sub-container inside a bin (Plano box, Sterilite box, etc.)"""
    __tablename__ = "containers"

    id = Column(Integer, primary_key=True, index=True)
    container_id = Column(String, unique=True, nullable=False, index=True)  # "X4K2P" - 5-char hash
    qr_code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)  # "Red Plano Box - Props"

    # Parent bin
    bin_id = Column(Integer, ForeignKey("bins.id"), nullable=False)

    # Container details
    container_type = Column(String)  # "plano_3700", "sterilite_6qt", "sterilite_1.5qt", etc.
    color = Column(String)  # "Red", "Blue", "Clear"

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    notes = Column(Text)

    # Relationships
    bin = relationship("Bin", back_populates="containers")
    items = relationship("Item", back_populates="container", cascade="all, delete-orphan")

class Item(Base):
    """Individual item in inventory"""
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)  # "Vitamix Blender", "5 inch Props"
    quantity = Column(Integer, default=1)
    category = Column(String, index=True)  # "Appliance", "Electronics", "FPV", "Tool", etc.

    # Location - can be in bin directly or in sub-container
    bin_id = Column(Integer, ForeignKey("bins.id"), nullable=False)
    container_id = Column(Integer, ForeignKey("containers.id"), nullable=True)  # NULL if loose in bin

    # Details
    description = Column(Text)
    notes = Column(Text)
    photo_url = Column(String)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    bin = relationship("Bin", back_populates="items")
    container = relationship("Container", back_populates="items")
