/**
 * Basic Tests - No Database Required
 * Tests basic functionality without requiring database connection
 */

const request = require('supertest');

// Mock the database module to avoid connection issues
jest.mock('../db', () => ({
  query: jest.fn(),
  withTransaction: jest.fn(),
  pool: {
    query: jest.fn(),
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0
  }
}));

describe('Basic API Tests', () => {
  let app;

  beforeAll(() => {
    // Import app after mocking database
    app = require('../index');
  });

  test('Root endpoint should return welcome message', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.body.message).toBe('Welcome to the Recipe API!');
  });

  test('Non-existent endpoint should return 404', async () => {
    const response = await request(app)
      .get('/nonexistent')
      .expect(404);
    
    expect(response.body.error).toBe(true);
    expect(response.body.code).toBe('ENDPOINT_NOT_FOUND');
  });

  test('Invalid JSON should return 400', async () => {
    const response = await request(app)
      .post('/ingredients')
      .send('invalid json')
      .set('Content-Type', 'application/json')
      .expect(400);
    
    expect(response.body.error).toBe(true);
  });
});
