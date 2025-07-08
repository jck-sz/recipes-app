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
pool.on('connect', (client) => {
  console.log('New client connected to PostgreSQL database');
  console.log(`Pool status: ${pool.totalCount} total, ${pool.idleCount} idle, ${pool.waitingCount} waiting`);

  // Set up client-level error handling
  client.on('error', (err) => {
    console.error('PostgreSQL client error:', err);
  });
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

  // Attempt to reconnect if the error is connection-related
  if (err.code === 'ECONNRESET' || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    console.log('Connection error detected, pool will attempt to reconnect...');
  }
});

// Database health check function
const checkConnection = async () => {
  try {
    const result = await pool.query('SELECT 1 as health_check, NOW() as timestamp');
    return {
      healthy: true,
      timestamp: result.rows[0].timestamp,
      poolStatus: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      code: error.code
    };
  }
};

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

// Query function with logging and retry logic
const query = async (text, params, retries = 3) => {
  const start = Date.now();
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;

      if (attempt > 1) {
        console.log(`Query succeeded on attempt ${attempt}`, { text, duration, rows: result.rowCount });
      } else {
        console.log('Executed query', { text, duration, rows: result.rowCount });
      }

      return result;
    } catch (error) {
      lastError = error;
      const duration = Date.now() - start;

      // Check if this is a connection error that might benefit from retry
      const isRetryableError = error.code === 'ECONNRESET' ||
                              error.code === 'ENOTFOUND' ||
                              error.code === 'ECONNREFUSED' ||
                              error.code === '57P01' || // admin_shutdown
                              error.code === '57P02' || // crash_shutdown
                              error.code === '57P03';   // cannot_connect_now

      if (isRetryableError && attempt < retries) {
        console.warn(`Query failed on attempt ${attempt}, retrying...`, {
          text,
          duration,
          error: error.message,
          code: error.code
        });

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        continue;
      }

      console.error('Query error', { text, duration, error: error.message, attempt });
      break;
    }
  }

  throw lastError;
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
  closePool,
  checkConnection
};
