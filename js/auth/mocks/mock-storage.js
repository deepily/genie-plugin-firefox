/**
 * Mock Storage Implementation for Testing
 * 
 * Simulates browser storage behavior for unit testing
 * without requiring actual browser environment.
 */

import { StorageInterface } from '../storage-interface.js';

export class MockStorage extends StorageInterface {
    constructor() {
        super();
        this.data = new Map();
        this.throwErrors = false;
        this.delay = 0; // Simulate async delay in milliseconds
        this.quota = 5 * 1024 * 1024; // 5MB storage quota
        this.usedSpace = 0;
    }

    /**
     * Get a value from mock storage
     * @param {string} key - Storage key
     * @returns {Promise<any>} - Stored value or null
     */
    async get(key) {
        if (this.delay > 0) {
            await this._sleep(this.delay);
        }

        if (this.throwErrors) {
            throw new Error('Mock storage error in get()');
        }

        const value = this.data.get(key);
        return value !== undefined ? JSON.parse(JSON.stringify(value)) : null;
    }

    /**
     * Set a value in mock storage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @returns {Promise<void>}
     */
    async set(key, value) {
        if (this.delay > 0) {
            await this._sleep(this.delay);
        }

        if (this.throwErrors) {
            throw new Error('Mock storage error in set()');
        }

        // Simulate storage quota checks
        const serializedValue = JSON.stringify(value);
        const valueSize = new Blob([serializedValue]).size;
        
        if (this.usedSpace + valueSize > this.quota) {
            throw new Error('Storage quota exceeded');
        }

        // Remove old value size if updating
        if (this.data.has(key)) {
            const oldValue = JSON.stringify(this.data.get(key));
            const oldSize = new Blob([oldValue]).size;
            this.usedSpace -= oldSize;
        }

        this.data.set(key, JSON.parse(JSON.stringify(value)));
        this.usedSpace += valueSize;
    }

    /**
     * Remove a value from mock storage
     * @param {string} key - Storage key
     * @returns {Promise<void>}
     */
    async remove(key) {
        if (this.delay > 0) {
            await this._sleep(this.delay);
        }

        if (this.throwErrors) {
            throw new Error('Mock storage error in remove()');
        }

        if (this.data.has(key)) {
            const oldValue = JSON.stringify(this.data.get(key));
            const oldSize = new Blob([oldValue]).size;
            this.usedSpace -= oldSize;
            this.data.delete(key);
        }
    }

    /**
     * Clear all values from mock storage
     * @returns {Promise<void>}
     */
    async clear() {
        if (this.delay > 0) {
            await this._sleep(this.delay);
        }

        if (this.throwErrors) {
            throw new Error('Mock storage error in clear()');
        }

        this.data.clear();
        this.usedSpace = 0;
    }

    /**
     * Get all stored keys
     * @returns {string[]} - Array of all keys
     */
    getKeys() {
        return Array.from(this.data.keys());
    }

    /**
     * Get storage usage statistics
     * @returns {Object} - Usage statistics
     */
    getUsageStats() {
        return {
            usedSpace: this.usedSpace,
            quota: this.quota,
            itemCount: this.data.size,
            percentUsed: (this.usedSpace / this.quota) * 100
        };
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
     * Set storage quota for testing quota limits
     * @param {number} quotaBytes - Quota in bytes
     */
    setQuota(quotaBytes) {
        this.quota = quotaBytes;
    }

    /**
     * Reset mock storage to initial state
     */
    reset() {
        this.data.clear();
        this.throwErrors = false;
        this.delay = 0;
        this.usedSpace = 0;
        this.quota = 5 * 1024 * 1024; // Reset to 5MB
    }

    /**
     * Simulate browser restart by creating new instance with same data
     * @returns {MockStorage} - New instance with copied data
     */
    simulateRestart() {
        const newStorage = new MockStorage();
        // Copy data to simulate persistence across restart
        for (const [key, value] of this.data.entries()) {
            newStorage.data.set(key, JSON.parse(JSON.stringify(value)));
        }
        newStorage.usedSpace = this.usedSpace;
        return newStorage;
    }

    /**
     * Simulate storage corruption
     * @param {string} key - Key to corrupt (optional)
     */
    simulateCorruption(key = null) {
        if (key) {
            this.data.set(key, { corrupted: true, invalidJson: 'this is not valid json {{{' });
        } else {
            // Corrupt all data
            for (const [k] of this.data.entries()) {
                this.data.set(k, { corrupted: true, invalidJson: 'corrupted data' });
            }
        }
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

console.log('mock-storage.js loaded');