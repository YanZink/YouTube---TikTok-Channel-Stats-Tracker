const { Pool } = require('pg');
require('dotenv').config();

// Connect to the database via DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

// Check connection

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
  } else {
    console.log('Successful connection to PostgreSQL');
    release();
  }
});

module.exports = pool;
