/**
 * Mock Messaging Implementation for Testing
 * 
 * Simulates browser extension messaging system for unit testing
 * without requiring actual browser environment.
 */

import { MessagingInterface, MESSAGE_TYPES } from '../messaging-interface.js';

export class MockMessaging extends MessagingInterface {
    constructor() {
        super();
        this.listeners = new Set();
        this.messageQueue = [];
        this.responseHandlers = new Map();
        this.throwErrors = false;
        this.delay = 0;
        this.messageId = 0;
    }

    /**
     * Add a message listener
     * @param {Function} listener - Function to handle incoming messages
     */
    addListener(listener) {
        if (typeof listener !== 'function') {
            throw new Error('Listener must be a function');
        }
        this.listeners.add(listener);
    }

    /**
     * Remove a message listener
     * @param {Function} listener - Function to remove
     */
    removeListener(listener) {
        this.listeners.delete(listener);
    }

    /**
     * Send a message to other components
     * @param {any} message - Message to send
     * @param {Object} options - Sending options
     * @returns {Promise<any>} - Response from the receiver
     */
    async sendMessage(message, options = {}) {
        if (this.delay > 0) {
            await this._sleep(this.delay);
        }

        if (this.throwErrors) {
            throw new Error('Mock messaging error in sendMessage()');
        }

        const messageWithId = {
            ...message,
            _messageId: ++this.messageId,
            _timestamp: Date.now(),
            _options: options
        };

        this.messageQueue.push(messageWithId);

        // Simulate message delivery to listeners
        const responses = [];
        for (const listener of this.listeners) {
            try {
                const response = await listener(messageWithId, options);
                if (response !== undefined) {
                    responses.push(response);
                }
            } catch (error) {
                console.warn('Mock messaging listener error:', error);
            }
        }

        // Return first response or undefined
        return responses.length > 0 ? responses[0] : undefined;
    }

    /**
     * Simulate receiving a message from another component
     * @param {any} message - Message to deliver
     * @param {Object} options - Message options
     * @returns {Promise<any>} - Response from listeners
     */
    async simulateMessage(message, options = {}) {
        const messageWithId = {
            ...message,
            _messageId: ++this.messageId,
            _timestamp: Date.now(),
            _options: options,
            _simulated: true
        };

        this.messageQueue.push(messageWithId);

        // Deliver to all listeners
        const responses = [];
        for (const listener of this.listeners) {
            try {
                const response = await listener(messageWithId, options);
                if (response !== undefined) {
                    responses.push(response);
                }
            } catch (error) {
                console.warn('Mock messaging listener error:', error);
                responses.push({ error: error.message });
            }
        }

        return responses;
    }

    /**
     * Get all messages that have been sent
     * @returns {Array} - Array of all messages
     */
    getMessageHistory() {
        return [...this.messageQueue];
    }

    /**
     * Get messages of a specific type
     * @param {string} type - Message type to filter by
     * @returns {Array} - Array of matching messages
     */
    getMessagesByType(type) {
        return this.messageQueue.filter(msg => msg.type === type);
    }

    /**
     * Clear message history
     */
    clearHistory() {
        this.messageQueue = [];
    }

    /**
     * Get listener count
     * @returns {number} - Number of registered listeners
     */
    getListenerCount() {
        return this.listeners.size;
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
     * Reset mock messaging to initial state
     */
    reset() {
        this.listeners.clear();
        this.messageQueue = [];
        this.responseHandlers.clear();
        this.throwErrors = false;
        this.delay = 0;
        this.messageId = 0;
    }

    /**
     * Helper method to create mock authentication messages
     * @param {string} action - Action to perform
     * @param {Object} data - Additional data
     * @returns {Object} - Formatted message
     */
    createAuthMessage(action, data = {}) {
        return {
            type: MESSAGE_TYPES.GET_AUTH_STATUS,
            action,
            data,
            timestamp: Date.now()
        };
    }

    /**
     * Simulate authentication responses for testing
     * @param {string} action - Action to respond to
     * @param {any} response - Response to send
     */
    setMockResponse(action, response) {
        this.addListener((message) => {
            if (message.action === action) {
                return response;
            }
        });
    }

    /**
     * Simulate network delays and failures
     * @param {number} failureRate - Percentage of messages that should fail (0-100)
     */
    setFailureRate(failureRate) {
        this.addListener((message) => {
            if (Math.random() * 100 < failureRate) {
                throw new Error('Simulated network failure');
            }
        });
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

console.log('mock-messaging.js loaded');