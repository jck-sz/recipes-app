const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../db');
const { success, notFound, conflict, created, paginated } = require('../utils/responses');
const { validateBody, validateParams, validateQuery } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { bulkOperationLimiter } = require('../middleware/rateLimiting');
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
const { buildWhereClause, sanitizeLikeInput } = require('../utils/queryBuilder');

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
      // For search, we need a custom condition since it's OR across multiple fields
      const searchTerm = sanitizeLikeInput(search);
      conditions.push({
        field: 'r.title',
        value: searchTerm,
        type: 'like'
      });
      // Note: We'll handle the OR condition manually for now
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

    const { whereClause, params: queryParams, nextIndex } = buildWhereClause(conditions);

    // Handle search OR condition manually (more complex case)
    let finalWhereClause = whereClause;
    let finalParams = [...queryParams];

    if (search && whereClause) {
      // Replace the simple title LIKE with title OR description LIKE
      const searchTerm = `%${sanitizeLikeInput(search)}%`;
      finalWhereClause = whereClause.replace(
        /r\.title ILIKE \$\d+/,
        `(r.title ILIKE $1 OR r.description ILIKE $1)`
      );
      finalParams[0] = searchTerm; // Update the first param to be the search term
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
        r.category_id,
        c.name as category_name,
        COUNT(DISTINCT ri.ingredient_id) as ingredient_count,
        COUNT(DISTINCT rt.tag_id) as tag_count
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      ${finalWhereClause}
      GROUP BY r.id, r.category_id, c.name
      ORDER BY r.created_at DESC
      LIMIT $${finalParams.length + 1} OFFSET $${finalParams.length + 2}
    `;

    const dataResult = await query(dataQuery, [...finalParams, limit, offset]);

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

// GET /recipes/:id - Get single recipe with full details (optimized single query)
router.get('/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Single optimized query to get recipe with all related data
    const fullRecipeQuery = `
      WITH recipe_data AS (
        SELECT
          r.*,
          c.name as category_name
        FROM recipes r
        LEFT JOIN categories c ON r.category_id = c.id
        WHERE r.id = $1
      ),
      recipe_ingredients_data AS (
        SELECT
          ri.recipe_id,
          json_agg(
            json_build_object(
              'id', i.id,
              'name', i.name,
              'quantity_unit', i.quantity_unit,
              'fodmap_level', i.fodmap_level,
              'quantity', ri.quantity
            ) ORDER BY i.name
          ) as ingredients
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = $1
        GROUP BY ri.recipe_id
      ),
      recipe_tags_data AS (
        SELECT
          rt.recipe_id,
          json_agg(
            json_build_object(
              'id', t.id,
              'name', t.name
            ) ORDER BY t.name
          ) as tags
        FROM recipe_tags rt
        JOIN tags t ON rt.tag_id = t.id
        WHERE rt.recipe_id = $1
        GROUP BY rt.recipe_id
      )
      SELECT
        rd.*,
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

    const fullRecipe = result.rows[0];

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
        const tagValues = tags.map((_, index) =>
          `($1, $${index + 2})`
        ).join(', ');

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

        // Batch insert new ingredients
        if (ingredients.length > 0) {
          const ingredientValues = ingredients.map((_, index) =>
            `($1, $${index * 2 + 2}, $${index * 2 + 3})`
          ).join(', ');

          const ingredientParams = [id];
          ingredients.forEach(ingredient => {
            ingredientParams.push(ingredient.ingredient_id, ingredient.quantity);
          });

          await client.query(
            `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ${ingredientValues}`,
            ingredientParams
          );
        }
      }

      // Update tags if provided
      if (tags !== undefined) {
        // Delete existing tags
        await client.query('DELETE FROM recipe_tags WHERE recipe_id = $1', [id]);

        // Batch insert new tags
        if (tags.length > 0) {
          const tagValues = tags.map((_, index) =>
            `($1, $${index + 2})`
          ).join(', ');

          await client.query(
            `INSERT INTO recipe_tags (recipe_id, tag_id) VALUES ${tagValues}`,
            [id, ...tags]
          );
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

      // Batch insert new ingredients
      if (ingredients.length > 0) {
        const ingredientValues = ingredients.map((_, index) =>
          `($1, $${index * 2 + 2}, $${index * 2 + 3})`
        ).join(', ');

        const ingredientParams = [id];
        ingredients.forEach(ingredient => {
          ingredientParams.push(ingredient.ingredient_id, ingredient.quantity);
        });

        await client.query(
          `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ${ingredientValues}`,
          ingredientParams
        );
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
  bulkOperationLimiter,
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

          // Batch insert ingredients
          if (ingredients && ingredients.length > 0) {
            const ingredientValues = ingredients.map((_, index) =>
              `($1, $${index * 2 + 2}, $${index * 2 + 3})`
            ).join(', ');

            const ingredientParams = [newRecipe.id];
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
            const tagValues = tags.map((_, index) =>
              `($1, $${index + 2})`
            ).join(', ');

            await client.query(
              `INSERT INTO recipe_tags (recipe_id, tag_id) VALUES ${tagValues}`,
              [newRecipe.id, ...tags]
            );
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
  bulkOperationLimiter,
  validateBody(bulkDeleteSchema),
  asyncHandler(async (req, res) => {
    const { ids } = req.body;

    const results = await withTransaction(async (client) => {
      // First, get all existing recipes to validate and prepare response
      const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
      const existingRecipesResult = await client.query(
        `SELECT id, title FROM recipes WHERE id IN (${placeholders})`,
        ids
      );

      const existingRecipes = existingRecipesResult.rows;
      const existingIds = existingRecipes.map(r => r.id);
      const missingIds = ids.filter(id => !existingIds.includes(parseInt(id)));

      const errors = missingIds.map(id => ({
        id: id,
        error: 'Recipe not found'
      }));

      let deletedRecipes = [];

      if (existingIds.length > 0) {
        // Batch delete relationships
        const existingPlaceholders = existingIds.map((_, index) => `$${index + 1}`).join(', ');

        await client.query(
          `DELETE FROM recipe_ingredients WHERE recipe_id IN (${existingPlaceholders})`,
          existingIds
        );

        await client.query(
          `DELETE FROM recipe_tags WHERE recipe_id IN (${existingPlaceholders})`,
          existingIds
        );

        // Batch delete recipes
        await client.query(
          `DELETE FROM recipes WHERE id IN (${existingPlaceholders})`,
          existingIds
        );

        deletedRecipes = existingRecipes.map(recipe => ({
          id: recipe.id,
          title: recipe.title
        }));
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
