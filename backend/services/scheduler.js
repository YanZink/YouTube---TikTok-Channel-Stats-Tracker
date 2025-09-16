const cron = require('node-cron');
const db = require('../db/database');
const youtubeService = require('./youtube');
const tiktokService = require('./tiktok');

class Scheduler {
  async start() {
    console.log('🚀 Starting scheduler with initial data collection...');

    // Collect data immediately on startup
    try {
      await this.collectStats();
      console.log('✅ Initial stats collection completed');
    } catch (error) {
      console.error('❌ Initial stats collection failed:', error);
    }

    // We plan regular collection every hour
    cron.schedule('0 * * * *', async () => {
      console.log('⏰ Hourly stats collection started...');
      await this.collectStats();
    });

    console.log('📅 Scheduler started - will collect stats hourly');
  }

  // Collect statistics for all channels
  async collectStats() {
    try {
      const channels = await db.query('SELECT * FROM channels');

      for (const channel of channels.rows) {
        try {
          let stats;

          if (channel.platform === 'youtube') {
            stats = await youtubeService.getChannelInfo(channel.channel_id);
          } else if (channel.platform === 'tiktok') {
            stats = await tiktokService.getChannelInfo(channel.channel_id);
          }

          await db.query(
            `INSERT INTO stats (channel_id, subscribers, total_views, videos, likes)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              channel.id,
              stats.subscribers,
              stats.views,
              stats.videos || 0,
              stats.likes || 0,
            ]
          );

          console.log(`Stats collected for ${channel.channel_name}`);
        } catch (error) {
          console.error(
            `Error collecting stats for channel ${channel.id}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error('Error in stats collection:', error);
    }
  }
}

module.exports = new Scheduler();
