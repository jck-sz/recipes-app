const { Pool } = require('pg');
const { logger } = require('../middleware/logging');

// Enhanced pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  min: 2,  // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Ensure UTF-8 encoding
  client_encoding: 'UTF8'
});

// Enhanced event handlers
pool.on('connect', (client) => {
  logger.info('New client connected to PostgreSQL', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

pool.on('acquire', (client) => {
  logger.debug('Client acquired from pool', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

pool.on('error', (err, client) => {
  logger.error('PostgreSQL pool error', err, {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

pool.on('remove', (client) => {
  logger.info('Client removed from pool', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

// Transaction helper
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

// Query helper with logging
const query = async (text, params = []) => {
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    logger.debug('Database query executed', {
      query: text,
      duration: `${duration}ms`,
      rows: result.rowCount
    });

    return result;
  } catch (error) {
    const duration = Date.now() - start;

    logger.error('Database query failed', error, {
      query: text,
      params,
      duration: `${duration}ms`
    });

    throw error;
  }
};

// Graceful shutdown
let isShuttingDown = false;
const gracefulShutdown = async () => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  logger.info('Closing database pool...');
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error('Error closing database pool', error);
  }
  process.exit(0);
};

// Handle process termination
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = {
  pool,
  query,
  withTransaction,
  gracefulShutdown
};
