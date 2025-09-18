# YouTube & TikTok Channel Stats Tracker

Web application for tracking YouTube and TikTok channel statistics with automated hourly data collection.

## Features

- **YouTube**: Track subscribers, views, video count
- **TikTok**: Track followers and total likes
- **Automated collection**: Hourly statistics via cron scheduler
- **Interactive charts**: Historical data visualization
- **Responsive design**: Works on desktop and mobile

## Quick Start

### Prerequisites

- Docker & Docker Compose
- [YouTube Data API v3 key](https://console.developers.google.com/)
- TokInsight API key from [https://tokeninsight.com](https://tokeninsight.com) for TikTok support

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/youtube-tiktok-tracker.git
cd youtube-tiktok-tracker

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://tracker_user:tracker_password@localhost:5432/tracker_db
PORT=5000
NODE_ENV=development
YOUTUBE_API_KEY=your_youtube_api_key_here
TOKINSIGHT_API_KEY=your_tokinsight_api_key_here
SCRAPER_INTERVAL_HOURS=1
EOF

# Start with Docker
docker-compose up -d --build

# View logs
docker-compose logs -f
```

**Access:**

- Frontend: http://localhost
- Backend: http://localhost:5000

## Supported URLs

**YouTube:**

- `https://youtube.com/@channelname`
- `@channelname`

**TikTok:**

- `https://tiktok.com/@username`
- `@username`

## API Endpoints

```bash
# Add channel
POST /api/channels
{
  "platform": "youtube",
  "url": "https://youtube.com/@channelname"
}

# Get all channels
GET /api/channels

# Get statistics
GET /api/stats/{channelId}?period=7d

# Delete channel
DELETE /api/channels/{channelId}
```

## Database Schema

```bash
youtube-tiktok-tracker/
├── backend/db/schema.sql       # PostgreSQL database schema
```

**channels table:**

```sql
CREATE TABLE channels (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    channel_url TEXT NOT NULL,
    channel_name VARCHAR(255),
    channel_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform, channel_id)
);
```

**stats table:**

```sql
CREATE TABLE stats (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
    subscribers INTEGER,
    total_views BIGINT,
    videos INTEGER,
    likes BIGINT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Architecture

```bash
youtube-tiktok-tracker/
│
├── backend/                    # Express.js API server
│   ├── services/
│   │   ├── youtube.js         # YouTube Data API v3
│   │   ├── youtube-api.js     # API service layer
│   │   ├── tiktok.js          # TokInsight API
│   │   └── scheduler.js       # Hourly data collection
│   ├── routes/
│   │   ├── channels.js        # Channel management
│   │   └── stats.js           # Statistics API
│   └── db/
│       └── schema.sql         # Database schema
│
├── frontend/                   # React.js application
│   └── src/components/
│       ├── Dashboard.jsx      # Main dashboard
│       ├── ChannelDetails.jsx # Charts and statistics
│       └── AddChannelModal.jsx # Add channel form
│
└── docker-compose.yml         # Development environment
```

## Environment Variables

| Variable             | Description                                                                                  | Required           |
| -------------------- | -------------------------------------------------------------------------------------------- | ------------------ |
| `DATABASE_URL`       | PostgreSQL connection                                                                        | Yes                |
| `YOUTUBE_API_KEY`    | YouTube API key from [console.developers.google.com](https://console.developers.google.com/) | For YouTube        |
| `TOKINSIGHT_API_KEY` | TokInsight API key from [tokeninsight.com](https://tokeninsight.com)                         | For TikTok         |
| `PORT`               | Server port                                                                                  | No (default: 5000) |

## Troubleshooting

**Database issues:**

```bash
docker-compose down -v
docker-compose up -d
```

**Frontend build issues:**

```bash
cd frontend
rm -rf node_modules
npm install
```

**API quotas:**

- YouTube: 10,000 units/day
- TikTok: Varies by TokInsight plan

## Development

**Local setup:**

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm start

# Database
createdb tracker_db
psql tracker_db < backend/db/schema.sql
```

## Tech Stack

- **Backend:** Express.js, PostgreSQL, YouTube API v3, TokInsight API
- **Frontend:** React 18, Chart.js, Lucide icons
- **Infrastructure:** Docker, nginx

## Contributing

1. Fork repository
2. Create feature branch
3. Submit pull request

## License

MIT License - see [LICENSE](LICENSE) file.

---

Track your favorite channels with ease!
