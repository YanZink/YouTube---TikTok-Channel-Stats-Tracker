// Utilities for URL parsing and channel ID extraction

/**
 * Extracts channel ID/username from YouTube URL
 * @param {string} url - YouTube channel URL
 * @returns {object} - {channelId, channelName, type}
 */
const parseYouTubeUrl = (url) => {
  try {
    // Patterns for different YouTube URL formats
    const patterns = {
      // https://www.youtube.com/channel/UC...
      channel: /youtube\.com\/channel\/([^\/\?]+)/,
      // https://www.youtube.com/c/channelname
      custom: /youtube\.com\/c\/([^\/\?]+)/,
      // https://www.youtube.com/@username
      handle: /youtube\.com\/@([^\/\?]+)/,
      // https://www.youtube.com/user/username
      user: /youtube\.com\/user\/([^\/\?]+)/,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      const match = url.match(pattern);
      if (match) {
        return {
          channelId: match[1],
          type: type,
          platform: 'youtube',
        };
      }
    }

    // If not URL, maybe it's just username
    if (!url.includes('youtube.com')) {
      return {
        channelId: url.replace('@', ''),
        type: 'username',
        platform: 'youtube',
      };
    }

    throw new Error('Invalid YouTube URL format');
  } catch (error) {
    throw new Error(`YouTube URL parsing error: ${error.message}`);
  }
};

/**
 * Extracts username from TikTok URL
 * @param {string} url - TikTok profile URL
 * @returns {object} - {username, platform}
 */
const parseTikTokUrl = (url) => {
  try {
    // Patterns for TikTok URL
    // https://www.tiktok.com/@username
    const pattern = /tiktok\.com\/@([^\/\?]+)/;
    const match = url.match(pattern);

    if (match) {
      return {
        username: match[1],
        platform: 'tiktok',
      };
    }

    // If not URL, maybe it's just username
    if (!url.includes('tiktok.com')) {
      return {
        username: url.replace('@', ''),
        platform: 'tiktok',
      };
    }

    throw new Error('Invalid TikTok URL format');
  } catch (error) {
    throw new Error(`TikTok URL parsing error: ${error.message}`);
  }
};

/**
 * Detects platform by URL
 * @param {string} url - Channel URL
 * @returns {string} - 'youtube' | 'tiktok' | 'unknown'
 */
const detectPlatform = (url) => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('tiktok.com')) {
    return 'tiktok';
  }
  return 'unknown';
};

/**
 * Universal URL parser
 * @param {string} url - Channel URL
 * @param {string} platform - Platform (optional)
 * @returns {object} - Parsed channel data
 */
const parseChannelUrl = (url, platform = null) => {
  const detectedPlatform = platform || detectPlatform(url);

  switch (detectedPlatform) {
    case 'youtube':
      return parseYouTubeUrl(url);
    case 'tiktok':
      return parseTikTokUrl(url);
    default:
      throw new Error('Unsupported platform');
  }
};

/**
 * Formats numbers for display
 * @param {number} num - Number
 * @returns {string} - Formatted number
 */
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Validates URL
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    // Could be just username
    return url.length > 0 && !url.includes(' ');
  }
};

module.exports = {
  parseYouTubeUrl,
  parseTikTokUrl,
  detectPlatform,
  parseChannelUrl,
  formatNumber,
  isValidUrl,
};
