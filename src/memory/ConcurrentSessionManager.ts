/**
 * Concurrent session manager for handling multiple simultaneous user sessions
 */

import { Logger } from '../utils/logger';
import { IGlobalMemory } from './interfaces';
import { ClientData, ClientStage } from '../types/client';

export interface SessionLock {
  number: string;
  lockId: string;
  timestamp: Date;
  operation: string;
}

export class ConcurrentSessionManager {
  private sessionLocks: Map<string, SessionLock> = new Map();
  private globalMemory: IGlobalMemory;
  private logger: Logger;
  private lockTimeout: number = 5000; // 5 seconds
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(globalMemory: IGlobalMemory) {
    this.globalMemory = globalMemory;
    this.logger = Logger.getInstance();
  }

  /**
   * Initialize the concurrent session manager
   */
  initialize(): void {
    // Start cleanup timer for expired locks
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredLocks();
    }, 30000); // Check every 30 seconds

    this.logger.info('Concurrent session manager initialized');
  }

  /**
   * Shutdown the concurrent session manager
   */
  shutdown(): void {
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
  async acquireLock(number: string, operation: string): Promise<string | null> {
    const lockId = this.generateLockId();
    
    // Check if session is already locked
    const existingLock = this.sessionLocks.get(number);
    if (existingLock) {
      const lockAge = Date.now() - existingLock.timestamp.getTime();
      
      if (lockAge < this.lockTimeout) {
        // Lock is still valid, cannot acquire
        this.logger.debug(`Cannot acquire lock for ${number}, already locked by ${existingLock.lockId}`);
        return null;
      } else {
        // Lock has expired, remove it
        this.sessionLocks.delete(number);
        this.logger.warn(`Expired lock removed for ${number}`);
      }
    }

    // Acquire new lock
    const lock: SessionLock = {
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
  releaseLock(number: string, lockId: string): boolean {
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
  async withSessionLock<T>(
    number: string,
    operation: string,
    callback: () => Promise<T>
  ): Promise<T | null> {
    const lockId = await this.acquireLock(number, operation);
    
    if (!lockId) {
      this.logger.warn(`Could not acquire lock for ${number} for operation: ${operation}`);
      return null;
    }

    try {
      const result = await callback();
      return result;
    } catch (error) {
      this.logger.error(`Error during locked operation for ${number}:`, error);
      throw error;
    } finally {
      this.releaseLock(number, lockId);
    }
  }

  /**
   * Thread-safe client data update
   */
  async setClientDataSafe(number: string, field: string, value: any): Promise<boolean> {
    return await this.withSessionLock(number, `setClientData:${field}`, async () => {
      this.globalMemory.setClientData(number, field, value);
      await this.globalMemory.saveSession(number);
      return true;
    }) !== null;
  }

  /**
   * Thread-safe stage update
   */
  async setCurrentStageSafe(number: string, stage: string): Promise<boolean> {
    return await this.withSessionLock(number, `setCurrentStage:${stage}`, async () => {
      this.globalMemory.setCurrentStage(number, stage);
      await this.globalMemory.saveSession(number);
      return true;
    }) !== null;
  }

  /**
   * Thread-safe stage marking as visited
   */
  async markStageAsVisitedSafe(number: string, stage: string): Promise<boolean> {
    return await this.withSessionLock(number, `markStageAsVisited:${stage}`, async () => {
      this.globalMemory.markStageAsVisited(number, stage);
      await this.globalMemory.saveSession(number);
      return true;
    }) !== null;
  }

  /**
   * Thread-safe stage error marking
   */
  async markStageAsErrorSafe(number: string, stage: string): Promise<boolean> {
    return await this.withSessionLock(number, `markStageAsError:${stage}`, async () => {
      this.globalMemory.markStageAsError(number, stage);
      await this.globalMemory.saveSession(number);
      return true;
    }) !== null;
  }

  /**
   * Thread-safe client addition
   */
  async addClientSafe(number: string): Promise<boolean> {
    return await this.withSessionLock(number, 'addClient', async () => {
      this.globalMemory.addClient(number);
      await this.globalMemory.saveSession(number);
      return true;
    }) !== null;
  }

  /**
   * Get session isolation info
   */
  getSessionInfo(number: string): {
    hasLock: boolean;
    lockInfo?: SessionLock | undefined;
    clientData?: ClientData | undefined;
    clientStage?: ClientStage | undefined;
  } {
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
      } as ClientStage : undefined;

      return {
        hasLock: !!lock,
        lockInfo: lock || undefined,
        clientData: clientData || undefined,
        clientStage: clientStage || undefined
      };
    } catch (error) {
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
  getAllActiveSessions(): string[] {
    return Array.from(this.globalMemory.clientesVisitantes);
  }

  /**
   * Get all locked sessions
   */
  getAllLockedSessions(): SessionLock[] {
    return Array.from(this.sessionLocks.values());
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const activeSessions = this.getAllActiveSessions();
      const expiredSessions: string[] = [];
      const sessionTimeout = 30 * 60 * 1000; // 30 minutes

      for (const number of activeSessions) {
        try {
          const clientData = this.globalMemory.getClientData(number);
          const timeDiff = Date.now() - clientData.lastActivity.getTime();
          
          if (timeDiff > sessionTimeout) {
            expiredSessions.push(number);
          }
        } catch (error) {
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
    } catch (error) {
      this.logger.error('Error during session cleanup:', error);
    }
  }

  /**
   * Cleanup a specific session
   */
  async cleanupSession(number: string): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Error cleaning up session for ${number}:`, error);
    }
  }

  /**
   * Cleanup expired locks
   */
  private cleanupExpiredLocks(): void {
    const now = Date.now();
    const expiredLocks: string[] = [];

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
  private generateLockId(): string {
    return `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}