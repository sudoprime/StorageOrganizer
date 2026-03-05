import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Plus, Trash2, X, ArrowRightLeft, ChevronLeft, MapPin, Package } from 'lucide-react';
import { roomsAPI, stacksAPI, binsAPI, binTypesAPI, layoutSlotsAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ─── Constants ───────────────────────────────────────────────

const MM_PER_INCH = 25.4;
const SNAP_POINTS = [0, 0.5, 1];
const SNAP_THRESHOLD = 0.15;
const DRAG_DEAD_ZONE = 4;
const MIN_CELL_PX = 40;
const LABEL_W = 24;
const COL_BTN_W = 40;
const GRID_PAD = 48;

// ─── Dimension helpers ───────────────────────────────────────

function getFootprint(item, typeLookup) {
  const bt = typeLookup[item.bin_type_id];
  if (!bt) return null;
  const w = bt.width_mm;
  const d = bt.depth_mm;
  return item.orientation === 'leftright'
    ? { cellW: d, cellH: w }
    : { cellW: w, cellH: d };
}

function computeGridLayout(rows, cols, stackMap, typeLookup, mode) {
  const cellItems = {};
  for (const [pos, stack] of Object.entries(stackMap)) {
    const source = mode === 'layout' ? (stack.layout_slots || []) : (stack.bins || []);
    const entries = [];
    for (const item of source) {
      const fp = getFootprint(item, typeLookup);
      if (fp) entries.push({ item, fp });
    }
    if (entries.length > 0) cellItems[pos] = entries;
  }

  const allFootprints = Object.values(cellItems).flat().map(e => e.fp);
  if (allFootprints.length === 0) {
    return { colWidths: Array(cols).fill(1), rowHeights: Array(rows).fill(1), unit: 1, cellItems };
  }

  const unit = Math.min(
    ...allFootprints.map(fp => Math.max(fp.cellW, fp.cellH))
  );

  const cellSlots = {};
  for (const [pos, entries] of Object.entries(cellItems)) {
    cellSlots[pos] = {
      nw: Math.max(...entries.map(e => e.fp.cellW / unit)),
      nh: Math.max(...entries.map(e => e.fp.cellH / unit)),
    };
  }

  const colWidths = Array.from({ length: cols }, (_, c) => {
    let max = 1;
    for (let r = 0; r < rows; r++) {
      const pos = `${String.fromCharCode(65 + r)}${c + 1}`;
      if (cellSlots[pos]) max = Math.max(max, cellSlots[pos].nw);
    }
    return max;
  });

  const rowHeights = Array.from({ length: rows }, (_, r) => {
    let max = 1;
    const rowLabel = String.fromCharCode(65 + r);
    for (let c = 0; c < cols; c++) {
      const pos = `${rowLabel}${c + 1}`;
      if (cellSlots[pos]) max = Math.max(max, cellSlots[pos].nh);
    }
    return max;
  });

  return { colWidths, rowHeights, unit, cellItems };
}

function computeInventoryLayout(rows, cols, stackMap, typeLookup) {
  const sizeLayout = computeGridLayout(rows, cols, stackMap, typeLookup, 'layout');
  const binItems = {};
  for (const [pos, stack] of Object.entries(stackMap)) {
    const entries = [];
    for (const bin of (stack.bins || [])) {
      const fp = getFootprint(bin, typeLookup);
      if (fp) entries.push({ item: bin, fp });
    }
    if (entries.length > 0) binItems[pos] = entries;
  }
  const ghostItems = {};
  for (const [pos, stack] of Object.entries(stackMap)) {
    const slots = stack.layout_slots || [];
    const ghosts = [];
    for (const slot of slots) {
      const fp = getFootprint(slot, typeLookup);
      if (fp) ghosts.push({ item: slot, fp });
    }
    if (ghosts.length > 0) ghostItems[pos] = ghosts;
  }
  return { ...sizeLayout, cellItems: binItems, ghostItems };
}

// ─── Height computation ──────────────────────────────────────

function computeBinHeights(stacks, typeLookup) {
  // Returns { [bin.id]: baseHeightMm } — height of the bottom of this bin from the floor
  const heights = {};

  for (const stack of stacks) {
    const bins = stack.bins || [];
    const binById = Object.fromEntries(bins.map(b => [b.id, b]));

    const getBase = (bin) => {
      if (heights[bin.id] !== undefined) return heights[bin.id];
      if (!bin.bottom_id || !binById[bin.bottom_id]) {
        heights[bin.id] = 0;
        return 0;
      }
      const below = binById[bin.bottom_id];
      const belowBt = typeLookup[below.bin_type_id];
      const belowH = belowBt ? belowBt.height_mm : 0;
      heights[bin.id] = getBase(below) + belowH;
      return heights[bin.id];
    };

    for (const bin of bins) getBase(bin);
  }

  return heights;
}

function getMaxHeightMm(stacks, typeLookup, binHeights) {
  let max = 0;
  for (const stack of stacks) {
    for (const bin of (stack.bins || [])) {
      const base = binHeights[bin.id] || 0;
      const bt = typeLookup[bin.bin_type_id];
      const top = base + (bt ? bt.height_mm : 0);
      if (top > max) max = top;
    }
  }
  return max;
}

function filterBinsByHeight(cellItems, binHeights, sliderMm, typeLookup) {
  const filtered = {};
  for (const [pos, entries] of Object.entries(cellItems)) {
    const kept = entries.filter(({ item }) => {
      const base = binHeights[item.id] || 0;
      const bt = typeLookup[item.bin_type_id];
      const top = base + (bt ? bt.height_mm : 0);
      // Show bin if the slider is within its vertical range (base inclusive, top exclusive)
      return base <= sliderMm && top > sliderMm;
    });
    if (kept.length > 0) filtered[pos] = kept;
  }
  return filtered;
}

// Find the topmost bin at a position (highest base + height)
function findTopmostBin(stack, typeLookup, binHeights) {
  let topBin = null;
  let topHeight = -1;
  for (const bin of (stack.bins || [])) {
    const base = binHeights[bin.id] || 0;
    const bt = typeLookup[bin.bin_type_id];
    const top = base + (bt ? bt.height_mm : 0);
    if (top > topHeight) { topHeight = top; topBin = bin; }
  }
  return topBin;
}

// ─── Snap drag hook ──────────────────────────────────────────

function snapValue(v) {
  let closest = 0.5;
  let minDist = Infinity;
  for (const s of SNAP_POINTS) {
    const d = Math.abs(v - s);
    if (d < minDist) { minDist = d; closest = s; }
  }
  return minDist < SNAP_THRESHOLD ? closest : Math.max(0, Math.min(1, v));
}

function useDrag(onDragEnd, onClickItem) {
  const stateRef = useRef(null);

  const onMouseDown = useCallback((e, item, containerRect, itemW, itemH) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startOx = item.offset_x ?? 0.5;
    const startOy = item.offset_y ?? 0.5;
    const availW = containerRect.width - itemW;
    const availH = containerRect.height - itemH;
    let didDrag = false;
    const dragId = item.bin_id || `slot-${item.id}`;

    stateRef.current = { item, startX, startY, startOx, startOy, availW, availH, dragId };

    const onMove = (ev) => {
      const s = stateRef.current;
      if (!s) return;
      const dx = ev.clientX - s.startX;
      const dy = ev.clientY - s.startY;
      if (!didDrag && Math.abs(dx) < DRAG_DEAD_ZONE && Math.abs(dy) < DRAG_DEAD_ZONE) return;
      didDrag = true;
      const rawX = s.availW > 0 ? s.startOx + dx / s.availW : 0.5;
      const rawY = s.availH > 0 ? s.startOy + dy / s.availH : 0.5;
      const el = document.getElementById(`drag-${s.dragId}`);
      if (el) {
        el.style.left = `${Math.max(0, Math.min(1, rawX)) * s.availW}px`;
        el.style.top = `${Math.max(0, Math.min(1, rawY)) * s.availH}px`;
      }
    };

    const onUp = (ev) => {
      const s = stateRef.current;
      stateRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (!s) return;
      if (!didDrag) { onClickItem?.(s.item); return; }
      const dx = ev.clientX - s.startX;
      const dy = ev.clientY - s.startY;
      const rawX = s.availW > 0 ? s.startOx + dx / s.availW : 0.5;
      const rawY = s.availH > 0 ? s.startOy + dy / s.availH : 0.5;
      onDragEnd(s.item, snapValue(rawX), snapValue(rawY));
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [onDragEnd, onClickItem]);

  return { onMouseDown };
}

// ─── Room List ───────────────────────────────────────────────

function RoomList({ rooms, onSelect, onCreate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
    setName('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />New Room
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 10x10 Storage Unit"
                required
                autoFocus
              />
              <Button type="submit" size="sm">Create</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {rooms.length === 0 && !showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>No rooms yet</CardTitle>
            <CardDescription>Create a room to start laying out your storage grid.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => onSelect(room)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{room.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); onDelete(room.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <CardDescription>
                  {room.grid_rows} × {room.grid_cols} grid
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Grid Renderer (shared between Layout and Inventory) ─────

function FloorGrid({
  rows, cols, layout, typeLookup, cellPx,
  onCellClick, onMouseDown,
  showEmpty = true, showAddButtons = false,
  addRow, addCol,
  onDragOver, onDropOnCell, onDropOnBin,
  ghostItems, binHeights,
}) {
  const colPx = layout.colWidths.map(w => w * cellPx);
  const rowPx = layout.rowHeights.map(h => h * cellPx);
  const gridTemplateCols = `${LABEL_W}px ${colPx.map(w => `${w}px`).join(' ')}`;
  const unit = layout.unit;

  return (
    <>
      {/* Column headers */}
      <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: gridTemplateCols }}>
        <div />
        {Array.from({ length: cols }, (_, i) => (
          <div key={i} className="text-center text-xs font-mono text-slate-500">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      <div className="space-y-2">
        {Array.from({ length: rows }, (_, r) => {
          const rowLabel = String.fromCharCode(65 + r);
          const rh = rowPx[r];
          return (
            <div key={r} className="grid gap-2" style={{ gridTemplateColumns: gridTemplateCols }}>
              <div className="flex items-center justify-center text-xs font-mono text-slate-500" style={{ height: rh }}>
                {rowLabel}
              </div>
              {Array.from({ length: cols }, (_, c) => {
                const pos = `${rowLabel}${c + 1}`;
                const cw = colPx[c];
                const cellEntries = layout.cellItems[pos] || [];
                const ghosts = ghostItems?.[pos] || [];
                const hasContent = cellEntries.length > 0 || ghosts.length > 0;

                if (!showEmpty && !hasContent) {
                  return <div key={pos} style={{ width: cw, height: rh }} />;
                }

                return (
                  <div
                    key={pos}
                    className={cn(
                      "relative cursor-pointer",
                      !hasContent && showEmpty && "rounded-md border-2 border-slate-700/50 bg-slate-800/40",
                    )}
                    style={{ width: cw, height: rh }}
                    onClick={() => onCellClick?.(pos)}
                    onDragOver={onDragOver ? (e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-primary', 'ring-inset'); } : undefined}
                    onDragLeave={onDragOver ? (e) => { e.currentTarget.classList.remove('ring-2', 'ring-primary', 'ring-inset'); } : undefined}
                    onDrop={onDropOnCell ? (e) => { e.preventDefault(); e.currentTarget.classList.remove('ring-2', 'ring-primary', 'ring-inset'); onDropOnCell(e, pos); } : undefined}
                  >
                    {!hasContent && showEmpty && (
                      <span className="absolute top-0.5 left-1 text-[9px] font-mono text-slate-600 z-10 pointer-events-none">
                        {pos}
                      </span>
                    )}

                    {/* Ghost outlines for layout slots (inventory tab) */}
                    {ghosts.map(({ item: slot, fp }) => {
                      const slotW = (fp.cellW / unit) * cellPx;
                      const slotH = (fp.cellH / unit) * cellPx;
                      const availW = cw - slotW;
                      const availH = rh - slotH;
                      const ox = slot.offset_x ?? 0.5;
                      const oy = slot.offset_y ?? 0.5;
                      const left = Math.max(0, availW) * ox;
                      const top = Math.max(0, availH) * oy;
                      const bt = typeLookup[slot.bin_type_id];

                      return (
                        <div
                          key={`ghost-${slot.id}`}
                          className="absolute rounded border-2 border-dashed border-slate-600/50 flex items-center justify-center pointer-events-none z-10"
                          style={{
                            width: Math.min(slotW, cw) - 2,
                            height: Math.min(slotH, rh) - 2,
                            left,
                            top,
                          }}
                        >
                          <span className="text-[9px] text-slate-600 font-medium truncate px-1">
                            <span className="opacity-60">{pos}</span> {bt?.name || '?'}
                          </span>
                        </div>
                      );
                    })}

                    {/* Actual items (layout slots or bins depending on mode) */}
                    {cellEntries.map(({ item, fp }) => {
                      const itemW = (fp.cellW / unit) * cellPx;
                      const itemH = (fp.cellH / unit) * cellPx;
                      const availW = cw - itemW;
                      const availH = rh - itemH;
                      const ox = item.offset_x ?? 0.5;
                      const oy = item.offset_y ?? 0.5;
                      const left = Math.max(0, availW) * ox;
                      const top = Math.max(0, availH) * oy;
                      const bt = typeLookup[item.bin_type_id];
                      const dragId = item.bin_id || `slot-${item.id}`;
                      // Higher bins render on top (z-index 20 + height tier)
                      const heightMm = binHeights?.[item.id] || 0;
                      const zIndex = 20 + Math.round(heightMm / 10);

                      return (
                        <div
                          key={dragId}
                          id={`drag-${dragId}`}
                          className="absolute rounded border border-slate-400 bg-slate-600 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
                          style={{
                            width: Math.min(itemW, cw) - 2,
                            height: Math.min(itemH, rh) - 2,
                            left,
                            top,
                            zIndex,
                          }}
                          onMouseDown={onMouseDown ? (e) => {
                            const container = e.currentTarget.parentElement.getBoundingClientRect();
                            onMouseDown(e, item, container, Math.min(itemW, cw) - 2, Math.min(itemH, rh) - 2);
                          } : undefined}
                          onDragOver={onDropOnBin ? (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.add('ring-2', 'ring-amber-400', 'ring-inset');
                          } : undefined}
                          onDragLeave={onDropOnBin ? (e) => {
                            e.currentTarget.classList.remove('ring-2', 'ring-amber-400', 'ring-inset');
                          } : undefined}
                          onDrop={onDropOnBin ? (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('ring-2', 'ring-amber-400', 'ring-inset');
                            // Also clean up parent cell highlight
                            e.currentTarget.parentElement.classList.remove('ring-2', 'ring-primary', 'ring-inset');
                            onDropOnBin(e, item);
                          } : undefined}
                        >
                          <span className="text-[9px] text-white/80 font-medium truncate px-1 pointer-events-none">
                            <span className="opacity-60">{pos}</span>{' '}
                            {item.bin_id
                              ? <>{item.name} <span className="opacity-50">{bt?.name} · {item.bin_id}</span></>
                              : (bt?.name || '?')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}

        {showAddButtons && (
          <div className="grid gap-2" style={{ gridTemplateColumns: gridTemplateCols }}>
            <div />
            <button
              onClick={addRow}
              className="rounded-md border-2 border-dashed border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-400 transition-colors h-8 flex items-center justify-center text-xs font-medium"
              style={{ gridColumn: `2 / ${cols + 2}` }}
            >
              <Plus className="h-3 w-3 mr-1" />Row
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Height Slider ───────────────────────────────────────────

function HeightSlider({ maxIn, value, onChange }) {
  if (maxIn <= 0) return null;

  const ticks = [];
  for (let i = 0; i <= maxIn; i++) ticks.push(i);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">
          Height: {value}" {value === 0 && <span className="text-xs opacity-60">(floor)</span>}
        </label>
        <span className="text-xs text-muted-foreground">{maxIn}" max</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={maxIn}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
          list="height-ticks"
        />
        <datalist id="height-ticks">
          {ticks.map(t => <option key={t} value={t} />)}
        </datalist>
      </div>
      <div className="flex justify-between px-0.5">
        {ticks.map(t => (
          <span key={t} className="text-[8px] text-slate-600 font-mono">{t}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Room Grid View (with tabs) ─────────────────────────────

function RoomGrid({ room, onBack, onRoomUpdate }) {
  const [tab, setTab] = useState('layout');
  const [stacks, setStacks] = useState([]);
  const [binTypes, setBinTypes] = useState([]);
  const [unassignedBins, setUnassignedBins] = useState([]);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPos, setSelectedPos] = useState(null);
  const [addTypeId, setAddTypeId] = useState('');
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [heightIn, setHeightIn] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const availH = viewH - rect.top - 32;
      setContainerSize({ w: rect.width, h: Math.max(200, availH) });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  const rows = room.grid_rows || 1;
  const cols = room.grid_cols || 1;

  const fetchData = async () => {
    try {
      const [stacksRes, typesRes, unassignedRes] = await Promise.all([
        stacksAPI.getAll(room.id),
        binTypesAPI.getAll(),
        binsAPI.getUnassigned(),
      ]);
      setStacks(stacksRes.data);
      setBinTypes(typesRes.data);
      setUnassignedBins(unassignedRes.data);
    } catch {
      setError('Failed to load grid data');
    }
  };

  useEffect(() => { fetchData(); }, [room.id]);

  const typeLookup = useMemo(
    () => Object.fromEntries(binTypes.map(bt => [bt.id, bt])),
    [binTypes]
  );
  const stackMap = useMemo(
    () => Object.fromEntries(stacks.map(s => [s.position, s])),
    [stacks]
  );

  // Height computation
  const binHeights = useMemo(
    () => computeBinHeights(stacks, typeLookup),
    [stacks, typeLookup]
  );
  const maxHeightMm = useMemo(
    () => getMaxHeightMm(stacks, typeLookup, binHeights),
    [stacks, typeLookup, binHeights]
  );
  const maxHeightIn = Math.ceil(maxHeightMm / MM_PER_INCH);

  // Layout tab: sized and rendered from layout_slots
  const layoutGrid = useMemo(
    () => computeGridLayout(rows, cols, stackMap, typeLookup, 'layout'),
    [rows, cols, stackMap, typeLookup]
  );

  // Inventory tab: sized from layout_slots, rendered with bins + ghost outlines
  const inventoryGrid = useMemo(
    () => computeInventoryLayout(rows, cols, stackMap, typeLookup),
    [rows, cols, stackMap, typeLookup]
  );

  // Filter inventory bins by height
  const filteredInventoryGrid = useMemo(() => {
    const minMm = heightIn * MM_PER_INCH;
    return {
      ...inventoryGrid,
      cellItems: filterBinsByHeight(inventoryGrid.cellItems, binHeights, minMm, typeLookup),
    };
  }, [inventoryGrid, binHeights, heightIn, typeLookup]);

  const activeLayout = tab === 'layout' ? layoutGrid : filteredInventoryGrid;

  const handleCellClick = (position) => {
    setSelectedPos(position);
    setAddTypeId('');
    setDialogOpen(true);
  };

  const ensureStack = async (position) => {
    const existing = stackMap[position];
    if (existing) return existing.id;
    const res = await stacksAPI.create({ room_id: room.id, position });
    return res.data.id;
  };

  // Layout tab: add a layout slot
  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!addTypeId) return;
    try {
      const stackId = await ensureStack(selectedPos);
      await layoutSlotsAPI.create({
        stack_id: stackId,
        bin_type_id: parseInt(addTypeId),
      });
      setAddTypeId('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add layout slot');
    }
  };

  const handleSwapSlotOrientation = async (slot) => {
    try {
      await layoutSlotsAPI.update(slot.id, {
        orientation: slot.orientation === 'leftright' ? 'updown' : 'leftright',
      });
      fetchData();
    } catch { setError('Failed to swap orientation'); }
  };

  const handleRemoveSlot = async (slot) => {
    try {
      await layoutSlotsAPI.delete(slot.id);
      fetchData();
    } catch { setError('Failed to remove layout slot'); }
  };

  const handleSlotDragEnd = useCallback(async (slot, ox, oy) => {
    try {
      await layoutSlotsAPI.update(slot.id, { offset_x: ox, offset_y: oy });
      fetchData();
    } catch { setError('Failed to update position'); }
  }, []);

  const handleSlotClick = useCallback((slot) => {
    const stack = stacks.find(s => s.layout_slots?.some(ls => ls.id === slot.id));
    if (stack) {
      setSelectedPos(stack.position);
      setAddTypeId('');
      setDialogOpen(true);
    }
  }, [stacks]);

  // Inventory tab: bin operations
  const handleSwapBinOrientation = async (bin) => {
    try {
      await binsAPI.update(bin.bin_id, { orientation: bin.orientation === 'leftright' ? 'updown' : 'leftright' });
      fetchData();
    } catch { setError('Failed to swap orientation'); }
  };

  const handleBinDragEnd = useCallback(async (bin, ox, oy) => {
    try {
      await binsAPI.update(bin.bin_id, { offset_x: ox, offset_y: oy });
      fetchData();
    } catch { setError('Failed to update position'); }
  }, []);

  const handleBinClick = useCallback((bin) => {
    const stack = stacks.find(s => s.bins?.some(b => b.bin_id === bin.bin_id));
    if (stack) {
      setSelectedPos(stack.position);
      setAddTypeId('');
      setDialogOpen(true);
    }
  }, [stacks]);

  const handleUnassignBin = async (bin) => {
    try {
      await binsAPI.update(bin.bin_id, { stack_id: null, bottom_id: null });
      fetchData();
    } catch { setError('Failed to unassign bin'); }
  };

  const { onMouseDown: onSlotMouseDown } = useDrag(handleSlotDragEnd, handleSlotClick);
  const { onMouseDown: onBinMouseDown } = useDrag(handleBinDragEnd, handleBinClick);

  const addRow = async () => {
    try {
      await roomsAPI.update(room.id, { grid_rows: rows + 1 });
      onRoomUpdate({ ...room, grid_rows: rows + 1 });
    } catch { setError('Failed to add row'); }
  };

  const addCol = async () => {
    try {
      await roomsAPI.update(room.id, { grid_cols: cols + 1 });
      onRoomUpdate({ ...room, grid_cols: cols + 1 });
    } catch { setError('Failed to add column'); }
  };

  // Drop unassigned bin onto empty grid cell (floor level)
  const handleDropOnCell = async (e, position) => {
    const binId = e.dataTransfer.getData('text/bin-id');
    if (!binId) return;
    try {
      const stackId = await ensureStack(position);
      const stack = stackMap[position] || (await stacksAPI.getOne(stackId)).data;
      const slots = stack.layout_slots || [];
      const bin = unassignedBins.find(b => b.bin_id === binId);
      const matchingSlot = bin ? slots.find(s => s.bin_type_id === bin.bin_type_id) : null;

      const updateData = { stack_id: stackId, bottom_id: null };
      if (matchingSlot) {
        updateData.orientation = matchingSlot.orientation;
        updateData.offset_x = matchingSlot.offset_x;
        updateData.offset_y = matchingSlot.offset_y;
      }
      await binsAPI.update(binId, updateData);
      fetchData();
    } catch { setError('Failed to assign bin'); }
  };

  // Drop unassigned bin onto existing grid bin (stack on top)
  const handleDropOnBin = async (e, targetBin) => {
    const binId = e.dataTransfer.getData('text/bin-id');
    if (!binId || binId === targetBin.bin_id) return;
    try {
      await binsAPI.update(binId, {
        stack_id: targetBin.stack_id,
        bottom_id: targetBin.id,
        orientation: targetBin.orientation,
        offset_x: targetBin.offset_x,
        offset_y: targetBin.offset_y,
      });
      fetchData();
    } catch { setError('Failed to stack bin'); }
  };

  // Compute cell unit size
  const totalNormW = activeLayout.colWidths.reduce((a, b) => a + b, 0);
  const totalNormH = activeLayout.rowHeights.reduce((a, b) => a + b, 0);
  const hGaps = (cols - 1) * 8;
  const vGaps = (rows - 1) * 8;
  const rowBtnH = tab === 'layout' ? 40 : 0;
  const colHeaderH = 24;
  const colBtnW = tab === 'layout' ? COL_BTN_W : 0;
  const availW = containerSize.w - GRID_PAD - LABEL_W - colBtnW - hGaps;
  const availH = containerSize.h - GRID_PAD - colHeaderH - vGaps - rowBtnH;
  const cellFromW = containerSize.w > 0 ? availW / totalNormW : 64;
  const cellFromH = containerSize.h > 0 ? availH / totalNormH : 64;
  const cellPx = Math.max(MIN_CELL_PX, Math.min(cellFromW, cellFromH));

  const rowPx = activeLayout.rowHeights.map(h => h * cellPx);

  const selectedStack = selectedPos ? stackMap[selectedPos] : null;
  const selectedSlots = selectedStack?.layout_slots || [];
  const selectedBins = selectedStack?.bins || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{room.name}</h1>
          <p className="text-sm text-muted-foreground">{rows} × {cols} grid</p>
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex border-b border-border">
        {[
          { key: 'layout', label: 'Layout', icon: MapPin },
          { key: 'inventory', label: 'Inventory', icon: Package },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              tab === key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm flex justify-between items-center">
          {error}
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Inventory: unassigned bins tray */}
      {tab === 'inventory' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Unassigned Bins ({unassignedBins.length})
          </label>
          {unassignedBins.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {unassignedBins.map((bin) => {
                const bt = typeLookup[bin.bin_type_id];
                return (
                  <div
                    key={bin.bin_id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/bin-id', bin.bin_id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 cursor-grab active:cursor-grabbing select-none hover:border-slate-500 transition-colors"
                  >
                    <Package className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white/90 truncate">{bt?.name || bin.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{bin.bin_id}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No unassigned bins. Create bins from the Bins page.</p>
          )}
        </div>
      )}

      {/* Inventory: height slider */}
      {tab === 'inventory' && maxHeightIn > 0 && (
        <HeightSlider maxIn={maxHeightIn} value={heightIn} onChange={setHeightIn} />
      )}

      {/* Grid */}
      <div
        ref={containerRef}
        className={cn(
          "bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-800 overflow-x-auto",
          tab === 'layout' ? "flex gap-2" : "block"
        )}
      >
        {tab === 'layout' ? (
          <>
            <div>
              <FloorGrid
                rows={rows}
                cols={cols}
                layout={layoutGrid}
                typeLookup={typeLookup}
                cellPx={cellPx}
                onCellClick={handleCellClick}
                onMouseDown={onSlotMouseDown}
                showEmpty
                showAddButtons
                addRow={addRow}
                addCol={addCol}
              />
            </div>
            <div className="flex items-center" style={{ paddingTop: 20 }}>
              <button
                onClick={addCol}
                className="rounded-md border-2 border-dashed border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-400 transition-colors w-8 flex flex-col items-center justify-center text-xs font-medium py-3"
                style={{ height: rowPx.reduce((a, b) => a + b, 0) + (rows - 1) * 8 }}
              >
                <Plus className="h-3 w-3 mb-1" />
                <span className="[writing-mode:vertical-lr]">Col</span>
              </button>
            </div>
          </>
        ) : (
          <FloorGrid
            rows={rows}
            cols={cols}
            layout={filteredInventoryGrid}
            typeLookup={typeLookup}
            cellPx={cellPx}
            onCellClick={handleCellClick}
            onMouseDown={onBinMouseDown}
            showEmpty={false}
            showAddButtons={false}
            onDragOver
            onDropOnCell={handleDropOnCell}
            onDropOnBin={handleDropOnBin}
            ghostItems={filteredInventoryGrid.ghostItems}
            binHeights={binHeights}
          />
        )}
      </div>

      {/* Cell dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Position {selectedPos}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            {/* Layout tab: show/edit layout slots */}
            {tab === 'layout' && (
              <>
                {selectedSlots.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Layout slots</label>
                    {selectedSlots.map((slot) => {
                      const bt = typeLookup[slot.bin_type_id];
                      return (
                        <div key={slot.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{bt?.name || 'Unknown type'}</div>
                            <div className="text-xs text-muted-foreground">
                              {slot.orientation === 'leftright' ? 'Sideways' : 'Upright'}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => handleSwapSlotOrientation(slot)}
                            title="Swap orientation"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveSlot(slot)}
                            title="Remove slot"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <form onSubmit={handleAddSlot} className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Add a slot</label>
                  <div className="flex gap-2">
                    <Select value={addTypeId} onChange={(e) => setAddTypeId(e.target.value)} className="flex-1">
                      <option value="">Select bin type...</option>
                      {binTypes.map(bt => (
                        <option key={bt.id} value={bt.id}>{bt.name}</option>
                      ))}
                    </Select>
                    <Button type="submit" size="sm" disabled={!addTypeId}>
                      <Plus className="h-4 w-4 mr-1" />Add
                    </Button>
                  </div>
                </form>
              </>
            )}

            {/* Inventory tab: show bins at this position */}
            {tab === 'inventory' && (
              <>
                {selectedBins.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Bins at this position</label>
                    {selectedBins.map((bin) => {
                      const bt = typeLookup[bin.bin_type_id];
                      const baseIn = ((binHeights[bin.id] || 0) / MM_PER_INCH).toFixed(1);
                      return (
                        <div key={bin.bin_id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{bin.name}</div>
                            <div className="text-xs text-muted-foreground">
                              <span className="font-mono">{bin.bin_id}</span>
                              {bt && <span> · {bt.name}</span>}
                              <span> · {baseIn}"</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => handleSwapBinOrientation(bin)}
                            title="Swap orientation"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-amber-500 hover:text-amber-500"
                            onClick={() => { handleUnassignBin(bin); setDialogOpen(false); }}
                            title="Unassign from grid"
                          >
                            <Package className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedBins.length === 0 && selectedSlots.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    No bins placed here yet. Drag bins from the tray above onto the grid.
                  </p>
                )}
              </>
            )}
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const fetchRooms = async () => {
    try {
      const res = await roomsAPI.getAll();
      setRooms(res.data);
    } catch {
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleCreate = async (name) => {
    try {
      await roomsAPI.create({ name });
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create room');
    }
  };

  const handleDelete = async (id) => {
    try {
      await roomsAPI.delete(id);
      if (selectedRoom?.id === id) setSelectedRoom(null);
      fetchRooms();
    } catch {
      setError('Failed to delete room');
    }
  };

  const handleRoomUpdate = (updated) => {
    setSelectedRoom(updated);
    setRooms(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  if (selectedRoom) {
    return (
      <RoomGrid
        room={selectedRoom}
        onBack={() => setSelectedRoom(null)}
        onRoomUpdate={handleRoomUpdate}
      />
    );
  }

  return (
    <>
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm flex justify-between items-center mb-6">
          {error}
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}
      <RoomList
        rooms={rooms}
        onSelect={setSelectedRoom}
        onCreate={handleCreate}
        onDelete={handleDelete}
      />
    </>
  );
}

export default RoomsPage;
