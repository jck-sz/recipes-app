const morgan = require('morgan');

// Custom token for request ID
morgan.token('id', (req) => req.id);

// Custom token for user info (when auth is implemented)
morgan.token('user', (req) => req.user ? req.user.id : 'anonymous');

// Custom token for response time in ms
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '';
  }
  
  const ms = (res._startAt[0] - req._startAt[0]) * 1000 +
             (res._startAt[1] - req._startAt[1]) * 1e-6;
  
  return ms.toFixed(3);
});

// Development logging format
const developmentFormat = ':id :method :url :status :response-time-ms ms - :res[content-length]';

// Production logging format
const productionFormat = ':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms';

// Request ID middleware
const requestId = (req, res, next) => {
  req.id = generateRequestId();
  res.setHeader('X-Request-ID', req.id);
  next();
};

// Generate unique request ID
const generateRequestId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Sanitize request data for logging
const sanitizeForLogging = (req) => {
  const sanitized = {
    method: req.method,
    url: req.url,
    query: req.query,
    params: req.params,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };

  // Only include body and headers in debug mode, and sanitize them
  if (process.env.LOG_LEVEL === 'debug') {
    if (req.body) {
      const sanitizedBody = { ...req.body };
      delete sanitizedBody.password;
      delete sanitizedBody.token;
      delete sanitizedBody.secret;
      sanitized.body = sanitizedBody;
    }

    if (req.headers) {
      const sanitizedHeaders = { ...req.headers };
      delete sanitizedHeaders.authorization;
      delete sanitizedHeaders.cookie;
      delete sanitizedHeaders['x-api-key'];
      sanitized.headers = sanitizedHeaders;
    }
  }

  return sanitized;
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR ${req.id}:`, {
    error: err.message,
    // Only include stack trace in debug mode
    ...(process.env.LOG_LEVEL === 'debug' && { stack: err.stack }),
    ...sanitizeForLogging(req)
  });
  
  next(err);
};

// Request logging middleware
const requestLogger = () => {
  const format = process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat;
  
  return morgan(format, {
    stream: {
      write: (message) => {
        // Remove trailing newline
        console.log(message.trim());
      }
    },
    skip: (req, res) => {
      // Skip logging for health checks in production
      return process.env.NODE_ENV === 'production' && req.url === '/health';
    }
  });
};

// Structured logging utility
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  
  error: (message, error = null, meta = {}) => {
    const errorInfo = error ? {
      message: error.message,
      // Only include stack trace in debug mode
      ...(process.env.LOG_LEVEL === 'debug' && { stack: error.stack })
    } : null;

    console.error(JSON.stringify({
      level: 'error',
      message,
      error: errorInfo,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(JSON.stringify({
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        ...meta
      }));
    }
  }
};

module.exports = {
  requestId,
  requestLogger,
  errorLogger,
  logger
};
