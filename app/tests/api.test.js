/**
 * Basic API Tests for FODMAP Recipe API
 * 
 * This is a simple test suite demonstrating how to test the API endpoints.
 * To run these tests, you would need to install a testing framework like Jest or Mocha.
 * 
 * Example installation:
 * npm install --save-dev jest supertest
 * 
 * Then add to package.json:
 * "scripts": {
 *   "test": "jest"
 * }
 */

const request = require('supertest');
const app = require('../index'); // You'd need to export the app from index.js

describe('FODMAP Recipe API', () => {
  
  describe('Health Endpoints', () => {
    test('GET /health should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.error).toBe(false);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.services.database.status).toBe('healthy');
    });

    test('GET /health/db should return database health', async () => {
      const response = await request(app)
        .get('/health/db')
        .expect(200);
      
      expect(response.body.error).toBe(false);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.checks).toHaveLength(3);
    });
  });

  describe('Categories API', () => {
    test('GET /categories should return all categories', async () => {
      const response = await request(app)
        .get('/categories')
        .expect(200);
      
      expect(response.body.error).toBe(false);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('GET /categories/:id should return single category', async () => {
      const response = await request(app)
        .get('/categories/1')
        .expect(200);
      
      expect(response.body.error).toBe(false);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.name).toBeDefined();
    });

    test('GET /categories/999 should return 404', async () => {
      const response = await request(app)
        .get('/categories/999')
        .expect(404);
      
      expect(response.body.error).toBe(true);
      expect(response.body.code).toBe('CATEGORY_NOT_FOUND');
    });
  });

  describe('Ingredients API', () => {
    test('GET /ingredients should return paginated ingredients', async () => {
      const response = await request(app)
        .get('/ingredients')
        .expect(200);
      
      expect(response.body.error).toBe(false);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.totalCount).toBeGreaterThan(0);
    });

    test('GET /ingredients/search should find ingredients', async () => {
      const response = await request(app)
        .get('/ingredients/search?q=Marchew')
        .expect(200);
      
      expect(response.body.error).toBe(false);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toContain('Marchew');
    });

    test('GET /ingredients/by-fodmap-level should filter by FODMAP level', async () => {
      const response = await request(app)
        .get('/ingredients/by-fodmap-level?level=LOW')
        .expect(200);
      
      expect(response.body.error).toBe(false);
      expect(response.body.data.fodmap_level).toBe('LOW');
      expect(Array.isArray(response.body.data.ingredients)).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
    });

    test('POST /ingredients should create new ingredient', async () => {
      const newIngredient = {
        name: 'Test Ingredient',
        quantity_unit: 'g',
        fodmap_level: 'LOW'
      };

      const response = await request(app)
        .post('/ingredients')
        .send(newIngredient)
        .expect(201);
      
      expect(response.body.error).toBe(false);
      expect(response.body.data.name).toBe(newIngredient.name);
      expect(response.body.data.id).toBeDefined();

      // Clean up - delete the test ingredient
      await request(app)
        .delete(`/ingredients/${response.body.data.id}`)
        .expect(200);
    });

    test('POST /ingredients with invalid data should return validation error', async () => {
      const invalidIngredient = {
        name: '', // Empty name should fail validation
        fodmap_level: 'INVALID' // Invalid FODMAP level
      };

      const response = await request(app)
        .post('/ingredients')
        .send(invalidIngredient)
        .expect(400);
      
      expect(response.body.error).toBe(true);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(response.body.details)).toBe(true);
    });
  });

  describe('Tags API', () => {
    test('GET /tags should return all tags', async () => {
      const response = await request(app)
        .get('/tags')
        .expect(200);
      
      expect(response.body.error).toBe(false);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('POST /tags should create new tag', async () => {
      const newTag = { name: 'Test Tag' };

      const response = await request(app)
        .post('/tags')
        .send(newTag)
        .expect(201);
      
      expect(response.body.error).toBe(false);
      expect(response.body.data.name).toBe(newTag.name);

      // Clean up
      await request(app)
        .delete(`/tags/${response.body.data.id}`)
        .expect(200);
    });
  });

  describe('Recipes API', () => {
    test('GET /recipes should return paginated recipes', async () => {
      const response = await request(app)
        .get('/recipes')
        .expect(200);
      
      expect(response.body.error).toBe(false);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('GET /recipes/:id should return recipe with ingredients and tags', async () => {
      const response = await request(app)
        .get('/recipes/1')
        .expect(200);
      
      expect(response.body.error).toBe(false);
      expect(response.body.data.id).toBe(1);
      expect(Array.isArray(response.body.data.ingredients)).toBe(true);
      expect(Array.isArray(response.body.data.tags)).toBe(true);
    });

    test('GET /recipes/popular should return popular recipes', async () => {
      const response = await request(app)
        .get('/recipes/popular?days=30')
        .expect(200);
      
      expect(response.body.error).toBe(false);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('GET /recipes/fodmap-safe should return FODMAP-safe recipes', async () => {
      const response = await request(app)
        .get('/recipes/fodmap-safe?max_level=LOW')
        .expect(200);
      
      expect(response.body.error).toBe(false);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.every(recipe => recipe.fodmap_score === 'LOW')).toBe(true);
    });

    test('GET /recipes with filters should filter correctly', async () => {
      const response = await request(app)
        .get('/recipes?category=1&prep_time_max=20')
        .expect(200);
      
      expect(response.body.error).toBe(false);
      expect(Array.isArray(response.body.data)).toBe(true);
      // All returned recipes should have preparation_time <= 20
      expect(response.body.data.every(recipe => 
        recipe.preparation_time === null || recipe.preparation_time <= 20
      )).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('GET /nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);
      
      expect(response.body.error).toBe(true);
      expect(response.body.code).toBe('ENDPOINT_NOT_FOUND');
    });

    test('POST with invalid JSON should return 400', async () => {
      const response = await request(app)
        .post('/ingredients')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
      
      expect(response.body.error).toBe(true);
      expect(response.body.code).toBe('INVALID_JSON');
    });
  });
});

/**
 * Integration Test Examples
 * 
 * These tests demonstrate more complex scenarios that test multiple endpoints together
 */
describe('Integration Tests', () => {
  test('Complete recipe workflow', async () => {
    // 1. Create a new ingredient
    const ingredient = await request(app)
      .post('/ingredients')
      .send({ name: 'Integration Test Ingredient', quantity_unit: 'g', fodmap_level: 'LOW' })
      .expect(201);

    // 2. Create a new tag
    const tag = await request(app)
      .post('/tags')
      .send({ name: 'Integration Test Tag' })
      .expect(201);

    // 3. Create a recipe using the ingredient and tag
    const recipe = await request(app)
      .post('/recipes')
      .send({
        title: 'Integration Test Recipe',
        description: 'A recipe for testing',
        preparation_time: 15,
        serving_size: 2,
        category_id: 1,
        ingredients: [{ ingredient_id: ingredient.body.data.id, quantity: 100 }],
        tags: [tag.body.data.id]
      })
      .expect(201);

    // 4. Verify the recipe was created with correct relationships
    const fullRecipe = await request(app)
      .get(`/recipes/${recipe.body.data.id}`)
      .expect(200);

    expect(fullRecipe.body.data.ingredients).toHaveLength(1);
    expect(fullRecipe.body.data.ingredients[0].id).toBe(ingredient.body.data.id);
    expect(fullRecipe.body.data.tags).toHaveLength(1);
    expect(fullRecipe.body.data.tags[0].id).toBe(tag.body.data.id);

    // 5. Clean up - delete in reverse order
    await request(app).delete(`/recipes/${recipe.body.data.id}`).expect(200);
    await request(app).delete(`/ingredients/${ingredient.body.data.id}`).expect(200);
    await request(app).delete(`/tags/${tag.body.data.id}`).expect(200);
  });
});
