import { Link } from 'react-router-dom';
import { Package, Search, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">StorageOrganizer</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          QR code-based inventory management for your storage units
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
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

        <Card>
          <CardHeader>
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

        <Card>
          <CardHeader>
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

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
          <CardDescription>Your inventory dashboard will appear here</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default HomePage;
