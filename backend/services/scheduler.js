const cron = require('node-cron');
const db = require('../db/database');
const youtubeService = require('./youtube');
const tiktokService = require('./tiktok');

class Scheduler {
  constructor() {
    // Configuration for retry logic
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
    };
  }

  async start() {
    console.log('🚀 Starting scheduler with initial data collection...');

    // Collect data immediately on startup
    try {
      await this.collectStats();
      console.log('✅ Initial stats collection completed');
    } catch (error) {
      console.error('❌ Initial stats collection failed:', error);
    }

    // Schedule regular collection every hour
    cron.schedule('0 * * * *', async () => {
      console.log('⏰ Hourly stats collection started...');
      await this.collectStats();
    });

    console.log('📅 Scheduler started - will collect stats hourly');
  }

  // Sleep function for delays
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Calculate delay for exponential backoff
  calculateDelay(attempt) {
    const delay =
      this.retryConfig.baseDelay *
      Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  // Retry wrapper for API calls
  async retryOperation(
    operation,
    operationName,
    maxRetries = this.retryConfig.maxRetries
  ) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `🔄 ${operationName} - Attempt ${attempt + 1}/${maxRetries + 1}`
        );
        const result = await operation();

        if (attempt > 0) {
          console.log(
            `✅ ${operationName} succeeded after ${attempt + 1} attempts`
          );
        }

        return result;
      } catch (error) {
        lastError = error;
        console.error(
          `❌ ${operationName} failed on attempt ${attempt + 1}:`,
          error.message
        );

        // Don't wait after the last attempt
        if (attempt < maxRetries) {
          const delay = this.calculateDelay(attempt);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }

    console.error(
      `💥 ${operationName} failed after ${maxRetries + 1} attempts`
    );
    throw lastError;
  }

  // Collect statistics for all channels with retry logic
  async collectStats() {
    try {
      const channels = await db.query('SELECT * FROM channels');
      console.log(`📊 Found ${channels.rows.length} channels to process`);

      for (const channel of channels.rows) {
        await this.processChannel(channel);

        // Small delay between channels to avoid overwhelming APIs
        await this.sleep(500);
      }

      console.log('🎉 Stats collection completed for all channels');
    } catch (error) {
      console.error('💥 Error in stats collection:', error);
    }
  }

  // Process individual channel with retry logic
  async processChannel(channel) {
    try {
      console.log(
        `\n🔍 Processing channel: ${channel.channel_name} (${channel.platform})`
      );

      let stats = null;

      if (channel.platform === 'youtube') {
        stats = await this.retryOperation(
          () => youtubeService.getChannelInfo(channel.channel_id),
          `YouTube API for ${channel.channel_name}`
        );
      } else if (channel.platform === 'tiktok') {
        stats = await this.retryOperation(
          () => tiktokService.getChannelInfo(channel.channel_id),
          `TikTok API for ${channel.channel_name}`
        );
      }

      if (stats) {
        await this.saveStats(channel, stats);
        console.log(`✅ Stats saved for ${channel.channel_name}`);
      } else {
        console.log(`⚠️ No stats obtained for ${channel.channel_name}`);
      }
    } catch (error) {
      console.error(
        `💥 Failed to process channel ${channel.channel_name}:`,
        error.message
      );

      // Save error stats or skip - depending on your preference
      await this.saveErrorStats(channel, error);
    }
  }

  // Save successful stats to database
  async saveStats(channel, stats) {
    try {
      await db.query(
        `INSERT INTO stats (channel_id, subscribers, total_views, videos, likes)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          channel.id,
          stats.subscribers || 0,
          stats.views || 0,
          stats.videos || 0,
          stats.likes || 0,
        ]
      );
    } catch (error) {
      console.error(
        `❌ Database error for channel ${channel.channel_name}:`,
        error
      );
      throw error;
    }
  }

  // Save error information (optional - you can remove this if not needed)
  async saveErrorStats(channel, error) {
    try {
      // Save with zero values or last known values
      await db.query(
        `INSERT INTO stats (channel_id, subscribers, total_views, videos, likes, error_message)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          channel.id,
          0, // or get last known values from database
          0,
          0,
          0,
          error.message.substring(0, 255), // limit error message length
        ]
      );
      console.log(`⚠️ Error stats saved for ${channel.channel_name}`);
    } catch (dbError) {
      console.error(
        `❌ Failed to save error stats for ${channel.channel_name}:`,
        dbError
      );
    }
  }

  // Method to manually trigger stats collection (useful for testing)
  async triggerCollection() {
    console.log('🎯 Manual stats collection triggered');
    await this.collectStats();
  }

  // Method to get retry statistics
  getRetryConfig() {
    return this.retryConfig;
  }

  // Method to update retry configuration
  updateRetryConfig(newConfig) {
    this.retryConfig = { ...this.retryConfig, ...newConfig };
    console.log('⚙️ Retry configuration updated:', this.retryConfig);
  }
}

module.exports = new Scheduler();
