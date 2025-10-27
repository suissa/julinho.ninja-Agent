/**
 * GlobalMemory - Manages global state and agent flow
 * Implementation will be added in task 3.1, 3.2, 3.3, and 3.4
 */
import { IGlobalMemory } from './interfaces';
import { ClientData, ClientStage } from '../types/client';
import { SessionPersistenceConfig } from '../types/session';
import { TimeoutConfig } from './TimeoutManager';
export declare class GlobalMemory implements IGlobalMemory {
    agentsFlow: string[];
    clientesVisitantes: Set<string>;
    clientData: Map<string, ClientData>;
    clientStages: Map<string, ClientStage>;
    lastMessageSent: Map<string, number>;
    private sessionPersistence;
    private timeoutManager;
    private concurrentSessionManager;
    private logger;
    constructor(sessionConfig?: SessionPersistenceConfig, timeoutConfig?: TimeoutConfig);
    getNextAgent(): string | null;
    resetAgentsFlow(): void;
    addClient(number: string): void;
    hasClient(number: string): boolean;
    setClientData(number: string, field: string, value: any): void;
    getClientData(number: string): ClientData;
    getCurrentStage(number: string): string | null;
    setCurrentStage(number: string, stage: string): void;
    markStageAsVisited(number: string, stage: string): void;
    markStageAsError(number: string, stage: string): void;
    getStageErrorCount(number: string, stage: string): number;
    canSendMessage(number: string): boolean;
    markMessageSent(number: string): void;
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
    getSessionInfo(number: string): {
        hasLock: boolean;
        lockInfo?: import("./ConcurrentSessionManager").SessionLock | undefined;
        clientData?: ClientData | undefined;
        clientStage?: ClientStage | undefined;
    };
    getAllActiveSessions(): string[];
    getAllLockedSessions(): import("./ConcurrentSessionManager").SessionLock[];
    cleanupExpiredSessions(): Promise<void>;
    cleanupSession(number: string): Promise<void>;
    withSessionLock<T>(number: string, operation: string, callback: () => Promise<T>): Promise<T | null>;
}
//# sourceMappingURL=GlobalMemory.d.ts.map