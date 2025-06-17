const express = require('express');
const router = express.Router();
const pool = require('../db');
const { success, internalError } = require('../utils/responses');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../middleware/logging');

// GET /health - Database and application health check
router.get('/', asyncHandler(async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {}
  };

  try {
    // Check database connection
    const dbStart = Date.now();
    const dbResult = await pool.query('SELECT 1 as health_check');
    const dbDuration = Date.now() - dbStart;

    if (dbResult.rows[0].health_check === 1) {
      healthCheck.services.database = {
        status: 'healthy',
        responseTime: `${dbDuration}ms`,
        connection: 'active'
      };
    } else {
      throw new Error('Database health check failed');
    }

    // Check database pool status
    healthCheck.services.database.pool = {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount
    };

    // Memory usage
    const memUsage = process.memoryUsage();
    healthCheck.system = {
      memory: {
        used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
      },
      cpu: {
        usage: process.cpuUsage()
      }
    };

    logger.debug('Health check completed successfully', {
      requestId: req.id,
      dbResponseTime: dbDuration
    });

    return success(res, healthCheck, 'Application is healthy');

  } catch (error) {
    logger.error('Health check failed', error, {
      requestId: req.id
    });

    healthCheck.status = 'unhealthy';
    healthCheck.services.database = {
      status: 'unhealthy',
      error: error.message
    };

    return internalError(
      res, 
      'Health check failed', 
      [error.message], 
      'HEALTH_CHECK_FAILED'
    );
  }
}));

// GET /health/db - Detailed database health check
router.get('/db', asyncHandler(async (req, res) => {
  try {
    const checks = [];

    // Basic connectivity
    const connectStart = Date.now();
    await pool.query('SELECT 1');
    checks.push({
      name: 'connectivity',
      status: 'pass',
      responseTime: `${Date.now() - connectStart}ms`
    });

    // Check if main tables exist
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('recipes', 'ingredients', 'categories', 'tags')
    `);
    
    checks.push({
      name: 'schema',
      status: tableCheck.rows.length === 4 ? 'pass' : 'fail',
      details: `Found ${tableCheck.rows.length}/4 required tables`
    });

    // Check data integrity
    const dataCheck = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM categories) as categories,
        (SELECT COUNT(*) FROM ingredients) as ingredients,
        (SELECT COUNT(*) FROM tags) as tags,
        (SELECT COUNT(*) FROM recipes) as recipes
    `);

    checks.push({
      name: 'data_integrity',
      status: 'pass',
      details: dataCheck.rows[0]
    });

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks,
      pool: {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount
      }
    };

    return success(res, healthData, 'Database health check completed');

  } catch (error) {
    logger.error('Database health check failed', error, {
      requestId: req.id
    });

    return internalError(
      res,
      'Database health check failed',
      [error.message],
      'DB_HEALTH_CHECK_FAILED'
    );
  }
}));

module.exports = router;
