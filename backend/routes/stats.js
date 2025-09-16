const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get statistics for the channel
router.get('/:channelId', async (req, res) => {
  const { period = '7d' } = req.query;

  // Define the time interval
  const intervals = {
    '24h': "NOW() - INTERVAL '24 hours'",
    '7d': "NOW() - INTERVAL '7 days'",
    '30d': "NOW() - INTERVAL '30 days'",
    all: "'1970-01-01'",
  };

  const interval = intervals[period] || intervals['7d'];

  try {
    const result = await db.query(
      `SELECT * FROM stats
       WHERE channel_id = $1 AND recorded_at >= ${interval}
       ORDER BY recorded_at ASC`,
      [req.params.channelId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
