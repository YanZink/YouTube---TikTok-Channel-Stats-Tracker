# YouTube & TikTok Channel Stats Tracker

A comprehensive web application for tracking YouTube and TikTok channel statistics with automated hourly data collection and beautiful visualizations.

📊 Features
Platform Support

YouTube: Track subscribers, views, and video count
TikTok: Track followers and total likes

Key Capabilities

Automated Data Collection: Hourly statistics gathering via cron scheduler
Real-time Charts: Interactive visualizations using Chart.js
Historical Data: Track growth trends over time (24h, 7d, 30d, all time)
Multi-platform: Support for both YouTube and TikTok channels
Responsive Design: Works on desktop and mobile devices
Easy Management: Add/remove channels with simple URL input

🏗️ Architecture
youtube-tiktok-tracker/
├── backend/ # Express.js API server
│ ├── services/
│ │ ├── youtube.js # YouTube Data API v3 integration
│ │ ├── youtube-api.js # YouTube API service layer
│ │ ├── tiktok.js # TokInsight API integration
│ │ └── scheduler.js # Automated hourly data collection
│ ├── routes/
│ │ ├── channels.js # Channel management endpoints
│ │ └── stats.js # Statistics retrieval endpoints
│ └── db/
│ └── schema.sql # PostgreSQL database schema
├── frontend/ # React.js client application
│ └── src/components/
│ ├── Dashboard.jsx # Main dashboard with channel cards
│ ├── ChannelDetails.jsx # Detailed statistics and charts
│ └── AddChannelModal.jsx # Channel addition interface
└── docker-compose.yml # Complete development environment
🚀 Quick Start
Prerequisites

Docker & Docker Compose (recommended)
Node.js 20+ (for local development)
YouTube Data API v3 key (Get it here)
TokInsight API key (Get it here) for TikTok support

1. Clone the Repository
   bashgit clone https://github.com/yourusername/youtube-tiktok-tracker.git
   cd youtube-tiktok-tracker
2. Environment Configuration
   Create a .env file in the root directory:
   bash# Database Configuration
   DATABASE_URL=postgresql://tracker_user:tracker_password@localhost:5432/tracker_db

# Server Configuration

PORT=5000
NODE_ENV=development

# API Keys

YOUTUBE_API_KEY=your_youtube_api_key_here
TOKINSIGHT_API_KEY=your_tokinsight_api_key_here

# Data Collection

SCRAPER_INTERVAL_HOURS=1 3. Launch with Docker (Recommended)
bash# Start all services
docker-compose up -d

# View logs

docker-compose logs -f

# Stop services

docker-compose down
Access Points:

Frontend: http://localhost
Backend API: http://localhost:5000
Database: localhost:5432

4. Manual Installation (Alternative)
   Backend Setup
   bashcd backend
   npm install
   npm run dev
   Frontend Setup
   bashcd frontend
   npm install
   npm start
   Database Setup
   bash# Install PostgreSQL and create database
   createdb tracker_db
   psql tracker_db < backend/db/schema.sql
   🔧 API Documentation
   Channel Management
   Add Channel
   bashPOST /api/channels
   Content-Type: application/json

{
"platform": "youtube", // or "tiktok"
"url": "https://youtube.com/@channelname" // or "@channelname"
}
Get All Channels
bashGET /api/channels
Delete Channel
bashDELETE /api/channels/{channelId}
Statistics
Get Channel Statistics
bashGET /api/stats/{channelId}?period=7d
Supported periods: 24h, 7d, 30d, all
📊 Supported URL Formats
YouTube

https://youtube.com/@channelname
https://youtube.com/channel/UCxxxxxxx
https://youtube.com/c/channelname
@channelname

TikTok

https://tiktok.com/@username
@username

🗄️ Database Schema
Tables
channels

id (Primary Key)
platform (youtube/tiktok)
channel_url (Original URL)
channel_name (Display name)
channel_id (Platform-specific ID)
created_at (Timestamp)

stats

id (Primary Key)
channel_id (Foreign Key)
subscribers (Follower count)
total_views (YouTube only)
videos (YouTube only)
likes (TikTok total likes)
recorded_at (Timestamp)

⚙️ Configuration
Environment Variables
VariableDescriptionRequiredDefaultDATABASE_URLPostgreSQL connection stringYes-PORTBackend server portNo5000NODE_ENVEnvironment modeNodevelopmentYOUTUBE_API_KEYYouTube Data API v3 keyFor YouTube-TOKINSIGHT_API_KEYTokInsight API keyFor TikTok-SCRAPER_INTERVAL_HOURSData collection frequencyNo1
Docker Configuration
The application uses the following ports:

Frontend: 80 (nginx)
Backend: 5000 (Express)
Database: 5432 (PostgreSQL)

📈 Data Collection
Automation

Scheduler: Runs hourly using node-cron
Initial Collection: Data is collected immediately when a channel is added
Error Handling: Failed collections are logged, don't affect other channels

Metrics Collected
YouTube Channels

Subscriber count
Total view count
Total video count

TikTok Channels

Follower count
Total likes received

🛠️ Development
Project Structure
backend/
├── services/ # Business logic and API integrations
├── routes/ # Express route handlers
├── db/ # Database configuration and schema
└── utils/ # Utility functions

frontend/
├── components/ # React components
├── services/ # API client functions
└── styles/ # CSS files
Tech Stack
Backend

Framework: Express.js
Database: PostgreSQL with pg driver
APIs: YouTube Data API v3, TokInsight API
Scheduling: node-cron
Web Scraping: Puppeteer (fallback)

Frontend

Framework: React 18
Charts: Chart.js with react-chartjs-2
Icons: Lucide React
HTTP Client: Axios

🔍 Troubleshooting
Common Issues
"Channel already being monitored"

Each channel can only be added once per platform
Check if the channel is already in your dashboard

YouTube API Quota Exceeded

YouTube Data API has daily quotas
Consider reducing collection frequency
Monitor usage in Google Cloud Console

TikTok Data Not Loading

Verify TOKINSIGHT_API_KEY is set correctly
TikTok API has stricter rate limits
Check API key balance and permissions

Database Connection Issues
bash# Check PostgreSQL status
docker-compose logs postgres

# Reset database

docker-compose down -v
docker-compose up -d
Frontend Build Issues
bash# Clear cache and rebuild
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
📝 API Limits & Considerations
YouTube Data API v3

Quota: 10,000 units/day (default)
Cost per request: ~3 units
Requests per hour: ~138 (for hourly collection)

TokInsight API

Rate limits: Varies by plan
Geographic restrictions: Some regions may be limited
Data freshness: Updates may have delays

🚧 Known Limitations

Real-time data: Statistics update hourly, not in real-time
Historical data: Only available from when channels were added
API dependencies: Requires external API keys for full functionality
TikTok accuracy: TikTok metrics may have delays or limitations

🤝 Contributing

Fork the repository
Create a feature branch: git checkout -b feature-name
Commit changes: git commit -am 'Add feature'
Push to branch: git push origin feature-name
Submit a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
🙋‍♀️ Support
For questions, issues, or feature requests:

Open an issue on GitHub
Check existing issues for solutions
Review the troubleshooting section above

Made with ❤️ for content creators and social media analysts
