import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="home-page">
      <div className="hero">
        <h1>StorageOrganizer</h1>
        <p>QR code-based inventory management for your storage units</p>
      </div>

      <div className="features">
        <div className="feature-card">
          <h2>Organize Your Storage</h2>
          <p>Track bins, containers, and items with QR codes</p>
          <Link to="/bins" className="btn btn-primary">View Bins</Link>
        </div>

        <div className="feature-card">
          <h2>Search Everything</h2>
          <p>Find any item across all your storage units</p>
          <Link to="/search" className="btn btn-primary">Search Items</Link>
        </div>

        <div className="feature-card">
          <h2>Scan QR Codes</h2>
          <p>Quickly access bin contents with your phone camera</p>
          <Link to="/scan" className="btn btn-primary">Scan QR Code</Link>
        </div>
      </div>

      <div className="quick-stats">
        <h2>Quick Stats</h2>
        <p>Your inventory dashboard will appear here</p>
      </div>
    </div>
  );
}

export default HomePage;
