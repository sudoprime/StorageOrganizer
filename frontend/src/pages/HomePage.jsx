import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, QrCode, MapPin, ClipboardList, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { binsAPI, itemsAPI, roomsAPI } from '../services/api';

function HomePage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const [binsRes, itemsRes, roomsRes] = await Promise.all([
          binsAPI.getAll(),
          itemsAPI.count(),
          roomsAPI.getAll(),
        ]);
        const binCount = binsRes.data.length;
        const itemCount = itemsRes.data.count;
        const roomCount = roomsRes.data.length;
        setStats({
          bins: binCount,
          items: itemCount,
          rooms: roomCount,
          itemsPerBin: binCount > 0 ? (itemCount / binCount).toFixed(1) : '0',
        });
      } catch {
        // stats are non-critical
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader className="flex-1">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Organize Your Storage</CardTitle>
            </div>
            <CardDescription>Track bins, containers, and items with QR codes</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/bins">View Bins</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex-1">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Search Everything</CardTitle>
            </div>
            <CardDescription>Find any item across all your storage units</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/search">Search Items</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex-1">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Scan QR Codes</CardTitle>
            </div>
            <CardDescription>Quickly access bin contents with your phone camera</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/scan">Scan QR Code</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.rooms}</p>
                  <p className="text-sm text-muted-foreground">Rooms</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.bins}</p>
                  <p className="text-sm text-muted-foreground">Bins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.items}</p>
                  <p className="text-sm text-muted-foreground">Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.itemsPerBin}</p>
                  <p className="text-sm text-muted-foreground">Items / Bin</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default HomePage;
