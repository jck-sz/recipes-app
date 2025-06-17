const rateLimit = require('express-rate-limit');
const { logger } = require('./logging');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: true,
    message: 'Too many requests from this IP, please try again later.',
    details: ['Rate limit exceeded. Please wait before making more requests.'],
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      requestId: req.id
    });
    
    res.status(429).json({
      error: true,
      message: 'Too many requests from this IP, please try again later.',
      details: ['Rate limit exceeded. Please wait before making more requests.'],
      code: 'RATE_LIMIT_EXCEEDED'
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path.startsWith('/health');
  }
});

// Strict rate limiter for write operations (POST, PUT, DELETE)
const strictLimiter = rateLimit({
  windowMs: parseInt(process.env.STRICT_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.STRICT_RATE_LIMIT_MAX_REQUESTS) || 20, // Limit each IP to 20 write requests per windowMs
  message: {
    error: true,
    message: 'Too many write operations from this IP, please try again later.',
    details: ['Write operation rate limit exceeded. Please wait before making more requests.'],
    code: 'WRITE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      requestId: req.id
    });
    
    res.status(429).json({
      error: true,
      message: 'Too many write operations from this IP, please try again later.',
      details: ['Write operation rate limit exceeded. Please wait before making more requests.'],
      code: 'WRITE_RATE_LIMIT_EXCEEDED'
    });
  },
  skip: (req) => {
    // Only apply to write operations
    return !['POST', 'PUT', 'DELETE'].includes(req.method);
  }
});

// Very strict rate limiter for bulk operations
const bulkOperationLimiter = rateLimit({
  windowMs: parseInt(process.env.BULK_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.BULK_RATE_LIMIT_MAX_REQUESTS) || 5, // Limit each IP to 5 bulk requests per hour
  message: {
    error: true,
    message: 'Too many bulk operations from this IP, please try again later.',
    details: ['Bulk operation rate limit exceeded. Please wait before making more requests.'],
    code: 'BULK_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Bulk operation rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      requestId: req.id
    });
    
    res.status(429).json({
      error: true,
      message: 'Too many bulk operations from this IP, please try again later.',
      details: ['Bulk operation rate limit exceeded. Please wait before making more requests.'],
      code: 'BULK_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Rate limiter for search operations
const searchLimiter = rateLimit({
  windowMs: parseInt(process.env.SEARCH_RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000, // 5 minutes
  max: parseInt(process.env.SEARCH_RATE_LIMIT_MAX_REQUESTS) || 50, // Limit each IP to 50 search requests per 5 minutes
  message: {
    error: true,
    message: 'Too many search requests from this IP, please try again later.',
    details: ['Search rate limit exceeded. Please wait before making more requests.'],
    code: 'SEARCH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Search rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      query: req.query,
      requestId: req.id
    });
    
    res.status(429).json({
      error: true,
      message: 'Too many search requests from this IP, please try again later.',
      details: ['Search rate limit exceeded. Please wait before making more requests.'],
      code: 'SEARCH_RATE_LIMIT_EXCEEDED'
    });
  }
});

module.exports = {
  generalLimiter,
  strictLimiter,
  bulkOperationLimiter,
  searchLimiter
};
