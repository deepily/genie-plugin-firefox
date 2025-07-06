module.exports = {
  // Indicates the root of your project
  testEnvironment: 'jsdom',
  
  // ESM support
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/__tests__/**/*.test.js"
  ],
  
  // Mock browser extension APIs
  moduleNameMapper: {
    "webextension-polyfill": "<rootDir>/__mocks__/webextension-polyfill.js"
  },
  
  // Setup files to run before tests
  setupFiles: [
    "<rootDir>/__tests__/setup.js"
  ],
  
  // Coverage settings
  collectCoverageFrom: [
    "js/**/*.js",
    "!js/lib/**/*.js"
  ],
  
  // Verbose output
  verbose: true
};