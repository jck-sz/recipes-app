const express = require('express');
const router = express.Router();
const { success, unauthorized } = require('../utils/responses');
const { validateBody } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const Joi = require('joi');

// Admin authentication schema
const adminAuthSchema = Joi.object({
  password: Joi.string().required()
});

/**
 * POST /admin/auth
 * Authenticate admin user with password
 */
router.post('/auth', 
  validateBody(adminAuthSchema),
  asyncHandler(async (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return unauthorized(res, 'Admin authentication not configured', [], 'ADMIN_NOT_CONFIGURED');
    }

    if (password !== adminPassword) {
      return unauthorized(res, 'Invalid admin password', [], 'INVALID_ADMIN_PASSWORD');
    }

    // Return success with a simple token (in production, use JWT)
    const token = Buffer.from(`admin:${Date.now()}`).toString('base64');

    return success(res, {
      authenticated: true,
      token: token,
      expiresIn: '24h' // For display purposes
    }, 'Admin authenticated successfully');
  })
);

/**
 * POST /admin/verify
 * Verify admin token (simple implementation)
 */
router.post('/verify',
  validateBody(Joi.object({
    token: Joi.string().required()
  })),
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [user, timestamp] = decoded.split(':');
      
      if (user !== 'admin') {
        return unauthorized(res, 'Invalid token', [], 'INVALID_TOKEN');
      }
      
      // Check if token is less than 24 hours old
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (tokenAge > maxAge) {
        return unauthorized(res, 'Token expired', [], 'TOKEN_EXPIRED');
      }
      
      return success(res, {
        valid: true,
        user: 'admin'
      }, 'Token is valid');
    } catch (error) {
      return unauthorized(res, 'Invalid token format', [], 'INVALID_TOKEN_FORMAT');
    }
  })
);

module.exports = router;
