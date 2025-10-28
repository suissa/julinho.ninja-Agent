/**
 * GlobalMemory - Manages global state and agent flow
 * Implementation will be added in task 3.1, 3.2, 3.3, and 3.4
 */
import { IGlobalMemory } from './interfaces';
import { ClientData, ClientStage } from '@types/client';
import { SessionPersistenceConfig } from '@types/session';
import { TimeoutConfig } from './TimeoutManager';
export declare class GlobalMemory implements IGlobalMemory {
    agentsFlow: string[];
    clientesVisitantes: Set<string>;
    clientData: Map<string, ClientData>;
    clientStages: Map<string, ClientStage>;
    lastMessageSent: Map<string, number>;
    private userFlows;
    getUserFlow(number: string): string[] | null;
    private sessionPersistence;
    private timeoutManager;
    private concurrentSessionManager;
    private logger;
    constructor(sessionConfig?: SessionPersistenceConfig, timeoutConfig?: TimeoutConfig);
    getNextAgent(number?: string): string | null;
    /**
     * Get next agent based on current stage (for scheduling flow)
     */
    getNextAgentByStage(currentStage: string): string | null;
    /**
     * Get next agent for a specific user based on their dynamic flow
     * @param number - User's phone number
     * @param currentStage - Current stage in the flow
     * @returns Next agent routing key or null if flow is complete
     */
    getNextAgentForUser(number: string, currentStage: string): string | null;
    /**
     * Set up dynamic scheduling flow for a user based on their choice
     * @param number - User's phone number
     * @param flowType - Type of flow (date-first, service-first, dentist-first)
     */
    setDynamicSchedulingFlow(number: string, flowType: 'date-first' | 'service-first' | 'dentist-first'): void;
    /**
     * Check if user is in scheduling phase
     * @param number - User's phone number
     * @returns true if user is in scheduling phase, false otherwise
     */
    isUserInSchedulingPhase(number: string): boolean;
    /**
     * Get scheduling data for a user
     * @param number - User's phone number
     * @returns Scheduling data object or null if not found
     */
    getSchedulingData(number: string): any;
    resetAgentsFlow(): void;
    /**
     * Reset to patient data collection flow only
     */
    resetToPatientDataFlow(): void;
    /**
     * Switch to scheduling flow for a specific user
     * @param number - User's phone number
     * @param flowType - Type of scheduling flow
     */
    switchToSchedulingFlow(number: string, flowType: 'date-first' | 'service-first' | 'dentist-first'): void;
    addClient(number: string): void;
    hasClient(number: string): boolean;
    setClientData(number: string, field: string, value: any): void;
    getClientData(number: string): ClientData;
    getCurrentStage(number: string): string | null;
    setCurrentStage(number: string, stage: string): void;
    markStageAsVisited(number: string, stage: string): void;
    markStageAsError(number: string, stage: string): void;
    getStageErrorCount(number: string, stage: string): number;
    canSendMessageForAgent(number: string, agentRoutingKey: string): boolean;
    canSendMessage(number: string): boolean;
    markMessageSentForAgent(number: string, agentRoutingKey: string): void;
    markMessageSent(number: string): void;
    resetMessageSentFlag(number: string): void;
    clear(): void;
    initializeSessionPersistence(): Promise<void>;
    shutdownSessionPersistence(): Promise<void>;
    saveSession(number: string): Promise<void>;
    loadSession(number: string): Promise<boolean>;
    deleteSession(number: string): Promise<void>;
    restoreAllSessions(): Promise<void>;
    setClientDataWithPersistence(number: string, field: string, value: any): Promise<void>;
    setCurrentStageWithPersistence(number: string, stage: string): Promise<void>;
    markStageAsVisitedWithPersistence(number: string, stage: string): Promise<void>;
    startUserResponseTimeout(number: string, stage: string, onTimeout: (number: string, stage: string) => Promise<void>, onReminderTimeout: (number: string, stage: string) => Promise<void>): void;
    clearUserResponseTimeout(number: string): void;
    hasActiveTimeout(number: string): boolean;
    getTimeoutInfo(number: string): import("./TimeoutManager").SessionTimeout | null;
    shutdownTimeoutManager(): Promise<void>;
    setClientDataSafe(number: string, field: string, value: any): Promise<boolean>;
    setCurrentStageSafe(number: string, stage: string): Promise<boolean>;
    markStageAsVisitedSafe(number: string, stage: string): Promise<boolean>;
    markStageAsErrorSafe(number: string, stage: string): Promise<boolean>;
    addClientSafe(number: string): Promise<boolean>;
    getSessionInfo(number: string): any;
    getAllActiveSessions(): string[];
    getAllLockedSessions(): any;
    cleanupExpiredSessions(): Promise<void>;
    cleanupSession(number: string): Promise<void>;
    withSessionLock<T>(number: string, operation: string, callback: () => Promise<T>): Promise<T | null>;
}
//# sourceMappingURL=GlobalMemory.d.ts.map