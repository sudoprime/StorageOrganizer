import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, X, Package, Pencil, Upload, Image as ImageIcon } from 'lucide-react';
import { binsAPI, itemsAPI, binTypesAPI, imagesAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function ImageGallery({ images, onUpload, onDelete, uploading }) {
  const fileRef = useRef(null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((img) => (
          <div key={img.id} className="relative group w-24 h-24 rounded-md overflow-hidden border bg-muted">
            <img src={img.url} alt={img.filename} className="w-full h-full object-cover" />
            <button
              onClick={() => onDelete(img.id)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-24 h-24 rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground/50 hover:border-muted-foreground/60 hover:text-muted-foreground/80 transition-colors"
        >
          {uploading ? (
            <span className="text-xs">...</span>
          ) : (
            <>
              <Upload className="h-5 w-5 mb-1" />
              <span className="text-xs">Upload</span>
            </>
          )}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            onUpload(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}

function BinDetailPage() {
  const { binId } = useParams();
  const navigate = useNavigate();
  const [bin, setBin] = useState(null);
  const [binType, setBinType] = useState(null);
  const [binTypes, setBinTypes] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingRow, setAddingRow] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingBin, setEditingBin] = useState(false);
  const [binDraft, setBinDraft] = useState({ name: '', bin_id: '', notes: '', bin_type_id: '' });
  const nameRef = useRef(null);

  const [binImages, setBinImages] = useState([]);
  const [itemImages, setItemImages] = useState({});
  const [uploadingBin, setUploadingBin] = useState(false);
  const [uploadingItem, setUploadingItem] = useState(null);

  const emptyRow = { name: '', quantity: 1, category: '', description: '' };
  const [draft, setDraft] = useState(emptyRow);

  const fetchBin = async () => {
    try {
      const [res, typesRes] = await Promise.all([
        binsAPI.getOne(binId),
        binTypesAPI.getAll(),
      ]);
      setBin(res.data);
      setBinTypes(typesRes.data);
      const bt = typesRes.data.find(t => t.id === res.data.bin_type_id);
      setBinType(bt || null);
      setItems(res.data.items || []);
    } catch {
      setError('Bin not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchBinImages = async (dbBinId) => {
    try {
      const res = await imagesAPI.getForBin(dbBinId);
      setBinImages(res.data);
    } catch { /* ignore */ }
  };

  const fetchItemImages = async (itemId) => {
    try {
      const res = await imagesAPI.getForItem(itemId);
      setItemImages(prev => ({ ...prev, [itemId]: res.data }));
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchBin(); }, [binId]);

  useEffect(() => {
    if (bin) {
      fetchBinImages(bin.id);
      (bin.items || []).forEach(item => fetchItemImages(item.id));
    }
  }, [bin?.id]);

  useEffect(() => {
    if (addingRow && nameRef.current) nameRef.current.focus();
  }, [addingRow]);

  const handleUploadBinImage = async (file) => {
    setUploadingBin(true);
    try {
      await imagesAPI.upload(file, { bin_id: bin.id });
      await fetchBinImages(bin.id);
    } catch {
      setError('Failed to upload image');
    } finally {
      setUploadingBin(false);
    }
  };

  const handleUploadItemImage = async (itemId, file) => {
    setUploadingItem(itemId);
    try {
      await imagesAPI.upload(file, { item_id: itemId });
      await fetchItemImages(itemId);
    } catch {
      setError('Failed to upload image');
    } finally {
      setUploadingItem(null);
    }
  };

  const handleDeleteImage = async (imageId, binDbId, itemId) => {
    try {
      await imagesAPI.delete(imageId);
      if (binDbId) await fetchBinImages(binDbId);
      if (itemId) await fetchItemImages(itemId);
    } catch {
      setError('Failed to delete image');
    }
  };

  const handleStartEditBin = () => {
    setEditingBin(true);
    setBinDraft({
      name: bin.name,
      bin_id: bin.bin_id,
      notes: bin.notes || '',
      bin_type_id: bin.bin_type_id ? String(bin.bin_type_id) : '',
    });
  };

  const handleSaveBin = async () => {
    if (!binDraft.name.trim() || !binDraft.bin_id.trim()) return;
    try {
      const updateData = {
        name: binDraft.name,
        notes: binDraft.notes || null,
        bin_type_id: binDraft.bin_type_id ? parseInt(binDraft.bin_type_id) : null,
      };
      if (binDraft.bin_id !== bin.bin_id) {
        updateData.bin_id = binDraft.bin_id;
      }
      await binsAPI.update(bin.bin_id, updateData);
      setEditingBin(false);
      if (binDraft.bin_id !== bin.bin_id) {
        navigate(`/bins/${binDraft.bin_id}`, { replace: true });
      } else {
        fetchBin();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update bin');
    }
  };

  const handleAddRow = () => {
    setAddingRow(true);
    setEditingId(null);
    setDraft(emptyRow);
  };

  const handleSaveNew = async () => {
    if (!draft.name.trim()) return;
    try {
      await itemsAPI.create({
        name: draft.name,
        quantity: draft.quantity || 1,
        category: draft.category || null,
        description: draft.description || null,
        bin_id: bin.id,
      });
      setAddingRow(false);
      setDraft(emptyRow);
      fetchBin();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add item');
    }
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setAddingRow(false);
    setDraft({
      name: item.name,
      quantity: item.quantity || 1,
      category: item.category || '',
      description: item.description || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!draft.name.trim()) return;
    try {
      await itemsAPI.update(editingId, {
        name: draft.name,
        quantity: draft.quantity || 1,
        category: draft.category || null,
        description: draft.description || null,
      });
      setEditingId(null);
      setDraft(emptyRow);
      fetchBin();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update item');
    }
  };

  const handleDelete = async (id) => {
    try {
      await itemsAPI.delete(id);
      fetchBin();
    } catch {
      setError('Failed to delete item');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editingId) handleSaveEdit();
      else handleSaveNew();
    }
    if (e.key === 'Escape') {
      setAddingRow(false);
      setEditingId(null);
      setDraft(emptyRow);
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (error && !bin) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/bins')}>
          <ArrowLeft className="h-4 w-4 mr-1" />Back to Bins
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/bins')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          {editingBin ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                  <Input
                    value={binDraft.name}
                    onChange={(e) => setBinDraft(d => ({ ...d, name: e.target.value }))}
                    placeholder="Bin name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Bin ID</label>
                  <Input
                    value={binDraft.bin_id}
                    onChange={(e) => setBinDraft(d => ({ ...d, bin_id: e.target.value }))}
                    placeholder="BIN-XXXX"
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                  <Select
                    value={binDraft.bin_type_id}
                    onChange={(e) => setBinDraft(d => ({ ...d, bin_type_id: e.target.value }))}
                  >
                    <option value="">No type</option>
                    {binTypes.map(bt => (
                      <option key={bt.id} value={bt.id}>{bt.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                  <Input
                    value={binDraft.notes}
                    onChange={(e) => setBinDraft(d => ({ ...d, notes: e.target.value }))}
                    placeholder="Notes"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveBin}>
                  <Check className="h-4 w-4 mr-1" />Save
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingBin(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{bin.name}</h1>
                <Badge variant="outline" className="font-mono text-base">{bin.bin_id}</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleStartEditBin} title="Edit bin">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
              {binType && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {binType.name}
                </p>
              )}
              {bin.notes && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {bin.notes}
                </p>
              )}
            </>
          )}
        </div>
        {!editingBin && (
          <Button size="sm" onClick={handleAddRow} disabled={addingRow}>
            <Plus className="h-4 w-4 mr-1" />Add Item
          </Button>
        )}
      </div>

      {/* Bin Images */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4" />Bin Photos
        </h3>
        <ImageGallery
          images={binImages}
          onUpload={handleUploadBinImage}
          onDelete={(imgId) => handleDeleteImage(imgId, bin.id, null)}
          uploading={uploadingBin}
        />
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm flex justify-between items-center">
          {error}
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left font-medium text-muted-foreground w-[25%]">Name</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground w-[8%]">Qty</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground w-[15%]">Category</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground w-[27%]">Description</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground w-[15%]">Images</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground w-[10%]"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              editingId === item.id ? (
                <EditableRow
                  key={item.id}
                  draft={draft}
                  setDraft={setDraft}
                  onSave={handleSaveEdit}
                  onCancel={() => { setEditingId(null); setDraft(emptyRow); }}
                  onKeyDown={handleKeyDown}
                />
              ) : (
                <ItemRow
                  key={item.id}
                  item={item}
                  images={itemImages[item.id] || []}
                  uploadingItem={uploadingItem}
                  onStartEdit={handleStartEdit}
                  onDelete={handleDelete}
                  onUploadImage={handleUploadItemImage}
                  onDeleteImage={(imgId) => handleDeleteImage(imgId, null, item.id)}
                />
              )
            ))}
            {addingRow && (
              <EditableRow
                draft={draft}
                setDraft={setDraft}
                onSave={handleSaveNew}
                onCancel={() => { setAddingRow(false); setDraft(emptyRow); }}
                onKeyDown={handleKeyDown}
                nameRef={nameRef}
              />
            )}
            {items.length === 0 && !addingRow && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No items yet. Click "Add Item" to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ItemRow({ item, images, uploadingItem, onStartEdit, onDelete, onUploadImage, onDeleteImage }) {
  const fileRef = useRef(null);

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-medium cursor-pointer" onClick={() => onStartEdit(item)}>{item.name}</td>
      <td className="px-4 py-3 text-muted-foreground cursor-pointer" onClick={() => onStartEdit(item)}>{item.quantity}</td>
      <td className="px-4 py-3 text-muted-foreground cursor-pointer" onClick={() => onStartEdit(item)}>{item.category || '—'}</td>
      <td className="px-4 py-3 text-muted-foreground truncate max-w-0 cursor-pointer" onClick={() => onStartEdit(item)}>{item.description || '—'}</td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1 flex-wrap">
          {images.map((img) => (
            <div key={img.id} className="relative group w-8 h-8 rounded overflow-hidden border bg-muted flex-shrink-0">
              <img src={img.url} alt={img.filename} className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteImage(img.id); }}
                className="absolute top-0 right-0 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
          <button
            onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
            disabled={uploadingItem === item.id}
            className="w-8 h-8 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground/40 hover:border-muted-foreground/60 hover:text-muted-foreground/80 transition-colors flex-shrink-0"
          >
            {uploadingItem === item.id ? <span className="text-[10px]">...</span> : <Plus className="h-3 w-3" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                onUploadImage(item.id, e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  );
}

function EditableRow({ draft, setDraft, onSave, onCancel, onKeyDown, nameRef }) {
  return (
    <tr className="border-b last:border-0 bg-muted/20">
      <td className="px-3 py-2">
        <Input
          ref={nameRef}
          value={draft.name}
          onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))}
          onKeyDown={onKeyDown}
          placeholder="Item name"
          className="h-8"
        />
      </td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min="1"
          value={draft.quantity}
          onChange={(e) => setDraft(d => ({ ...d, quantity: parseInt(e.target.value) || 1 }))}
          onKeyDown={onKeyDown}
          className="h-8 w-16"
        />
      </td>
      <td className="px-3 py-2">
        <Input
          value={draft.category}
          onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))}
          onKeyDown={onKeyDown}
          placeholder="Category"
          className="h-8"
        />
      </td>
      <td className="px-3 py-2">
        <Input
          value={draft.description}
          onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
          onKeyDown={onKeyDown}
          placeholder="Description"
          className="h-8"
        />
      </td>
      <td className="px-3 py-2"></td>
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={onSave}>
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default BinDetailPage;
