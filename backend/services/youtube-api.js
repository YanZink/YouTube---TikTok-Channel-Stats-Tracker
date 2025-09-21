const axios = require('axios');

class YouTubeAPI {
  async searchChannelByUsername(username) {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=@${username}&key=${apiKey}`;
      console.log('Searching channel:', `@${username}`);

      const response = await axios.get(searchUrl);

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].id.channelId;
      }
      return null;
    } catch (error) {
      console.error('Search API Error:', error.message);

      // Throw specific errors for proper handling
      if (error.response?.status === 403) {
        throw new Error('YouTube API quota exceeded');
      }
      throw error;
    }
  }

  async getChannelStats(channelId) {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`;

      const response = await axios.get(url);
      const data = response.data;

      if (data.items && data.items.length > 0) {
        const channel = data.items[0];
        console.log('Channel found:', channel.snippet.title);

        return {
          id: channelId,
          name: channel.snippet.title,
          subscribers: parseInt(channel.statistics.subscriberCount || 0),
          views: parseInt(channel.statistics.viewCount || 0),
          videos: parseInt(channel.statistics.videoCount || 0),
        };
      } else {
        throw new Error(`No channel data found for ID: ${channelId}`);
      }
    } catch (error) {
      console.error('YouTube API Error:', error.message);

      // Handle quota errors specifically
      if (error.response?.status === 403) {
        throw new Error('YouTube API quota exceeded');
      }
      throw error;
    }
  }
}

module.exports = new YouTubeAPI();
