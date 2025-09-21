import React, { useState, useEffect } from 'react';
import { Youtube, Music2 } from 'lucide-react';
import AddChannelModal from './AddChannelModal';
import ChannelDetails from './ChannelDetails';
import './Dashboard.css';

const Dashboard = () => {
  const [channels, setChannels] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingChannelId, setDeletingChannelId] = useState(null);
  const [isAddingChannel, setIsAddingChannel] = useState(false);

  useEffect(() => {
    fetchChannels();
    // Update every 30 seconds
    const interval = setInterval(fetchChannels, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/channels`);
      const data = await response.json();
      setChannels(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading channels:', error);
      setLoading(false);
    }
  };

  // Format number
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleChannelAdded = async (responseData) => {
    setIsAddingChannel(true);
    try {
      await fetchChannels(); // Reload the entire list
      setShowAddModal(false);
    } catch (error) {
      console.error('Error refreshing channels:', error);
    } finally {
      setIsAddingChannel(false);
    }
  };

  const handleViewDetails = async (channel) => {
    try {
      // Loading full channel statistics
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/stats/${channel.id}`
      );
      const stats = await response.json();
      setSelectedChannel({ ...channel, stats });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleChannelDeleted = (deletedChannelId) => {
    setChannels((prev) =>
      prev.filter((channel) => channel.id !== deletedChannelId)
    );

    // If the channel being deleted was opened in detail, close it
    if (selectedChannel && selectedChannel.id === deletedChannelId) {
      setSelectedChannel(null);
    }

    // Reset the deletion state
    setDeletingChannelId(null);
  };

  if (selectedChannel) {
    return (
      <ChannelDetails
        channel={selectedChannel}
        onBack={() => setSelectedChannel(null)}
        onChannelDeleted={handleChannelDeleted}
      />
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Channel Stats Tracker</h1>
        <button
          className="btn-add-channel"
          onClick={() => setShowAddModal(true)}
        >
          Add Channel
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading channels...</div>
      ) : (
        <div className="channels-grid">
          {channels.map((channel) => (
            <div key={channel.id} className="channel-card">
              <div className="channel-header">
                {channel.platform === 'youtube' ? (
                  <Youtube className="platform-icon youtube" />
                ) : (
                  <Music2 className="platform-icon tiktok" />
                )}
                <span className="channel-name">{channel.name}</span>
              </div>

              <div className="channel-stats">
                <div className="stat-item">
                  <span className="stat-label">Subscribers:</span>
                  <span className="stat-value">
                    {formatNumber(channel.subscribers)}
                  </span>
                </div>

                {/* DISPLAY FOR DIFFERENT PLATFORMS */}
                {channel.platform === 'youtube' ? (
                  <>
                    <div className="stat-item">
                      <span className="stat-label">Views:</span>
                      <span className="stat-value">
                        {formatNumber(channel.views)}
                      </span>
                    </div>
                    {channel.videos > 0 && (
                      <div className="stat-item">
                        <span className="stat-label">Videos:</span>
                        <span className="stat-value">
                          {formatNumber(channel.videos)}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  // FOR TIKTOK WE SHOW ONLY LIKES
                  <div className="stat-item">
                    <span className="stat-label">Likes:</span>
                    <span className="stat-value">
                      {formatNumber(channel.likes)}
                    </span>
                  </div>
                )}
              </div>

              <button
                className="btn-view-details"
                onClick={() => handleViewDetails(channel)}
                disabled={deletingChannelId === channel.id}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {isAddingChannel && (
        <div className="adding-loading">
          <div className="spinner"></div>
          Adding channel...
        </div>
      )}

      {showAddModal && (
        <AddChannelModal
          onClose={() => setShowAddModal(false)}
          onChannelAdded={handleChannelAdded}
        />
      )}
    </div>
  );
};

export default Dashboard;
