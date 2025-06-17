const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { success, internalError, notFound, conflict, created } = require('../utils/responses');
const { validateBody, validateParams } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { tagCreateSchema, tagUpdateSchema, idParamSchema } = require('../validation/schemas');

// GET /tags - List all tags
router.get('/', asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM tags ORDER BY name');
  success(res, result.rows, 'Tags retrieved successfully');
}));

// GET /tags/:id - Get single tag
router.get('/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query('SELECT * FROM tags WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return notFound(res, 'Tag', 'TAG_NOT_FOUND');
    }

    success(res, result.rows[0], 'Tag retrieved successfully');
  })
);

// POST /tags - Create new tag
router.post('/',
  validateBody(tagCreateSchema),
  asyncHandler(async (req, res) => {
    const { name } = req.body;

    // Check if tag already exists
    const existingResult = await query('SELECT id FROM tags WHERE name = $1', [name.trim()]);
    if (existingResult.rows.length > 0) {
      return conflict(res, 'Tag already exists', 'TAG_EXISTS');
    }

    // Insert new tag
    const result = await query(
      'INSERT INTO tags (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );

    created(res, result.rows[0], 'Tag created successfully');
  })
);

// PUT /tags/:id - Update tag
router.put('/:id',
  validateParams(idParamSchema),
  validateBody(tagUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    // Check if tag exists
    const existingResult = await query('SELECT id FROM tags WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return notFound(res, 'Tag', 'TAG_NOT_FOUND');
    }

    // Check if new name conflicts with existing tag
    const conflictResult = await query('SELECT id FROM tags WHERE name = $1 AND id != $2', [name.trim(), id]);
    if (conflictResult.rows.length > 0) {
      return conflict(res, 'Tag name already exists', 'TAG_NAME_EXISTS');
    }

    // Update tag
    const result = await query(
      'UPDATE tags SET name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), id]
    );

    success(res, result.rows[0], 'Tag updated successfully');
  })
);

// DELETE /tags/:id - Delete tag
router.delete('/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if tag exists
    const existingResult = await query('SELECT id, name FROM tags WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return notFound(res, 'Tag', 'TAG_NOT_FOUND');
    }

    // Check if any recipes use this tag
    const recipesResult = await query('SELECT COUNT(*) as count FROM recipe_tags WHERE tag_id = $1', [id]);
    const recipeCount = parseInt(recipesResult.rows[0].count);

    if (recipeCount > 0) {
      return conflict(res, `Cannot delete tag. ${recipeCount} recipe(s) are using this tag.`, 'TAG_IN_USE');
    }

    // Delete tag
    await query('DELETE FROM tags WHERE id = $1', [id]);

    success(res, { id: parseInt(id), name: existingResult.rows[0].name }, 'Tag deleted successfully');
  })
);

module.exports = router;
