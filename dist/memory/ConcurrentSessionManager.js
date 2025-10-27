"use strict";
/**
 * Concurrent session manager for handling multiple simultaneous user sessions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrentSessionManager = void 0;
const logger_1 = require("../utils/logger");
class ConcurrentSessionManager {
    constructor(globalMemory) {
        this.sessionLocks = new Map();
        this.lockTimeout = 5000; // 5 seconds
        this.cleanupInterval = null;
        this.globalMemory = globalMemory;
        this.logger = logger_1.Logger.getInstance();
    }
    /**
     * Initialize the concurrent session manager
     */
    initialize() {
        // Start cleanup timer for expired locks
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredLocks();
        }, 30000); // Check every 30 seconds
        this.logger.info('Concurrent session manager initialized');
    }
    /**
     * Shutdown the concurrent session manager
     */
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        // Clear all locks
        this.sessionLocks.clear();
        this.logger.info('Concurrent session manager shutdown');
    }
    /**
     * Acquire a lock for a phone number session
     */
    async acquireLock(number, operation) {
        const lockId = this.generateLockId();
        // Check if session is already locked
        const existingLock = this.sessionLocks.get(number);
        if (existingLock) {
            const lockAge = Date.now() - existingLock.timestamp.getTime();
            if (lockAge < this.lockTimeout) {
                // Lock is still valid, cannot acquire
                this.logger.debug(`Cannot acquire lock for ${number}, already locked by ${existingLock.lockId}`);
                return null;
            }
            else {
                // Lock has expired, remove it
                this.sessionLocks.delete(number);
                this.logger.warn(`Expired lock removed for ${number}`);
            }
        }
        // Acquire new lock
        const lock = {
            number,
            lockId,
            timestamp: new Date(),
            operation
        };
        this.sessionLocks.set(number, lock);
        this.logger.debug(`Lock acquired for ${number} with ID ${lockId} for operation: ${operation}`);
        return lockId;
    }
    /**
     * Release a lock for a phone number session
     */
    releaseLock(number, lockId) {
        const existingLock = this.sessionLocks.get(number);
        if (!existingLock) {
            this.logger.warn(`No lock found to release for ${number}`);
            return false;
        }
        if (existingLock.lockId !== lockId) {
            this.logger.warn(`Lock ID mismatch for ${number}. Expected: ${existingLock.lockId}, Got: ${lockId}`);
            return false;
        }
        this.sessionLocks.delete(number);
        this.logger.debug(`Lock released for ${number} with ID ${lockId}`);
        return true;
    }
    /**
     * Execute an operation with session lock
     */
    async withSessionLock(number, operation, callback) {
        const lockId = await this.acquireLock(number, operation);
        if (!lockId) {
            this.logger.warn(`Could not acquire lock for ${number} for operation: ${operation}`);
            return null;
        }
        try {
            const result = await callback();
            return result;
        }
        catch (error) {
            this.logger.error(`Error during locked operation for ${number}:`, error);
            throw error;
        }
        finally {
            this.releaseLock(number, lockId);
        }
    }
    /**
     * Thread-safe client data update
     */
    async setClientDataSafe(number, field, value) {
        return await this.withSessionLock(number, `setClientData:${field}`, async () => {
            this.globalMemory.setClientData(number, field, value);
            await this.globalMemory.saveSession(number);
            return true;
        }) !== null;
    }
    /**
     * Thread-safe stage update
     */
    async setCurrentStageSafe(number, stage) {
        return await this.withSessionLock(number, `setCurrentStage:${stage}`, async () => {
            this.globalMemory.setCurrentStage(number, stage);
            await this.globalMemory.saveSession(number);
            return true;
        }) !== null;
    }
    /**
     * Thread-safe stage marking as visited
     */
    async markStageAsVisitedSafe(number, stage) {
        return await this.withSessionLock(number, `markStageAsVisited:${stage}`, async () => {
            this.globalMemory.markStageAsVisited(number, stage);
            await this.globalMemory.saveSession(number);
            return true;
        }) !== null;
    }
    /**
     * Thread-safe stage error marking
     */
    async markStageAsErrorSafe(number, stage) {
        return await this.withSessionLock(number, `markStageAsError:${stage}`, async () => {
            this.globalMemory.markStageAsError(number, stage);
            await this.globalMemory.saveSession(number);
            return true;
        }) !== null;
    }
    /**
     * Thread-safe client addition
     */
    async addClientSafe(number) {
        return await this.withSessionLock(number, 'addClient', async () => {
            this.globalMemory.addClient(number);
            await this.globalMemory.saveSession(number);
            return true;
        }) !== null;
    }
    /**
     * Get session isolation info
     */
    getSessionInfo(number) {
        const lock = this.sessionLocks.get(number);
        try {
            const clientData = this.globalMemory.getClientData(number);
            const currentStage = this.globalMemory.getCurrentStage(number);
            const clientStage = currentStage ? {
                number,
                currentStage,
                visitedStages: new Set(),
                stageErrors: new Map(),
                lastActivity: new Date()
            } : undefined;
            return {
                hasLock: !!lock,
                lockInfo: lock || undefined,
                clientData: clientData || undefined,
                clientStage: clientStage || undefined
            };
        }
        catch (error) {
            return {
                hasLock: !!lock,
                lockInfo: lock || undefined,
                clientData: undefined,
                clientStage: undefined
            };
        }
    }
    /**
     * Get all active sessions
     */
    getAllActiveSessions() {
        return Array.from(this.globalMemory.clientesVisitantes);
    }
    /**
     * Get all locked sessions
     */
    getAllLockedSessions() {
        return Array.from(this.sessionLocks.values());
    }
    /**
     * Cleanup expired sessions
     */
    async cleanupExpiredSessions() {
        try {
            const activeSessions = this.getAllActiveSessions();
            const expiredSessions = [];
            const sessionTimeout = 30 * 60 * 1000; // 30 minutes
            for (const number of activeSessions) {
                try {
                    const clientData = this.globalMemory.getClientData(number);
                    const timeDiff = Date.now() - clientData.lastActivity.getTime();
                    if (timeDiff > sessionTimeout) {
                        expiredSessions.push(number);
                    }
                }
                catch (error) {
                    // Client data not found, consider it expired
                    expiredSessions.push(number);
                }
            }
            for (const number of expiredSessions) {
                await this.cleanupSession(number);
            }
            if (expiredSessions.length > 0) {
                this.logger.info(`Cleaned up ${expiredSessions.length} expired sessions`);
            }
        }
        catch (error) {
            this.logger.error('Error during session cleanup:', error);
        }
    }
    /**
     * Cleanup a specific session
     */
    async cleanupSession(number) {
        try {
            // Clear timeout
            this.globalMemory.clearUserResponseTimeout(number);
            // Remove from active clients
            this.globalMemory.clientesVisitantes.delete(number);
            // Remove client data
            this.globalMemory.clientData.delete(number);
            this.globalMemory.clientStages.delete(number);
            this.globalMemory.lastMessageSent.delete(number);
            // Delete persisted session
            await this.globalMemory.deleteSession(number);
            // Release any locks
            const lock = this.sessionLocks.get(number);
            if (lock) {
                this.sessionLocks.delete(number);
            }
            this.logger.info(`Session cleaned up for phone: ${number}`);
        }
        catch (error) {
            this.logger.error(`Error cleaning up session for ${number}:`, error);
        }
    }
    /**
     * Cleanup expired locks
     */
    cleanupExpiredLocks() {
        const now = Date.now();
        const expiredLocks = [];
        for (const [number, lock] of this.sessionLocks) {
            const lockAge = now - lock.timestamp.getTime();
            if (lockAge > this.lockTimeout) {
                expiredLocks.push(number);
            }
        }
        for (const number of expiredLocks) {
            this.sessionLocks.delete(number);
            this.logger.warn(`Expired lock removed for ${number}`);
        }
    }
    /**
     * Generate unique lock ID
     */
    generateLockId() {
        return `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.ConcurrentSessionManager = ConcurrentSessionManager;
//# sourceMappingURL=ConcurrentSessionManager.js.map