import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { itemsAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await itemsAPI.search(query);
      setResults(response.data);
    } catch (err) {
      setError('Failed to search items. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Search Items</h1>

      <form onSubmit={handleSearch} className="flex gap-3">
        <Input
          type="text"
          placeholder="Search for items..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </form>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Results ({results.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {results.map((result) => (
              <div key={result.item.id} className="py-4 first:pt-0 last:pb-0 grid md:grid-cols-[2fr_1fr] gap-4">
                <div>
                  <h3 className="font-semibold">{result.item.name}</h3>
                  <p className="text-sm text-muted-foreground">Qty: {result.item.quantity}</p>
                  {result.item.category && (
                    <Badge variant="secondary" className="mt-1">{result.item.category}</Badge>
                  )}
                  {result.item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{result.item.description}</p>
                  )}
                </div>
                <div className="bg-muted rounded-md p-3 text-sm space-y-1">
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Location</p>
                  {result.room && <p>Room: {result.room.name}</p>}
                  {result.stack && <p>Position: {result.stack.position}</p>}
                  <p>
                    Bin:{' '}
                    <Link to={`/bins/${result.bin.bin_id}`} className="text-primary hover:underline">
                      {result.bin.name}
                    </Link>{' '}
                    <span className="text-muted-foreground">({result.bin.bin_id})</span>
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {results.length === 0 && !loading && query && (
        <div className="text-center py-12 text-muted-foreground">
          No items found matching "{query}"
        </div>
      )}
    </div>
  );
}

export default SearchPage;
