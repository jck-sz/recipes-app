const { Pool } = require('pg');

// Validate and sanitize pool configuration
function validatePoolConfig() {
  const max = parseInt(process.env.DB_POOL_MAX) || 20;
  const min = parseInt(process.env.DB_POOL_MIN) || 2;
  const maxUses = parseInt(process.env.DB_MAX_USES) || 1000; // Reduced from 7500
  const idleTimeout = parseInt(process.env.DB_IDLE_TIMEOUT) || 30000;
  const connectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000;

  // Validation
  if (max < 1 || max > 100) {
    throw new Error('DB_POOL_MAX must be between 1 and 100');
  }
  if (min < 0 || min > max) {
    throw new Error('DB_POOL_MIN must be between 0 and DB_POOL_MAX');
  }
  if (maxUses < 100 || maxUses > 10000) {
    throw new Error('DB_MAX_USES must be between 100 and 10000');
  }
  if (idleTimeout < 1000 || idleTimeout > 300000) {
    throw new Error('DB_IDLE_TIMEOUT must be between 1000ms and 300000ms');
  }
  if (connectionTimeout < 1000 || connectionTimeout > 60000) {
    throw new Error('DB_CONNECTION_TIMEOUT must be between 1000ms and 60000ms');
  }

  return { max, min, maxUses, idleTimeout, connectionTimeout };
}

// Database pool configuration
const { max, min, maxUses, idleTimeout, connectionTimeout } = validatePoolConfig();

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max, // Maximum number of connections
  min, // Minimum number of connections
  idleTimeoutMillis: idleTimeout,
  connectionTimeoutMillis: connectionTimeout,
  maxUses, // Reduced maximum uses per connection

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
  // Only log in debug mode to reduce noise
  if (process.env.LOG_LEVEL === 'debug') {
    console.log('New client connected to PostgreSQL database');
    console.log(`Pool status: ${pool.totalCount} total, ${pool.idleCount} idle, ${pool.waitingCount} waiting`);
  }

  // Set up client-level error handling
  client.on('error', (err) => {
    console.error('PostgreSQL client error:', err);
  });
});

// Only log pool events in debug mode
if (process.env.LOG_LEVEL === 'debug') {
  pool.on('acquire', () => {
    console.log('Client acquired from pool');
  });

  pool.on('remove', () => {
    console.log('Client removed from pool');
  });
}

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

      // Only log slow queries or retries to reduce noise
      if (attempt > 1) {
        console.log(`Query succeeded on attempt ${attempt}`, {
          query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          duration,
          rows: result.rowCount
        });
      } else if (duration > 1000 || process.env.LOG_LEVEL === 'debug') {
        console.log('Executed query', {
          query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          duration,
          rows: result.rowCount
        });
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
          query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          duration,
          error: error.message,
          code: error.code
        });

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        continue;
      }

      console.error('Query error', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration,
        error: error.message,
        attempt
      });
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
