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
      // 1. Get user_id by username
      console.log(`📞 Query user_id for: ${cleanUsername}`);
      const userIdData = await this.callApi('/user_uniqueid/', {
        unique_id: cleanUsername,
      });

      // Shortened log - only important fields
      console.log('📊 User ID Response:', {
        uid: userIdData?.uid,
        status: userIdData?.status_code,
        hasUser: !!userIdData?.user,
      });

      // Extract user_id from TokenInsight response
      const userId =
        userIdData?.uid || userIdData?.user?.uid || userIdData?.data?.user_id;

      if (!userId) {
        console.error('❌ User ID not found for:', cleanUsername);
        return this.getDefaultChannelInfo(cleanUsername);
      }

      console.log(`✅ Found user_id: ${userId} for ${cleanUsername}`);

      // 2. Getting a profile
      console.log(`📞 Profile request for uid: ${userId}`);
      const profileData = await this.callApi('/user_profile/', {
        uid: userId,
      });

      // Shortened profile log
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
        likes: likes, // MAIN METRIC - LIKES
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

    // Check the status in the TokenInsight response
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
