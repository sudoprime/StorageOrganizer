# Rooms Grid UI

The rooms grid is the core spatial layout component. It renders an interactive floor plan where users place and arrange bins within a room.

**Key file:** `frontend/src/pages/RoomsPage.jsx`

## Page Structure

The rooms page has three levels:

1. **Room List** (`RoomList` component) — Cards for each room showing name and grid dimensions. "New Room" creates a room with a 1×1 grid.
2. **Room Grid** (`RoomGrid` component) — Interactive grid for the selected room with two subtabs:
   - **Layout** — Full grid editor with empty cells, +Row/+Col buttons, and bin type assignment dialog.
   - **Inventory** — Shows only occupied cells. Unassigned bins tray at top with HTML drag-and-drop onto grid cells. Can unassign bins back to the tray.

## Data Model

### Backend Models (backend/app/models/models.py)

- **Room** — `grid_rows` (int, default 1), `grid_cols` (int, default 1) define grid size. Has many Stacks.
- **Stack** — Position marker at a grid coordinate (e.g. "A1", "B3"). `room_id` + `position`. Has many Bins. Stack is auto-created when the first bin is added to an empty cell.
- **Bin** — Physical container. Relevant grid fields:
  - `stack_id` — which cell it's in
  - `bin_type_id` — FK to BinType for dimensions
  - `orientation` — `"updown"` (default) or `"leftright"`, swaps width/depth on the floor plan
  - `offset_x`, `offset_y` — position within cell (0.0–1.0, default 0.5 = centered)
- **BinType** — Template with `width_mm`, `depth_mm`, `height_mm`. Width/depth are the floor footprint; height is vertical.

### Schemas (backend/app/schemas/schemas.py)

- `GET /api/stacks?room_id=X` returns `StackWithBins` — each stack includes its `bins[]` array.
- Bin create/update accepts `orientation`, `offset_x`, `offset_y`.

## Grid Sizing Algorithm

Implemented in `computeGridLayout()` and the `cellPx` calculation in `RoomGrid`.

### Normalization

1. **Footprint mapping:** Each bin's floor footprint is derived from its BinType. `orientation="updown"` → `cellW=width_mm, cellH=depth_mm`. `orientation="leftright"` → swapped.
2. **Unit length:** The smallest bin's longest footprint side (across all bins in the room) becomes 1 unit.
3. **Cell slot size:** For cells with multiple bins, the slot = max dimensions across all bins in that cell.
4. **Column width:** Max normalized slot width across all cells in that column (minimum 1 unit).
5. **Row height:** Max normalized slot height across all cells in that row (minimum 1 unit).

### Responsive Scaling

The grid scales to fill available space:

- A `ResizeObserver` + window resize listener measures the container.
- Available width = container width minus padding, row labels, +Col button, and gaps.
- Available height = viewport bottom minus grid top, minus padding, column headers, gaps, and +Row button.
- `cellPx = max(MIN_CELL_PX, min(cellFromWidth, cellFromHeight))` — picks the smaller scale factor so the grid fits both axes. Minimum 40px per unit.

Constants:
- `MIN_CELL_PX = 40` — floor for cell unit size
- `LABEL_W = 24` — row label column width
- `COL_BTN_W = 40` — +Col button width
- `GRID_PAD = 48` — container padding (p-6 × 2)

## Grid Rendering

The grid is rendered by a shared `FloorGrid` component used by both tabs. It accepts props to control behavior:
- `showEmpty` — whether to render empty cells (Layout: true, Inventory: false)
- `showAddButtons` — whether to show +Row button (Layout: true, Inventory: false)
- `onDragOver` / `onDropOnCell` — HTML drag-and-drop handlers (Inventory only)

### Cell Rendering

- **Empty cells (Layout only):** Subtle dark border/background with position label (e.g. "A1").
- **Occupied cells:** Each bin renders as a colored rectangle (color assigned per BinType from `PAD_PALETTE`) with soft glow. Four-corner label layout:
  - Top-left: grid position (e.g. "A3")
  - Top-right: bin name
  - Center: bin_id (large, bold mono)
  - Bottom-left: type name
  - Bottom-right: Z level (e.g. "Z1")
- **Empty cells (Inventory):** Rendered as invisible spacers to preserve grid geometry.
- Multiple bins can occupy the same cell (same Stack). They render independently with isometric Z offsets.

## Interaction

### Layout Tab

#### Adding Bins

1. Click any cell (empty or occupied) → opens the position dialog.
2. Dialog shows existing bins at that position with swap/remove controls.
3. "Add a bin" dropdown → select BinType → creates a Bin at that Stack (Stack is auto-created if needed via `ensureStack()`).

### Inventory Tab

#### Unassigned Bins Tray

- Shows all bins with `stack_id=NULL` and `parent_id=NULL` (fetched via `GET /api/bins?unassigned=true`).
- Each bin is a draggable chip with bin type name and hash ID.
- Uses HTML5 drag-and-drop API (`draggable`, `onDragStart` sets `text/bin-id` data).

#### Drag-and-Drop Stacking Rules

Both **cells** and **bins** are valid drop targets. They have distinct behaviors:

**Drop on Cell:**

1. **Floor level (no bins, or slider at 0):**
   - Place bin at floor (`bottom_id = null`).
   - **Type enforcement:** bin must match the layout slot's `bin_type_id`. Mismatches show an error toast and reject the drop.

2. **Active bins visible in cell:**
   - Place as **sibling** — same parent as the active bins (`bottom_id = active_bins[0].bottom_id`).
   - This puts the new bin next to existing bins at that level, on top of the same parent.

3. **All bins below slider (cell grayed out, no active bins):**
   - Place on top of the **topmost bin** in the stack (`bottom_id = topmost.id`).

**Drop on Bin:**

- Always stack on top of that specific bin (`bottom_id = target.id`).
- Works regardless of slider position, as long as the target bin is visible/active.

**Stability Warning:**

- When placing a bin with a larger footprint on top of a smaller bin, a confirmation dialog warns about stability concerns. The user must confirm before the placement proceeds.

**Visual Feedback:**

- Bins highlight with an **amber ring** on drag-over.
- Cells highlight with a **primary-color ring** on drag-over.
- Bin drop events call `e.stopPropagation()` so they don't also trigger the cell handler.

#### Sibling Auto-Layout

When 2+ bins share the same parent (`bottom_id`):
- **Orientation:** perpendicular to the parent bin.
- **Positioning:** clustered near center with a small gap (0.12 offset step). Existing siblings are repositioned to distribute evenly.
- **Spread axis:** along the parent's longer footprint dimension.

#### Unassign from Grid

- Click a bin in the grid → position dialog shows an unassign button (Package icon, amber).
- Sets `stack_id: null` via PUT, moving the bin back to the unassigned tray.

### Swap Orientation

Per-bin toggle in the dialog (ArrowRightLeft icon). Toggles `orientation` between `"updown"` and `"leftright"`, which swaps the bin's width/depth on the floor plan.

### Drag to Position

Bins can be dragged within their cell to reposition. Implemented in `useDrag()` hook.

- **Dead zone:** 4px of mouse movement before a drag starts. Below that threshold, it's treated as a click (opens the position dialog).
- **Live preview:** During drag, the bin's DOM position is updated directly (no React re-render) for smooth 60fps movement.
- **Snap on release:** `offset_x`/`offset_y` snap to nearest of `[0, 0.5, 1]` if within threshold (0.15). This gives 9 snap positions: left/center/right × top/center/bottom.
- **Persistence:** On mouse up, the snapped offsets are saved via `PUT /api/bins/{bin_id}`.
- The offset represents position of the bin within available space: `actualLeft = (cellWidth - binWidth) * offset_x`.

### Grid Resizing

- **+Row** button spans the bottom of the grid. Increments `room.grid_rows`.
- **+Col** button is vertical on the right side, spanning the grid height. Increments `room.grid_cols`.
- Both persist immediately via `PUT /api/rooms/{id}`.

## API Endpoints Used

| Endpoint | Usage |
|---|---|
| `GET /api/rooms` | List all rooms |
| `POST /api/rooms` | Create room |
| `PUT /api/rooms/{id}` | Update grid_rows/grid_cols |
| `DELETE /api/rooms/{id}` | Delete room |
| `GET /api/stacks?room_id=X` | Get stacks with bins for room |
| `POST /api/stacks` | Auto-create stack at position |
| `DELETE /api/stacks/{id}` | Remove stack (clears cell) |
| `GET /api/bin-types` | List bin types for dropdown |
| `POST /api/bins` | Create bin at stack |
| `GET /api/bins?unassigned=true` | Get bins not assigned to any stack |
| `PUT /api/bins/{bin_id}` | Update orientation/offset/stack_id |
| `DELETE /api/bins/{bin_id}` | Remove bin from cell |

## Vertical Stack Visualization

Bins stacked via `bottom_id` are rendered with depth cues:

- **Isometric offset:** Each Z level shifts the bin 18px up and left. Z1 sits at true position, Z2 is offset (-18,-18), etc. This reveals lower bins at the bottom-right edge.
- **Active/below classification:** The height slider defines a cross-section. Bins the slider cuts through are **active** (full color, interactive). Bins entirely below are **grayed out** (muted color, only Z label visible, `pointer-events-none`). Bins entirely above are **hidden**.
- **Z-index:** Higher bins render on top (`zIndex = 20 + heightMm/10`).
- **Z label:** Bottom-right corner shows `Z1`, `Z2`, etc. from `computeBinLevels()` which traverses the `bottom_id` linked list.
- **Height slider:** Range goes from 0 to the true top of the tallest bin (base + height). Ghost outlines (layout slot guides) are hidden when the slider is above floor level or when bins occupy the position.

## Future Considerations

- **Mini side-elevation view:** A narrow strip alongside each stack column showing a vertical cross-section (doll-house cutaway). Each bin would render as a colored rectangle at its true height, stacked vertically. Clicking a layer in the elevation would jump the height slider to that level. This would give full 3D spatial awareness without needing to scrub the slider.
- Diagonal orientation support (mentioned as eventual possibility)
- Row/column deletion
- Touch/mobile drag support (currently mouse-only)
