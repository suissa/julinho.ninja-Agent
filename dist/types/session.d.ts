/**
 * Session management types for persistence and recovery
 */
import { ClientData, ClientStage } from './client';
export interface SessionData {
    number: string;
    clientData: ClientData;
    clientStage: ClientStage;
    agentsFlow: string[];
    lastMessageSent?: number | undefined;
    sessionTimeout?: number | undefined;
    createdAt: Date;
    updatedAt: Date;
}
export interface SessionPersistenceConfig {
    enabled: boolean;
    storageType: 'file' | 'database';
    filePath?: string;
    cleanupInterval?: number;
    sessionTimeout?: number;
}
export interface SerializableSessionData {
    number: string;
    clientData: {
        number: string;
        name?: string | undefined;
        cpf?: string | undefined;
        email?: string | undefined;
        birthDate?: string | undefined;
        currentAgent?: string | undefined;
        startTime: string;
        lastActivity: string;
    };
    clientStage: {
        number: string;
        currentStage: string;
        visitedStages: string[];
        stageErrors: Array<[string, number]>;
        lastActivity: string;
    };
    agentsFlow: string[];
    lastMessageSent?: number | undefined;
    sessionTimeout?: number | undefined;
    createdAt: string;
    updatedAt: string;
}
export interface SessionManager {
    saveSession(number: string, sessionData: SessionData): Promise<void>;
    loadSession(number: string): Promise<SessionData | null>;
    deleteSession(number: string): Promise<void>;
    getAllSessions(): Promise<SessionData[]>;
    cleanupExpiredSessions(): Promise<void>;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=session.d.ts.map