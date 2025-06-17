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
  idParamSchema
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
router.put('/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { title, description, preparation_time, serving_size, image_url, category_id, ingredients, tags, updated_by } = req.body;

    // Check if recipe exists
    const existingResult = await client.query('SELECT id FROM recipes WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return notFound(res, 'Recipe');
    }

    // Validate required fields
    const validationErr = validateRequired(['title', 'category_id'], req.body);
    if (validationErr) {
      await client.query('ROLLBACK');
      return validationError(res, validationErr);
    }

    // Validate optional fields
    if (preparation_time !== undefined) {
      const prepTimeErr = validatePositiveInteger(preparation_time, 'preparation_time');
      if (prepTimeErr) {
        await client.query('ROLLBACK');
        return validationError(res, prepTimeErr);
      }
    }

    if (serving_size !== undefined) {
      const servingSizeErr = validatePositiveInteger(serving_size, 'serving_size');
      if (servingSizeErr) {
        await client.query('ROLLBACK');
        return validationError(res, servingSizeErr);
      }
    }

    if (image_url) {
      const urlErr = validateUrl(image_url, 'image_url');
      if (urlErr) {
        await client.query('ROLLBACK');
        return validationError(res, urlErr);
      }
    }

    // Validate ingredients if provided
    if (ingredients) {
      const ingredientsErr = validateIngredients(ingredients);
      if (ingredientsErr) {
        await client.query('ROLLBACK');
        return validationError(res, ingredientsErr);
      }
    }

    // Validate tags if provided
    if (tags) {
      const tagsErr = validateTags(tags);
      if (tagsErr) {
        await client.query('ROLLBACK');
        return validationError(res, tagsErr);
      }
    }

    // Check if category exists
    const categoryResult = await client.query('SELECT id FROM categories WHERE id = $1', [category_id]);
    if (categoryResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return validationError(res, 'Invalid category_id');
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
          await client.query('ROLLBACK');
          return validationError(res, 'One or more ingredient IDs are invalid');
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
          await client.query('ROLLBACK');
          return validationError(res, 'One or more tag IDs are invalid');
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

    await client.query('COMMIT');

    // Get the complete updated recipe with relationships
    const completeRecipeQuery = `
      SELECT r.*, c.name as category_name
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.id = $1
    `;
    const completeRecipeResult = await client.query(completeRecipeQuery, [id]);

    success(res, completeRecipeResult.rows[0], 'Recipe updated successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database error:', err);
    error(res, 'Failed to update recipe');
  } finally {
    client.release();
  }
});

// DELETE /recipes/:id - Delete recipe and all relationships
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if recipe exists
    const existingResult = await pool.query('SELECT id, title FROM recipes WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return notFound(res, 'Recipe');
    }

    const recipe = existingResult.rows[0];

    // Delete recipe (CASCADE will handle recipe_ingredients and recipe_tags)
    await pool.query('DELETE FROM recipes WHERE id = $1', [id]);

    success(res, { id: parseInt(id), title: recipe.title }, 'Recipe deleted successfully');
  } catch (err) {
    console.error('Database error:', err);
    error(res, 'Failed to delete recipe');
  }
});

module.exports = router;
