const express = require('express');
const router = express.Router();
const db = require('../db/database');
const youtubeService = require('../services/youtube');
const tiktokService = require('../services/tiktok');

// URL validation
const validateChannelUrl = (url, platform) => {
  const patterns = {
    youtube: [
      /^(https?:\/\/)?(www\.)?youtube\.com\/@[a-zA-Z0-9_-]+$/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/channel\/[a-zA-Z0-9_-]+$/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/c\/[a-zA-Z0-9_-]+$/,
      /^@[a-zA-Z0-9_-]+$/, // Only @channelname
    ],
    tiktok: [
      /^(https?:\/\/)?(www\.)?tiktok\.com\/@[a-zA-Z0-9_-]+$/,
      /^@[a-zA-Z0-9_-]+$/, // Only @username
    ],
  };

  return patterns[platform].some((pattern) => pattern.test(url.trim()));
};

// Middleware for validation
const validateChannelInput = (req, res, next) => {
  const { platform, url } = req.body;

  if (!platform || !url) {
    return res.status(400).json({ error: 'Platform and URL are required' });
  }

  if (!['youtube', 'tiktok'].includes(platform)) {
    return res.status(400).json({ error: 'Invalid platform' });
  }

  if (!validateChannelUrl(url, platform)) {
    return res.status(400).json({
      error:
        platform === 'youtube'
          ? 'Invalid format. Use: https://youtube.com/@channelname or @channelname'
          : 'Invalid format. Use: https://tiktok.com/@username or @username',
    });
  }

  next();
};

// Get all channels with latest statistics
router.get('/', async (req, res) => {
  try {
    const query = `
    SELECT DISTINCT ON (c.id)
    c.id,
    c.channel_name as name,
    c.platform,
    c.channel_id,
    c.channel_url,
    s.subscribers,
    s.total_views as views,
    s.videos,
    s.likes,
    s.recorded_at as timestamp
    FROM channels c
    LEFT JOIN stats s ON c.id = s.channel_id
    ORDER BY c.id, s.recorded_at DESC
    `;

    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error receiving channels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//Add a new channel
router.post('/', validateChannelInput, async (req, res) => {
  const { platform, url } = req.body;

  console.log('✅ Received from frontend:', { platform, url });

  try {
    let channelData;
    let channelId;

    // Check for duplicates BEFORE calling the API
    if (platform === 'youtube') {
      channelId = extractYouTubeChannelId(url);
      console.log('🔄 Extracted YouTube channelId:', channelId);

      // Check the existence of the channel in the DB
      const existingChannel = await db.query(
        'SELECT * FROM channels WHERE platform = $1 AND channel_id = $2',
        [platform, channelId]
      );

      if (existingChannel.rows.length > 0) {
        return res.status(409).json({
          error:
            'Failed to add channel. The channel is already being monitored',
        });
      }

      channelData = await youtubeService.getChannelInfo(channelId, url);
      console.log('✅ YouTube service result:', channelData);
    } else if (platform === 'tiktok') {
      channelId = extractTikTokChannelId(url);

      const existingChannel = await db.query(
        'SELECT * FROM channels WHERE platform = $1 AND channel_id = $2',
        [platform, channelId]
      );

      if (existingChannel.rows.length > 0) {
        return res.status(409).json({
          error:
            'Failed to add channel. The channel is already being monitored',
        });
      }

      channelData = await tiktokService.getChannelInfo(channelId);
    }

    // Save the channel to the DB
    const insertChannelQuery = `
      INSERT INTO channels (channel_name, platform, channel_id, channel_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    const channelResult = await db.query(insertChannelQuery, [
      channelData.name,
      platform,
      channelId,
      url,
    ]);

    const dbChannelId = channelResult.rows[0].id;

    const insertStatsQuery = `
      INSERT INTO stats (channel_id, subscribers, total_views, videos, likes, recorded_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;

    await db.query(insertStatsQuery, [
      dbChannelId,
      channelData.subscribers,
      channelData.views,
      channelData.videos || 0,
      channelData.likes || 0,
    ]);

    res.json({
      success: true,
      channelId: dbChannelId,
      message: 'Channel added successfully',
    });
  } catch (error) {
    console.error('❌ Full error in channel addition:', error);

    if (error.message.includes('duplicate key')) {
      return res.status(409).json({
        error: 'Failed to add channel. The channel is already being monitored',
      });
    }

    res.status(500).json({
      error: 'Failed to add channel',
      details: error.message,
    });
  }
});

// Function to extract YouTube channel ID from URL
function extractYouTubeChannelId(url) {
  const trimmedUrl = url.trim();

  // https://www.youtube.com/@discovery -> discovery
  if (trimmedUrl.includes('/@')) {
    const parts = trimmedUrl.split('/@');
    if (parts.length > 1) {
      return parts[1].split('/')[0].split('?')[0].trim();
    }
  }

  // https://www.youtube.com/channel/UCxxxxxx -> UCxxxxxx
  if (trimmedUrl.includes('/channel/')) {
    const parts = trimmedUrl.split('/channel/');
    if (parts.length > 1) {
      return parts[1].split('/')[0].split('?')[0].trim();
    }
  }

  // https://www.youtube.com/c/channelname -> channelname
  if (trimmedUrl.includes('/c/')) {
    const parts = trimmedUrl.split('/c/');
    if (parts.length > 1) {
      return parts[1].split('/')[0].split('?')[0].trim();
    }
  }

  // @channelname -> channelname
  if (trimmedUrl.startsWith('@')) {
    return trimmedUrl.substring(1).trim();
  }

  throw new Error('Invalid YouTube URL format');
}

// Function to extract TikTok channel ID from URL
function extractTikTokChannelId(url) {
  const trimmedUrl = url.trim();

  // https://www.tiktok.com/@username -> username
  if (trimmedUrl.includes('/@')) {
    const parts = trimmedUrl.split('/@');
    if (parts.length > 1) {
      return parts[1].split('/')[0].split('?')[0].trim();
    }
  }

  // @username -> username
  if (trimmedUrl.startsWith('@')) {
    return trimmedUrl.substring(1).trim();
  }

  throw new Error('Invalid TikTok URL format');
}

// Delete channel
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM channels WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete channel:', error);
    res.status(500).json({ error: 'Failed to delete channel' });
  }
});

module.exports = router;
