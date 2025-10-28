/**
 * ConcurrentSessionManager - Manages concurrent sessions and prevents conflicts
 */

import { IGlobalMemory } from './interfaces';
import { Logger } from '@src/utils/logger';

export interface SessionLock {
  number: string;
  operation: string;
  timestamp: number;
  timeout: number;
}

export class ConcurrentSessionManager {
  private activeLocks: Map<string, SessionLock> = new Map();
  private logger: Logger;

  constructor(private globalMemory: IGlobalMemory) {
    this.logger = Logger.getInstance();
  }

  /**
   * Acquire a session lock for a specific operation
   */
  async acquireLock(number: string, operation: string, timeoutMs: number = 30000): Promise<boolean> {
    const lockKey = `${number}:${operation}`;
    const now = Date.now();

    // Check if lock already exists and is still valid
    const existingLock = this.activeLocks.get(lockKey);
    if (existingLock && (now - existingLock.timestamp) < existingLock.timeout) {
      this.logger.warn(`Lock already exists for ${lockKey}`);
      return false;
    }

    // Create new lock
    const lock: SessionLock = {
      number,
      operation,
      timestamp: now,
      timeout: timeoutMs
    };

    this.activeLocks.set(lockKey, lock);
    this.logger.debug(`Lock acquired for ${lockKey}`);

    // Set automatic cleanup
    setTimeout(() => {
      this.releaseLock(number, operation);
    }, timeoutMs);

    return true;
  }

  /**
   * Release a session lock
   */
  releaseLock(number: string, operation: string): boolean {
    const lockKey = `${number}:${operation}`;
    const existed = this.activeLocks.delete(lockKey);
    
    if (existed) {
      this.logger.debug(`Lock released for ${lockKey}`);
    }
    
    return existed;
  }

  /**
   * Check if a lock exists for a session operation
   */
  hasLock(number: string, operation: string): boolean {
    const lockKey = `${number}:${operation}`;
    const lock = this.activeLocks.get(lockKey);
    
    if (!lock) return false;
    
    // Check if lock is still valid
    const now = Date.now();
    if ((now - lock.timestamp) >= lock.timeout) {
      this.activeLocks.delete(lockKey);
      return false;
    }
    
    return true;
  }

  /**
   * Execute operation with session lock
   */
  async withSessionLock<T>(
    number: string, 
    operation: string, 
    callback: () => Promise<T>,
    timeoutMs: number = 30000
  ): Promise<T | null> {
    const acquired = await this.acquireLock(number, operation, timeoutMs);
    
    if (!acquired) {
      this.logger.warn(`Could not acquire lock for ${number}:${operation}`);
      return null;
    }

    try {
      const result = await callback();
      return result;
    } finally {
      this.releaseLock(number, operation);
    }
  }

  /**
   * Get all active locks (for debugging)
   */
  getActiveLocks(): SessionLock[] {
    const now = Date.now();
    const validLocks: SessionLock[] = [];
    
    for (const [key, lock] of this.activeLocks.entries()) {
      if ((now - lock.timestamp) < lock.timeout) {
        validLocks.push(lock);
      } else {
        this.activeLocks.delete(key);
      }
    }
    
    return validLocks;
  }

  /**
   * Cleanup expired locks
   */
  cleanupExpiredLocks(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, lock] of this.activeLocks.entries()) {
      if ((now - lock.timestamp) >= lock.timeout) {
        this.activeLocks.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired locks`);
    }
  }

  /**
   * Get lock statistics
   */
  getLockStats(): { total: number; active: number } {
    const now = Date.now();
    let active = 0;
    
    for (const lock of this.activeLocks.values()) {
      if ((now - lock.timestamp) < lock.timeout) {
        active++;
      }
    }
    
    return {
      total: this.activeLocks.size,
      active
    };
  }
}
