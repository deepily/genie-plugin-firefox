/**
 * Authentication Manager - Core authentication logic with dependency injection
 * 
 * Manages authentication flow, session persistence, and token lifecycle
 * using dependency injection for maximum testability.
 */

import { SessionValidator } from './session-validator.js';
import { 
    AuthError, 
    AuthNetworkError, 
    AuthTokenError, 
    AuthSessionError, 
    AuthStorageError,
    AuthTimeoutError,
    AuthErrorUtils 
} from './auth-errors.js';

export class AuthManager {
    /**
     * Create new AuthManager with dependency injection
     * @param {StorageInterface} storage - Storage implementation
     * @param {MessagingInterface} messaging - Messaging implementation  
     * @param {Object} serverAPI - Server API implementation
     * @param {Object} config - Configuration options
     */
    constructor(storage, messaging, serverAPI, config = {}) {
        // Validate dependencies
        if (!storage) throw new Error('Storage dependency is required');
        if (!messaging) throw new Error('Messaging dependency is required');
        if (!serverAPI) throw new Error('ServerAPI dependency is required');

        this.storage = storage;
        this.messaging = messaging;
        this.serverAPI = serverAPI;
        
        // Configuration with defaults
        this.config = {
            sessionStorageKey: 'lupin_auth_session',
            tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes
            maxRetryAttempts: 3,
            retryDelay: 1000,
            sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
            debug: false,
            ...config
        };

        // Internal state
        this.currentSession = null;
        this.isAuthenticated = false;
        this.authPromise = null; // Prevent concurrent auth attempts
        this.refreshPromise = null; // Prevent concurrent token refresh
        
        if (this.config.debug) {
            console.log('AuthManager initialized with config:', this.config);
        }
    }

    /**
     * Initialize authentication system
     * @returns {Promise<boolean>} - True if already authenticated
     */
    async initialize() {
        try {
            if (this.config.debug) console.log('AuthManager initializing...');
            
            // Try to restore session from storage
            await this._restoreSession();
            
            if (this.config.debug) {
                console.log('AuthManager initialized. Authenticated:', this.isAuthenticated);
            }
            
            return this.isAuthenticated;
        } catch (error) {
            if (this.config.debug) {
                console.error('AuthManager initialization failed:', error);
            }
            
            // Clear any corrupted session data
            await this._clearSession();
            return false;
        }
    }

    /**
     * Get current authentication status
     * @returns {Promise<Object>} - Authentication status details
     */
    async getAuthStatus() {
        if (!this.currentSession) {
            return {
                isAuthenticated: false,
                session: null,
                needsAuthentication: true
            };
        }

        // Check if session is expired
        if (SessionValidator.isExpired(this.currentSession)) {
            if (this.config.debug) console.log('Session expired, clearing...');
            await this._clearSession();
            return {
                isAuthenticated: false,
                session: null,
                needsAuthentication: true,
                reason: 'session_expired'
            };
        }

        // Check if tokens need refresh
        if (SessionValidator.expiresSoon(this.currentSession, this.config.tokenRefreshThreshold / (60 * 1000))) {
            if (this.config.debug) console.log('Session expires soon, needs refresh');
            return {
                isAuthenticated: true,
                session: SessionValidator.sanitizeForLogging(this.currentSession),
                needsRefresh: true
            };
        }

        return {
            isAuthenticated: true,
            session: SessionValidator.sanitizeForLogging(this.currentSession),
            needsAuthentication: false
        };
    }

    /**
     * Perform authentication flow
     * @param {Object} options - Authentication options
     * @returns {Promise<Object>} - Authentication result
     */
    async authenticate(options = {}) {
        // Prevent concurrent authentication attempts
        if (this.authPromise) {
            if (this.config.debug) console.log('Authentication already in progress, waiting...');
            return await this.authPromise;
        }

        this.authPromise = this._performAuthentication(options);
        
        try {
            const result = await this.authPromise;
            return result;
        } finally {
            this.authPromise = null;
        }
    }

    /**
     * Refresh authentication tokens
     * @returns {Promise<boolean>} - True if refresh successful
     */
    async refreshTokens() {
        if (!this.currentSession || !this.currentSession.tokens.refresh) {
            throw new AuthTokenError('No refresh token available');
        }

        // Prevent concurrent refresh attempts
        if (this.refreshPromise) {
            if (this.config.debug) console.log('Token refresh already in progress, waiting...');
            return await this.refreshPromise;
        }

        this.refreshPromise = this._performTokenRefresh();
        
        try {
            const result = await this.refreshPromise;
            return result;
        } finally {
            this.refreshPromise = null;
        }
    }

    /**
     * Get valid access token (refreshing if necessary)
     * @returns {Promise<string>} - Valid access token
     */
    async getAccessToken() {
        const status = await this.getAuthStatus();
        
        if (!status.isAuthenticated) {
            throw new AuthSessionError('Not authenticated');
        }

        // Refresh tokens if needed
        if (status.needsRefresh) {
            await this.refreshTokens();
        }

        return this.currentSession.tokens.access;
    }

    /**
     * Logout and clear session data
     * @returns {Promise<void>}
     */
    async logout() {
        if (this.config.debug) console.log('Logging out...');
        
        await this._clearSession();
        
        // Notify other components about logout
        try {
            await this.messaging.sendMessage({
                type: 'AUTH_STATUS_CHANGED',
                isAuthenticated: false,
                reason: 'logout'
            });
        } catch (error) {
            if (this.config.debug) {
                console.warn('Failed to send logout message:', error);
            }
        }
    }

    /**
     * Update session last used timestamp
     * @returns {Promise<void>}
     */
    async updateLastUsed() {
        if (this.currentSession) {
            this.currentSession = SessionValidator.updateLastUsed(this.currentSession);
            await this._saveSession();
        }
    }

    /**
     * Internal method to perform authentication
     * @private
     * @param {Object} options - Authentication options
     * @returns {Promise<Object>} - Authentication result
     */
    async _performAuthentication(options) {
        try {
            if (this.config.debug) console.log('Starting authentication flow...');
            
            // Step 1: Get session ID from server
            const sessionResponse = await this._retryOperation(
                () => this.serverAPI.getSessionId(),
                'get_session_id'
            );
            
            if (!sessionResponse.sessionId) {
                throw new AuthServerError('Server did not provide session ID');
            }

            // Step 2: Get authentication tokens
            const tokenResponse = await this._retryOperation(
                () => this.serverAPI.getAuthTokens(sessionResponse.sessionId),
                'get_auth_tokens'
            );

            // Step 3: Validate session with server
            const validationResponse = await this._retryOperation(
                () => this.serverAPI.validateSession(sessionResponse.sessionId),
                'validate_session'
            );

            // Step 4: Create and store session
            const session = SessionValidator.createSession(
                sessionResponse.sessionId,
                tokenResponse,
                validationResponse.user,
                this.config.sessionDuration
            );

            await this._setSession(session);

            if (this.config.debug) console.log('Authentication successful');

            // Notify other components
            await this.messaging.sendMessage({
                type: 'AUTH_STATUS_CHANGED',
                isAuthenticated: true,
                session: SessionValidator.sanitizeForLogging(session)
            });

            return {
                success: true,
                session: SessionValidator.sanitizeForLogging(session)
            };

        } catch (error) {
            if (this.config.debug) {
                console.error('Authentication failed:', error);
            }
            
            const authError = AuthErrorUtils.fromError(error, 'authentication');
            
            // Clear any partial session data
            await this._clearSession();
            
            throw authError;
        }
    }

    /**
     * Internal method to perform token refresh
     * @private
     * @returns {Promise<boolean>} - True if refresh successful
     */
    async _performTokenRefresh() {
        try {
            if (this.config.debug) console.log('Refreshing authentication tokens...');
            
            const refreshToken = this.currentSession.tokens.refresh;
            
            const tokenResponse = await this._retryOperation(
                () => this.serverAPI.refreshTokens(refreshToken),
                'refresh_tokens'
            );

            // Update session with new tokens
            this.currentSession.tokens = {
                ...this.currentSession.tokens,
                access: tokenResponse.access,
                type: tokenResponse.type || this.currentSession.tokens.type
            };

            // Update refresh token if provided
            if (tokenResponse.refresh) {
                this.currentSession.tokens.refresh = tokenResponse.refresh;
            }

            // Update timestamps
            this.currentSession.lastUsed = Date.now();
            if (tokenResponse.expiresIn) {
                this.currentSession.expiresAt = Date.now() + (tokenResponse.expiresIn * 1000);
            }

            // Validate updated session
            SessionValidator.validateSession(this.currentSession);
            
            // Save updated session
            await this._saveSession();

            if (this.config.debug) console.log('Token refresh successful');

            return true;

        } catch (error) {
            if (this.config.debug) {
                console.error('Token refresh failed:', error);
            }
            
            // If refresh fails, clear session and require re-authentication
            await this._clearSession();
            
            throw AuthErrorUtils.fromError(error, 'token_refresh');
        }
    }

    /**
     * Restore session from storage
     * @private
     * @returns {Promise<void>}
     */
    async _restoreSession() {
        try {
            const sessionData = await this.storage.get(this.config.sessionStorageKey);
            
            if (!sessionData) {
                if (this.config.debug) console.log('No stored session found');
                return;
            }

            // Validate stored session
            SessionValidator.validateSession(sessionData);
            
            // Check if session is expired
            if (SessionValidator.isExpired(sessionData)) {
                if (this.config.debug) console.log('Stored session is expired');
                await this._clearSession();
                return;
            }

            this.currentSession = sessionData;
            this.isAuthenticated = true;
            
            if (this.config.debug) {
                console.log('Session restored from storage');
            }

        } catch (error) {
            if (this.config.debug) {
                console.warn('Failed to restore session:', error);
            }
            
            // Clear corrupted session data
            await this._clearSession();
            throw new AuthStorageError('Failed to restore session from storage', 'restore');
        }
    }

    /**
     * Save session to storage
     * @private
     * @returns {Promise<void>}
     */
    async _saveSession() {
        try {
            await this.storage.set(this.config.sessionStorageKey, this.currentSession);
            
            if (this.config.debug) {
                console.log('Session saved to storage');
            }
        } catch (error) {
            if (this.config.debug) {
                console.error('Failed to save session:', error);
            }
            
            throw new AuthStorageError('Failed to save session to storage', 'save');
        }
    }

    /**
     * Set new session and update state
     * @private
     * @param {Object} session - Session to set
     * @returns {Promise<void>}
     */
    async _setSession(session) {
        this.currentSession = session;
        this.isAuthenticated = true;
        await this._saveSession();
    }

    /**
     * Clear session data from memory and storage
     * @private
     * @returns {Promise<void>}
     */
    async _clearSession() {
        this.currentSession = null;
        this.isAuthenticated = false;
        
        try {
            await this.storage.remove(this.config.sessionStorageKey);
        } catch (error) {
            if (this.config.debug) {
                console.warn('Failed to clear session from storage:', error);
            }
        }
    }

    /**
     * Retry an operation with exponential backoff
     * @private
     * @param {Function} operation - Operation to retry
     * @param {string} operationName - Name for logging
     * @returns {Promise<any>} - Operation result
     */
    async _retryOperation(operation, operationName) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.config.maxRetryAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (this.config.debug) {
                    console.warn(`${operationName} attempt ${attempt} failed:`, error);
                }
                
                // Don't retry non-retryable errors
                if (!AuthErrorUtils.isRetryable(error)) {
                    throw error;
                }
                
                // Don't retry on last attempt
                if (attempt === this.config.maxRetryAttempts) {
                    break;
                }
                
                // Wait before retrying with exponential backoff
                const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError;
    }
}

console.log('auth-manager.js loaded');