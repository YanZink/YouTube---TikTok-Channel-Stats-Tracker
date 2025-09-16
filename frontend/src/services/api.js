const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  // get all channels
  async getChannels() {
    const response = await fetch(`${API_BASE_URL}/channels`);
    if (!response.ok) throw new Error('Failed to fetch channels');
    return response.json();
  }

  async addChannel(platform, url) {
    const response = await fetch(`${API_BASE_URL}/channels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform,
        url,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to add channel');
    }

    return response.json();
  }

  async deleteChannel(id) {
    const response = await fetch(`${API_BASE_URL}/channels/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete channel');
    return response.json();
  }

  async getChannelStats(channelId, period = '7d') {
    const response = await fetch(
      `${API_BASE_URL}/stats/${channelId}?period=${period}`
    );
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new ApiService();
