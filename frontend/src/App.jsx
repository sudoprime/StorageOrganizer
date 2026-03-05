import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Package, Search, QrCode, Home, MapPin, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';
import BinsPage from './pages/BinsPage';
import BinDetailPage from './pages/BinDetailPage';
import SearchPage from './pages/SearchPage';
import InventoryPage from './pages/InventoryPage';
import QRScannerPage from './pages/QRScannerPage';

function NavLink({ to, children, icon: Icon }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-primary-foreground/10 text-white"
          : "text-slate-300 hover:text-white hover:bg-primary-foreground/5"
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Link>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <nav className="bg-slate-800 border-b border-slate-700">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <Link to="/" className="text-white font-bold text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                StorageOrganizer
              </Link>
              <div className="flex items-center gap-1">
                <NavLink to="/" icon={Home}>Home</NavLink>
                <NavLink to="/rooms" icon={MapPin}>Rooms</NavLink>
                <NavLink to="/bins" icon={Package}>Bins</NavLink>
                <NavLink to="/inventory" icon={ClipboardList}>Inventory</NavLink>
                <NavLink to="/search" icon={Search}>Search</NavLink>
                <NavLink to="/scan" icon={QrCode}>Scan</NavLink>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/bins" element={<BinsPage />} />
            <Route path="/bins/:binId" element={<BinDetailPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/scan" element={<QRScannerPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
