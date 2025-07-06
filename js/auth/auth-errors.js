/**
 * Authentication Error Classes
 * 
 * Custom error classes for different authentication scenarios
 */

/**
 * Base authentication error class
 */
export class AuthError extends Error {
    constructor(message, code = 'AUTH_ERROR') {
        super(message);
        this.name = 'AuthError';
        this.code = code;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Network-related authentication errors
 */
export class AuthNetworkError extends AuthError {
    constructor(message, originalError = null) {
        super(message, 'AUTH_NETWORK_ERROR');
        this.name = 'AuthNetworkError';
        this.originalError = originalError;
        this.retryable = true;
    }
}

/**
 * Server response errors (4xx, 5xx)
 */
export class AuthServerError extends AuthError {
    constructor(message, statusCode = null, response = null) {
        super(message, 'AUTH_SERVER_ERROR');
        this.name = 'AuthServerError';
        this.statusCode = statusCode;
        this.response = response;
        this.retryable = statusCode >= 500; // Retry server errors, not client errors
    }
}

/**
 * Token-related errors (expired, invalid, malformed)
 */
export class AuthTokenError extends AuthError {
    constructor(message, tokenType = 'unknown') {
        super(message, 'AUTH_TOKEN_ERROR');
        this.name = 'AuthTokenError';
        this.tokenType = tokenType;
        this.retryable = true; // Can usually be fixed by re-authentication
    }
}

/**
 * Session-related errors (invalid session, session not found)
 */
export class AuthSessionError extends AuthError {
    constructor(message, sessionId = null) {
        super(message, 'AUTH_SESSION_ERROR');
        this.name = 'AuthSessionError';
        this.sessionId = sessionId;
        this.retryable = true;
    }
}

/**
 * Storage-related errors (quota exceeded, corruption, etc.)
 */
export class AuthStorageError extends AuthError {
    constructor(message, operation = 'unknown') {
        super(message, 'AUTH_STORAGE_ERROR');
        this.name = 'AuthStorageError';
        this.operation = operation;
        this.retryable = false; // Storage issues usually require manual intervention
    }
}

/**
 * Configuration or validation errors
 */
export class AuthConfigError extends AuthError {
    constructor(message, configKey = null) {
        super(message, 'AUTH_CONFIG_ERROR');
        this.name = 'AuthConfigError';
        this.configKey = configKey;
        this.retryable = false; // Config issues require code changes
    }
}

/**
 * Timeout errors for authentication operations
 */
export class AuthTimeoutError extends AuthError {
    constructor(message, operation = 'unknown', timeout = null) {
        super(message, 'AUTH_TIMEOUT_ERROR');
        this.name = 'AuthTimeoutError';
        this.operation = operation;
        this.timeout = timeout;
        this.retryable = true;
    }
}

/**
 * Error helper functions
 */
export class AuthErrorUtils {
    /**
     * Check if an error is retryable
     * @param {Error} error - Error to check
     * @returns {boolean} - True if the error can be retried
     */
    static isRetryable(error) {
        if (error instanceof AuthError) {
            return error.retryable;
        }
        
        // Network errors are generally retryable
        if (error.name === 'NetworkError' || error.name === 'TypeError') {
            return true;
        }
        
        return false;
    }

    /**
     * Get error code from any error
     * @param {Error} error - Error to analyze
     * @returns {string} - Error code
     */
    static getErrorCode(error) {
        if (error instanceof AuthError) {
            return error.code;
        }
        
        return 'UNKNOWN_ERROR';
    }

    /**
     * Create an appropriate AuthError from a generic error
     * @param {Error} error - Original error
     * @param {string} context - Context where the error occurred
     * @returns {AuthError} - Appropriate AuthError subclass
     */
    static fromError(error, context = 'unknown') {
        if (error instanceof AuthError) {
            return error;
        }

        // Network errors
        if (error.name === 'NetworkError' || error.name === 'TypeError') {
            return new AuthNetworkError(`Network error in ${context}: ${error.message}`, error);
        }

        // Timeout errors
        if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
            return new AuthTimeoutError(`Timeout in ${context}: ${error.message}`, context);
        }

        // Generic authentication error
        return new AuthError(`Error in ${context}: ${error.message}`, 'GENERIC_AUTH_ERROR');
    }

    /**
     * Format error for user display
     * @param {Error} error - Error to format
     * @returns {string} - User-friendly error message
     */
    static formatForUser(error) {
        if (error instanceof AuthNetworkError) {
            return 'Network connection error. Please check your internet connection and try again.';
        }
        
        if (error instanceof AuthTokenError) {
            return 'Authentication session expired. Please try recording again.';
        }
        
        if (error instanceof AuthServerError) {
            if (error.statusCode === 401 || error.statusCode === 403) {
                return 'Authentication failed. Please try again.';
            }
            return 'Server error. Please try again later.';
        }
        
        if (error instanceof AuthStorageError) {
            return 'Storage error. Please check browser permissions and try again.';
        }
        
        if (error instanceof AuthTimeoutError) {
            return 'Request timed out. Please try again.';
        }
        
        return 'Authentication error occurred. Please try again.';
    }
}

console.log('auth-errors.js loaded');