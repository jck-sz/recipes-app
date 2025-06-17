const express = require('express');
const router = express.Router();
const pool = require('../db');
const { success, error, validationError, notFound, conflict, created, paginated } = require('../utils/responses');
const { validateRequired, validateFodmapLevel } = require('../utils/validation');
const { parsePagination, buildPaginationResponse } = require('../utils/pagination');

// GET /ingredients - List all ingredients with pagination
router.get('/', async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { fodmap_level } = req.query;
    
    let whereClause = '';
    let queryParams = [];
    
    // Add FODMAP level filter if provided
    if (fodmap_level) {
      const fodmapErr = validateFodmapLevel(fodmap_level);
      if (fodmapErr) {
        return validationError(res, fodmapErr);
      }
      whereClause = 'WHERE fodmap_level = $1';
      queryParams.push(fodmap_level);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM ingredients ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Get paginated results
    const dataQuery = `
      SELECT id, name, quantity_unit, fodmap_level 
      FROM ingredients 
      ${whereClause}
      ORDER BY name 
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    const dataResult = await pool.query(dataQuery, [...queryParams, limit, offset]);
    
    const pagination = buildPaginationResponse(page, limit, totalCount);
    paginated(res, dataResult.rows, pagination, 'Ingredients retrieved successfully');
  } catch (err) {
    console.error('Database error:', err);
    error(res, 'Failed to retrieve ingredients');
  }
});

// GET /ingredients/search?q=term - Search ingredients by name
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return validationError(res, 'Search query parameter "q" is required');
    }
    
    const { page, limit, offset } = parsePagination(req.query);
    const searchTerm = `%${q.trim()}%`;
    
    // Get total count
    const countQuery = 'SELECT COUNT(*) as count FROM ingredients WHERE name ILIKE $1';
    const countResult = await pool.query(countQuery, [searchTerm]);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Get paginated results
    const dataQuery = `
      SELECT id, name, quantity_unit, fodmap_level 
      FROM ingredients 
      WHERE name ILIKE $1 
      ORDER BY name 
      LIMIT $2 OFFSET $3
    `;
    const dataResult = await pool.query(dataQuery, [searchTerm, limit, offset]);
    
    const pagination = buildPaginationResponse(page, limit, totalCount);
    paginated(res, dataResult.rows, pagination, `Found ${totalCount} ingredients matching "${q}"`);
  } catch (err) {
    console.error('Database error:', err);
    error(res, 'Failed to search ingredients');
  }
});

// GET /ingredients/:id - Get single ingredient
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT id, name, quantity_unit, fodmap_level FROM ingredients WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return notFound(res, 'Ingredient');
    }
    
    success(res, result.rows[0], 'Ingredient retrieved successfully');
  } catch (err) {
    console.error('Database error:', err);
    error(res, 'Failed to retrieve ingredient');
  }
});

// POST /ingredients - Create new ingredient
router.post('/', async (req, res) => {
  try {
    const { name, quantity_unit, fodmap_level } = req.body;

    // Validate required fields
    const validationErr = validateRequired(['name'], req.body);
    if (validationErr) {
      return validationError(res, validationErr);
    }

    // Validate FODMAP level if provided
    const fodmapErr = validateFodmapLevel(fodmap_level);
    if (fodmapErr) {
      return validationError(res, fodmapErr);
    }

    // Check if ingredient already exists
    const existingResult = await pool.query('SELECT id FROM ingredients WHERE name = $1', [name]);
    if (existingResult.rows.length > 0) {
      return conflict(res, 'Ingredient already exists');
    }

    // Insert new ingredient
    const result = await pool.query(
      'INSERT INTO ingredients (name, quantity_unit, fodmap_level) VALUES ($1, $2, $3) RETURNING *',
      [name, quantity_unit || null, fodmap_level || null]
    );

    created(res, result.rows[0], 'Ingredient created successfully');
  } catch (err) {
    console.error('Database error:', err);
    error(res, 'Failed to create ingredient');
  }
});

// PUT /ingredients/:id - Update ingredient
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity_unit, fodmap_level } = req.body;

    // Validate required fields
    const validationErr = validateRequired(['name'], req.body);
    if (validationErr) {
      return validationError(res, validationErr);
    }

    // Validate FODMAP level if provided
    const fodmapErr = validateFodmapLevel(fodmap_level);
    if (fodmapErr) {
      return validationError(res, fodmapErr);
    }

    // Check if ingredient exists
    const existingResult = await pool.query('SELECT id FROM ingredients WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return notFound(res, 'Ingredient');
    }

    // Check if new name conflicts with existing ingredient
    const conflictResult = await pool.query('SELECT id FROM ingredients WHERE name = $1 AND id != $2', [name, id]);
    if (conflictResult.rows.length > 0) {
      return conflict(res, 'Ingredient name already exists');
    }

    // Update ingredient
    const result = await pool.query(
      'UPDATE ingredients SET name = $1, quantity_unit = $2, fodmap_level = $3 WHERE id = $4 RETURNING *',
      [name, quantity_unit || null, fodmap_level || null, id]
    );

    success(res, result.rows[0], 'Ingredient updated successfully');
  } catch (err) {
    console.error('Database error:', err);
    error(res, 'Failed to update ingredient');
  }
});

// DELETE /ingredients/:id - Delete ingredient (check no recipes use it)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ingredient exists
    const existingResult = await pool.query('SELECT id, name FROM ingredients WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return notFound(res, 'Ingredient');
    }

    // Check if any recipes use this ingredient
    const recipesResult = await pool.query('SELECT COUNT(*) as count FROM recipe_ingredients WHERE ingredient_id = $1', [id]);
    const recipeCount = parseInt(recipesResult.rows[0].count);

    if (recipeCount > 0) {
      return conflict(res, `Cannot delete ingredient. ${recipeCount} recipe(s) are using this ingredient.`);
    }

    // Delete ingredient
    await pool.query('DELETE FROM ingredients WHERE id = $1', [id]);

    success(res, { id: parseInt(id), name: existingResult.rows[0].name }, 'Ingredient deleted successfully');
  } catch (err) {
    console.error('Database error:', err);
    error(res, 'Failed to delete ingredient');
  }
});

module.exports = router;
