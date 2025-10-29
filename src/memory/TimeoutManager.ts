/**
 * Timeout manager for handling user response timeouts and session management
 */

import { Logger } from '../utils/logger';
import { IGlobalMemory } from './interfaces';

export interface TimeoutConfig {
  userResponseTimeout: number; // milliseconds
  reminderTimeout: number; // milliseconds
  maxRetries: number;
}

export interface SessionTimeout {
  number: string;
  stage: string;
  startTime: Date;
  reminderSent: boolean;
  retryCount: number;
  timeoutId: NodeJS.Timeout;
  reminderTimeoutId?: NodeJS.Timeout;
}

export class TimeoutManager {
  private activeTimeouts: Map<string, SessionTimeout> = new Map();
  private config: TimeoutConfig;
  private logger: Logger;
  private globalMemory: IGlobalMemory;

  constructor(config: TimeoutConfig, globalMemory: IGlobalMemory) {
    this.config = config;
    this.globalMemory = globalMemory;
    this.logger = Logger.getInstance();
  }

  /**
   * Start timeout for user response
   */
  startUserResponseTimeout(
    number: string, 
    stage: string, 
    onTimeout: (number: string, stage: string) => Promise<void>,
    onReminderTimeout: (number: string, stage: string) => Promise<void>
  ): void {
    // Clear any existing timeout for this phone number
    this.clearTimeout(number);

    const timeoutId = setTimeout(async () => {
      await this.handleUserResponseTimeout(number, stage, onTimeout, onReminderTimeout);
    }, this.config.userResponseTimeout);

    const sessionTimeout: SessionTimeout = {
      number,
      stage,
      startTime: new Date(),
      reminderSent: false,
      retryCount: 0,
      timeoutId
    };

    this.activeTimeouts.set(number, sessionTimeout);
    
    this.logger.debug(`User response timeout started for ${number} at stage ${stage}`);
  }

  /**
   * Clear timeout for a phone number
   */
  clearTimeout(number: string): void {
    const sessionTimeout = this.activeTimeouts.get(number);
    
    if (sessionTimeout) {
      clearTimeout(sessionTimeout.timeoutId);
      
      if (sessionTimeout.reminderTimeoutId) {
        clearTimeout(sessionTimeout.reminderTimeoutId);
      }
      
      this.activeTimeouts.delete(number);
      this.logger.debug(`Timeout cleared for ${number}`);
    }
  }

  /**
   * Handle user response timeout
   */
  private async handleUserResponseTimeout(
    number: string,
    stage: string,
    onTimeout: (number: string, stage: string) => Promise<void>,
    onReminderTimeout: (number: string, stage: string) => Promise<void>
  ): Promise<void> {
    const sessionTimeout = this.activeTimeouts.get(number);
    
    if (!sessionTimeout) {
      return; // Timeout was already cleared
    }

    try {
      if (!sessionTimeout.reminderSent) {
        // First timeout - send reminder
        sessionTimeout.reminderSent = true;
        sessionTimeout.retryCount++;
        
        this.logger.info(`User response timeout for ${number} at stage ${stage}, sending reminder`);
        
        // Send reminder message
        await onReminderTimeout(number, stage);
        
        // Set extended timeout for final response
        sessionTimeout.reminderTimeoutId = setTimeout(async () => {
          await this.handleFinalTimeout(number, stage, onTimeout);
        }, this.config.reminderTimeout);
        
      } else {
        // Final timeout - end session gracefully
        await this.handleFinalTimeout(number, stage, onTimeout);
      }
    } catch (error) {
      this.logger.error(`Error handling timeout for ${number}:`, error);
      await this.handleFinalTimeout(number, stage, onTimeout);
    }
  }

  /**
   * Handle final timeout - end session gracefully
   */
  private async handleFinalTimeout(
    number: string,
    stage: string,
    onTimeout: (number: string, stage: string) => Promise<void>
  ): Promise<void> {
    const sessionTimeout = this.activeTimeouts.get(number);
    
    if (!sessionTimeout) {
      return;
    }

    try {
      this.logger.info(`Final timeout for ${number} at stage ${stage}, ending session gracefully`);
      
      // Clear the timeout
      this.clearTimeout(number);
      
      // Call the timeout handler
      await onTimeout(number, stage);
      
    } catch (error) {
      this.logger.error(`Error handling final timeout for ${number}:`, error);
    }
  }

  /**
   * Get active timeout info for a phone number
   */
  getTimeoutInfo(number: string): SessionTimeout | null {
    return this.activeTimeouts.get(number) || null;
  }

  /**
   * Get all active timeouts
   */
  getAllActiveTimeouts(): SessionTimeout[] {
    return Array.from(this.activeTimeouts.values());
  }

  /**
   * Clear all timeouts (for shutdown)
   */
  clearAllTimeouts(): void {
    for (const [number] of Array.from(this.activeTimeouts.entries())) {
      this.clearTimeout(number);
    }
    this.logger.info('All timeouts cleared');
  }

  /**
   * Check if a phone number has an active timeout
   */
  hasActiveTimeout(number: string): boolean {
    return this.activeTimeouts.has(number);
  }
}
