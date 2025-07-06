/**
 * Messaging Interface - Abstract interface for inter-component communication
 * 
 * This interface defines the contract for communication between different
 * parts of the browser extension (background, popup, content scripts)
 */

export class MessagingInterface {
    /**
     * Add a message listener
     * @param {Function} listener - Function to handle incoming messages
     * @returns {void}
     */
    addListener(listener) {
        throw new Error('MessagingInterface.addListener() must be implemented');
    }

    /**
     * Remove a message listener
     * @param {Function} listener - Function to remove
     * @returns {void}
     */
    removeListener(listener) {
        throw new Error('MessagingInterface.removeListener() must be implemented');
    }

    /**
     * Send a message to other components
     * @param {any} message - Message to send
     * @param {Object} options - Sending options (target, etc.)
     * @returns {Promise<any>} - Response from the receiver
     */
    async sendMessage(message, options = {}) {
        throw new Error('MessagingInterface.sendMessage() must be implemented');
    }

    /**
     * Send a message and expect a response
     * @param {any} message - Message to send
     * @param {Object} options - Sending options
     * @returns {Promise<any>} - Response from the receiver
     */
    async sendMessageWithResponse(message, options = {}) {
        return this.sendMessage(message, { ...options, expectResponse: true });
    }
}

/**
 * Message type constants for authentication communication
 */
export const MESSAGE_TYPES = {
    GET_AUTH_STATUS: 'get_auth_status',
    GET_SESSION: 'get_session',
    AUTHENTICATE: 'authenticate',
    CLEAR_AUTH: 'clear_auth',
    MAKE_AUTHENTICATED_REQUEST: 'make_authenticated_request',
    AUTH_STATE_CHANGED: 'auth_state_changed'
};

/**
 * Authentication state constants
 */
export const AUTH_STATES = {
    UNAUTHENTICATED: 'unauthenticated',
    AUTHENTICATING: 'authenticating',
    AUTHENTICATED: 'authenticated',
    EXPIRED: 'expired',
    ERROR: 'error'
};

console.log('messaging-interface.js loaded');