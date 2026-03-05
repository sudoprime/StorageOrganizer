import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';
import BinsPage from './pages/BinsPage';
import BinDetailPage from './pages/BinDetailPage';
import SearchPage from './pages/SearchPage';
import QRScannerPage from './pages/QRScannerPage';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              StorageOrganizer
            </Link>
            <ul className="nav-menu">
              <li className="nav-item">
                <Link to="/" className="nav-link">Home</Link>
              </li>
              <li className="nav-item">
                <Link to="/rooms" className="nav-link">Rooms</Link>
              </li>
              <li className="nav-item">
                <Link to="/bins" className="nav-link">Bins</Link>
              </li>
              <li className="nav-item">
                <Link to="/search" className="nav-link">Search</Link>
              </li>
              <li className="nav-item">
                <Link to="/scan" className="nav-link">Scan QR</Link>
              </li>
            </ul>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/bins" element={<BinsPage />} />
            <Route path="/bins/:binId" element={<BinDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/scan" element={<QRScannerPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
