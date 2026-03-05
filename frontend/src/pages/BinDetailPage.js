import React from 'react';
import { useParams } from 'react-router-dom';

function BinDetailPage() {
  const { binId } = useParams();
  
  return (
    <div className="bin-detail-page">
      <h1>Bin Details: {binId}</h1>
      <p>Bin details coming soon...</p>
    </div>
  );
}

export default BinDetailPage;
