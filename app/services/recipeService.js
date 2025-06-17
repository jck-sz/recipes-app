/**
 * Recipe Service Layer
 * Centralizes common recipe query patterns and business logic
 */

const { query, withTransaction } = require('../db');
const { buildWhereClause, sanitizeLikeInput } = require('../utils/queryBuilder');

class RecipeService {
  /**
   * Get recipes with filtering and pagination
   */
  static async getRecipes(filters = {}, pagination = {}) {
    const { category, search, tag, prep_time_max } = filters;
    const { limit, offset } = pagination;

    // Build conditions
    const conditions = [];
    
    if (category) {
      conditions.push({ field: 'r.category_id', value: category, type: 'exact' });
    }

    if (search) {
      const searchTerm = sanitizeLikeInput(search);
      conditions.push({ field: 'r.title', value: searchTerm, type: 'like' });
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
      conditions.push({ field: 'r.preparation_time', operator: '<=', value: prep_time_max, type: 'exact' });
    }

    const { whereClause, params: queryParams } = buildWhereClause(conditions);
    
    // Handle search OR condition
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

    // Get count and data
    const countQuery = `
      SELECT COUNT(DISTINCT r.id) as count
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      ${finalWhereClause}
    `;
    
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

    const [countResult, dataResult] = await Promise.all([
      query(countQuery, finalParams),
      query(dataQuery, [...finalParams, limit, offset])
    ]);

    return {
      recipes: dataResult.rows,
      totalCount: parseInt(countResult.rows[0].count)
    };
  }

  /**
   * Get single recipe with full details
   */
  static async getRecipeById(id) {
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
    return result.rows[0] || null;
  }

  /**
   * Create recipe with ingredients and tags
   */
  static async createRecipe(recipeData) {
    const { title, description, preparation_time, category_id, serving_size, image_url, ingredients, tags } = recipeData;

    return await withTransaction(async (client) => {
      // Insert recipe
      const recipeResult = await client.query(
        `INSERT INTO recipes (title, description, preparation_time, category_id, serving_size, image_url, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [title, description, preparation_time, category_id, serving_size || null, image_url || null, 'system']
      );

      const recipe = recipeResult.rows[0];

      // Batch insert ingredients
      if (ingredients && ingredients.length > 0) {
        await this._insertRecipeIngredients(client, recipe.id, ingredients);
      }

      // Batch insert tags
      if (tags && tags.length > 0) {
        await this._insertRecipeTags(client, recipe.id, tags);
      }

      return recipe;
    });
  }

  /**
   * Update recipe with ingredients and tags
   */
  static async updateRecipe(id, recipeData) {
    const { title, description, preparation_time, category_id, serving_size, image_url, ingredients, tags } = recipeData;

    return await withTransaction(async (client) => {
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

      // Update ingredients if provided
      if (ingredients !== undefined) {
        await client.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [id]);
        if (ingredients.length > 0) {
          await this._insertRecipeIngredients(client, id, ingredients);
        }
      }

      // Update tags if provided
      if (tags !== undefined) {
        await client.query('DELETE FROM recipe_tags WHERE recipe_id = $1', [id]);
        if (tags.length > 0) {
          await this._insertRecipeTags(client, id, tags);
        }
      }

      return recipeResult.rows[0];
    });
  }

  /**
   * Delete recipe and relationships
   */
  static async deleteRecipe(id) {
    return await withTransaction(async (client) => {
      // Check if recipe exists
      const existingResult = await client.query('SELECT id, title FROM recipes WHERE id = $1', [id]);
      if (existingResult.rows.length === 0) {
        throw new Error('RECIPE_NOT_FOUND');
      }

      const recipe = existingResult.rows[0];

      // Delete relationships
      await client.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [id]);
      await client.query('DELETE FROM recipe_tags WHERE recipe_id = $1', [id]);

      // Delete recipe
      await client.query('DELETE FROM recipes WHERE id = $1', [id]);

      return recipe;
    });
  }

  /**
   * Private helper: Insert recipe ingredients
   */
  static async _insertRecipeIngredients(client, recipeId, ingredients) {
    const ingredientValues = ingredients.map((_, index) =>
      `($1, $${index * 2 + 2}, $${index * 2 + 3})`
    ).join(', ');

    const ingredientParams = [recipeId];
    ingredients.forEach(ingredient => {
      ingredientParams.push(ingredient.ingredient_id, ingredient.quantity);
    });

    await client.query(
      `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES ${ingredientValues}`,
      ingredientParams
    );
  }

  /**
   * Private helper: Insert recipe tags
   */
  static async _insertRecipeTags(client, recipeId, tags) {
    const tagValues = tags.map((_, index) => `($1, $${index + 2})`).join(', ');
    await client.query(
      `INSERT INTO recipe_tags (recipe_id, tag_id) VALUES ${tagValues}`,
      [recipeId, ...tags]
    );
  }
}

module.exports = RecipeService;
