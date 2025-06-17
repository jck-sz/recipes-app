const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../db');
const { success, internalError, notFound, conflict, created, paginated } = require('../utils/responses');
const { validateBody, validateQuery, validateParams } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { parsePagination, buildPaginationResponse } = require('../utils/pagination');
const {
  recipeCreateSchema,
  recipeUpdateSchema,
  recipeQuerySchema,
  idParamSchema,
  popularRecipesSchema,
  fodmapSafeRecipesSchema,
  bulkRecipesSchema,
  bulkDeleteSchema,
  recipeIngredientsUpdateSchema
} = require('../validation/schemas');

// GET /recipes - List all recipes with filtering and pagination
router.get('/',
  validateQuery(recipeQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { category, search, tag, prep_time_max } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Build WHERE conditions based on filters
    if (category) {
      whereConditions.push(`r.category_id = $${paramIndex}`);
      queryParams.push(category);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (prep_time_max) {
      whereConditions.push(`r.preparation_time <= $${paramIndex}`);
      queryParams.push(prep_time_max);
      paramIndex++;
    }

    if (tag) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM recipe_tags rt
        JOIN tags t ON rt.tag_id = t.id
        WHERE rt.recipe_id = r.id AND t.name = $${paramIndex}
      )`);
      queryParams.push(tag);
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

    // Get paginated results with basic info
    const dataQuery = `
      SELECT DISTINCT r.id, r.title, r.description, r.preparation_time, r.serving_size,
             r.image_url, r.created_at, r.updated_at, c.name as category_name
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataResult = await query(dataQuery, [...queryParams, limit, offset]);

    const pagination = buildPaginationResponse(page, limit, totalCount);
    paginated(res, dataResult.rows, pagination, 'Recipes retrieved successfully');
  })
);

// GET /recipes/popular - Most viewed/created recipes
router.get('/popular',
  validateQuery(popularRecipesSchema),
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { days } = req.query;

    // For now, we'll use creation date as popularity metric
    // In a real app, you'd track views/ratings
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM recipes r
      WHERE r.created_at >= $1
    `;
    const countResult = await query(countQuery, [cutoffDate.toISOString()]);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get popular recipes (ordered by creation date for now)
    const dataQuery = `
      SELECT
        r.id,
        r.title,
        r.description,
        r.preparation_time,
        r.serving_size,
        r.image_url,
        r.created_at,
        c.name as category_name,
        COUNT(ri.ingredient_id) as ingredient_count,
        COUNT(rt.tag_id) as tag_count
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      WHERE r.created_at >= $1
      GROUP BY r.id, c.name
      ORDER BY r.created_at DESC, ingredient_count DESC
      LIMIT $2 OFFSET $3
    `;
    const dataResult = await query(dataQuery, [cutoffDate.toISOString(), limit, offset]);

    const pagination = buildPaginationResponse(page, limit, totalCount);
    paginated(res, dataResult.rows, pagination, `Popular recipes from last ${days} days`);
  })
);

// GET /recipes/fodmap-safe - Filter recipes by FODMAP safety
router.get('/fodmap-safe',
  validateQuery(fodmapSafeRecipesSchema),
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { max_level = 'MODERATE' } = req.query;

    // Build the exclusion condition based on max_level
    let whereCondition;
    let queryParams;

    if (max_level === 'LOW') {
      // Exclude recipes with HIGH or MODERATE FODMAP ingredients
      whereCondition = "i2.fodmap_level IN ('HIGH', 'MODERATE')";
      queryParams = [limit, offset];
    } else {
      // Exclude recipes with HIGH FODMAP ingredients only
      whereCondition = "i2.fodmap_level = 'HIGH'";
      queryParams = [limit, offset];
    }

    // Get FODMAP-safe recipes
    const dataQuery = `
      SELECT
        r.id,
        r.title,
        r.description,
        r.preparation_time,
        r.serving_size,
        r.image_url,
        r.created_at,
        c.name as category_name,
        '${max_level}' as fodmap_score
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.id NOT IN (
        SELECT DISTINCT r2.id
        FROM recipes r2
        JOIN recipe_ingredients ri2 ON r2.id = ri2.recipe_id
        JOIN ingredients i2 ON ri2.ingredient_id = i2.id
        WHERE ${whereCondition}
      )
      ORDER BY r.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const dataResult = await query(dataQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM recipes r
      WHERE r.id NOT IN (
        SELECT DISTINCT r2.id
        FROM recipes r2
        JOIN recipe_ingredients ri2 ON r2.id = ri2.recipe_id
        JOIN ingredients i2 ON ri2.ingredient_id = i2.id
        WHERE ${whereCondition}
      )
    `;
    const countResult = await query(countQuery, []);
    const totalCount = parseInt(countResult.rows[0].count);

    const pagination = buildPaginationResponse(page, limit, totalCount);
    paginated(res, dataResult.rows, pagination, `FODMAP-safe recipes (max level: ${max_level})`);
  })
);

// GET /recipes/:id - Get single recipe with full details (ingredients, tags, category)
router.get('/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Get recipe basic info
    const recipeQuery = `
      SELECT r.*, c.name as category_name
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.id = $1
    `;
    const recipeResult = await query(recipeQuery, [id]);

    if (recipeResult.rows.length === 0) {
      return notFound(res, 'Recipe', 'RECIPE_NOT_FOUND');
    }

    const recipe = recipeResult.rows[0];

    // Get recipe ingredients
    const ingredientsQuery = `
      SELECT ri.quantity, i.id, i.name, i.quantity_unit, i.fodmap_level
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = $1
      ORDER BY i.name
    `;
    const ingredientsResult = await query(ingredientsQuery, [id]);

    // Get recipe tags
    const tagsQuery = `
      SELECT t.id, t.name
      FROM recipe_tags rt
      JOIN tags t ON rt.tag_id = t.id
      WHERE rt.recipe_id = $1
      ORDER BY t.name
    `;
    const tagsResult = await query(tagsQuery, [id]);

    // Combine all data
    const fullRecipe = {
      ...recipe,
      ingredients: ingredientsResult.rows,
      tags: tagsResult.rows
    };

    success(res, fullRecipe, 'Recipe retrieved successfully');
  })
);

// POST /recipes - Create recipe with ingredients and tags in single request
router.post('/',
  validateBody(recipeCreateSchema),
  asyncHandler(async (req, res) => {
    const result = await withTransaction(async (client) => {
      const { title, description, preparation_time, serving_size, image_url, category_id, ingredients, tags, created_by } = req.body;

      // Check if category exists
      const categoryResult = await client.query('SELECT id FROM categories WHERE id = $1', [category_id]);
      if (categoryResult.rows.length === 0) {
        throw new Error('Invalid category_id');
      }

      // Insert recipe
      const recipeQuery = `
        INSERT INTO recipes (title, description, preparation_time, serving_size, image_url, category_id, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
        RETURNING *
      `;
      const recipeResult = await client.query(recipeQuery, [
        title,
        description || null,
        preparation_time || null,
        serving_size || null,
        image_url || null,
        category_id,
        created_by || 'system'
      ]);

      const newRecipe = recipeResult.rows[0];

      // Insert ingredients if provided
      if (ingredients && ingredients.length > 0) {
        // Verify all ingredient IDs exist
        const ingredientIds = ingredients.map(ing => ing.ingredient_id);
        const ingredientCheckQuery = `SELECT id FROM ingredients WHERE id = ANY($1)`;
        const ingredientCheckResult = await client.query(ingredientCheckQuery, [ingredientIds]);

        if (ingredientCheckResult.rows.length !== ingredientIds.length) {
          throw new Error('One or more ingredient IDs are invalid');
        }

        // Insert recipe ingredients
        for (const ingredient of ingredients) {
          await client.query(
            'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ($1, $2, $3)',
            [newRecipe.id, ingredient.ingredient_id, ingredient.quantity]
          );
        }
      }

      // Insert tags if provided
      if (tags && tags.length > 0) {
        // Verify all tag IDs exist
        const tagCheckQuery = `SELECT id FROM tags WHERE id = ANY($1)`;
        const tagCheckResult = await client.query(tagCheckQuery, [tags]);

        if (tagCheckResult.rows.length !== tags.length) {
          throw new Error('One or more tag IDs are invalid');
        }

        // Insert recipe tags
        for (const tagId of tags) {
          await client.query(
            'INSERT INTO recipe_tags (recipe_id, tag_id) VALUES ($1, $2)',
            [newRecipe.id, tagId]
          );
        }
      }

      // Get the complete recipe with relationships
      const completeRecipeQuery = `
        SELECT r.*, c.name as category_name
        FROM recipes r
        LEFT JOIN categories c ON r.category_id = c.id
        WHERE r.id = $1
      `;
      const completeRecipeResult = await client.query(completeRecipeQuery, [newRecipe.id]);

      return completeRecipeResult.rows[0];
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
    const { title, description, preparation_time, serving_size, image_url, category_id, ingredients, tags, updated_by } = req.body;

    const result = await withTransaction(async (client) => {
      // Check if recipe exists
      const existingResult = await client.query('SELECT id FROM recipes WHERE id = $1', [id]);
      if (existingResult.rows.length === 0) {
        throw new Error('Recipe not found');
      }

      // Check if category exists
      const categoryResult = await client.query('SELECT id FROM categories WHERE id = $1', [category_id]);
      if (categoryResult.rows.length === 0) {
        throw new Error('Invalid category_id');
      }

      // Update recipe
      const recipeQuery = `
        UPDATE recipes
        SET title = $1, description = $2, preparation_time = $3, serving_size = $4,
            image_url = $5, category_id = $6, updated_by = $7, updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `;
      const recipeResult = await client.query(recipeQuery, [
        title,
        description || null,
        preparation_time || null,
        serving_size || null,
        image_url || null,
        category_id,
        updated_by || 'system',
        id
      ]);

      // Update ingredients if provided
      if (ingredients !== undefined) {
        // Delete existing ingredients
        await client.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [id]);

        if (ingredients.length > 0) {
          // Verify all ingredient IDs exist
          const ingredientIds = ingredients.map(ing => ing.ingredient_id);
          const ingredientCheckQuery = `SELECT id FROM ingredients WHERE id = ANY($1)`;
          const ingredientCheckResult = await client.query(ingredientCheckQuery, [ingredientIds]);

          if (ingredientCheckResult.rows.length !== ingredientIds.length) {
            throw new Error('One or more ingredient IDs are invalid');
          }

          // Insert new ingredients
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

        if (tags.length > 0) {
          // Verify all tag IDs exist
          const tagCheckQuery = `SELECT id FROM tags WHERE id = ANY($1)`;
          const tagCheckResult = await client.query(tagCheckQuery, [tags]);

          if (tagCheckResult.rows.length !== tags.length) {
            throw new Error('One or more tag IDs are invalid');
          }

          // Insert new tags
          for (const tagId of tags) {
            await client.query(
              'INSERT INTO recipe_tags (recipe_id, tag_id) VALUES ($1, $2)',
              [id, tagId]
            );
          }
        }
      }

      // Get the complete updated recipe with relationships
      const completeRecipeQuery = `
        SELECT r.*, c.name as category_name
        FROM recipes r
        LEFT JOIN categories c ON r.category_id = c.id
        WHERE r.id = $1
      `;
      const completeRecipeResult = await client.query(completeRecipeQuery, [id]);

      return completeRecipeResult.rows[0];
    });

    success(res, result, 'Recipe updated successfully');
  })
);

// DELETE /recipes/:id - Delete recipe and all relationships
router.delete('/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if recipe exists
    const existingResult = await query('SELECT id, title FROM recipes WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return notFound(res, 'Recipe', 'RECIPE_NOT_FOUND');
    }

    const recipe = existingResult.rows[0];

    // Delete recipe (CASCADE will handle recipe_ingredients and recipe_tags)
    await query('DELETE FROM recipes WHERE id = $1', [id]);

    success(res, { id: parseInt(id), title: recipe.title }, 'Recipe deleted successfully');
  })
);

// GET /recipes/:id/ingredients - Get recipe ingredients with details
router.get('/:id/ingredients',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if recipe exists
    const recipeCheck = await query('SELECT id, title FROM recipes WHERE id = $1', [id]);
    if (recipeCheck.rows.length === 0) {
      return notFound(res, 'Recipe', 'RECIPE_NOT_FOUND');
    }

    // Get recipe ingredients with full details
    const ingredientsQuery = `
      SELECT
        ri.quantity,
        i.id,
        i.name,
        i.quantity_unit,
        i.fodmap_level,
        (ri.quantity || ' ' || COALESCE(i.quantity_unit, '')) as formatted_quantity
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = $1
      ORDER BY i.name
    `;
    const result = await query(ingredientsQuery, [id]);

    success(res, {
      recipe_id: parseInt(id),
      recipe_title: recipeCheck.rows[0].title,
      ingredients: result.rows,
      total_ingredients: result.rows.length
    }, 'Recipe ingredients retrieved successfully');
  })
);

// PUT /recipes/:id/ingredients - Update recipe ingredients separately
router.put('/:id/ingredients',
  validateParams(idParamSchema),
  validateBody(recipeIngredientsUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { ingredients } = req.body;

    const result = await withTransaction(async (client) => {
      // Check if recipe exists
      const recipeCheck = await client.query('SELECT id, title FROM recipes WHERE id = $1', [id]);
      if (recipeCheck.rows.length === 0) {
        throw new Error('Recipe not found');
      }

      // Verify all ingredient IDs exist
      const ingredientIds = ingredients.map(ing => ing.ingredient_id);
      const ingredientCheckQuery = `SELECT id FROM ingredients WHERE id = ANY($1)`;
      const ingredientCheckResult = await client.query(ingredientCheckQuery, [ingredientIds]);

      if (ingredientCheckResult.rows.length !== ingredientIds.length) {
        throw new Error('One or more ingredient IDs are invalid');
      }

      // Delete existing ingredients
      await client.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [id]);

      // Insert new ingredients
      for (const ingredient of ingredients) {
        await client.query(
          'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ($1, $2, $3)',
          [id, ingredient.ingredient_id, ingredient.quantity]
        );
      }

      // Update recipe timestamp
      await client.query(
        'UPDATE recipes SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );

      return recipeCheck.rows[0];
    });

    success(res, {
      recipe_id: parseInt(id),
      recipe_title: result.title,
      ingredients_updated: ingredients.length
    }, 'Recipe ingredients updated successfully');
  })
);

// GET /recipes/popular - Most viewed/created recipes
router.get('/popular',
  validateQuery(popularRecipesSchema),
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { days } = req.query;

    // For now, we'll use creation date as popularity metric
    // In a real app, you'd track views/ratings
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM recipes r
      WHERE r.created_at >= $1
    `;
    const countResult = await query(countQuery, [cutoffDate.toISOString()]);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get popular recipes (ordered by creation date for now)
    const dataQuery = `
      SELECT
        r.id,
        r.title,
        r.description,
        r.preparation_time,
        r.serving_size,
        r.image_url,
        r.created_at,
        c.name as category_name,
        COUNT(ri.ingredient_id) as ingredient_count,
        COUNT(rt.tag_id) as tag_count
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      WHERE r.created_at >= $1
      GROUP BY r.id, c.name
      ORDER BY r.created_at DESC, ingredient_count DESC
      LIMIT $2 OFFSET $3
    `;
    const dataResult = await query(dataQuery, [cutoffDate.toISOString(), limit, offset]);

    const pagination = buildPaginationResponse(page, limit, totalCount);
    paginated(res, dataResult.rows, pagination, `Popular recipes from last ${days} days`);
  })
);

// POST /recipes/bulk - Import multiple recipes from JSON
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
          const { title, description, preparation_time, serving_size, image_url, category_id, ingredients, tags, created_by } = recipe;

          // Check if category exists
          const categoryResult = await client.query('SELECT id FROM categories WHERE id = $1', [category_id]);
          if (categoryResult.rows.length === 0) {
            errors.push({
              index: i,
              title: title,
              error: 'Invalid category_id'
            });
            continue;
          }

          // Insert recipe
          const recipeQuery = `
            INSERT INTO recipes (title, description, preparation_time, serving_size, image_url, category_id, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
            RETURNING *
          `;
          const recipeResult = await client.query(recipeQuery, [
            title,
            description || null,
            preparation_time || null,
            serving_size || null,
            image_url || null,
            category_id,
            created_by || 'bulk_import'
          ]);

          const newRecipe = recipeResult.rows[0];

          // Insert ingredients if provided
          if (ingredients && ingredients.length > 0) {
            // Verify all ingredient IDs exist
            const ingredientIds = ingredients.map(ing => ing.ingredient_id);
            const ingredientCheckQuery = `SELECT id FROM ingredients WHERE id = ANY($1)`;
            const ingredientCheckResult = await client.query(ingredientCheckQuery, [ingredientIds]);

            if (ingredientCheckResult.rows.length !== ingredientIds.length) {
              errors.push({
                index: i,
                title: title,
                error: 'One or more ingredient IDs are invalid'
              });
              continue;
            }

            // Insert recipe ingredients
            for (const ingredient of ingredients) {
              await client.query(
                'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ($1, $2, $3)',
                [newRecipe.id, ingredient.ingredient_id, ingredient.quantity]
              );
            }
          }

          // Insert tags if provided
          if (tags && tags.length > 0) {
            // Verify all tag IDs exist
            const tagCheckQuery = `SELECT id FROM tags WHERE id = ANY($1)`;
            const tagCheckResult = await client.query(tagCheckQuery, [tags]);

            if (tagCheckResult.rows.length !== tags.length) {
              errors.push({
                index: i,
                title: title,
                error: 'One or more tag IDs are invalid'
              });
              continue;
            }

            // Insert recipe tags
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

// DELETE /recipes/bulk - Delete multiple recipes
router.delete('/bulk',
  validateBody(bulkDeleteSchema),
  asyncHandler(async (req, res) => {
    const { ids } = req.body;

    const result = await withTransaction(async (client) => {
      const deletedRecipes = [];
      const errors = [];

      for (const id of ids) {
        try {
          // Check if recipe exists
          const existingResult = await client.query('SELECT id, title FROM recipes WHERE id = $1', [id]);
          if (existingResult.rows.length === 0) {
            errors.push({
              recipe_id: id,
              error: 'Recipe not found'
            });
            continue;
          }

          const recipe = existingResult.rows[0];

          // Delete recipe (CASCADE will handle recipe_ingredients and recipe_tags)
          await client.query('DELETE FROM recipes WHERE id = $1', [id]);

          deletedRecipes.push({
            recipe_id: id,
            title: recipe.title
          });

        } catch (error) {
          errors.push({
            recipe_id: id,
            error: error.message
          });
        }
      }

      return { deletedRecipes, errors };
    });

    const statusCode = result.errors.length > 0 ? 207 : 200; // 207 Multi-Status if there are errors

    res.status(statusCode).json({
      error: false,
      message: `Bulk delete completed. ${result.deletedRecipes.length} recipes deleted, ${result.errors.length} errors`,
      data: {
        deleted_recipes: result.deletedRecipes,
        errors: result.errors,
        summary: {
          total_submitted: ids.length,
          successful: result.deletedRecipes.length,
          failed: result.errors.length
        }
      }
    });
  })
);

module.exports = router;
