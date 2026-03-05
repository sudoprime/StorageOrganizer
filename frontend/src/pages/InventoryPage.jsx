import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { itemsAPI, binsAPI, stacksAPI, roomsAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZE = 50;

function computeStackLevel(bin, allBins) {
  const binById = Object.fromEntries(allBins.map(b => [b.id, b]));
  let level = 1;
  let current = bin;
  while (current.bottom_id && binById[current.bottom_id]) {
    level++;
    current = binById[current.bottom_id];
  }
  return level;
}

function InventoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [bins, setBins] = useState([]);
  const [stacks, setStacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPage = async (p) => {
    setLoading(true);
    try {
      const [itemsRes, countRes, binsRes, roomsRes] = await Promise.all([
        itemsAPI.getAll({ skip: p * PAGE_SIZE, limit: PAGE_SIZE }),
        itemsAPI.count(),
        binsAPI.getAll(),
        roomsAPI.getAll(),
      ]);
      setItems(itemsRes.data);
      setTotal(countRes.data.count);
      setBins(binsRes.data);
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

  useEffect(() => { fetchPage(page); }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const binLookup = Object.fromEntries(bins.map(b => [b.id, b]));
  const stackLookup = Object.fromEntries(stacks.map(s => [s.id, s]));

  const getItemLocation = (item) => {
    const bin = binLookup[item.bin_id];
    if (!bin) return { binId: '—', location: '—' };
    if (!bin.stack_id) return { binId: bin.bin_id, location: 'Unassigned' };
    const stack = stackLookup[bin.stack_id];
    if (!stack) return { binId: bin.bin_id, location: 'Unassigned' };
    const level = computeStackLevel(bin, bins);
    return { binId: bin.bin_id, location: `${stack.position} - level ${level}` };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <span className="text-sm text-muted-foreground">{total} item{total !== 1 ? 's' : ''}</span>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm flex justify-between items-center">
          {error}
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No items yet. Add items from within a bin.</p>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Name</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Qty</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Category</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Bin</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Location</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const { binId, location } = getItemLocation(item);
                  return (
                    <tr
                      key={item.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => binId !== '—' ? navigate(`/bins/${binId}`) : undefined}
                    >
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.quantity}</td>
                      <td className="px-4 py-3">
                        {item.category ? (
                          <Badge variant="secondary">{item.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono text-xs">{binId}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{location}</td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-0">{item.description || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />Prev
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default InventoryPage;
