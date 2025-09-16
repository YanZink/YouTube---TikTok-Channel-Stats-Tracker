const YouTubeAPI = require('./youtube-api');

class YouTubeService {
  async getChannelInfo(channelInput) {
    console.log('🔄 Using YouTube API for:', channelInput);

    // Remove @ if present
    let username = channelInput.replace('@', '');

    // 1. Search channelId by username (WITHOUT substring(1)!)
    const channelId = await YouTubeAPI.searchChannelByUsername(username);

    if (!channelId) {
      console.log('❌ Channel not found for:', username);
      return this.getFallbackData(channelInput);
    }
    console.log('✅ Found channel ID:', channelId, 'for', username);

    // 2. Get statistics on the found channelId
    try {
      const apiResult = await YouTubeAPI.getChannelStats(channelId);
      if (apiResult) {
        console.log('✅ YouTube API success:', apiResult);
        return apiResult;
      }
    } catch (error) {
      console.error('❌ YouTube API failed:', error.message);
    }

    return this.getFallbackData(channelInput);
  }

  getFallbackData(channelId) {
    return {
      id: channelId,
      name: `@${channelId}`,
      subscribers: 0,
      views: 0,
      videos: 0,
    };
  }
}

module.exports = new YouTubeService();
