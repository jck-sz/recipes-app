/**
 * Input Sanitization - Main Entry Point
 * Exports sanitization functions and middleware
 */

const { sanitizeString, sanitizeNumber, sanitizeArray } = require('./sanitizers');
const { sanitizeBody, sanitizeQuery } = require('./middleware');
const { generalSanitization } = require('./presets');

module.exports = {
  // Core sanitization functions
  sanitizeString,
  sanitizeNumber,
  sanitizeArray,
  
  // Middleware functions
  sanitizeBody,
  sanitizeQuery,
  
  // Preset configurations
  generalSanitization
};
