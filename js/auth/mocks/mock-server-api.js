/**
 * Mock Server API Implementation for Testing
 * 
 * Simulates FastAPI server responses for authentication testing
 * without requiring actual server connection.
 */

export class MockServerAPI {
    constructor() {
        this.baseUrl = 'http://localhost:7999';
        this.responses = new Map();
        this.callCounts = new Map();
        this.throwErrors = false;
        this.delay = 0;
        this.requestHistory = [];
        
        // Set up default responses
        this._setupDefaultResponses();
    }

    /**
     * Make an HTTP request to the mock server
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options (method, headers, body)
     * @returns {Promise<Object>} - Response data
     */
    async request(endpoint, options = {}) {
        if (this.delay > 0) {
            await this._sleep(this.delay);
        }

        const method = options.method || 'GET';
        const key = `${method} ${endpoint}`;
        
        // Record the request
        this.requestHistory.push({
            endpoint,
            method,
            options,
            timestamp: Date.now()
        });

        // Update call count
        this.callCounts.set(key, (this.callCounts.get(key) || 0) + 1);

        if (this.throwErrors) {
            throw new Error(`Mock server error for ${key}`);
        }

        // Get response for this endpoint
        const response = this.responses.get(key);
        if (!response) {
            throw new Error(`No mock response configured for ${key}`);
        }

        // Handle different response types
        if (response.error) {
            const error = new Error(response.error.message);
            error.status = response.error.status;
            throw error;
        }

        return response.data;
    }

    /**
     * Get session ID from server
     * @returns {Promise<Object>} - Session response
     */
    async getSessionId() {
        return this.request('/api/get-session-id', { method: 'GET' });
    }

    /**
     * Authenticate and get tokens
     * @param {string} sessionId - Session identifier
     * @returns {Promise<Object>} - Authentication tokens
     */
    async getAuthTokens(sessionId) {
        return this.request('/api/auth/tokens', {
            method: 'POST',
            body: { sessionId }
        });
    }

    /**
     * Refresh authentication tokens
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<Object>} - New tokens
     */
    async refreshTokens(refreshToken) {
        return this.request('/api/auth/refresh', {
            method: 'POST',
            body: { refreshToken }
        });
    }

    /**
     * Validate session with server
     * @param {string} sessionId - Session to validate
     * @returns {Promise<Object>} - Validation result
     */
    async validateSession(sessionId) {
        return this.request('/api/auth/validate', {
            method: 'POST',
            body: { sessionId }
        });
    }

    /**
     * Set a mock response for an endpoint
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {Object} responseData - Response data
     */
    setResponse(method, endpoint, responseData) {
        const key = `${method} ${endpoint}`;
        this.responses.set(key, { data: responseData });
    }

    /**
     * Set a mock error response for an endpoint
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {number} status - HTTP status code
     * @param {string} message - Error message
     */
    setErrorResponse(method, endpoint, status, message) {
        const key = `${method} ${endpoint}`;
        this.responses.set(key, {
            error: { status, message }
        });
    }

    /**
     * Get call count for an endpoint
     * @param {string} endpoint - Endpoint to check
     * @param {string} method - HTTP method (default: GET)
     * @returns {number} - Number of calls made
     */
    getCallCount(endpoint, method = 'GET') {
        const key = `${method} ${endpoint}`;
        return this.callCounts.get(key) || 0;
    }

    /**
     * Get request history
     * @returns {Array} - Array of all requests made
     */
    getRequestHistory() {
        return [...this.requestHistory];
    }

    /**
     * Clear all call counts and history
     */
    clearHistory() {
        this.callCounts.clear();
        this.requestHistory = [];
    }

    /**
     * Set mock to throw errors for testing error handling
     * @param {boolean} shouldThrow - Whether to throw errors
     */
    setThrowErrors(shouldThrow) {
        this.throwErrors = shouldThrow;
    }

    /**
     * Set artificial delay for testing async behavior
     * @param {number} delayMs - Delay in milliseconds
     */
    setDelay(delayMs) {
        this.delay = delayMs;
    }

    /**
     * Reset mock API to initial state
     */
    reset() {
        this.responses.clear();
        this.callCounts.clear();
        this.requestHistory = [];
        this.throwErrors = false;
        this.delay = 0;
        this._setupDefaultResponses();
    }

    /**
     * Simulate different authentication scenarios
     * @param {string} scenario - Scenario name
     */
    setScenario(scenario) {
        this.reset();
        
        switch (scenario) {
            case 'success':
                this._setupSuccessScenario();
                break;
            case 'expired_tokens':
                this._setupExpiredTokensScenario();
                break;
            case 'server_error':
                this._setupServerErrorScenario();
                break;
            case 'network_error':
                this.setThrowErrors(true);
                break;
            default:
                throw new Error(`Unknown scenario: ${scenario}`);
        }
    }

    /**
     * Set up default success responses
     * @private
     */
    _setupDefaultResponses() {
        this.setResponse('GET', '/api/get-session-id', {
            sessionId: 'mock-session-123',
            timestamp: Date.now()
        });

        this.setResponse('POST', '/api/auth/tokens', {
            access: 'mock-access-token-abc123',
            refresh: 'mock-refresh-token-xyz789',
            type: 'Bearer',
            expiresIn: 3600
        });

        this.setResponse('POST', '/api/auth/refresh', {
            access: 'mock-new-access-token-def456',
            type: 'Bearer',
            expiresIn: 3600
        });

        this.setResponse('POST', '/api/auth/validate', {
            valid: true,
            user: {
                id: 'mock-user-123',
                name: 'Test User',
                permissions: ['read', 'write']
            }
        });
    }

    /**
     * Set up success scenario responses
     * @private
     */
    _setupSuccessScenario() {
        this._setupDefaultResponses();
    }

    /**
     * Set up expired tokens scenario
     * @private
     */
    _setupExpiredTokensScenario() {
        this.setErrorResponse('POST', '/api/auth/tokens', 401, 'Session expired');
        this.setErrorResponse('POST', '/api/auth/validate', 401, 'Token expired');
        
        // Refresh should work
        this.setResponse('POST', '/api/auth/refresh', {
            access: 'mock-refreshed-token-ghi789',
            type: 'Bearer',
            expiresIn: 3600
        });
    }

    /**
     * Set up server error scenario
     * @private
     */
    _setupServerErrorScenario() {
        this.setErrorResponse('GET', '/api/get-session-id', 500, 'Internal server error');
        this.setErrorResponse('POST', '/api/auth/tokens', 503, 'Service unavailable');
    }

    /**
     * Private helper to simulate async delay
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise<void>}
     */
    async _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

console.log('mock-server-api.js loaded');