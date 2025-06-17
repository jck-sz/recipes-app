/**
 * Input Sanitization Middleware
 * Provides middleware for sanitizing and validating user inputs to prevent injection attacks
 */

const { logger } = require('./logging');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Create DOMPurify instance for server-side HTML sanitization
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitizes string input by removing/escaping potentially dangerous characters
 * @param {string} input - Input string to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} - Sanitized string
 */
function sanitizeString(input, options = {}) {
  if (typeof input !== 'string') {
    return input;
  }

  const {
    maxLength = 1000,
    allowHtml = false,
    trimWhitespace = true,
    removeControlChars = true
  } = options;

  let sanitized = input;

  // Trim whitespace if requested
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Remove control characters (except newlines and tabs if HTML is allowed)
  if (removeControlChars) {
    if (allowHtml) {
      // Keep newlines and tabs for HTML content
      sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    } else {
      // Remove all control characters
      sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    }
  }

  // Handle HTML content
  if (allowHtml) {
    // Sanitize HTML using DOMPurify to prevent XSS
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  } else {
    // Remove all HTML tags
    sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
  }

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitizes numeric input
 * @param {any} input - Input to sanitize as number
 * @param {Object} options - Sanitization options
 * @returns {number|null} - Sanitized number or null if invalid
 */
function sanitizeNumber(input, options = {}) {
  const {
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER,
    allowFloat = true,
    allowNegative = true
  } = options;

  if (input === null || input === undefined || input === '') {
    return null;
  }

  const num = allowFloat ? parseFloat(input) : parseInt(input, 10);

  if (isNaN(num)) {
    return null;
  }

  if (!allowNegative && num < 0) {
    return null;
  }

  if (num < min || num > max) {
    return null;
  }

  return num;
}

/**
 * Sanitizes array input
 * @param {any} input - Input to sanitize as array
 * @param {Object} options - Sanitization options
 * @returns {Array} - Sanitized array
 */
function sanitizeArray(input, options = {}) {
  const {
    maxLength = 100,
    itemSanitizer = null,
    allowEmpty = true
  } = options;

  if (!Array.isArray(input)) {
    return allowEmpty ? [] : null;
  }

  let sanitized = input.slice(0, maxLength);

  if (itemSanitizer && typeof itemSanitizer === 'function') {
    sanitized = sanitized.map(item => itemSanitizer(item)).filter(item => item !== null);
  }

  return sanitized;
}

/**
 * Middleware to sanitize request body
 * @param {Object} sanitizationRules - Rules for sanitizing specific fields
 * @returns {Function} - Express middleware function
 */
function sanitizeBody(sanitizationRules = {}) {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }

    try {
      const sanitized = {};

      for (const [key, value] of Object.entries(req.body)) {
        const rule = sanitizationRules[key];

        if (!rule) {
          // No specific rule, apply basic string sanitization
          if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
          } else {
            sanitized[key] = value;
          }
          continue;
        }

        switch (rule.type) {
          case 'string':
            sanitized[key] = sanitizeString(value, rule.options);
            break;
          case 'number':
            sanitized[key] = sanitizeNumber(value, rule.options);
            break;
          case 'array':
            sanitized[key] = sanitizeArray(value, rule.options);
            break;
          case 'boolean':
            sanitized[key] = Boolean(value);
            break;
          case 'skip':
            sanitized[key] = value; // Don't sanitize
            break;
          default:
            sanitized[key] = sanitizeString(String(value));
        }
      }

      req.body = sanitized;
      next();
    } catch (error) {
      logger.error('Input sanitization error', error, {
        requestId: req.id,
        body: req.body
      });
      
      return res.status(400).json({
        error: true,
        message: 'Invalid input data',
        details: ['Input contains invalid characters or format'],
        code: 'INVALID_INPUT'
      });
    }
  };
}

/**
 * Middleware to sanitize query parameters
 * @param {Object} sanitizationRules - Rules for sanitizing specific query params
 * @returns {Function} - Express middleware function
 */
function sanitizeQuery(sanitizationRules = {}) {
  return (req, res, next) => {
    if (!req.query || typeof req.query !== 'object') {
      return next();
    }

    try {
      const sanitized = {};

      for (const [key, value] of Object.entries(req.query)) {
        const rule = sanitizationRules[key];

        if (!rule) {
          // No specific rule, apply basic string sanitization
          sanitized[key] = sanitizeString(String(value), { maxLength: 200 });
          continue;
        }

        switch (rule.type) {
          case 'string':
            sanitized[key] = sanitizeString(String(value), rule.options);
            break;
          case 'number':
            sanitized[key] = sanitizeNumber(value, rule.options);
            break;
          case 'boolean':
            sanitized[key] = value === 'true' || value === '1';
            break;
          case 'skip':
            sanitized[key] = value; // Don't sanitize
            break;
          default:
            sanitized[key] = sanitizeString(String(value), { maxLength: 200 });
        }
      }

      req.query = sanitized;
      next();
    } catch (error) {
      logger.error('Query sanitization error', error, {
        requestId: req.id,
        query: req.query
      });
      
      return res.status(400).json({
        error: true,
        message: 'Invalid query parameters',
        details: ['Query contains invalid characters or format'],
        code: 'INVALID_QUERY'
      });
    }
  };
}

/**
 * General input sanitization middleware for common cases
 */
const generalSanitization = sanitizeBody({
  title: { type: 'string', options: { maxLength: 255 } },
  description: { type: 'string', options: { maxLength: 2000, allowHtml: false } },
  name: { type: 'string', options: { maxLength: 255 } },
  search: { type: 'string', options: { maxLength: 100 } },
  q: { type: 'string', options: { maxLength: 100 } }
});

module.exports = {
  sanitizeString,
  sanitizeNumber,
  sanitizeArray,
  sanitizeBody,
  sanitizeQuery,
  generalSanitization
};
