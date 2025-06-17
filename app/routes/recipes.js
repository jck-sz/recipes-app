const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../db');
const { success, internalError, notFound, conflict, created, paginated } = require('../utils/responses');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  recipeCreateSchema,
  recipeUpdateSchema,
  recipeQuerySchema,
  popularRecipesSchema,
  fodmapSafeRecipesSchema,
  recipeIngredientsUpdateSchema,
  bulkRecipesSchema,
  bulkDeleteSchema,
  idParamSchema
} = require('../validation/schemas');
const { parsePagination, buildPaginationResponse } = require('../utils/pagination');

// GET /recipes - List all recipes with filtering and pagination
router.get('/',
  validateQuery(recipeQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { category, search, tag, prep_time_max } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (category) {
      whereConditions.push(`r.category_id = $${paramIndex}`);
      queryParams.push(category);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`);
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (tag) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM recipe_tags rt
        JOIN tags t ON rt.tag_id = t.id
        WHERE rt.recipe_id = r.id AND t.name ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${tag.trim()}%`);
      paramIndex++;
    }

    if (prep_time_max) {
      whereConditions.push(`r.preparation_time <= $${paramIndex}`);
      queryParams.push(prep_time_max);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT r.id) as count
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get paginated results with full details
    const dataQuery = `
      SELECT
        r.id,
        r.title,
        r.description,
        r.preparation_time,
        r.serving_size,
        r.image_url,
        r.created_at,
        r.updated_at,
        c.name as category_name,
        COUNT(DISTINCT ri.ingredient_id) as ingredient_count,
        COUNT(DISTINCT rt.tag_id) as tag_count
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      ${whereClause}
      GROUP BY r.id, c.name
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataResult = await query(dataQuery, [...queryParams, limit, offset]);

    const pagination = buildPaginationResponse(page, limit, totalCount);
    paginated(res, dataResult.rows, pagination, 'Recipes retrieved successfully');
  })
);

// GET /recipes/popular - Get popular recipes
router.get('/popular',
  validateQuery(popularRecipesSchema),
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { days = 30 } = req.query;

    // For now, we'll simulate popularity by recent creation date
    // In a real app, you'd track views, likes, etc.
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const countQuery = `
      SELECT COUNT(*) as count
      FROM recipes r
      WHERE r.created_at >= $1
    `;
    const countResult = await query(countQuery, [cutoffDate.toISOString()]);
    const totalCount = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT
        r.id,
        r.title,
        r.description,
        r.preparation_time,
        r.serving_size,
        r.image_url,
        r.created_at,
        r.updated_at,
        c.name as category_name,
        COUNT(DISTINCT ri.ingredient_id) as ingredient_count,
        COUNT(DISTINCT rt.tag_id) as tag_count
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      WHERE r.created_at >= $1
      GROUP BY r.id, c.name
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const dataResult = await query(dataQuery, [cutoffDate.toISOString(), limit, offset]);

    const pagination = buildPaginationResponse(page, limit, totalCount);
    paginated(res, dataResult.rows, pagination, `Popular recipes from last ${days} days`);
  })
);

// GET /recipes/fodmap-safe - Get FODMAP-safe recipes
router.get('/fodmap-safe',
  validateQuery(fodmapSafeRecipesSchema),
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { max_level = 'LOW' } = req.query;

    // Define FODMAP level hierarchy
    const fodmapLevels = ['LOW', 'MODERATE', 'HIGH'];
    const maxLevelIndex = fodmapLevels.indexOf(max_level);
    const allowedLevels = fodmapLevels.slice(0, maxLevelIndex + 1);

    const countQuery = `
      SELECT COUNT(DISTINCT r.id) as count
      FROM recipes r
      WHERE NOT EXISTS (
        SELECT 1 FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = r.id
        AND i.fodmap_level NOT IN (${allowedLevels.map((_, i) => `$${i + 1}`).join(', ')})
      )
    `;
    const countResult = await query(countQuery, allowedLevels);
    const totalCount = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT
        r.id,
        r.title,
        r.description,
        r.preparation_time,
        r.serving_size,
        r.image_url,
        r.created_at,
        r.updated_at,
        c.name as category_name,
        COUNT(DISTINCT ri.ingredient_id) as ingredient_count,
        COUNT(DISTINCT rt.tag_id) as tag_count
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      WHERE NOT EXISTS (
        SELECT 1 FROM recipe_ingredients ri2
        JOIN ingredients i ON ri2.ingredient_id = i.id
        WHERE ri2.recipe_id = r.id
        AND i.fodmap_level NOT IN (${allowedLevels.map((_, i) => `$${i + 1}`).join(', ')})
      )
      GROUP BY r.id, c.name
      ORDER BY r.created_at DESC
      LIMIT $${allowedLevels.length + 1} OFFSET $${allowedLevels.length + 2}
    `;

    const dataResult = await query(dataQuery, [...allowedLevels, limit, offset]);

    const pagination = buildPaginationResponse(page, limit, totalCount);
    paginated(res, dataResult.rows, pagination, `FODMAP-safe recipes (max level: ${max_level})`);
  })
);

// GET /recipes/:id - Get single recipe with full details
router.get('/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Get recipe with category
    const recipeQuery = `
      SELECT
        r.*,
        c.name as category_name
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.id = $1
    `;
    const recipeResult = await query(recipeQuery, [id]);

    if (recipeResult.rows.length === 0) {
      return notFound(res, 'Recipe', 'RECIPE_NOT_FOUND');
    }

    const recipe = recipeResult.rows[0];

    // Get ingredients
    const ingredientsQuery = `
      SELECT
        i.id,
        i.name,
        i.quantity_unit,
        i.fodmap_level,
        ri.quantity
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = $1
      ORDER BY i.name
    `;
    const ingredientsResult = await query(ingredientsQuery, [id]);

    // Get tags
    const tagsQuery = `
      SELECT
        t.id,
        t.name
      FROM recipe_tags rt
      JOIN tags t ON rt.tag_id = t.id
      WHERE rt.recipe_id = $1
      ORDER BY t.name
    `;
    const tagsResult = await query(tagsQuery, [id]);

    const fullRecipe = {
      ...recipe,
      ingredients: ingredientsResult.rows,
      tags: tagsResult.rows
    };

    success(res, fullRecipe, 'Recipe retrieved successfully');
  })
);

// GET /recipes/:id/ingredients - Get detailed ingredient list for a recipe
router.get('/:id/ingredients',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if recipe exists
    const recipeCheck = await query('SELECT id, title FROM recipes WHERE id = $1', [id]);
    if (recipeCheck.rows.length === 0) {
      return notFound(res, 'Recipe', 'RECIPE_NOT_FOUND');
    }

    const ingredientsQuery = `
      SELECT
        i.id,
        i.name,
        i.quantity_unit,
        i.fodmap_level,
        ri.quantity
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = $1
      ORDER BY i.name
    `;
    const ingredientsResult = await query(ingredientsQuery, [id]);

    success(res, {
      recipe: recipeCheck.rows[0],
      ingredients: ingredientsResult.rows
    }, 'Recipe ingredients retrieved successfully');
  })
);

// POST /recipes - Create new recipe with ingredients and tags
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

      // Insert ingredients
      if (ingredients && ingredients.length > 0) {
        for (const ingredient of ingredients) {
          await client.query(
            'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ($1, $2, $3)',
            [recipe.id, ingredient.ingredient_id, ingredient.quantity]
          );
        }
      }

      // Insert tags
      if (tags && tags.length > 0) {
        for (const tagId of tags) {
          await client.query(
            'INSERT INTO recipe_tags (recipe_id, tag_id) VALUES ($1, $2)',
            [recipe.id, tagId]
          );
        }
      }

      return recipe;
    });

    created(res, result, 'Recipe created successfully');
  })
);

// PUT /recipes/:id - Update recipe including ingredients and tags
router.put('/:id',
  validateParams(idParamSchema),
  validateBody(recipeUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, preparation_time, category_id, serving_size, image_url, ingredients, tags } = req.body;

    const result = await withTransaction(async (client) => {
      // Check if recipe exists
      const existingResult = await client.query('SELECT id FROM recipes WHERE id = $1', [id]);
      if (existingResult.rows.length === 0) {
        throw new Error('RECIPE_NOT_FOUND');
      }

      // Update recipe
      const recipeResult = await client.query(
        `UPDATE recipes
         SET title = $1, description = $2, preparation_time = $3, category_id = $4,
             serving_size = $5, image_url = $6, updated_by = $7, updated_at = CURRENT_TIMESTAMP
         WHERE id = $8 RETURNING *`,
        [title, description, preparation_time, category_id, serving_size || null, image_url || null, 'system', id]
      );

      const recipe = recipeResult.rows[0];

      // Update ingredients if provided
      if (ingredients !== undefined) {
        // Delete existing ingredients
        await client.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [id]);

        // Insert new ingredients
        if (ingredients.length > 0) {
          for (const ingredient of ingredients) {
            await client.query(
              'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ($1, $2, $3)',
              [id, ingredient.ingredient_id, ingredient.quantity]
            );
          }
        }
      }

      // Update tags if provided
      if (tags !== undefined) {
        // Delete existing tags
        await client.query('DELETE FROM recipe_tags WHERE recipe_id = $1', [id]);

        // Insert new tags
        if (tags.length > 0) {
          for (const tagId of tags) {
            await client.query(
              'INSERT INTO recipe_tags (recipe_id, tag_id) VALUES ($1, $2)',
              [id, tagId]
            );
          }
        }
      }

      return recipe;
    });

    success(res, result, 'Recipe updated successfully');
  })
);

// DELETE /recipes/:id - Delete recipe and all relationships
router.delete('/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await withTransaction(async (client) => {
      // Check if recipe exists
      const existingResult = await client.query('SELECT id, title FROM recipes WHERE id = $1', [id]);
      if (existingResult.rows.length === 0) {
        throw new Error('RECIPE_NOT_FOUND');
      }

      const recipe = existingResult.rows[0];

      // Delete relationships (foreign key constraints should handle this, but being explicit)
      await client.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [id]);
      await client.query('DELETE FROM recipe_tags WHERE recipe_id = $1', [id]);

      // Delete recipe
      await client.query('DELETE FROM recipes WHERE id = $1', [id]);

      return recipe;
    });

    success(res, result, 'Recipe deleted successfully');
  })
);

// PUT /recipes/:id/ingredients - Update only ingredients of a recipe
router.put('/:id/ingredients',
  validateParams(idParamSchema),
  validateBody(recipeIngredientsUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { ingredients } = req.body;

    const result = await withTransaction(async (client) => {
      // Check if recipe exists
      const existingResult = await client.query('SELECT id, title FROM recipes WHERE id = $1', [id]);
      if (existingResult.rows.length === 0) {
        throw new Error('RECIPE_NOT_FOUND');
      }

      // Delete existing ingredients
      await client.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [id]);

      // Insert new ingredients
      if (ingredients.length > 0) {
        for (const ingredient of ingredients) {
          await client.query(
            'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ($1, $2, $3)',
            [id, ingredient.ingredient_id, ingredient.quantity]
          );
        }
      }

      // Get updated ingredient list
      const ingredientsQuery = `
        SELECT
          i.id,
          i.name,
          i.quantity_unit,
          i.fodmap_level,
          ri.quantity
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = $1
        ORDER BY i.name
      `;
      const ingredientsResult = await client.query(ingredientsQuery, [id]);

      return {
        recipe: existingResult.rows[0],
        ingredients: ingredientsResult.rows
      };
    });

    success(res, result, 'Recipe ingredients updated successfully');
  })
);

// POST /recipes/bulk - Bulk import recipes
router.post('/bulk',
  validateBody(bulkRecipesSchema),
  asyncHandler(async (req, res) => {
    const { recipes } = req.body;

    const results = await withTransaction(async (client) => {
      const createdRecipes = [];
      const errors = [];

      for (let i = 0; i < recipes.length; i++) {
        try {
          const recipe = recipes[i];
          const { title, description, preparation_time, category_id, serving_size, image_url, ingredients, tags } = recipe;

          // Insert recipe
          const recipeResult = await client.query(
            `INSERT INTO recipes (title, description, preparation_time, category_id, serving_size, image_url, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [title, description, preparation_time, category_id, serving_size || null, image_url || null, 'system']
          );

          const newRecipe = recipeResult.rows[0];

          // Insert ingredients
          if (ingredients && ingredients.length > 0) {
            for (const ingredient of ingredients) {
              await client.query(
                'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ($1, $2, $3)',
                [newRecipe.id, ingredient.ingredient_id, ingredient.quantity]
              );
            }
          }

          // Insert tags
          if (tags && tags.length > 0) {
            for (const tagId of tags) {
              await client.query(
                'INSERT INTO recipe_tags (recipe_id, tag_id) VALUES ($1, $2)',
                [newRecipe.id, tagId]
              );
            }
          }

          createdRecipes.push({
            index: i,
            recipe_id: newRecipe.id,
            title: newRecipe.title
          });

        } catch (error) {
          errors.push({
            index: i,
            title: recipes[i].title || 'Unknown',
            error: error.message
          });
        }
      }

      return { createdRecipes, errors };
    });

    const statusCode = results.errors.length > 0 ? 207 : 201; // 207 Multi-Status if there are errors

    res.status(statusCode).json({
      error: false,
      message: `Bulk import completed. ${results.createdRecipes.length} recipes created, ${results.errors.length} errors`,
      data: {
        created_recipes: results.createdRecipes,
        errors: results.errors,
        summary: {
          total_submitted: recipes.length,
          successful: results.createdRecipes.length,
          failed: results.errors.length
        }
      }
    });
  })
);

// DELETE /recipes/bulk - Bulk delete recipes by IDs
router.delete('/bulk',
  validateBody(bulkDeleteSchema),
  asyncHandler(async (req, res) => {
    const { ids } = req.body;

    const results = await withTransaction(async (client) => {
      const deletedRecipes = [];
      const errors = [];

      for (const id of ids) {
        try {
          // Check if recipe exists
          const existingResult = await client.query('SELECT id, title FROM recipes WHERE id = $1', [id]);
          if (existingResult.rows.length === 0) {
            errors.push({
              id: id,
              error: 'Recipe not found'
            });
            continue;
          }

          const recipe = existingResult.rows[0];

          // Delete relationships
          await client.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [id]);
          await client.query('DELETE FROM recipe_tags WHERE recipe_id = $1', [id]);

          // Delete recipe
          await client.query('DELETE FROM recipes WHERE id = $1', [id]);

          deletedRecipes.push({
            id: recipe.id,
            title: recipe.title
          });

        } catch (error) {
          errors.push({
            id: id,
            error: error.message
          });
        }
      }

      return { deletedRecipes, errors };
    });

    const statusCode = results.errors.length > 0 ? 207 : 200; // 207 Multi-Status if there are errors

    res.status(statusCode).json({
      error: false,
      message: `Bulk delete completed. ${results.deletedRecipes.length} recipes deleted, ${results.errors.length} errors`,
      data: {
        deleted_recipes: results.deletedRecipes,
        errors: results.errors,
        summary: {
          total_submitted: ids.length,
          successful: results.deletedRecipes.length,
          failed: results.errors.length
        }
      }
    });
  })
);

module.exports = router;
