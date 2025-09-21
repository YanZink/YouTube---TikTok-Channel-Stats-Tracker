const cron = require('node-cron');
const db = require('../db/database');
const youtubeService = require('./youtube');
const tiktokService = require('./tiktok');

class Scheduler {
  constructor() {
    // Configuration for retry logic
    this.retryConfig = {
      maxRetries: 2,
      baseDelay: 2000, // 2 seconds
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
    };

    // Simple quota tracking
    this.youtubeQuotaExhausted = false;
    this.lastQuotaReset = new Date();
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
      this.resetQuotaIfNeeded();
      await this.collectStats();
    });

    console.log('📅 Scheduler started - will collect stats hourly');
  }

  // Reset quota flag every 20 hours
  resetQuotaIfNeeded() {
    const hours = (new Date() - this.lastQuotaReset) / (1000 * 60 * 60);
    if (hours >= 20) {
      this.youtubeQuotaExhausted = false;
      this.lastQuotaReset = new Date();
      console.log('🔄 YouTube quota flag reset');
    }
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

  // Check if error is critical (no retry needed)
  isCriticalError(error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('quota') || msg.includes('403') || msg.includes('not found')
    );
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

        // Check for quota exhaustion
        if (error.message.includes('quota') || error.message.includes('403')) {
          this.youtubeQuotaExhausted = true;
        }

        // Don't retry critical errors
        if (this.isCriticalError(error)) {
          console.log(`🚫 Critical error detected, stopping retries`);
          break;
        }

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
        await this.sleep(1000);
      }

      console.log('🎉 Stats collection completed for all channels');
    } catch (error) {
      console.error('💥 Error in stats collection:', error);
    }
  }

  // Check if data is valid before saving
  isValidData(stats, platform) {
    if (platform === 'youtube') {
      return stats.subscribers > 0 || stats.views > 0 || stats.videos > 0;
    }
    if (platform === 'tiktok') {
      return stats.subscribers > 0 || stats.likes > 0;
    }
    return false;
  }

  // Process individual channel with retry logic
  async processChannel(channel) {
    try {
      console.log(
        `\n🔍 Processing channel: ${channel.channel_name} (${channel.platform})`
      );

      let stats = null;

      if (channel.platform === 'youtube') {
        if (this.youtubeQuotaExhausted) {
          console.log(
            `⏭️ Skipping YouTube channel ${channel.channel_name} - quota exhausted`
          );
          return;
        }

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

      // Only save if we have valid data
      if (stats && this.isValidData(stats, channel.platform)) {
        await this.saveStats(channel, stats);
        console.log(`✅ Stats saved for ${channel.channel_name}`);
      } else {
        console.log(
          `⚠️ Invalid data for ${channel.channel_name}, not saving to database`
        );
      }
    } catch (error) {
      console.error(
        `💥 Failed to process channel ${channel.channel_name}:`,
        error.message
      );
      // Simply skip failed channels - no database pollution
    }
  }

  // Save successful stats to database
  // Save successful stats to database
  async saveStats(channel, stats) {
    try {
      await db.query(
        `INSERT INTO stats (channel_id, subscribers, total_views, videos, likes, recorded_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
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

  // Method to manually trigger stats collection (useful for testing)
  async triggerCollection() {
    console.log('🎯 Manual stats collection triggered');
    await this.collectStats();
  }
}

module.exports = new Scheduler();
