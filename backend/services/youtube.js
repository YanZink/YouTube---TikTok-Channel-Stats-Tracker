const YouTubeAPI = require('./youtube-api');

class YouTubeService {
  async getChannelInfo(channelInput) {
    console.log('Using YouTube API for:', channelInput);

    let username = channelInput.replace('@', '');

    // Search for channel ID
    const channelId = await YouTubeAPI.searchChannelByUsername(username);
    if (!channelId) {
      throw new Error(`Channel not found: ${username}`);
    }

    console.log('Found channel ID:', channelId, 'for', username);

    // Get channel statistics
    const apiResult = await YouTubeAPI.getChannelStats(channelId);
    if (!apiResult) {
      throw new Error(`Failed to get channel stats for: ${channelId}`);
    }

    console.log('YouTube API success:', apiResult);
    return apiResult;
  }
}

module.exports = new YouTubeService();
