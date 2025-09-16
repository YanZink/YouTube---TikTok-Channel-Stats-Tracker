const axios = require('axios');

class YouTubeAPI {
  async searchChannelByUsername(username) {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=@${username}&key=${apiKey}`;
      console.log('🔍 Searching channel:', `@${username}`);
      const response = await axios.get(searchUrl);

      if (response.data.items.length > 0) {
        return response.data.items[0].id.channelId;
      }
      return null;
    } catch (error) {
      console.error('Search API Error:', error.message);
      return null;
    }
  }
  async getChannelStats(channelId) {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`; // Добавь эту строку!

      console.log('🔑 API Key exists:', !!apiKey);
      console.log('🌐 Requesting URL:', url.replace(apiKey, '***')); // Mask the key

      const response = await axios.get(url);
      const data = response.data;

      console.log('📊 API Response:', JSON.stringify(data, null, 2)); // Full answer

      if (data.items && data.items.length > 0) {
        const channel = data.items[0];
        console.log('✅ Channel found:', channel.snippet.title);
        return {
          id: channelId,
          name: channel.snippet.title,
          subscribers: parseInt(channel.statistics.subscriberCount),
          views: parseInt(channel.statistics.viewCount),
          videos: parseInt(channel.statistics.videoCount),
        };
      } else {
        console.log('❌ No channel found for ID:', channelId);
        return null;
      }
    } catch (error) {
      console.error('❌ YouTube API Error:', error.message);
      console.error('Error details:', error.response?.data); // Error details
      return null;
    }
  }
}

module.exports = new YouTubeAPI();
