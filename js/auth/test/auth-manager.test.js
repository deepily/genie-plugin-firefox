/**
 * AuthManager Test Suite
 * 
 * Comprehensive tests for AuthManager class with 80%+ coverage
 * using dependency injection and mock implementations.
 */

import { AuthManager } from '../auth-manager.js';
import { MockStorage } from '../mocks/mock-storage.js';
import { MockMessaging } from '../mocks/mock-messaging.js';
import { MockServerAPI } from '../mocks/mock-server-api.js';
import { SessionValidator } from '../session-validator.js';
import {
    AuthError,
    AuthNetworkError,
    AuthTokenError,
    AuthSessionError,
    AuthStorageError,
    AuthTimeoutError
} from '../auth-errors.js';

describe('AuthManager', () => {
    let authManager;
    let mockStorage;
    let mockMessaging;
    let mockServerAPI;
    let testConfig;

    beforeEach(() => {
        // Create fresh mocks for each test
        mockStorage = new MockStorage();
        mockMessaging = new MockMessaging();
        mockServerAPI = new MockServerAPI();
        
        testConfig = {
            sessionStorageKey: 'test_auth_session',
            tokenRefreshThreshold: 5 * 60 * 1000,
            maxRetryAttempts: 2,
            retryDelay: 100,
            sessionDuration: 24 * 60 * 60 * 1000,
            debug: false
        };

        authManager = new AuthManager(
            mockStorage,
            mockMessaging,
            mockServerAPI,
            testConfig
        );
    });

    describe('Constructor', () => {
        test('should create AuthManager with all dependencies', () => {
            expect(authManager).toBeInstanceOf(AuthManager);
            expect(authManager.storage).toBe(mockStorage);
            expect(authManager.messaging).toBe(mockMessaging);
            expect(authManager.serverAPI).toBe(mockServerAPI);
            expect(authManager.isAuthenticated).toBe(false);
            expect(authManager.currentSession).toBe(null);
        });

        test('should throw error if storage dependency missing', () => {
            expect(() => {
                new AuthManager(null, mockMessaging, mockServerAPI);
            }).toThrow('Storage dependency is required');
        });

        test('should throw error if messaging dependency missing', () => {
            expect(() => {
                new AuthManager(mockStorage, null, mockServerAPI);
            }).toThrow('Messaging dependency is required');
        });

        test('should throw error if serverAPI dependency missing', () => {
            expect(() => {
                new AuthManager(mockStorage, mockMessaging, null);
            }).toThrow('ServerAPI dependency is required');
        });

        test('should merge custom config with defaults', () => {
            const customConfig = { debug: true, maxRetryAttempts: 5 };
            const manager = new AuthManager(
                mockStorage,
                mockMessaging,
                mockServerAPI,
                customConfig
            );
            
            expect(manager.config.debug).toBe(true);
            expect(manager.config.maxRetryAttempts).toBe(5);
            expect(manager.config.sessionStorageKey).toBe('lupin_auth_session'); // default
        });
    });

    describe('initialize()', () => {
        test('should initialize without existing session', async () => {
            const result = await authManager.initialize();
            
            expect(result).toBe(false);
            expect(authManager.isAuthenticated).toBe(false);
            expect(authManager.currentSession).toBe(null);
        });

        test('should restore valid session from storage', async () => {
            const validSession = createValidTestSession();
            await mockStorage.set('test_auth_session', validSession);
            
            const result = await authManager.initialize();
            
            expect(result).toBe(true);
            expect(authManager.isAuthenticated).toBe(true);
            expect(authManager.currentSession).toEqual(validSession);
        });

        test('should clear expired session from storage', async () => {
            const expiredSession = createExpiredTestSession();
            await mockStorage.set('test_auth_session', expiredSession);
            
            const result = await authManager.initialize();
            
            expect(result).toBe(false);
            expect(authManager.isAuthenticated).toBe(false);
            expect(await mockStorage.get('test_auth_session')).toBe(null);
        });

        test('should handle corrupted session data', async () => {
            await mockStorage.set('test_auth_session', { invalid: 'session' });
            
            const result = await authManager.initialize();
            
            expect(result).toBe(false);
            expect(authManager.isAuthenticated).toBe(false);
            expect(await mockStorage.get('test_auth_session')).toBe(null);
        });

        test('should handle storage errors gracefully', async () => {
            mockStorage.setThrowErrors(true);
            
            const result = await authManager.initialize();
            
            expect(result).toBe(false);
            expect(authManager.isAuthenticated).toBe(false);
        });
    });

    describe('getAuthStatus()', () => {
        test('should return not authenticated when no session', async () => {
            const status = await authManager.getAuthStatus();
            
            expect(status).toEqual({
                isAuthenticated: false,
                session: null,
                needsAuthentication: true
            });
        });

        test('should return authenticated status for valid session', async () => {
            authManager.currentSession = createValidTestSession();
            authManager.isAuthenticated = true;
            
            const status = await authManager.getAuthStatus();
            
            expect(status.isAuthenticated).toBe(true);
            expect(status.session).toBeDefined();
            expect(status.needsAuthentication).toBe(false);
        });

        test('should detect expired session', async () => {
            authManager.currentSession = createExpiredTestSession();
            authManager.isAuthenticated = true;
            
            const status = await authManager.getAuthStatus();
            
            expect(status.isAuthenticated).toBe(false);
            expect(status.needsAuthentication).toBe(true);
            expect(status.reason).toBe('session_expired');
            expect(authManager.isAuthenticated).toBe(false);
        });

        test('should detect session that expires soon', async () => {
            const soonExpiringSession = createSoonExpiringTestSession();
            authManager.currentSession = soonExpiringSession;
            authManager.isAuthenticated = true;
            
            const status = await authManager.getAuthStatus();
            
            expect(status.isAuthenticated).toBe(true);
            expect(status.needsRefresh).toBe(true);
        });
    });

    describe('authenticate()', () => {
        test('should perform successful authentication flow', async () => {
            mockServerAPI.setScenario('success');
            
            const result = await authManager.authenticate();
            
            expect(result.success).toBe(true);
            expect(result.session).toBeDefined();
            expect(authManager.isAuthenticated).toBe(true);
            expect(authManager.currentSession).toBeDefined();
            
            // Verify session was saved to storage
            const storedSession = await mockStorage.get('test_auth_session');
            expect(storedSession).toBeDefined();
            
            // Verify messaging notification
            const messages = mockMessaging.getMessagesByType('AUTH_STATUS_CHANGED');
            expect(messages).toHaveLength(1);
            expect(messages[0].isAuthenticated).toBe(true);
        });

        test('should handle server errors during authentication', async () => {
            mockServerAPI.setScenario('server_error');
            
            await expect(authManager.authenticate()).rejects.toThrow();
            expect(authManager.isAuthenticated).toBe(false);
            expect(authManager.currentSession).toBe(null);
        });

        test('should handle network errors during authentication', async () => {
            mockServerAPI.setScenario('network_error');
            
            await expect(authManager.authenticate()).rejects.toThrow();
            expect(authManager.isAuthenticated).toBe(false);
        });

        test('should prevent concurrent authentication attempts', async () => {
            mockServerAPI.setScenario('success');
            mockServerAPI.setDelay(200); // Add delay to test concurrency
            
            const promise1 = authManager.authenticate();
            const promise2 = authManager.authenticate();
            
            const [result1, result2] = await Promise.all([promise1, promise2]);
            
            expect(result1).toEqual(result2);
            expect(mockServerAPI.getCallCount('/api/get-session-id')).toBe(1);
        });

        test('should retry failed operations', async () => {
            // Set up to fail first attempt, succeed on second
            let callCount = 0;
            const originalRequest = mockServerAPI.request.bind(mockServerAPI);
            mockServerAPI.request = async (endpoint, options) => {
                if (endpoint === '/api/get-session-id' && ++callCount === 1) {
                    throw new Error('Network error');
                }
                return originalRequest(endpoint, options);
            };
            
            const result = await authManager.authenticate();
            
            expect(result.success).toBe(true);
            expect(callCount).toBe(2);
        });
    });

    describe('refreshTokens()', () => {
        beforeEach(async () => {
            // Set up authenticated state
            authManager.currentSession = createValidTestSession();
            authManager.isAuthenticated = true;
        });

        test('should successfully refresh tokens', async () => {
            mockServerAPI.setScenario('success');
            
            const result = await authManager.refreshTokens();
            
            expect(result).toBe(true);
            expect(authManager.currentSession.tokens.access).toBe('mock-new-access-token-def456');
        });

        test('should throw error when no refresh token available', async () => {
            authManager.currentSession.tokens.refresh = null;
            
            await expect(authManager.refreshTokens()).rejects.toThrow(AuthTokenError);
        });

        test('should throw error when not authenticated', async () => {
            authManager.currentSession = null;
            authManager.isAuthenticated = false;
            
            await expect(authManager.refreshTokens()).rejects.toThrow(AuthTokenError);
        });

        test('should clear session on refresh failure', async () => {
            mockServerAPI.setErrorResponse('POST', '/api/auth/refresh', 401, 'Invalid refresh token');
            
            await expect(authManager.refreshTokens()).rejects.toThrow();
            expect(authManager.isAuthenticated).toBe(false);
            expect(authManager.currentSession).toBe(null);
        });

        test('should prevent concurrent refresh attempts', async () => {
            mockServerAPI.setScenario('success');
            mockServerAPI.setDelay(200);
            
            const promise1 = authManager.refreshTokens();
            const promise2 = authManager.refreshTokens();
            
            const [result1, result2] = await Promise.all([promise1, promise2]);
            
            expect(result1).toBe(result2);
            expect(mockServerAPI.getCallCount('/api/auth/refresh')).toBe(1);
        });
    });

    describe('getAccessToken()', () => {
        test('should return access token for valid session', async () => {
            authManager.currentSession = createValidTestSession();
            authManager.isAuthenticated = true;
            
            const token = await authManager.getAccessToken();
            
            expect(token).toBe('mock-access-token-abc123');
        });

        test('should throw error when not authenticated', async () => {
            await expect(authManager.getAccessToken()).rejects.toThrow(AuthSessionError);
        });

        test('should refresh tokens if session expires soon', async () => {
            authManager.currentSession = createSoonExpiringTestSession();
            authManager.isAuthenticated = true;
            mockServerAPI.setScenario('success');
            
            const token = await authManager.getAccessToken();
            
            expect(token).toBeDefined();
            expect(mockServerAPI.getCallCount('/api/auth/refresh')).toBe(1);
        });
    });

    describe('logout()', () => {
        beforeEach(async () => {
            authManager.currentSession = createValidTestSession();
            authManager.isAuthenticated = true;
            await mockStorage.set('test_auth_session', authManager.currentSession);
        });

        test('should clear session and notify', async () => {
            await authManager.logout();
            
            expect(authManager.isAuthenticated).toBe(false);
            expect(authManager.currentSession).toBe(null);
            expect(await mockStorage.get('test_auth_session')).toBe(null);
            
            const messages = mockMessaging.getMessagesByType('AUTH_STATUS_CHANGED');
            expect(messages).toHaveLength(1);
            expect(messages[0].isAuthenticated).toBe(false);
            expect(messages[0].reason).toBe('logout');
        });

        test('should handle messaging errors gracefully', async () => {
            mockMessaging.setThrowErrors(true);
            
            // Should not throw despite messaging error
            await expect(authManager.logout()).resolves.toBeUndefined();
            
            expect(authManager.isAuthenticated).toBe(false);
        });
    });

    describe('updateLastUsed()', () => {
        test('should update last used timestamp', async () => {
            const originalTime = Date.now() - 1000;
            authManager.currentSession = createValidTestSession();
            authManager.currentSession.lastUsed = originalTime;
            
            await authManager.updateLastUsed();
            
            expect(authManager.currentSession.lastUsed).toBeGreaterThan(originalTime);
        });

        test('should handle no current session', async () => {
            await expect(authManager.updateLastUsed()).resolves.toBeUndefined();
        });
    });

    describe('Error Handling', () => {
        test('should handle storage errors during session save', async () => {
            mockStorage.setThrowErrors(true);
            mockServerAPI.setScenario('success');
            
            await expect(authManager.authenticate()).rejects.toThrow(AuthStorageError);
        });

        test('should handle invalid server responses', async () => {
            mockServerAPI.setResponse('GET', '/api/get-session-id', {});
            
            await expect(authManager.authenticate()).rejects.toThrow();
        });
    });

    describe('Configuration', () => {
        test('should use custom session storage key', async () => {
            const customConfig = { sessionStorageKey: 'custom_key' };
            const manager = new AuthManager(
                mockStorage,
                mockMessaging,
                mockServerAPI,
                customConfig
            );
            
            const validSession = createValidTestSession();
            await mockStorage.set('custom_key', validSession);
            
            await manager.initialize();
            
            expect(manager.isAuthenticated).toBe(true);
        });

        test('should respect debug configuration', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            const debugManager = new AuthManager(
                mockStorage,
                mockMessaging,
                mockServerAPI,
                { debug: true }
            );
            
            expect(consoleSpy).toHaveBeenCalledWith(
                'AuthManager initialized with config:',
                expect.any(Object)
            );
            
            consoleSpy.mockRestore();
        });
    });
});

// Helper functions for creating test data
function createValidTestSession() {
    const now = Date.now();
    return {
        sessionId: 'test-session-123',
        tokens: {
            access: 'mock-access-token-abc123',
            refresh: 'mock-refresh-token-xyz789',
            type: 'Bearer'
        },
        user: {
            id: 'test-user-123',
            name: 'Test User',
            permissions: ['read', 'write']
        },
        timestamp: now,
        expiresAt: now + (24 * 60 * 60 * 1000), // 24 hours from now
        lastUsed: now
    };
}

function createExpiredTestSession() {
    const now = Date.now();
    return {
        sessionId: 'expired-session-123',
        tokens: {
            access: 'expired-access-token',
            refresh: 'expired-refresh-token',
            type: 'Bearer'
        },
        user: {
            id: 'test-user-123',
            name: 'Test User',
            permissions: ['read']
        },
        timestamp: now - (25 * 60 * 60 * 1000), // 25 hours ago
        expiresAt: now - (60 * 1000), // 1 minute ago (expired)
        lastUsed: now - (2 * 60 * 60 * 1000) // 2 hours ago
    };
}

function createSoonExpiringTestSession() {
    const now = Date.now();
    return {
        sessionId: 'soon-expiring-session-123',
        tokens: {
            access: 'soon-expiring-access-token',
            refresh: 'soon-expiring-refresh-token',
            type: 'Bearer'
        },
        user: {
            id: 'test-user-123',
            name: 'Test User',
            permissions: ['read']
        },
        timestamp: now - (23 * 60 * 60 * 1000), // 23 hours ago
        expiresAt: now + (2 * 60 * 1000), // 2 minutes from now (expires soon)
        lastUsed: now
    };
}

console.log('auth-manager.test.js loaded');