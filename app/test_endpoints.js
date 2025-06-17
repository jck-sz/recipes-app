#!/usr/bin/env node

/**
 * Comprehensive API Endpoint Test Suite
 * Tests all documented endpoints to verify they work correctly
 */

const http = require('http');
const querystring = require('querystring');

const BASE_URL = 'http://localhost:3000';
let testResults = [];
let totalTests = 0;
let passedTests = 0;

// Test helper function
async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test function
async function test(name, testFn) {
  totalTests++;
  try {
    await testFn();
    console.log(`✅ ${name}`);
    testResults.push({ name, status: 'PASS' });
    passedTests++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    testResults.push({ name, status: 'FAIL', error: error.message });
  }
}

// Assertion helpers
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertStatusCode(response, expected) {
  assertEqual(response.statusCode, expected, 'Status code mismatch');
}

function assertHasProperty(obj, prop) {
  if (!obj.hasOwnProperty(prop)) {
    throw new Error(`Missing property: ${prop}`);
  }
}

function assertIsArray(value, message = 'Expected array') {
  if (!Array.isArray(value)) {
    throw new Error(message);
  }
}

// Main test suite
async function runTests() {
  console.log('🚀 Starting API Endpoint Tests...\n');

  // Health endpoint tests
  await test('GET /health - should return healthy status', async () => {
    const response = await makeRequest('GET', '/health');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertHasProperty(response.body.data, 'status');
    assertEqual(response.body.data.status, 'healthy', 'Should be healthy');
  });

  await test('GET /health/db - should return database health', async () => {
    const response = await makeRequest('GET', '/health/db');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertHasProperty(response.body.data, 'checks');
    assertIsArray(response.body.data.checks, 'Checks should be array');
  });

  // Categories endpoint tests
  await test('GET /categories - should return all categories', async () => {
    const response = await makeRequest('GET', '/categories');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertIsArray(response.body.data, 'Categories should be array');
  });

  await test('GET /categories/1 - should return single category', async () => {
    const response = await makeRequest('GET', '/categories/1');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertHasProperty(response.body.data, 'id');
    assertEqual(response.body.data.id, 1, 'Should return category with ID 1');
  });

  await test('GET /categories/999 - should return 404 for non-existent category', async () => {
    const response = await makeRequest('GET', '/categories/999');
    assertStatusCode(response, 404);
    assertEqual(response.body.error, true, 'Should have error');
  });

  // Ingredients endpoint tests
  await test('GET /ingredients - should return paginated ingredients', async () => {
    const response = await makeRequest('GET', '/ingredients');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertIsArray(response.body.data, 'Ingredients should be array');
    assertHasProperty(response.body, 'pagination');
  });

  await test('GET /ingredients?limit=3 - should respect pagination', async () => {
    const response = await makeRequest('GET', '/ingredients?limit=3');
    assertStatusCode(response, 200);
    assertEqual(response.body.data.length, 3, 'Should return 3 ingredients');
    assertEqual(response.body.pagination.limit, 3, 'Pagination limit should be 3');
  });

  await test('GET /ingredients/search?q=marchew - should search ingredients', async () => {
    const response = await makeRequest('GET', '/ingredients/search?q=marchew');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertIsArray(response.body.data, 'Search results should be array');
  });

  await test('GET /ingredients/unused - should return unused ingredients', async () => {
    const response = await makeRequest('GET', '/ingredients/unused');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertHasProperty(response.body.data, 'unused_ingredients');
  });

  await test('GET /ingredients/by-fodmap-level?level=LOW - should filter by FODMAP level', async () => {
    const response = await makeRequest('GET', '/ingredients/by-fodmap-level?level=LOW');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertHasProperty(response.body.data, 'ingredients');
  });

  // Tags endpoint tests
  await test('GET /tags - should return all tags', async () => {
    const response = await makeRequest('GET', '/tags');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertIsArray(response.body.data, 'Tags should be array');
  });

  await test('GET /tags/1 - should return single tag', async () => {
    const response = await makeRequest('GET', '/tags/1');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertHasProperty(response.body.data, 'id');
  });

  // Recipes endpoint tests
  await test('GET /recipes - should return paginated recipes', async () => {
    const response = await makeRequest('GET', '/recipes');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertIsArray(response.body.data, 'Recipes should be array');
    assertHasProperty(response.body, 'pagination');
  });

  await test('GET /recipes/1 - should return single recipe with details', async () => {
    const response = await makeRequest('GET', '/recipes/1');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertHasProperty(response.body.data, 'ingredients');
    assertHasProperty(response.body.data, 'tags');
    assertIsArray(response.body.data.ingredients, 'Ingredients should be array');
    assertIsArray(response.body.data.tags, 'Tags should be array');
  });

  await test('GET /recipes/1/ingredients - should return recipe ingredients', async () => {
    const response = await makeRequest('GET', '/recipes/1/ingredients');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertHasProperty(response.body.data, 'ingredients');
  });

  await test('GET /recipes/popular - should return popular recipes', async () => {
    const response = await makeRequest('GET', '/recipes/popular');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertIsArray(response.body.data, 'Popular recipes should be array');
  });

  await test('GET /recipes/fodmap-safe - should return FODMAP-safe recipes', async () => {
    const response = await makeRequest('GET', '/recipes/fodmap-safe');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertIsArray(response.body.data, 'FODMAP-safe recipes should be array');
  });

  // Search and filtering tests
  await test('GET /recipes?search=jajecznica - should search recipes', async () => {
    const response = await makeRequest('GET', '/recipes?search=jajecznica');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertIsArray(response.body.data, 'Search results should be array');
  });

  await test('GET /recipes?category=1 - should filter by category', async () => {
    const response = await makeRequest('GET', '/recipes?category=1');
    assertStatusCode(response, 200);
    assertEqual(response.body.error, false, 'Should not have error');
    assertIsArray(response.body.data, 'Filtered recipes should be array');
  });

  // Error handling tests
  await test('GET /nonexistent - should return 404', async () => {
    const response = await makeRequest('GET', '/nonexistent');
    assertStatusCode(response, 404);
    assertEqual(response.body.error, true, 'Should have error');
    assertEqual(response.body.code, 'ENDPOINT_NOT_FOUND', 'Should have correct error code');
  });

  await test('GET /recipes/999 - should return 404 for non-existent recipe', async () => {
    const response = await makeRequest('GET', '/recipes/999');
    assertStatusCode(response, 404);
    assertEqual(response.body.error, true, 'Should have error');
  });

  // Print results
  console.log('\n📊 Test Results:');
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
