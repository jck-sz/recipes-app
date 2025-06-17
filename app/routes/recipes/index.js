/**
 * Recipes Router - Main Entry Point
 * Splits large recipes.js into focused modules
 */

const express = require('express');
const router = express.Router();

// Import sub-routers
const basicRoutes = require('./basic');
const bulkRoutes = require('./bulk');
const specialRoutes = require('./special');
const relationshipRoutes = require('./relationships');

// Mount sub-routers
router.use('/', basicRoutes);           // Basic CRUD operations
router.use('/bulk', bulkRoutes);        // Bulk operations
router.use('/', specialRoutes);         // Special endpoints (popular, fodmap-safe)
router.use('/', relationshipRoutes);    // Relationship management (ingredients, tags)

module.exports = router;
