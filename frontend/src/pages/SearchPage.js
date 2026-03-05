import React, { useState } from 'react';
import { itemsAPI } from '../services/api';
import { Link } from 'react-router-dom';

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
    <div className="search-page">
      <h1>Search Items</h1>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search for items..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {results.length > 0 && (
        <div className="search-results">
          <h2>Results ({results.length})</h2>
          {results.map((result) => (
            <div key={result.item.id} className="search-result-item">
              <div className="result-item-info">
                <h3>{result.item.name}</h3>
                <p className="item-quantity">Quantity: {result.item.quantity}</p>
                {result.item.category && (
                  <span className="item-category">{result.item.category}</span>
                )}
                {result.item.description && (
                  <p className="item-description">{result.item.description}</p>
                )}
              </div>

              <div className="result-location">
                <h4>Location:</h4>
                {result.room && <p>Room: {result.room.name}</p>}
                <p>
                  Bin: <Link to={`/bins/${result.bin.bin_id}`}>{result.bin.name}</Link> ({result.bin.bin_id})
                </p>
                {result.bin.location_description && (
                  <p>Position: {result.bin.location_description}</p>
                )}
                {result.container && (
                  <p>Container: {result.container.name} ({result.container.container_id})</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && query && (
        <div className="no-results">
          <p>No items found matching "{query}"</p>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
