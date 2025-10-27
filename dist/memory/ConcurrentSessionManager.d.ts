/**
 * Concurrent session manager for handling multiple simultaneous user sessions
 */
import { IGlobalMemory } from './interfaces';
import { ClientData, ClientStage } from '../types/client';
export interface SessionLock {
    number: string;
    lockId: string;
    timestamp: Date;
    operation: string;
}
export declare class ConcurrentSessionManager {
    private sessionLocks;
    private globalMemory;
    private logger;
    private lockTimeout;
    private cleanupInterval;
    constructor(globalMemory: IGlobalMemory);
    /**
     * Initialize the concurrent session manager
     */
    initialize(): void;
    /**
     * Shutdown the concurrent session manager
     */
    shutdown(): void;
    /**
     * Acquire a lock for a phone number session
     */
    acquireLock(number: string, operation: string): Promise<string | null>;
    /**
     * Release a lock for a phone number session
     */
    releaseLock(number: string, lockId: string): boolean;
    /**
     * Execute an operation with session lock
     */
    withSessionLock<T>(number: string, operation: string, callback: () => Promise<T>): Promise<T | null>;
    /**
     * Thread-safe client data update
     */
    setClientDataSafe(number: string, field: string, value: any): Promise<boolean>;
    /**
     * Thread-safe stage update
     */
    setCurrentStageSafe(number: string, stage: string): Promise<boolean>;
    /**
     * Thread-safe stage marking as visited
     */
    markStageAsVisitedSafe(number: string, stage: string): Promise<boolean>;
    /**
     * Thread-safe stage error marking
     */
    markStageAsErrorSafe(number: string, stage: string): Promise<boolean>;
    /**
     * Thread-safe client addition
     */
    addClientSafe(number: string): Promise<boolean>;
    /**
     * Get session isolation info
     */
    getSessionInfo(number: string): {
        hasLock: boolean;
        lockInfo?: SessionLock | undefined;
        clientData?: ClientData | undefined;
        clientStage?: ClientStage | undefined;
    };
    /**
     * Get all active sessions
     */
    getAllActiveSessions(): string[];
    /**
     * Get all locked sessions
     */
    getAllLockedSessions(): SessionLock[];
    /**
     * Cleanup expired sessions
     */
    cleanupExpiredSessions(): Promise<void>;
    /**
     * Cleanup a specific session
     */
    cleanupSession(number: string): Promise<void>;
    /**
     * Cleanup expired locks
     */
    private cleanupExpiredLocks;
    /**
     * Generate unique lock ID
     */
    private generateLockId;
}
//# sourceMappingURL=ConcurrentSessionManager.d.ts.map