/**
 * Configuration Management
 * Centralized configuration with validation
 */

const { validateEnvOrExit } = require('../utils/envValidation');

// Validate environment on module load
const validatedEnv = validateEnvOrExit();

// Export configuration object
const config = {
  // Application settings
  app: {
    name: validatedEnv.APP_NAME || 'fodmap-recipe-api',
    env: validatedEnv.NODE_ENV || 'development',
    port: validatedEnv.PORT || 3000
  },

  // Database configuration
  database: {
    url: validatedEnv.DATABASE_URL,
    pool: {
      max: validatedEnv.DB_POOL_MAX || 20,
      min: validatedEnv.DB_POOL_MIN || 2,
      idleTimeout: validatedEnv.DB_IDLE_TIMEOUT || 30000,
      connectionTimeout: validatedEnv.DB_CONNECTION_TIMEOUT || 10000,
      maxUses: validatedEnv.DB_MAX_USES || 7500,
      queryTimeout: validatedEnv.DB_QUERY_TIMEOUT || 30000,
      statementTimeout: validatedEnv.DB_STATEMENT_TIMEOUT || 60000
    }
  },

  // Security settings
  security: {
    allowedOrigins: validatedEnv.ALLOWED_ORIGINS || ['*'],
    rateLimits: {
      general: {
        windowMs: validatedEnv.RATE_LIMIT_WINDOW_MS || 900000,
        max: validatedEnv.RATE_LIMIT_MAX_REQUESTS || 100
      },
      strict: {
        windowMs: validatedEnv.STRICT_RATE_LIMIT_WINDOW_MS || 900000,
        max: validatedEnv.STRICT_RATE_LIMIT_MAX_REQUESTS || 20
      },
      bulk: {
        windowMs: validatedEnv.BULK_RATE_LIMIT_WINDOW_MS || 3600000,
        max: validatedEnv.BULK_RATE_LIMIT_MAX_REQUESTS || 5
      },
      search: {
        windowMs: validatedEnv.SEARCH_RATE_LIMIT_WINDOW_MS || 300000,
        max: validatedEnv.SEARCH_RATE_LIMIT_MAX_REQUESTS || 50
      }
    }
  },

  // Logging configuration
  logging: {
    level: validatedEnv.LOG_LEVEL || 'info',
    enableRequestLogging: validatedEnv.ENABLE_REQUEST_LOGGING !== false
  },

  // Feature flags
  features: {
    healthCheck: validatedEnv.HEALTH_CHECK_ENABLED !== false,
    developmentMode: validatedEnv.DEVELOPMENT_MODE === true,
    sqlQueryLogging: validatedEnv.LOG_SQL_QUERIES === true
  },

  // Helper methods
  isDevelopment: () => config.app.env === 'development',
  isProduction: () => config.app.env === 'production',
  isTest: () => config.app.env === 'test'
};

module.exports = config;
