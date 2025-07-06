/**
 * Session Validator - Handles session validation and schema enforcement
 * 
 * Validates session data structure, token formats, expiration times,
 * and ensures data integrity for authentication sessions.
 */

import { AuthTokenError, AuthSessionError, AuthConfigError } from './auth-errors.js';

/**
 * Session data schema definition
 */
export const SESSION_SCHEMA = {
    sessionId: 'string',
    tokens: {
        access: 'string',
        refresh: 'string',
        type: 'string'
    },
    user: {
        id: 'string',
        name: 'string',
        permissions: 'array'
    },
    timestamp: 'number',
    expiresAt: 'number',
    lastUsed: 'number'
};

export class SessionValidator {
    /**
     * Validate a complete session object
     * @param {Object} session - Session object to validate
     * @returns {boolean} - True if session is valid
     * @throws {AuthSessionError} - If session structure is invalid
     */
    static validateSession(session) {
        if (!session || typeof session !== 'object') {
            throw new AuthSessionError('Session must be a valid object');
        }

        // Validate required fields
        if (!session.sessionId || typeof session.sessionId !== 'string') {
            throw new AuthSessionError('Session must have a valid sessionId');
        }

        if (!session.tokens || typeof session.tokens !== 'object') {
            throw new AuthSessionError('Session must have a valid tokens object');
        }

        if (!session.timestamp || typeof session.timestamp !== 'number') {
            throw new AuthSessionError('Session must have a valid timestamp');
        }

        if (!session.expiresAt || typeof session.expiresAt !== 'number') {
            throw new AuthSessionError('Session must have a valid expiresAt timestamp');
        }

        // Validate tokens
        this.validateTokens(session.tokens);

        // Validate user data if present
        if (session.user) {
            this.validateUser(session.user);
        }

        // Validate timestamps
        this.validateTimestamps(session);

        return true;
    }

    /**
     * Validate token structure
     * @param {Object} tokens - Tokens object to validate
     * @throws {AuthTokenError} - If tokens are invalid
     */
    static validateTokens(tokens) {
        if (!tokens || typeof tokens !== 'object') {
            throw new AuthTokenError('Tokens must be a valid object');
        }

        if (!tokens.access || typeof tokens.access !== 'string') {
            throw new AuthTokenError('Access token must be a valid string', 'access');
        }

        if (tokens.refresh && typeof tokens.refresh !== 'string') {
            throw new AuthTokenError('Refresh token must be a valid string', 'refresh');
        }

        if (!tokens.type || typeof tokens.type !== 'string') {
            throw new AuthTokenError('Token type must be specified', 'type');
        }

        // Validate token format (basic checks)
        if (tokens.access.length < 10) {
            throw new AuthTokenError('Access token appears to be too short', 'access');
        }

        if (tokens.refresh && tokens.refresh.length < 10) {
            throw new AuthTokenError('Refresh token appears to be too short', 'refresh');
        }
    }

    /**
     * Validate user data structure
     * @param {Object} user - User object to validate
     * @throws {AuthSessionError} - If user data is invalid
     */
    static validateUser(user) {
        if (!user || typeof user !== 'object') {
            throw new AuthSessionError('User data must be a valid object');
        }

        if (!user.id || typeof user.id !== 'string') {
            throw new AuthSessionError('User must have a valid id');
        }

        if (user.permissions && !Array.isArray(user.permissions)) {
            throw new AuthSessionError('User permissions must be an array');
        }
    }

    /**
     * Validate timestamp consistency
     * @param {Object} session - Session to validate timestamps for
     * @throws {AuthSessionError} - If timestamps are inconsistent
     */
    static validateTimestamps(session) {
        const now = Date.now();

        // Check that timestamps are reasonable
        if (session.timestamp > now) {
            throw new AuthSessionError('Session timestamp cannot be in the future');
        }

        if (session.expiresAt <= session.timestamp) {
            throw new AuthSessionError('Session expiration must be after creation time');
        }

        // Check for reasonable session duration (max 30 days)
        const maxDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        if (session.expiresAt - session.timestamp > maxDuration) {
            throw new AuthSessionError('Session duration appears unreasonably long');
        }

        // Validate lastUsed if present
        if (session.lastUsed && session.lastUsed > now) {
            throw new AuthSessionError('Last used timestamp cannot be in the future');
        }
    }

    /**
     * Check if a session is expired
     * @param {Object} session - Session to check
     * @returns {boolean} - True if session is expired
     */
    static isExpired(session) {
        if (!session || !session.expiresAt) {
            return true;
        }

        return Date.now() >= session.expiresAt;
    }

    /**
     * Check if a session will expire soon
     * @param {Object} session - Session to check
     * @param {number} warningMinutes - Minutes before expiration to warn (default: 30)
     * @returns {boolean} - True if session expires soon
     */
    static expiresSoon(session, warningMinutes = 30) {
        if (!session || !session.expiresAt) {
            return true;
        }

        const warningTime = warningMinutes * 60 * 1000; // Convert to milliseconds
        return Date.now() >= (session.expiresAt - warningTime);
    }

    /**
     * Get remaining session time in milliseconds
     * @param {Object} session - Session to check
     * @returns {number} - Milliseconds until expiration (0 if expired)
     */
    static getRemainingTime(session) {
        if (!session || !session.expiresAt) {
            return 0;
        }

        const remaining = session.expiresAt - Date.now();
        return Math.max(0, remaining);
    }

    /**
     * Create a new session object with validated structure
     * @param {string} sessionId - Session identifier
     * @param {Object} tokens - Authentication tokens
     * @param {Object} user - User information (optional)
     * @param {number} durationMs - Session duration in milliseconds (default: 24 hours)
     * @returns {Object} - Validated session object
     */
    static createSession(sessionId, tokens, user = null, durationMs = 24 * 60 * 60 * 1000) {
        const now = Date.now();
        
        const session = {
            sessionId,
            tokens,
            user,
            timestamp: now,
            expiresAt: now + durationMs,
            lastUsed: now
        };

        // Validate the created session
        this.validateSession(session);
        
        return session;
    }

    /**
     * Update session last used timestamp
     * @param {Object} session - Session to update
     * @returns {Object} - Updated session object
     */
    static updateLastUsed(session) {
        if (!session) {
            throw new AuthSessionError('Cannot update null session');
        }

        const updatedSession = {
            ...session,
            lastUsed: Date.now()
        };

        this.validateSession(updatedSession);
        return updatedSession;
    }

    /**
     * Sanitize session data for logging (remove sensitive information)
     * @param {Object} session - Session to sanitize
     * @returns {Object} - Sanitized session object
     */
    static sanitizeForLogging(session) {
        if (!session) {
            return null;
        }

        return {
            sessionId: session.sessionId,
            userId: session.user?.id,
            timestamp: session.timestamp,
            expiresAt: session.expiresAt,
            lastUsed: session.lastUsed,
            isExpired: this.isExpired(session),
            remainingTime: this.getRemainingTime(session)
        };
    }
}

console.log('session-validator.js loaded');