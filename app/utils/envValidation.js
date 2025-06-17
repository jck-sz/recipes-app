/**
 * Environment Variable Validation Utility
 * Validates required environment variables and provides defaults
 */

/**
 * Validates and parses environment variables
 * @param {Object} schema - Validation schema
 * @returns {Object} - Validated environment variables
 */
function validateEnv(schema) {
  const errors = [];
  const warnings = [];
  const validated = {};

  for (const [key, config] of Object.entries(schema)) {
    const value = process.env[key];
    const { required = false, type = 'string', defaultValue, validator, description } = config;

    // Check if required variable is missing
    if (required && (value === undefined || value === '')) {
      errors.push(`Required environment variable ${key} is missing. ${description || ''}`);
      continue;
    }

    // Use default value if not provided
    const finalValue = value !== undefined && value !== '' ? value : defaultValue;

    if (finalValue === undefined) {
      if (required) {
        errors.push(`Required environment variable ${key} has no value and no default. ${description || ''}`);
      }
      continue;
    }

    // Type conversion and validation
    try {
      let parsedValue;

      switch (type) {
        case 'string':
          parsedValue = String(finalValue);
          break;
        case 'number':
          parsedValue = Number(finalValue);
          if (isNaN(parsedValue)) {
            throw new Error(`${key} must be a valid number`);
          }
          break;
        case 'integer':
          parsedValue = parseInt(finalValue, 10);
          if (isNaN(parsedValue)) {
            throw new Error(`${key} must be a valid integer`);
          }
          break;
        case 'boolean':
          parsedValue = finalValue === 'true' || finalValue === '1' || finalValue === 'yes';
          break;
        case 'array':
          if (Array.isArray(finalValue)) {
            parsedValue = finalValue;
          } else {
            parsedValue = String(finalValue).split(',').map(item => item.trim()).filter(item => item);
          }
          break;
        case 'url':
          try {
            new URL(finalValue);
            parsedValue = finalValue;
          } catch {
            throw new Error(`${key} must be a valid URL`);
          }
          break;
        default:
          parsedValue = finalValue;
      }

      // Custom validation
      if (validator && typeof validator === 'function') {
        const validationResult = validator(parsedValue);
        if (validationResult !== true) {
          throw new Error(validationResult || `${key} failed custom validation`);
        }
      }

      validated[key] = parsedValue;

      // Warning for using default values in production
      if (value === undefined && process.env.NODE_ENV === 'production' && defaultValue !== undefined) {
        warnings.push(`Using default value for ${key} in production environment`);
      }

    } catch (error) {
      errors.push(`Invalid value for ${key}: ${error.message}`);
    }
  }

  return { validated, errors, warnings };
}

/**
 * Environment validation schema for the FODMAP Recipe API
 */
const envSchema = {
  NODE_ENV: {
    type: 'string',
    defaultValue: 'development',
    validator: (value) => ['development', 'production', 'test'].includes(value) || 'Must be development, production, or test',
    description: 'Application environment'
  },
  PORT: {
    type: 'integer',
    defaultValue: 3000,
    validator: (value) => value > 0 && value < 65536 || 'Must be a valid port number (1-65535)',
    description: 'Server port number'
  },
  DATABASE_URL: {
    type: 'string',
    required: true,
    validator: (value) => value.startsWith('postgresql://') || 'Must be a valid PostgreSQL connection string',
    description: 'PostgreSQL database connection string'
  },
  APP_NAME: {
    type: 'string',
    defaultValue: 'fodmap-recipe-api',
    description: 'Application name for monitoring'
  },
  
  // Database pool settings
  DB_POOL_MAX: {
    type: 'integer',
    defaultValue: 20,
    validator: (value) => value > 0 && value <= 100 || 'Must be between 1 and 100',
    description: 'Maximum database connections in pool'
  },
  DB_POOL_MIN: {
    type: 'integer',
    defaultValue: 2,
    validator: (value) => value >= 0 && value <= 50 || 'Must be between 0 and 50',
    description: 'Minimum database connections in pool'
  },
  DB_IDLE_TIMEOUT: {
    type: 'integer',
    defaultValue: 30000,
    validator: (value) => value > 0 || 'Must be positive',
    description: 'Database connection idle timeout in milliseconds'
  },
  DB_CONNECTION_TIMEOUT: {
    type: 'integer',
    defaultValue: 10000,
    validator: (value) => value > 0 || 'Must be positive',
    description: 'Database connection timeout in milliseconds'
  },
  
  // Security settings
  ALLOWED_ORIGINS: {
    type: 'array',
    defaultValue: ['*'],
    description: 'CORS allowed origins (comma-separated)'
  },
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: {
    type: 'integer',
    defaultValue: 900000, // 15 minutes
    validator: (value) => value > 0 || 'Must be positive',
    description: 'Rate limit window in milliseconds'
  },
  RATE_LIMIT_MAX_REQUESTS: {
    type: 'integer',
    defaultValue: 100,
    validator: (value) => value > 0 || 'Must be positive',
    description: 'Maximum requests per rate limit window'
  },
  
  // Logging
  LOG_LEVEL: {
    type: 'string',
    defaultValue: 'info',
    validator: (value) => ['error', 'warn', 'info', 'debug'].includes(value) || 'Must be error, warn, info, or debug',
    description: 'Logging level'
  },
  ENABLE_REQUEST_LOGGING: {
    type: 'boolean',
    defaultValue: true,
    description: 'Enable request logging'
  }
};

/**
 * Validates the current environment
 * @returns {Object} - Validation results
 */
function validateCurrentEnv() {
  return validateEnv(envSchema);
}

/**
 * Validates environment and exits if there are errors
 */
function validateEnvOrExit() {
  const { validated, errors, warnings } = validateCurrentEnv();

  if (warnings.length > 0) {
    console.warn('Environment warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
    console.warn('');
  }

  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\nPlease check your .env file and fix the above errors.');
    console.error('See .env.example for reference.');
    process.exit(1);
  }

  console.log('Environment validation passed ✓');
  return validated;
}

/**
 * Gets a validated environment variable
 * @param {string} key - Environment variable key
 * @param {any} defaultValue - Default value if not set
 * @returns {any} - Environment variable value
 */
function getEnvVar(key, defaultValue = undefined) {
  const { validated } = validateCurrentEnv();
  return validated[key] !== undefined ? validated[key] : defaultValue;
}

module.exports = {
  validateEnv,
  validateCurrentEnv,
  validateEnvOrExit,
  getEnvVar,
  envSchema
};
