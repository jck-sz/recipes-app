const { internalError, validationError } = require('../utils/responses');
const { logger } = require('./logging');

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error', err, {
    requestId: req.id,
    method: req.method,
    url: req.url,
    body: req.body,
    query: req.query,
    params: req.params,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    return validationError(res, err.message, err.details || [], 'VALIDATION_ERROR');
  }

  if (err.name === 'CastError') {
    return validationError(res, 'Invalid ID format', [], 'INVALID_ID');
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return validationError(res, 'Resource already exists', [], 'DUPLICATE_RESOURCE');
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    return validationError(res, 'Referenced resource does not exist', [], 'INVALID_REFERENCE');
  }

  if (err.code === '23502') { // PostgreSQL not null violation
    return validationError(res, 'Required field is missing', [], 'MISSING_REQUIRED_FIELD');
  }

  if (err.code === '23514') { // PostgreSQL check constraint violation
    return validationError(res, 'Invalid field value', [], 'INVALID_FIELD_VALUE');
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return internalError(res, 'Database connection failed', [], 'DATABASE_ERROR');
  }

  // JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return validationError(res, 'Invalid JSON format', [], 'INVALID_JSON');
  }

  // Default to internal server error
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  const details = process.env.NODE_ENV === 'production' 
    ? [] 
    : [err.stack];

  return internalError(res, message, details, 'INTERNAL_ERROR');
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  return res.status(404).json({
    error: true,
    message: 'Endpoint not found',
    details: [`${req.method} ${req.url} is not a valid endpoint`],
    code: 'ENDPOINT_NOT_FOUND'
  });
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Rate limiting error handler
const rateLimitHandler = (req, res) => {
  logger.warn('Rate limit exceeded', {
    requestId: req.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  return res.status(429).json({
    error: true,
    message: 'Too many requests',
    details: ['Rate limit exceeded. Please try again later.'],
    code: 'RATE_LIMIT_EXCEEDED'
  });
};

module.exports = {
  globalErrorHandler,
  notFoundHandler,
  asyncHandler,
  rateLimitHandler
};
