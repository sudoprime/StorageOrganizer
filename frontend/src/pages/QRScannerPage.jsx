import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function QRScannerPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">QR Scanner</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>QR scanner (requires HTTPS for camera access) is under development.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default QRScannerPage;
