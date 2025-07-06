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
    "!js/lib/**/*.js",
    "!js/auth/mocks/**/*.js"
  ],
  
  // Coverage thresholds for authentication components
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    "js/auth/**/*.js": {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Verbose output
  verbose: true
};