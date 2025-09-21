const db = require('../db/database');

class TikTokService {
  constructor() {
    this.apiKey = process.env.TOKINSIGHT_API_KEY;
    this.baseUrl = 'https://api.tokinsight.com/tok/v1';

    if (!this.apiKey) {
      console.warn(
        '⚠️ TOKINSIGHT_API_KEY is not set. TikTok features will not be available.'
      );
    }
  }

  async getChannelInfo(username) {
    if (!this.apiKey) {
      console.error('❌ TOKINSIGHT_API_KEY is not set.');
      return this.getDefaultChannelInfo(username);
    }

    const cleanUsername = username.replace('@', '').trim();
    console.log(`🔍 Get TikTok data for: ${cleanUsername}`);

    try {
      // 1. Try to get cached user_id from database
      let userId = await this.getCachedUserId(cleanUsername);

      if (!userId) {
        // 2. Get user_id by username (only if not cached)
        console.log(`📞 Query user_id for: ${cleanUsername}`);
        const userIdData = await this.callApi('/user_uniqueid/', {
          unique_id: cleanUsername,
        });

        console.log('📊 User ID Response:', {
          uid: userIdData?.uid,
          status: userIdData?.status_code,
          hasUser: !!userIdData?.user,
        });

        // Extract user_id from TokInsight response
        userId =
          userIdData?.uid || userIdData?.user?.uid || userIdData?.data?.user_id;

        if (!userId) {
          console.error('❌ User ID not found for:', cleanUsername);
          return this.getDefaultChannelInfo(cleanUsername);
        }

        // Cache user_id for future use
        await this.cacheUserId(cleanUsername, userId);
        console.log(
          `✅ Found and cached user_id: ${userId} for ${cleanUsername}`
        );
      } else {
        console.log(`📋 Using cached user_id: ${userId} for ${cleanUsername}`);
      }

      // 3. Get profile using cached or found user_id
      console.log(`📞 Profile request for uid: ${userId}`);
      const profileData = await this.callApi('/user_profile/', {
        uid: userId,
      });

      // Parse profile data
      const profileInfo = profileData?.user || profileData?.data || profileData;
      console.log('📊 Profile Response:', {
        nickname: profileInfo?.nickname,
        follower_count: profileInfo?.follower_count,
        total_favorited: profileInfo?.total_favorited,
        status: profileData?.status_code,
      });

      const subscribers = profileInfo?.follower_count || 0;
      const likes = profileInfo?.total_favorited || 0;
      const nickname =
        profileInfo?.nickname || profileInfo?.display_name || cleanUsername;

      const result = {
        id: cleanUsername,
        name: nickname,
        subscribers,
        views: 0,
        videos: 0,
        likes: likes, // Main metric for TikTok
      };

      console.log(`✅ TikTok data obtained for ${cleanUsername}:`);
      console.log(`   👥 Subscribers: ${subscribers.toLocaleString()}`);
      console.log(`   ❤️  Likes: ${likes.toLocaleString()}`);

      return result;
    } catch (error) {
      console.error(`❌ TikTok API error for ${cleanUsername}:`, error.message);
      if (error.message.includes('401') || error.message.includes('403')) {
        console.error('🔑 Authentication issue. Check TOKINSIGHT_API_KEY');
      }
      return this.getDefaultChannelInfo(cleanUsername);
    }
  }

  // Get cached user_id from database
  async getCachedUserId(username) {
    try {
      const result = await db.query(
        'SELECT real_channel_id FROM channels WHERE channel_id = $1 AND platform = $2 AND real_channel_id IS NOT NULL',
        [username, 'tiktok']
      );

      if (result.rows.length > 0 && result.rows[0].real_channel_id) {
        return result.rows[0].real_channel_id;
      }
    } catch (error) {
      console.error(
        '❌ Database error while getting cached user_id:',
        error.message
      );
    }
    return null;
  }

  // Cache user_id in database
  async cacheUserId(username, userId) {
    try {
      await db.query(
        'UPDATE channels SET real_channel_id = $1 WHERE channel_id = $2 AND platform = $3',
        [userId, username, 'tiktok']
      );
      console.log('💾 Cached TikTok user_id:', username, '→', userId);
    } catch (error) {
      console.error('❌ Failed to cache TikTok user_id:', error.message);
    }
  }

  // For new channels - return user_id to save in database
  async getChannelInfoForNewChannel(username) {
    if (!this.apiKey) {
      console.error('❌ TOKINSIGHT_API_KEY is not set.');
      const fallback = this.getDefaultChannelInfo(username);
      return { ...fallback, realChannelId: null };
    }

    const cleanUsername = username.replace('@', '').trim();
    console.log(`🔍 Get TikTok data for new channel: ${cleanUsername}`);

    try {
      // Get user_id
      const userIdData = await this.callApi('/user_uniqueid/', {
        unique_id: cleanUsername,
      });

      const userId =
        userIdData?.uid || userIdData?.user?.uid || userIdData?.data?.user_id;

      if (!userId) {
        throw new Error(`TikTok user not found: ${cleanUsername}`);
      }

      // Get profile
      const profileData = await this.callApi('/user_profile/', {
        uid: userId,
      });

      const profileInfo = profileData?.user || profileData?.data || profileData;
      const subscribers = profileInfo?.follower_count || 0;
      const likes = profileInfo?.total_favorited || 0;
      const nickname =
        profileInfo?.nickname || profileInfo?.display_name || cleanUsername;

      console.log('✅ New TikTok channel processed:', cleanUsername);

      return {
        id: cleanUsername,
        name: nickname,
        subscribers,
        views: 0,
        videos: 0,
        likes: likes,
        realChannelId: userId, // Include user_id for database
      };
    } catch (error) {
      console.error(
        `❌ TikTok API error for new channel ${cleanUsername}:`,
        error.message
      );
      throw error;
    }
  }

  async callApi(endpoint, params) {
    const url = new URL(this.baseUrl + endpoint);

    // Convert all parameters to strings
    Object.entries(params).forEach(([k, v]) => {
      url.searchParams.set(k, String(v));
    });

    console.log(
      `🌐 API request: ${endpoint} (${Object.keys(params).join(', ')})`
    );

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'TikTok-Tracker/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ TokInsight API error ${response.status}:`,
        errorText.substring(0, 200)
      );
      throw new Error(
        `TokInsight API error: ${response.status} - ${errorText.substring(
          0,
          100
        )}`
      );
    }

    const data = await response.json();

    // Check the status in the TokInsight response
    if (data.status_code && data.status_code !== 0) {
      throw new Error(
        `TokInsight API error: ${data.status_msg || 'Unknown error'}`
      );
    }

    return data;
  }

  getDefaultChannelInfo(username) {
    console.log(`⚠️ Returning the stub for the TikTok channel: ${username}`);
    return {
      id: username,
      name: username,
      subscribers: 0,
      views: 0,
      videos: 0,
      likes: 0,
    };
  }
}

module.exports = new TikTokService();
