const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const channelsRouter = require('./routes/channels');
const statsRouter = require('./routes/stats');
const scheduler = require('./services/scheduler');
const setupDatabase = require('./scripts/setup-database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? 'https://tracker-frontend.onrender.com'
        : 'http://localhost:3000',
  })
);
app.use(express.json());

// Routes
app.use('/api/channels', channelsRouter);
app.use('/api/stats', statsRouter);

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔄 Initializing database...');
    await setupDatabase();
    console.log('✅ Database initialized successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    scheduler.start();
    console.log('⏰ Scheduler started');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
