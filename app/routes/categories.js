const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { success, notFound, conflict, created, paginated } = require('../utils/responses');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { categoryCreateSchema, categoryUpdateSchema, idParamSchema, paginationSchema } = require('../validation/schemas');
const { parsePagination, buildPaginationResponse } = require('../utils/pagination');

// GET /categories - List all categories
router.get('/', asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM categories ORDER BY id');
  success(res, result.rows, 'Categories retrieved successfully');
}));

// GET /categories/:id - Get single category
router.get('/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return notFound(res, 'Category', 'CATEGORY_NOT_FOUND');
    }

    success(res, result.rows[0], 'Category retrieved successfully');
  })
);

// POST /categories - Create new category (admin only for now)
router.post('/',
  validateBody(categoryCreateSchema),
  asyncHandler(async (req, res) => {
    const { name } = req.body;

    // Check if category already exists
    const existingResult = await query('SELECT id FROM categories WHERE name = $1', [name]);
    if (existingResult.rows.length > 0) {
      return conflict(res, 'Category already exists', 'CATEGORY_EXISTS');
    }

    // Insert new category
    const result = await query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );

    created(res, result.rows[0], 'Category created successfully');
  })
);

// PUT /categories/:id - Update category
router.put('/:id',
  validateParams(idParamSchema),
  validateBody(categoryUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    // Check if category exists
    const existingResult = await query('SELECT id FROM categories WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return notFound(res, 'Category', 'CATEGORY_NOT_FOUND');
    }

    // Check if new name conflicts with existing category
    const conflictResult = await query('SELECT id FROM categories WHERE name = $1 AND id != $2', [name, id]);
    if (conflictResult.rows.length > 0) {
      return conflict(res, 'Category name already exists', 'CATEGORY_NAME_EXISTS');
    }

    // Update category
    const result = await query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    success(res, result.rows[0], 'Category updated successfully');
  })
);

// DELETE /categories/:id - Delete category (check no recipes exist)
router.delete('/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if category exists
    const existingResult = await query('SELECT id, name FROM categories WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return notFound(res, 'Category', 'CATEGORY_NOT_FOUND');
    }

    // Check if any recipes use this category
    const recipesResult = await query('SELECT COUNT(*) as count FROM recipes WHERE category_id = $1', [id]);
    const recipeCount = parseInt(recipesResult.rows[0].count);

    if (recipeCount > 0) {
      return conflict(res, `Cannot delete category. ${recipeCount} recipe(s) are using this category.`, 'CATEGORY_IN_USE');
    }

    // Delete category
    await query('DELETE FROM categories WHERE id = $1', [id]);

    success(res, { id: parseInt(id), name: existingResult.rows[0].name }, 'Category deleted successfully');
  })
);

// GET /categories/:id/recipes - Get all recipes in category
router.get('/:id/recipes',
  validateParams(idParamSchema),
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit, offset } = parsePagination(req.query);

    // Check if category exists
    const categoryCheck = await query('SELECT id, name FROM categories WHERE id = $1', [id]);
    if (categoryCheck.rows.length === 0) {
      return notFound(res, 'Category', 'CATEGORY_NOT_FOUND');
    }

    // Get total count of recipes in category
    const countQuery = 'SELECT COUNT(*) as count FROM recipes WHERE category_id = $1';
    const countResult = await query(countQuery, [id]);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get paginated recipes in category
    const recipesQuery = `
      SELECT
        r.id,
        r.title,
        r.description,
        r.preparation_time,
        r.serving_size,
        r.image_url,
        r.created_at,
        r.updated_at,
        COUNT(ri.ingredient_id) as ingredient_count,
        COUNT(rt.tag_id) as tag_count
      FROM recipes r
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      WHERE r.category_id = $1
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const recipesResult = await query(recipesQuery, [id, limit, offset]);

    const pagination = buildPaginationResponse(page, limit, totalCount);
    paginated(res, {
      category: categoryCheck.rows[0],
      recipes: recipesResult.rows
    }, pagination, `Recipes in category "${categoryCheck.rows[0].name}"`);
  })
);

module.exports = router;
