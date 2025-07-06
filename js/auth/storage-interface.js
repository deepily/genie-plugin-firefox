/**
 * Storage Interface - Abstract interface for authentication data storage
 * 
 * This interface defines the contract for storing authentication data
 * in different environments (browser storage, mock storage for testing, etc.)
 */

export class StorageInterface {
    /**
     * Get a value from storage
     * @param {string} key - Storage key
     * @returns {Promise<any>} - Stored value or null if not found
     */
    async get(key) {
        throw new Error('StorageInterface.get() must be implemented');
    }

    /**
     * Set a value in storage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @returns {Promise<void>}
     */
    async set(key, value) {
        throw new Error('StorageInterface.set() must be implemented');
    }

    /**
     * Remove a value from storage
     * @param {string} key - Storage key
     * @returns {Promise<void>}
     */
    async remove(key) {
        throw new Error('StorageInterface.remove() must be implemented');
    }

    /**
     * Clear all values from storage
     * @returns {Promise<void>}
     */
    async clear() {
        throw new Error('StorageInterface.clear() must be implemented');
    }

    /**
     * Check if a key exists in storage
     * @param {string} key - Storage key
     * @returns {Promise<boolean>}
     */
    async has(key) {
        const value = await this.get(key);
        return value !== null && value !== undefined;
    }
}

/**
 * Storage key constants for authentication data
 */
export const STORAGE_KEYS = {
    AUTH_SESSION: 'auth_session',
    USER_PREFERENCES: 'user_preferences',
    REFRESH_TOKEN: 'refresh_token',
    LAST_AUTH_TIME: 'last_auth_time'
};

console.log('storage-interface.js loaded');