const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../db');
const { success, internalError, notFound, conflict, created, paginated } = require('../utils/responses');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  ingredientCreateSchema,
  ingredientUpdateSchema,
  ingredientQuerySchema,
  ingredientSearchSchema,
  ingredientsByFodmapSchema,
  bulkIngredientsSchema,
  idParamSchema
} = require('../validation/schemas');
const { parsePagination, buildPaginationResponse } = require('../utils/pagination');

// GET /ingredients - List all ingredients with pagination
router.get('/',
  validateQuery(ingredientQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { fodmap_level } = req.query;

    let whereClause = '';
    let queryParams = [];

    // Add FODMAP level filter if provided
    if (fodmap_level) {
      whereClause = 'WHERE fodmap_level = $1';
      queryParams.push(fodmap_level);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM ingredients ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get paginated results
    const dataQuery = `
      SELECT id, name, quantity_unit, fodmap_level
      FROM ingredients
      ${whereClause}
      ORDER BY name
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    const dataResult = await query(dataQuery, [...queryParams, limit, offset]);

    const pagination = buildPaginationResponse(page, limit, totalCount);
    paginated(res, dataResult.rows, pagination, 'Ingredients retrieved successfully');
  })
);

// GET /ingredients/search?q=term - Search ingredients by name
router.get('/search',
  validateQuery(ingredientSearchSchema),
  asyncHandler(async (req, res) => {
    const { q } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    const searchTerm = `%${q.trim()}%`;

    // Get total count
    const countQuery = 'SELECT COUNT(*) as count FROM ingredients WHERE name ILIKE $1';
    const countResult = await query(countQuery, [searchTerm]);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get paginated results
    const dataQuery = `
      SELECT id, name, quantity_unit, fodmap_level
      FROM ingredients
      WHERE name ILIKE $1
      ORDER BY name
      LIMIT $2 OFFSET $3
    `;
    const dataResult = await query(dataQuery, [searchTerm, limit, offset]);

    const pagination = buildPaginationResponse(page, limit, totalCount);
    paginated(res, dataResult.rows, pagination, `Found ${totalCount} ingredients matching "${q}"`);
  })
);

// GET /ingredients/unused - Ingredients not used in any recipe
router.get('/unused', asyncHandler(async (req, res) => {
  const unusedQuery = `
    SELECT
      i.id,
      i.name,
      i.quantity_unit,
      i.fodmap_level
    FROM ingredients i
    LEFT JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
    WHERE ri.ingredient_id IS NULL
    ORDER BY i.name
  `;

  const result = await query(unusedQuery);

  success(res, {
    unused_ingredients: result.rows,
    count: result.rows.length
  }, `Found ${result.rows.length} unused ingredients`);
}));

// GET /ingredients/by-fodmap-level - Group ingredients by FODMAP level
router.get('/by-fodmap-level',
  validateQuery(ingredientsByFodmapSchema),
  asyncHandler(async (req, res) => {
    const { level } = req.query;

    // Get ingredients grouped by FODMAP level
    const ingredientsQuery = `
      SELECT
        i.id,
        i.name,
        i.quantity_unit,
        i.fodmap_level,
        COUNT(ri.recipe_id) as used_in_recipes
      FROM ingredients i
      LEFT JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
      WHERE i.fodmap_level = $1
      GROUP BY i.id, i.name, i.quantity_unit, i.fodmap_level
      ORDER BY i.name
    `;

    const result = await query(ingredientsQuery, [level]);

    // Get summary statistics
    const statsQuery = `
      SELECT
        fodmap_level,
        COUNT(*) as total_ingredients,
        COUNT(CASE WHEN ri.ingredient_id IS NOT NULL THEN 1 END) as used_ingredients,
        COUNT(CASE WHEN ri.ingredient_id IS NULL THEN 1 END) as unused_ingredients
      FROM ingredients i
      LEFT JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
      WHERE i.fodmap_level = $1
      GROUP BY fodmap_level
    `;

    const statsResult = await query(statsQuery, [level]);

    success(res, {
      fodmap_level: level,
      ingredients: result.rows,
      statistics: statsResult.rows[0] || {
        fodmap_level: level,
        total_ingredients: 0,
        used_ingredients: 0,
        unused_ingredients: 0
      }
    }, `Ingredients with FODMAP level: ${level}`);
  })
);

// GET /ingredients/:id - Get single ingredient
router.get('/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query(
      'SELECT id, name, quantity_unit, fodmap_level FROM ingredients WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return notFound(res, 'Ingredient', 'INGREDIENT_NOT_FOUND');
    }

    success(res, result.rows[0], 'Ingredient retrieved successfully');
  })
);

// POST /ingredients - Create new ingredient
router.post('/',
  validateBody(ingredientCreateSchema),
  asyncHandler(async (req, res) => {
    const { name, quantity_unit, fodmap_level } = req.body;

    // Check if ingredient already exists
    const existingResult = await query('SELECT id FROM ingredients WHERE name = $1', [name]);
    if (existingResult.rows.length > 0) {
      return conflict(res, 'Ingredient already exists', 'INGREDIENT_EXISTS');
    }

    // Insert new ingredient
    const result = await query(
      'INSERT INTO ingredients (name, quantity_unit, fodmap_level) VALUES ($1, $2, $3) RETURNING *',
      [name, quantity_unit || null, fodmap_level || null]
    );

    created(res, result.rows[0], 'Ingredient created successfully');
  })
);

// PUT /ingredients/:id - Update ingredient
router.put('/:id',
  validateParams(idParamSchema),
  validateBody(ingredientUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, quantity_unit, fodmap_level } = req.body;

    // Check if ingredient exists
    const existingResult = await query('SELECT id FROM ingredients WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return notFound(res, 'Ingredient', 'INGREDIENT_NOT_FOUND');
    }

    // Check if new name conflicts with existing ingredient
    const conflictResult = await query('SELECT id FROM ingredients WHERE name = $1 AND id != $2', [name, id]);
    if (conflictResult.rows.length > 0) {
      return conflict(res, 'Ingredient name already exists', 'INGREDIENT_NAME_EXISTS');
    }

    // Update ingredient
    const result = await query(
      'UPDATE ingredients SET name = $1, quantity_unit = $2, fodmap_level = $3 WHERE id = $4 RETURNING *',
      [name, quantity_unit || null, fodmap_level || null, id]
    );

    success(res, result.rows[0], 'Ingredient updated successfully');
  })
);

// DELETE /ingredients/:id - Delete ingredient (check no recipes use it)
router.delete('/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if ingredient exists
    const existingResult = await query('SELECT id, name FROM ingredients WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return notFound(res, 'Ingredient', 'INGREDIENT_NOT_FOUND');
    }

    // Check if any recipes use this ingredient
    const recipesResult = await query('SELECT COUNT(*) as count FROM recipe_ingredients WHERE ingredient_id = $1', [id]);
    const recipeCount = parseInt(recipesResult.rows[0].count);

    if (recipeCount > 0) {
      return conflict(res, `Cannot delete ingredient. ${recipeCount} recipe(s) are using this ingredient.`, 'INGREDIENT_IN_USE');
    }

    // Delete ingredient
    await query('DELETE FROM ingredients WHERE id = $1', [id]);

    success(res, { id: parseInt(id), name: existingResult.rows[0].name }, 'Ingredient deleted successfully');
  })
);

// POST /ingredients/bulk - Bulk import ingredients
router.post('/bulk',
  validateBody(bulkIngredientsSchema),
  asyncHandler(async (req, res) => {
    const { ingredients } = req.body;

    const results = await withTransaction(async (client) => {
      const createdIngredients = [];
      const errors = [];

      for (let i = 0; i < ingredients.length; i++) {
        try {
          const ingredient = ingredients[i];
          const { name, quantity_unit, fodmap_level } = ingredient;

          // Check if ingredient already exists
          const existingResult = await client.query('SELECT id FROM ingredients WHERE name = $1', [name]);
          if (existingResult.rows.length > 0) {
            errors.push({
              index: i,
              name: name,
              error: 'Ingredient already exists'
            });
            continue;
          }

          // Insert new ingredient
          const result = await client.query(
            'INSERT INTO ingredients (name, quantity_unit, fodmap_level) VALUES ($1, $2, $3) RETURNING *',
            [name, quantity_unit || null, fodmap_level || null]
          );

          createdIngredients.push({
            index: i,
            ingredient_id: result.rows[0].id,
            name: result.rows[0].name
          });

        } catch (error) {
          errors.push({
            index: i,
            name: ingredients[i].name || 'Unknown',
            error: error.message
          });
        }
      }

      return { createdIngredients, errors };
    });

    const statusCode = results.errors.length > 0 ? 207 : 201; // 207 Multi-Status if there are errors

    res.status(statusCode).json({
      error: false,
      message: `Bulk import completed. ${results.createdIngredients.length} ingredients created, ${results.errors.length} errors`,
      data: {
        created_ingredients: results.createdIngredients,
        errors: results.errors,
        summary: {
          total_submitted: ingredients.length,
          successful: results.createdIngredients.length,
          failed: results.errors.length
        }
      }
    });
  })
);

module.exports = router;
