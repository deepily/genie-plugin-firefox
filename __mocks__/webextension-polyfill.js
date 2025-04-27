// Mock for webextension-polyfill
const browser = {
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

export default browser;