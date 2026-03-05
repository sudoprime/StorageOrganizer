import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Pencil, Ruler, X, Check, ImagePlus, Package } from 'lucide-react';
import { binTypesAPI, binsAPI, stacksAPI, roomsAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const MM_PER_INCH = 25.4;

function mmToIn(mm) { return mm / MM_PER_INCH; }
function inToMm(inches) { return inches * MM_PER_INCH; }

function formatDim(mm, unit) {
  if (unit === 'in') return mmToIn(mm).toFixed(2);
  return mm.toFixed(1);
}

function parseDim(value, unit) {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  return unit === 'in' ? inToMm(num) : num;
}

function volumeMm3(bt) {
  return bt.width_mm * bt.depth_mm * bt.height_mm;
}

function UnitToggle({ value, onChange, size = 'default' }) {
  const cls = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <div className="flex rounded-md border border-input overflow-hidden">
      {['in', 'mm'].map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          className={`${cls} font-medium transition-colors ${value === u ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
        >
          {u}
        </button>
      ))}
    </div>
  );
}

function ImageUpload({ imageData, onUpload, onRemove }) {
  const fileRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  if (imageData) {
    return (
      <div className="relative group">
        <img src={imageData} alt="Bin type" className="w-full h-40 object-contain rounded-md bg-muted" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full h-32 rounded-md border-2 border-dashed border-input hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ImagePlus className="h-6 w-6" />
        <span className="text-xs">Add photo</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </>
  );
}

function BinTypeForm({ initial, onSave, onCancel }) {
  const [unit, setUnit] = useState('in');
  const [name, setName] = useState(initial?.name || '');
  const [width, setWidth] = useState(initial ? formatDim(initial.width_mm, 'in') : '');
  const [depth, setDepth] = useState(initial ? formatDim(initial.depth_mm, 'in') : '');
  const [height, setHeight] = useState(initial ? formatDim(initial.height_mm, 'in') : '');

  const switchUnit = (newUnit) => {
    if (newUnit === unit) return;
    const fromUnit = unit;
    setWidth(prev => prev ? formatDim(parseDim(prev, fromUnit), newUnit) : '');
    setDepth(prev => prev ? formatDim(parseDim(prev, fromUnit), newUnit) : '');
    setHeight(prev => prev ? formatDim(parseDim(prev, fromUnit), newUnit) : '');
    setUnit(newUnit);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name,
      width_mm: parseDim(width, unit),
      depth_mm: parseDim(depth, unit),
      height_mm: parseDim(height, unit),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 19gal Tote" required />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Unit:</span>
        <UnitToggle value={unit} onChange={switchUnit} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[['Width', width, setWidth], ['Depth', depth, setDepth], ['Height', height, setHeight]].map(([label, val, setter]) => (
          <div key={label}>
            <label className="text-sm font-medium text-muted-foreground">{label} ({unit})</label>
            <Input type="number" step="any" value={val} onChange={(e) => setter(e.target.value)} required />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm"><Check className="h-4 w-4 mr-1" />Save</Button>
        {onCancel && <Button type="button" variant="outline" size="sm" onClick={onCancel}><X className="h-4 w-4 mr-1" />Cancel</Button>}
      </div>
    </form>
  );
}

// ─── Types Tab ───────────────────────────────────────────────

function TypesTab() {
  const [binTypes, setBinTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [displayUnit, setDisplayUnit] = useState('in');

  const fetchBinTypes = async () => {
    try {
      const res = await binTypesAPI.getAll();
      const sorted = [...res.data].sort((a, b) => volumeMm3(b) - volumeMm3(a));
      setBinTypes(sorted);
    } catch {
      setError('Failed to load bin types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBinTypes(); }, []);

  const handleCreate = async (data) => {
    try {
      await binTypesAPI.create(data);
      setShowForm(false);
      fetchBinTypes();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create bin type');
    }
  };

  const handleUpdate = async (data) => {
    try {
      await binTypesAPI.update(editingId, data);
      setEditingId(null);
      fetchBinTypes();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update bin type');
    }
  };

  const handleDelete = async (id) => {
    try {
      await binTypesAPI.delete(id);
      fetchBinTypes();
    } catch {
      setError('Failed to delete bin type');
    }
  };

  const handleImageUpload = async (id, file) => {
    try {
      await binTypesAPI.uploadImage(id, file);
      fetchBinTypes();
    } catch {
      setError('Failed to upload image');
    }
  };

  const handleImageRemove = async (id) => {
    try {
      await binTypesAPI.deleteImage(id);
      fetchBinTypes();
    } catch {
      setError('Failed to remove image');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UnitToggle value={displayUnit} onChange={setDisplayUnit} />
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4 mr-1" />New Bin Type
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm flex justify-between items-center">
          {error}
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-lg">New Bin Type</CardTitle></CardHeader>
          <CardContent>
            <BinTypeForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : binTypes.length === 0 && !showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>No bin types yet</CardTitle>
            <CardDescription>Create a bin type to define standard container dimensions.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {binTypes.map((bt) => (
            <Card key={bt.id} className="overflow-hidden">
              {editingId === bt.id ? (
                <CardContent className="pt-6">
                  <BinTypeForm initial={bt} onSave={handleUpdate} onCancel={() => setEditingId(null)} />
                </CardContent>
              ) : (
                <>
                  {bt.image_data ? (
                    <div className="relative group">
                      <img src={bt.image_data} alt={bt.name} className="w-full h-44 object-contain bg-muted p-2" />
                      <button
                        onClick={() => handleImageRemove(bt.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <ImageUpload onUpload={(file) => handleImageUpload(bt.id, file)} />
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{bt.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(bt.id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(bt.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">
                        {formatDim(bt.width_mm, displayUnit)} × {formatDim(bt.depth_mm, displayUnit)} × {formatDim(bt.height_mm, displayUnit)}
                      </span>
                      <Badge variant="secondary">{displayUnit}</Badge>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Inventory Tab ───────────────────────────────────────────

function computeStackLevel(bin, allBins) {
  // Count how many bins are below this one via bottom_id chain
  const binById = Object.fromEntries(allBins.map(b => [b.id, b]));
  let level = 1;
  let current = bin;
  while (current.bottom_id && binById[current.bottom_id]) {
    level++;
    current = binById[current.bottom_id];
  }
  return level;
}

function InventoryTab() {
  const navigate = useNavigate();
  const [bins, setBins] = useState([]);
  const [binTypes, setBinTypes] = useState([]);
  const [stacks, setStacks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBinTypeId, setNewBinTypeId] = useState('');
  const [newBinName, setNewBinName] = useState('');

  const fetchData = async () => {
    try {
      const [binsRes, typesRes, roomsRes] = await Promise.all([
        binsAPI.getAll(),
        binTypesAPI.getAll(),
        roomsAPI.getAll(),
      ]);
      setBins(binsRes.data);
      setBinTypes(typesRes.data);
      setRooms(roomsRes.data);
      // Fetch stacks for all rooms
      const allStacks = [];
      for (const room of roomsRes.data) {
        const stacksRes = await stacksAPI.getAll(room.id);
        allStacks.push(...stacksRes.data);
      }
      setStacks(allStacks);
    } catch {
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newBinTypeId) return;
    try {
      await binsAPI.create({
        name: newBinName || binTypes.find(bt => bt.id === parseInt(newBinTypeId))?.name || 'Unnamed Bin',
        bin_type_id: parseInt(newBinTypeId),
      });
      setDialogOpen(false);
      setNewBinTypeId('');
      setNewBinName('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create bin');
    }
  };

  const handleDelete = async (binId) => {
    try {
      await binsAPI.delete(binId);
      fetchData();
    } catch {
      setError('Failed to delete bin');
    }
  };

  const typeLookup = Object.fromEntries(binTypes.map(bt => [bt.id, bt]));
  const stackLookup = Object.fromEntries(stacks.map(s => [s.id, s]));

  const getLocation = (bin) => {
    if (!bin.stack_id) return 'Unassigned';
    const stack = stackLookup[bin.stack_id];
    if (!stack) return 'Unassigned';
    const level = computeStackLevel(bin, bins);
    return `${stack.position} - level ${level}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />Add Bin
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm flex justify-between items-center">
          {error}
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : bins.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No bins yet</CardTitle>
            <CardDescription>Add a bin to start tracking your inventory.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">ID</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Name</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Type</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Location</th>
                <th className="h-10 px-4 text-right font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {bins.map((bin) => {
                const bt = typeLookup[bin.bin_type_id];
                return (
                  <tr key={bin.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/bins/${bin.bin_id}`)}>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="font-mono">{bin.bin_id}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{bin.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{bt?.name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {getLocation(bin)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDelete(bin.bin_id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Add New Bin</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form id="new-bin-form" onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Bin Type *</label>
              <Select value={newBinTypeId} onChange={(e) => setNewBinTypeId(e.target.value)} required>
                <option value="">Select a type...</option>
                {binTypes.map(bt => (
                  <option key={bt.id} value={bt.id}>{bt.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Name (optional)</label>
              <Input
                value={newBinName}
                onChange={(e) => setNewBinName(e.target.value)}
                placeholder="e.g. Kitchen Gadgets"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave blank to use the bin type name</p>
            </div>
          </form>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button type="submit" size="sm" form="new-bin-form">Create</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

// ─── Main Page with SubNav ───────────────────────────────────

function BinsPage() {
  const [tab, setTab] = useState('inventory');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Bins</h1>
      </div>

      <div className="flex border-b border-border">
        {[
          { key: 'inventory', label: 'Inventory', icon: Package },
          { key: 'types', label: 'Types', icon: Ruler },
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

      {tab === 'types' ? <TypesTab /> : <InventoryTab />}
    </div>
  );
}

export default BinsPage;
