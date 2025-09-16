const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const channelsRouter = require('./routes/channels');
const statsRouter = require('./routes/stats');
const scheduler = require('./services/scheduler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/channels', channelsRouter);
app.use('/api/stats', statsRouter);

// Launching the scheduler to collect statistics hourly
scheduler.start();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
