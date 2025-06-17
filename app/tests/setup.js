/**
 * Jest Test Setup
 * Configures the test environment before running tests
 */

const path = require('path');

// Load test environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

// Mock console.log and console.error to reduce noise during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Only show errors during tests, suppress other logs
console.log = jest.fn();
console.error = jest.fn();

// Restore console for specific test debugging if needed
global.restoreConsole = () => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
};

// Set test timeout
jest.setTimeout(30000);
