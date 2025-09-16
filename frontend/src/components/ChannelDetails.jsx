import React, { useEffect, useState } from 'react';
import { ArrowLeft, Youtube, Music2, Trash2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import './ChannelDetails.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ChannelDetails = ({ channel, onBack, onChannelDeleted }) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchChannelStats = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/stats/${channel.id}`
        );
        const data = await response.json();

        const validStats = data.filter((stat) => {
          const hasValidDate =
            stat.recorded_at && !isNaN(new Date(stat.recorded_at).getTime());

          return hasValidDate;
        });

        setStats(validStats);
        setLoading(false);
      } catch (error) {
        console.error('Error loading statistics:', error);
        setLoading(false);
      }
    };

    fetchChannelStats();
  }, [channel.id]);

  const handleDeleteChannel = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/channels/${channel.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete channel');
      }

      // Close the modal window and the detail page
      setShowDeleteModal(false);

      // Call the callback to update the list of channels in the Dashboard
      if (typeof onChannelDeleted === 'function') {
        onChannelDeleted(channel.id);
      }

      // Go back
      onBack();
    } catch (error) {
      console.error('Error deleting channel:', error);
      alert('Error deleting channel: ' + error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatFullNumber = (num) => {
    if (!num || num === 0) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getYAxisBounds = (data, padding = 0.1) => {
    if (!data || data.length === 0) return { min: 0, max: 100 };

    const validValues = data.filter(
      (val) => val !== null && val !== undefined && !isNaN(val)
    );
    if (validValues.length === 0) return { min: 0, max: 100 };

    const min = Math.min(...validValues);
    const max = Math.max(...validValues);

    if (min === max) {
      if (min === 0) return { min: 0, max: 10 };
      return {
        min: Math.max(0, min * 0.95),
        max: min * 1.05,
      };
    }

    const range = max - min;
    const paddingValue = range * padding;

    return {
      min: Math.max(0, min - paddingValue),
      max: max + paddingValue,
    };
  };

  const prepareChartData = (dataKey, label, color) => {
    const data = stats.map((s) => s[dataKey] || 0);
    const bounds = getYAxisBounds(data);

    return {
      chartData: {
        labels: stats.map((s) => formatDateTime(s.recorded_at)),
        datasets: [
          {
            label: label,
            data: data,
            borderColor: color,
            backgroundColor: color + '20',
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      yAxisBounds: bounds,
    };
  };

  const createChartOptions = (yAxisBounds, dataKey) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${formatFullNumber(context.raw)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
        },
      },
      y: {
        min: yAxisBounds.min,
        max: yAxisBounds.max,
        ticks: {
          callback: (value) => {
            if (dataKey === 'videos') {
              return Math.round(value).toString();
            }
            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
            return Math.round(value).toString();
          },
        },
      },
    },
  });

  const lastUpdate =
    stats.length > 0
      ? new Date(stats[stats.length - 1].recorded_at).toLocaleString()
      : 'N/A';

  // Check for data availability for each chart type
  const hasSubscribersData = stats.some(
    (s) => s.subscribers !== null && s.subscribers !== undefined
  );
  const hasViewsData = stats.some(
    (s) => s.total_views !== null && s.total_views !== undefined
  );
  const hasVideosData = stats.some(
    (s) => s.videos !== null && s.videos !== undefined
  );
  const hasLikesData = stats.some(
    (s) => s.likes !== null && s.likes !== undefined
  );

  const subscribersChart = prepareChartData(
    'subscribers',
    'Subscribers',
    '#FF0000'
  );
  const viewsChart = prepareChartData('total_views', 'Views', '#1a73e8');
  const videosChart = prepareChartData('videos', 'Videos', '#34A853');
  const likesChart = prepareChartData('likes', 'Likes', '#FF69B4');

  return (
    <div className="channel-details">
      <button className="btn-back" onClick={onBack}>
        <ArrowLeft size={20} />
        Back to Dashboard
      </button>

      <div className="details-header">
        <div className="details-title">
          {channel.platform === 'youtube' ? (
            <Youtube className="platform-icon youtube" />
          ) : (
            <Music2 className="platform-icon tiktok" />
          )}
          <h1>Channel Details - {channel.name}</h1>
        </div>

        {/* Delete button */}
        <button
          className="btn-delete-channel"
          onClick={() => setShowDeleteModal(true)}
          disabled={loading}
        >
          <Trash2 size={18} />
          Delete Channel
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading statistics...</div>
      ) : (
        <>
          <div className="current-stats">
            <div className="stat-card">
              <span className="stat-label">Subscribers:</span>
              <span className="stat-value">
                {formatFullNumber(channel.subscribers)}
              </span>
            </div>

            {/* DISPLAY FOR DIFFERENT PLATFORMS */}
            {channel.platform === 'youtube' ? (
              <>
                <div className="stat-card">
                  <span className="stat-label">Views:</span>
                  <span className="stat-value">
                    {formatFullNumber(channel.views)}
                  </span>
                </div>
                {channel.videos > 0 && (
                  <div className="stat-card">
                    <span className="stat-label">Videos:</span>
                    <span className="stat-value">
                      {formatFullNumber(channel.videos)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="stat-card">
                <span className="stat-label">Likes:</span>
                <span className="stat-value">
                  {formatFullNumber(channel.likes)}
                </span>
              </div>
            )}
          </div>

          <div className="last-update">Last updated: {lastUpdate}</div>

          {stats.length === 0 ? (
            <div className="no-data">
              No historical data available. Statistics will appear after the
              next hourly collection.
            </div>
          ) : (
            <div className="charts-container">
              {hasSubscribersData && (
                <div className="chart-wrapper">
                  <h3>Subscribers Over Time</h3>
                  <div className="chart">
                    <Line
                      data={subscribersChart.chartData}
                      options={createChartOptions(
                        subscribersChart.yAxisBounds,
                        'subscribers'
                      )}
                    />
                  </div>
                </div>
              )}

              {channel.platform === 'youtube' ? (
                <>
                  {hasViewsData && (
                    <div className="chart-wrapper">
                      <h3>Views Over Time</h3>
                      <div className="chart">
                        <Line
                          data={viewsChart.chartData}
                          options={createChartOptions(
                            viewsChart.yAxisBounds,
                            'total_views'
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {hasVideosData && (
                    <div className="chart-wrapper">
                      <h3>Videos Over Time</h3>
                      <div className="chart">
                        <Line
                          data={videosChart.chartData}
                          options={createChartOptions(
                            videosChart.yAxisBounds,
                            'videos'
                          )}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                hasLikesData && (
                  <div className="chart-wrapper">
                    <h3>Likes Over Time</h3>
                    <div className="chart">
                      <Line
                        data={likesChart.chartData}
                        options={createChartOptions(
                          likesChart.yAxisBounds,
                          'likes'
                        )}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </>
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteChannel}
        channelName={channel.name}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ChannelDetails;
