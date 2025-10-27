/**
 * Timeout manager for handling user response timeouts and session management
 */
import { IGlobalMemory } from './interfaces';
export interface TimeoutConfig {
    userResponseTimeout: number;
    reminderTimeout: number;
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
export declare class TimeoutManager {
    private activeTimeouts;
    private config;
    private logger;
    private globalMemory;
    constructor(config: TimeoutConfig, globalMemory: IGlobalMemory);
    /**
     * Start timeout for user response
     */
    startUserResponseTimeout(number: string, stage: string, onTimeout: (number: string, stage: string) => Promise<void>, onReminderTimeout: (number: string, stage: string) => Promise<void>): void;
    /**
     * Clear timeout for a phone number
     */
    clearTimeout(number: string): void;
    /**
     * Handle user response timeout
     */
    private handleUserResponseTimeout;
    /**
     * Handle final timeout - end session gracefully
     */
    private handleFinalTimeout;
    /**
     * Get active timeout info for a phone number
     */
    getTimeoutInfo(number: string): SessionTimeout | null;
    /**
     * Get all active timeouts
     */
    getAllActiveTimeouts(): SessionTimeout[];
    /**
     * Clear all timeouts (for shutdown)
     */
    clearAllTimeouts(): void;
    /**
     * Check if a phone number has an active timeout
     */
    hasActiveTimeout(number: string): boolean;
}
//# sourceMappingURL=TimeoutManager.d.ts.map