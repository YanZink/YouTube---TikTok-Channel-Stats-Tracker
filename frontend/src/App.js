import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import api from './services/api';
import './App.css';

function App() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Loading channels
  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const data = await api.getChannels();
      setChannels(data);
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChannel = async (id) => {
    try {
      await api.deleteChannel(id);
      await loadChannels();
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>YouTube & TikTok Tracker</h1>
      </header>

      <main>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <Dashboard channels={channels} onDelete={handleDeleteChannel} />
        )}
      </main>
    </div>
  );
}

export default App;
