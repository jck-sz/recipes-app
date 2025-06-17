const { Pool } = require('pg');

// Database pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX) || 20, // Maximum number of connections
  min: parseInt(process.env.DB_POOL_MIN) || 2,  // Minimum number of connections
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000, // 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000, // 10 seconds
  maxUses: parseInt(process.env.DB_MAX_USES) || 7500, // Maximum uses per connection

  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,

  // Query timeout
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000, // 30 seconds

  // Statement timeout
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 60000, // 60 seconds

  // Application name for monitoring
  application_name: process.env.APP_NAME || 'fodmap-recipe-api'
};

const pool = new Pool(poolConfig);

// Enhanced connection monitoring and error handling
pool.on('connect', () => {
  console.log('New client connected to PostgreSQL database');
  console.log(`Pool status: ${pool.totalCount} total, ${pool.idleCount} idle, ${pool.waitingCount} waiting`);
});

pool.on('acquire', () => {
  console.log('Client acquired from pool');
});

pool.on('remove', () => {
  console.log('Client removed from pool');
});

pool.on('error', (err, client) => {
  console.error('PostgreSQL pool error:', err);
  console.error('Pool status:', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });

  // Log client info if available
  if (client) {
    console.error('Error occurred on client:', client.processID);
  }
});

// Graceful pool shutdown function
const closePool = async () => {
  console.log('Closing database pool...');
  try {
    await pool.end();
    console.log('Database pool closed successfully');
  } catch (err) {
    console.error('Error closing database pool:', err);
    throw err;
  }
};

// Query function with logging
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Query error', { text, duration, error: error.message });
    throw error;
  }
};

// Transaction wrapper
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  withTransaction,
  closePool
};
