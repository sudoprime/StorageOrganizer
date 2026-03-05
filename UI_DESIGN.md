# UI/UX Design Document

## Core Concept

A spatial, grid-based interface for organizing storage containers - inspired by The Sims building mode. Users can visually plan and track the physical layout of their storage unit.

## Primary Workflow

1. **Create Room** (storage unit/space)
   - Define physical dimensions (e.g., "10×10 storage unit")
   - System generates a grid based on dimensions

2. **Create Boxes**
   - Define box properties (name, size, QR code)
   - Edit contents in spreadsheet-like interface
   - Add photos of items

3. **Place & Organize**
   - Drag boxes onto grid with snapping
   - Stack boxes vertically on grid positions
   - Move/rearrange as needed

## Grid System

### Grid Visualization

**Top-down 2D view** with height/story selector

```
┌─────────────────────────────┐
│  [Height Slider: Level 1-6] │  ← Story selector on side
├─────────────────────────────┤
│                             │
│    ┌────┐  ┌────┐          │
│    │Kit │  │FPV │  ┌────┐  │
│    │chen│  │Gear│  │Elec│  │
│    └────┘  └────┘  │tron│  │
│                     │ics │  │
│    ┌─────────┐     └────┘  │
│    │  Books  │             │
│    │         │     ┌────┐  │
│    └─────────┘     │3D  │  │
│                    │Prnt│  │
│                    └────┘  │
│                             │
└─────────────────────────────┘
```

**Height/Story Slider:**
- Vertical slider showing levels 1-6 (or max stack height)
- Select a level to view boxes at that height
- Boxes at other levels fade out or show as outlines
- Allows planning safe stacking (see what's underneath)

### Grid Units & Normalization

**Input:** Real-world dimensions
- Room: actual dimensions in feet (e.g., 10' × 10', 10' × 20')
- Boxes: actual dimensions from BINS.md
  - Large: 25¾" × 18⅜"
  - Small: 18" × 12⅝"

**Normalization:** Longest box dimension = 1 grid unit
- Large bin (25.75" × 18.375"): **1.0 × 0.71 units**
- Small bin (18" × 12.625"): **0.70 × 0.49 units**

**Grid cell size:** Derived from room dimensions and normalized unit
- Allows responsive display while maintaining proportions
- Grid snaps to normalized unit boundaries

### Drag & Drop Behavior

**Snapping:**
- Boxes snap to grid cell boundaries
- Grid lines visible on hover/drag
- Visual feedback when position is valid (green) or invalid (red/blocked)

**Collision Detection:**
- Can't overlap boxes on same level
- Visual indicator if trying to place in occupied space
- Optional: warn if stacking unsafe heights (>5-6 high for loaded bins)

**Stacking:**
- Boxes stack vertically at grid positions
- Can drag from one position to another
- Can drag between height levels (restack)
- Visual indicator shows stack order (1, 2, 3, etc.)

## Box Display

### Grid View (Top-Down)

Each box shows:
- **Box name** (large, readable): "Kitchen Gadgets", "FPV Gear", "Electronics"
- **Visual size**: Footprint matches actual bin dimensions (normalized)
- **Stack indicator**: Small badge showing position in stack (e.g., "3/5" = 3rd box in stack of 5)
- **Optional color coding**: By category, by room, or custom

### Box Details Panel

Click a box to open details:
- **Header:** Box name, QR code (printable)
- **Properties:** Size, current location (Room, Position, Level)
- **Items:** Spreadsheet-like table
  - Columns: Item name, Quantity, Category, Notes
  - Add/edit/delete rows
  - Bulk operations (import CSV, copy/paste)
- **Photos:** Grid of attached photos
  - Click to enlarge
  - Add new via upload or camera (mobile)
  - Associate photos with specific items or entire box

### Spreadsheet-Style Item Editor

```
┌─────────────────────────────────────────────────────────┐
│  Box: Kitchen Gadgets                      [+ Add Item] │
├──────────┬──────────┬────────────┬───────────┬──────────┤
│ Item     │ Quantity │ Category   │ Notes     │ Photo    │
├──────────┼──────────┼────────────┼───────────┼──────────┤
│ Blender  │    1     │ Appliance  │ Vitamix   │ [📷]     │
│ Spatulas │    4     │ Utensil    │ Silicone  │          │
│ Knife set│    1     │ Cutlery    │ Global    │ [📷]     │
│ [new]    │          │            │           │          │
└──────────┴──────────┴────────────┴───────────┴──────────┘
```

**Features:**
- Inline editing (click cell to edit)
- Keyboard navigation (tab, arrow keys)
- Quick add (enter in last row creates new)
- Photo button opens camera (mobile) or file picker
- Bulk import from CSV

## Mobile Experience (PWA)

### QR Scanning Flow

1. **Scan QR code** (camera opens automatically)
2. **Box loads** (shows current contents)
3. **Quick actions:**
   - Add item (quick entry form)
   - Take photo (snap item, auto-attach)
   - View location (shows grid position)
   - Move box (update location)

### Mobile Grid View

- Simplified for smaller screens
- Pinch to zoom
- Tap to select, tap-hold to drag
- Height selector as bottom navigation

## Room (Storage Unit) Management

### Creating a Room

**Form fields:**
- Name (e.g., "10×10 Storage Unit", "Garage", "Basement")
- Dimensions (Length × Width in feet)
- Optional: Max stack height (default 6)
- Optional: Photo of space

**Grid generation:**
- Calculate grid based on room dimensions
- Show preview before creation
- Allow walking path planning (mark cells as aisles)

### Room View

**Layout:**
```
┌──────────────────────────────────┐
│  Rooms          [+ New Room]     │  ← Room selector
├──────────────────────────────────┤
│  📦 10×10 Storage Unit (84 boxes)│  ← Active room
│  🏠 Garage (12 boxes)            │
│  🏠 Basement (8 boxes)           │
└──────────────────────────────────┘
```

**Multi-room support:**
- Switch between rooms
- Move boxes between rooms (drag & drop or context menu)
- Search across all rooms

## Search & Filter

### Global Search

**Search box (always visible):**
- Searches across all items in all boxes
- Real-time results
- Shows: Item name → Box name → Location

**Example:**
```
Search: "hdmi cable"

Results:
  - HDMI Cable (3x) → Electronics Box → 10×10 Unit, Pos B3, Level 2
  - HDMI Cable (1x) → Office Supplies → Garage, Pos A1, Level 1
```

**Click result:**
- Navigates to room
- Highlights box on grid
- Opens box details panel

### Grid Filtering

**Filter boxes by:**
- Category/tag
- Date added
- Last accessed
- Has photos
- Stack height

**Visual filter:**
- Dim non-matching boxes
- Highlight matching boxes

## Future Enhancements (Stretch Goals)

### Isometric View
- 3D perspective like The Sims
- See all stack levels simultaneously
- Rotate view
- Better spatial understanding

### Advanced Visualization
- Heat map (most accessed boxes)
- Space utilization (% full)
- Weight distribution visualization
- Suggested packing order

### Smart Features
- Auto-suggest box placement (based on access frequency)
- Packing list generator (for moving day)
- "Find a space for this box" (AI placement)
- Fragile item warnings

### Collaboration
- Share room with family/moving crew
- Real-time updates (WebSocket)
- Commented/tagged items
- Access logs (who accessed what)

## Design Principles

1. **Physical-first:** UI should match reality (what you see = what's in storage)
2. **Mobile-optimized:** Scanning happens in the storage unit, on your phone
3. **Quick capture:** Add items fast (scanning QR is faster than searching a list)
4. **Visual memory:** Grid + photos help you remember where things are
5. **Progressive disclosure:** Simple by default, advanced features available when needed

## Component Hierarchy

```
App
├── RoomSelector
├── GridView
│   ├── GridCanvas
│   ├── GridCell (multiple)
│   ├── Box (draggable, multiple)
│   └── HeightSlider
├── BoxDetailsPanel
│   ├── BoxHeader (name, QR code)
│   ├── ItemTable (spreadsheet)
│   └── PhotoGallery
├── SearchBar
├── FilterPanel
└── QRScanner (mobile PWA)
```

## Technical Considerations

### State Management
- Room data (dimensions, boxes, items)
- Grid state (zoom, pan, selected level)
- Drag state (current drag operation)
- Filter/search state

### Performance
- Virtualization for large grids (many boxes)
- Lazy load photos (thumbnails first)
- Debounced search
- Optimistic updates (feel instant)

### Data Model

```
Room {
  id, name, dimensions, created_at
  boxes[]
}

Box {
  id, name, qr_code, room_id
  position {x, y, level}
  dimensions {width, depth, height}
  items[]
}

Item {
  id, box_id, name, quantity, category, notes
  photos[]
}
```

---

**Note:** This is a living document. Update as the design evolves during development.
