import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Search, QrCode, Home, MapPin, ClipboardList, LogOut, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import HoardLogo from './components/HoardLogo';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';
import BinsPage from './pages/BinsPage';
import BinDetailPage from './pages/BinDetailPage';
import SearchPage from './pages/SearchPage';
import InventoryPage from './pages/InventoryPage';
import QRScannerPage from './pages/QRScannerPage';

function NavLink({ to, children, icon: Icon }) {
  const location = useLocation();
  const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-white/10 text-white"
          : "text-neutral-400 hover:text-white hover:bg-white/5"
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Link>
  );
}

function AuthenticatedApp({ onLogout }) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-neutral-900 border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center">
              <HoardLogo size="sm" />
            </Link>
            <div className="flex items-center gap-1">
              <NavLink to="/" icon={Home}>Home</NavLink>
              <NavLink to="/rooms" icon={MapPin}>Rooms</NavLink>
              <NavLink to="/bins" icon={Package}>Bins</NavLink>
              <NavLink to="/inventory" icon={ClipboardList}>Inventory</NavLink>
              <NavLink to="/search" icon={Search}>Search</NavLink>
              <NavLink to="/scan" icon={QrCode}>Scan</NavLink>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:roomId/:tab" element={<RoomsPage />} />
          <Route path="/rooms/:roomId" element={<RoomsPage />} />
          <Route path="/bins" element={<BinsPage />} />
          <Route path="/bins/:binId" element={<BinDetailPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/scan" element={<QRScannerPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [authenticated, setAuthenticated] = useState(() => !!localStorage.getItem('auth_token'));

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setAuthenticated(false);
  };

  return (
    <Router>
      {authenticated ? (
        <AuthenticatedApp onLogout={handleLogout} />
      ) : (
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={() => setAuthenticated(true)} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
