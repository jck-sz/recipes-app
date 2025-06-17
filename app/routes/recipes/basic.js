/**
 * Basic Recipe CRUD Operations
 * Handles: GET /, GET /:id, POST /, PUT /:id, DELETE /:id
 */

const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../../db');
const { success, notFound, created } = require('../../utils/responses');
const { validateBody, validateParams, validateQuery } = require('../../middleware/validation');
const { asyncHandler } = require('../../middleware/errorHandler');
const { buildWhereClause, sanitizeLikeInput } = require('../../utils/queryBuilder');
const { parsePagination, buildPaginationResponse } = require('../../utils/pagination');
const {
  recipeCreateSchema,
  recipeUpdateSchema,
  recipeQuerySchema,
  idParamSchema
} = require('../../validation/schemas');

// GET /recipes - List all recipes with filtering and pagination
router.get('/',
  validateQuery(recipeQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { category, search, tag, prep_time_max } = req.query;

    // Build safe WHERE conditions using query builder
    const conditions = [];
    
    if (category) {
      conditions.push({
        field: 'r.category_id',
        value: category,
        type: 'exact'
      });
    }

    if (search) {
      const searchTerm = sanitizeLikeInput(search);
      conditions.push({
        field: 'r.title',
        value: searchTerm,
        type: 'like'
      });
    }

    if (tag) {
      conditions.push({
        field: 'EXISTS',
        value: {
          query: `SELECT 1 FROM recipe_tags rt JOIN tags t ON rt.tag_id = t.id WHERE rt.recipe_id = r.id AND t.name ILIKE $${conditions.length + 1}`,
          params: [`%${sanitizeLikeInput(tag)}%`]
        },
        type: 'exists'
      });
    }

    if (prep_time_max) {
      conditions.push({
        field: 'r.preparation_time',
        operator: '<=',
        value: prep_time_max,
        type: 'exact'
      });
    }

    const { whereClause, params: queryParams } = buildWhereClause(conditions);
    
    // Handle search OR condition manually
    let finalWhereClause = whereClause;
    let finalParams = [...queryParams];
    
    if (search && whereClause) {
      const searchTerm = `%${sanitizeLikeInput(search)}%`;
      finalWhereClause = whereClause.replace(
        /r\.title ILIKE \$\d+/,
        `(r.title ILIKE $1 OR r.description ILIKE $1)`
      );
      finalParams[0] = searchTerm;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT r.id) as count
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      ${finalWhereClause}
    `;
    const countResult = await query(countQuery, finalParams);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get paginated results
    const dataQuery = `
      SELECT
        r.id, r.title, r.description, r.preparation_time,
        r.serving_size, r.image_url, r.created_at, r.updated_at,
        c.name as category_name,
        COUNT(DISTINCT ri.ingredient_id) as ingredient_count,
        COUNT(DISTINCT rt.tag_id) as tag_count
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      ${finalWhereClause}
      GROUP BY r.id, c.name
      ORDER BY r.created_at DESC
      LIMIT $${finalParams.length + 1} OFFSET $${finalParams.length + 2}
    `;

    const dataResult = await query(dataQuery, [...finalParams, limit, offset]);
    const pagination = buildPaginationResponse(page, limit, totalCount);
    
    res.json({
      error: false,
      message: 'Recipes retrieved successfully',
      data: dataResult.rows,
      pagination
    });
  })
);

// GET /recipes/:id - Get single recipe with full details
router.get('/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Single optimized query with CTEs
    const fullRecipeQuery = `
      WITH recipe_data AS (
        SELECT r.*, c.name as category_name
        FROM recipes r
        LEFT JOIN categories c ON r.category_id = c.id
        WHERE r.id = $1
      ),
      recipe_ingredients_data AS (
        SELECT ri.recipe_id,
          json_agg(
            json_build_object(
              'id', i.id, 'name', i.name, 'quantity_unit', i.quantity_unit,
              'fodmap_level', i.fodmap_level, 'quantity', ri.quantity
            ) ORDER BY i.name
          ) as ingredients
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = $1
        GROUP BY ri.recipe_id
      ),
      recipe_tags_data AS (
        SELECT rt.recipe_id,
          json_agg(
            json_build_object('id', t.id, 'name', t.name) ORDER BY t.name
          ) as tags
        FROM recipe_tags rt
        JOIN tags t ON rt.tag_id = t.id
        WHERE rt.recipe_id = $1
        GROUP BY rt.recipe_id
      )
      SELECT rd.*,
        COALESCE(rid.ingredients, '[]'::json) as ingredients,
        COALESCE(rtd.tags, '[]'::json) as tags
      FROM recipe_data rd
      LEFT JOIN recipe_ingredients_data rid ON rd.id = rid.recipe_id
      LEFT JOIN recipe_tags_data rtd ON rd.id = rtd.recipe_id
    `;

    const result = await query(fullRecipeQuery, [id]);

    if (result.rows.length === 0) {
      return notFound(res, 'Recipe', 'RECIPE_NOT_FOUND');
    }

    success(res, result.rows[0], 'Recipe retrieved successfully');
  })
);

// POST /recipes - Create new recipe
router.post('/',
  validateBody(recipeCreateSchema),
  asyncHandler(async (req, res) => {
    const { title, description, preparation_time, category_id, serving_size, image_url, ingredients, tags } = req.body;

    const result = await withTransaction(async (client) => {
      // Insert recipe
      const recipeResult = await client.query(
        `INSERT INTO recipes (title, description, preparation_time, category_id, serving_size, image_url, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [title, description, preparation_time, category_id, serving_size || null, image_url || null, 'system']
      );

      const recipe = recipeResult.rows[0];

      // Batch insert ingredients
      if (ingredients && ingredients.length > 0) {
        const ingredientValues = ingredients.map((_, index) =>
          `($1, $${index * 2 + 2}, $${index * 2 + 3})`
        ).join(', ');

        const ingredientParams = [recipe.id];
        ingredients.forEach(ingredient => {
          ingredientParams.push(ingredient.ingredient_id, ingredient.quantity);
        });

        await client.query(
          `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ${ingredientValues}`,
          ingredientParams
        );
      }

      // Batch insert tags
      if (tags && tags.length > 0) {
        const tagValues = tags.map((_, index) => `($1, $${index + 2})`).join(', ');
        await client.query(
          `INSERT INTO recipe_tags (recipe_id, tag_id) VALUES ${tagValues}`,
          [recipe.id, ...tags]
        );
      }

      return recipe;
    });

    created(res, result, 'Recipe created successfully');
  })
);

module.exports = router;
