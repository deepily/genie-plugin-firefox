// Setup file for Jest tests

// Mock browser global
global.browser = {
  runtime: {
    sendMessage: jest.fn().mockResolvedValue({}),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    lastError: null
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue({})
    }
  },
  tabs: {
    query: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    executeScript: jest.fn().mockResolvedValue([])
  },
  contextMenus: {
    create: jest.fn(),
    remove: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  }
};

// Mock console methods to prevent test output pollution
// global.console = {
//   ...console,
//   log: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn()
// };