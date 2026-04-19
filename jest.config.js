// jest.config.js
'use strict';
module.exports = {
  testEnvironment: 'node',
  testMatch:       ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/config/**'],
  coverageDirectory:   'coverage',
  // runs BEFORE any module is required – sets env vars so env.js validation passes
  setupFiles:         ['./tests/jest.env.setup.js'],
  // runs AFTER test framework is installed – used for jest global mocks
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 15000,
};
