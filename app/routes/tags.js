const express = require('express');
const router = express.Router();
const pool = require('../db');
const { success, error, validationError, notFound, conflict, created } = require('../utils/responses');
const { validateRequired } = require('../utils/validation');

// GET /tags - List all tags
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tags ORDER BY name');
    success(res, result.rows, 'Tags retrieved successfully');
  } catch (err) {
    console.error('Database error:', err);
    error(res, 'Failed to retrieve tags');
  }
});

// POST /tags - Create new tag
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    // Validate required fields
    const validationErr = validateRequired(['name'], req.body);
    if (validationErr) {
      return validationError(res, validationErr);
    }
    
    // Validate name length
    if (name.trim().length === 0) {
      return validationError(res, 'Tag name cannot be empty');
    }
    
    if (name.length > 255) {
      return validationError(res, 'Tag name cannot exceed 255 characters');
    }
    
    // Check if tag already exists
    const existingResult = await pool.query('SELECT id FROM tags WHERE name = $1', [name.trim()]);
    if (existingResult.rows.length > 0) {
      return conflict(res, 'Tag already exists');
    }
    
    // Insert new tag
    const result = await pool.query(
      'INSERT INTO tags (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );
    
    created(res, result.rows[0], 'Tag created successfully');
  } catch (err) {
    console.error('Database error:', err);
    error(res, 'Failed to create tag');
  }
});

// PUT /tags/:id - Update tag
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    // Validate required fields
    const validationErr = validateRequired(['name'], req.body);
    if (validationErr) {
      return validationError(res, validationErr);
    }
    
    // Validate name length
    if (name.trim().length === 0) {
      return validationError(res, 'Tag name cannot be empty');
    }
    
    if (name.length > 255) {
      return validationError(res, 'Tag name cannot exceed 255 characters');
    }
    
    // Check if tag exists
    const existingResult = await pool.query('SELECT id FROM tags WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return notFound(res, 'Tag');
    }
    
    // Check if new name conflicts with existing tag
    const conflictResult = await pool.query('SELECT id FROM tags WHERE name = $1 AND id != $2', [name.trim(), id]);
    if (conflictResult.rows.length > 0) {
      return conflict(res, 'Tag name already exists');
    }
    
    // Update tag
    const result = await pool.query(
      'UPDATE tags SET name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), id]
    );
    
    success(res, result.rows[0], 'Tag updated successfully');
  } catch (err) {
    console.error('Database error:', err);
    error(res, 'Failed to update tag');
  }
});

// DELETE /tags/:id - Delete tag
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if tag exists
    const existingResult = await pool.query('SELECT id, name FROM tags WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return notFound(res, 'Tag');
    }
    
    // Check if any recipes use this tag
    const recipesResult = await pool.query('SELECT COUNT(*) as count FROM recipe_tags WHERE tag_id = $1', [id]);
    const recipeCount = parseInt(recipesResult.rows[0].count);
    
    if (recipeCount > 0) {
      return conflict(res, `Cannot delete tag. ${recipeCount} recipe(s) are using this tag.`);
    }
    
    // Delete tag
    await pool.query('DELETE FROM tags WHERE id = $1', [id]);
    
    success(res, { id: parseInt(id), name: existingResult.rows[0].name }, 'Tag deleted successfully');
  } catch (err) {
    console.error('Database error:', err);
    error(res, 'Failed to delete tag');
  }
});

module.exports = router;
