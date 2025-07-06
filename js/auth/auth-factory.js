/**
 * Authentication Factory - Easy initialization of AuthManager with dependencies
 * 
 * Provides convenient factory methods for creating AuthManager instances
 * with appropriate implementations for different environments.
 */

import { AuthManager } from './auth-manager.js';
import { StorageInterface } from './storage-interface.js';
import { MessagingInterface } from './messaging-interface.js';

// Mock implementations for testing
import { MockStorage } from './mocks/mock-storage.js';
import { MockMessaging } from './mocks/mock-messaging.js';
import { MockServerAPI } from './mocks/mock-server-api.js';

/**
 * Browser storage implementation using chrome.storage.local
 */
class BrowserStorage extends StorageInterface {
    async get(key) {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                resolve(result[key] || null);
            });
        });
    }

    async set(key, value) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, resolve);
        });
    }

    async remove(key) {
        return new Promise((resolve) => {
            chrome.storage.local.remove([key], resolve);
        });
    }

    async clear() {
        return new Promise((resolve) => {
            chrome.storage.local.clear(resolve);
        });
    }
}

/**
 * Browser messaging implementation using chrome.runtime
 */
class BrowserMessaging extends MessagingInterface {
    constructor() {
        super();
        this.listeners = new Set();
        
        // Set up chrome.runtime listener
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this._handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });
    }

    addListener(listener) {
        this.listeners.add(listener);
    }

    removeListener(listener) {
        this.listeners.delete(listener);
    }

    async sendMessage(message, options = {}) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    }

    async _handleMessage(message, sender, sendResponse) {
        for (const listener of this.listeners) {
            try {
                const response = await listener(message, { sender });
                if (response !== undefined) {
                    sendResponse(response);
                    break;
                }
            } catch (error) {
                console.error('Browser messaging listener error:', error);
                sendResponse({ error: error.message });
                break;
            }
        }
    }
}

/**
 * Real server API implementation for production use
 */
class ServerAPI {
    constructor(baseUrl = 'http://localhost:7999') {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        const response = await fetch(url, config);
        
        if (!response.ok) {
            const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
            error.status = response.status;
            throw error;
        }

        return await response.json();
    }

    async getSessionId() {
        return this.request('/api/get-session-id');
    }

    async getAuthTokens(sessionId) {
        return this.request('/api/auth/tokens', {
            method: 'POST',
            body: { sessionId }
        });
    }

    async refreshTokens(refreshToken) {
        return this.request('/api/auth/refresh', {
            method: 'POST',
            body: { refreshToken }
        });
    }

    async validateSession(sessionId) {
        return this.request('/api/auth/validate', {
            method: 'POST',
            body: { sessionId }
        });
    }
}

/**
 * Authentication Factory for creating configured AuthManager instances
 */
export class AuthFactory {
    /**
     * Create AuthManager for browser extension environment
     * @param {Object} config - Configuration options
     * @returns {AuthManager} - Configured AuthManager instance
     */
    static createForBrowser(config = {}) {
        const storage = new BrowserStorage();
        const messaging = new BrowserMessaging();
        const serverAPI = new ServerAPI(config.serverUrl);
        
        return new AuthManager(storage, messaging, serverAPI, config);
    }

    /**
     * Create AuthManager for testing environment with mocks
     * @param {Object} config - Configuration options
     * @param {Object} mockOverrides - Override specific mocks
     * @returns {AuthManager} - AuthManager with mock dependencies
     */
    static createForTesting(config = {}, mockOverrides = {}) {
        const storage = mockOverrides.storage || new MockStorage();
        const messaging = mockOverrides.messaging || new MockMessaging();
        const serverAPI = mockOverrides.serverAPI || new MockServerAPI();
        
        const testConfig = {
            debug: true,
            maxRetryAttempts: 1,
            retryDelay: 10,
            ...config
        };
        
        return new AuthManager(storage, messaging, serverAPI, testConfig);
    }

    /**
     * Create AuthManager with custom implementations
     * @param {StorageInterface} storage - Storage implementation
     * @param {MessagingInterface} messaging - Messaging implementation
     * @param {Object} serverAPI - Server API implementation
     * @param {Object} config - Configuration options
     * @returns {AuthManager} - AuthManager with custom dependencies
     */
    static createCustom(storage, messaging, serverAPI, config = {}) {
        return new AuthManager(storage, messaging, serverAPI, config);
    }

    /**
     * Get default configuration for different environments
     * @param {string} environment - Environment name ('production', 'development', 'testing')
     * @returns {Object} - Default configuration for environment
     */
    static getDefaultConfig(environment) {
        const configs = {
            production: {
                debug: false,
                serverUrl: 'https://lupin.deepily.ai',
                sessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
                tokenRefreshThreshold: 30 * 60 * 1000, // 30 minutes
                maxRetryAttempts: 3,
                retryDelay: 1000
            },
            development: {
                debug: true,
                serverUrl: 'http://localhost:7999',
                sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
                tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes
                maxRetryAttempts: 2,
                retryDelay: 500
            },
            testing: {
                debug: true,
                serverUrl: 'http://localhost:7999',
                sessionDuration: 60 * 60 * 1000, // 1 hour
                tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes
                maxRetryAttempts: 1,
                retryDelay: 10
            }
        };

        return configs[environment] || configs.development;
    }

    /**
     * Initialize authentication system for browser extension
     * @param {string} environment - Environment ('production', 'development')
     * @param {Object} configOverrides - Configuration overrides
     * @returns {Promise<AuthManager>} - Initialized AuthManager
     */
    static async initializeForBrowser(environment = 'development', configOverrides = {}) {
        const config = {
            ...this.getDefaultConfig(environment),
            ...configOverrides
        };

        const authManager = this.createForBrowser(config);
        await authManager.initialize();
        
        return authManager;
    }

    /**
     * Check if browser API is available
     * @returns {boolean} - True if running in browser extension context
     */
    static isBrowserEnvironment() {
        return typeof chrome !== 'undefined' && 
               chrome.storage && 
               chrome.runtime;
    }

    /**
     * Validate configuration object
     * @param {Object} config - Configuration to validate
     * @throws {Error} - If configuration is invalid
     */
    static validateConfig(config) {
        if (config.sessionDuration && config.sessionDuration < 60000) {
            throw new Error('Session duration must be at least 1 minute');
        }

        if (config.tokenRefreshThreshold && config.tokenRefreshThreshold < 1000) {
            throw new Error('Token refresh threshold must be at least 1 second');
        }

        if (config.maxRetryAttempts && config.maxRetryAttempts < 1) {
            throw new Error('Max retry attempts must be at least 1');
        }

        if (config.retryDelay && config.retryDelay < 0) {
            throw new Error('Retry delay cannot be negative');
        }

        if (config.serverUrl && !config.serverUrl.startsWith('http')) {
            throw new Error('Server URL must start with http:// or https://');
        }
    }
}

/**
 * Convenience function for quick browser initialization
 * @param {Object} config - Configuration options
 * @returns {Promise<AuthManager>} - Initialized AuthManager
 */
export async function initAuth(config = {}) {
    const environment = config.production ? 'production' : 'development';
    return AuthFactory.initializeForBrowser(environment, config);
}

console.log('auth-factory.js loaded');