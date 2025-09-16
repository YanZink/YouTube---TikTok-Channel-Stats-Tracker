
--channels
CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    channel_url TEXT NOT NULL,
    channel_name VARCHAR(255),
    channel_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform, channel_id)
);

--stats
CREATE TABLE IF NOT EXISTS stats (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
    subscribers INTEGER,
    total_views BIGINT,
    videos INTEGER,
    likes BIGINT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--Indexes for optimization
CREATE INDEX IF NOT EXISTS idx_stats_channel_id ON stats(channel_id);
CREATE INDEX IF NOT EXISTS idx_stats_recorded_at ON stats(recorded_at);
CREATE INDEX IF NOT EXISTS idx_channels_platform_channel_id ON channels(platform, channel_id);


ALTER TABLE stats ADD COLUMN IF NOT EXISTS videos INTEGER;
ALTER TABLE stats ADD COLUMN IF NOT EXISTS likes BIGINT;