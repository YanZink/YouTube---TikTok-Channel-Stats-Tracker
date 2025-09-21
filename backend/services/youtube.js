const YouTubeAPI = require('./youtube-api');
const db = require('../db/database');

class YouTubeService {
  async getChannelInfo(channelHandle) {
    console.log('🔄 Using YouTube API for:', channelHandle);

    try {
      // 1. Try to get cached real Channel ID from database
      const cachedChannelId = await this.getCachedChannelId(channelHandle);

      let realChannelId;
      if (cachedChannelId) {
        console.log('📋 Using cached Channel ID:', cachedChannelId);
        realChannelId = cachedChannelId;
      } else {
        // 2. Only search if not cached (first time only)
        console.log('🔍 First time search for:', channelHandle);
        realChannelId = await this.searchAndCacheChannelId(channelHandle);
      }

      // 3. Get statistics directly by Channel ID (1 quota unit instead of 100)
      const stats = await YouTubeAPI.getChannelStats(realChannelId);
      if (!stats) {
        throw new Error(`Failed to get stats for channel: ${realChannelId}`);
      }

      console.log('✅ YouTube API success for', channelHandle);
      return stats;
    } catch (error) {
      console.error(
        '❌ YouTube API failed for',
        channelHandle,
        ':',
        error.message
      );
      throw error;
    }
  }

  // Get cached Channel ID from database
  async getCachedChannelId(channelHandle) {
    try {
      const result = await db.query(
        'SELECT real_channel_id FROM channels WHERE channel_id = $1 AND platform = $2 AND real_channel_id IS NOT NULL',
        [channelHandle, 'youtube']
      );

      if (result.rows.length > 0 && result.rows[0].real_channel_id) {
        return result.rows[0].real_channel_id;
      }
    } catch (error) {
      console.error(
        '❌ Database error while getting cached Channel ID:',
        error.message
      );
    }
    return null;
  }

  // Search and cache Channel ID (only used once per channel)
  async searchAndCacheChannelId(channelHandle) {
    const username = channelHandle.replace('@', '');

    // Search for real Channel ID (100 quota units - but only once per channel!)
    const realChannelId = await YouTubeAPI.searchChannelByUsername(username);

    if (!realChannelId) {
      throw new Error(`Channel not found: ${username}`);
    }

    // Cache the real Channel ID in database for future use
    try {
      await db.query(
        'UPDATE channels SET real_channel_id = $1 WHERE channel_id = $2 AND platform = $3',
        [realChannelId, channelHandle, 'youtube']
      );
      console.log('💾 Cached Channel ID:', channelHandle, '→', realChannelId);
    } catch (error) {
      console.error('❌ Failed to cache Channel ID:', error.message);
    }

    return realChannelId;
  }

  // For new channels - return the real Channel ID to save in database
  async getChannelInfoForNewChannel(channelHandle) {
    const username = channelHandle.replace('@', '');

    // Search for real Channel ID
    const realChannelId = await YouTubeAPI.searchChannelByUsername(username);
    if (!realChannelId) {
      throw new Error(`Channel not found: ${username}`);
    }

    // Get statistics
    const stats = await YouTubeAPI.getChannelStats(realChannelId);
    if (!stats) {
      throw new Error(`Failed to get stats for channel: ${realChannelId}`);
    }

    console.log('✅ New YouTube channel processed:', channelHandle);

    // Return stats with real Channel ID for saving
    return {
      ...stats,
      realChannelId: realChannelId, // Include real Channel ID for database
    };
  }
}

module.exports = new YouTubeService();
