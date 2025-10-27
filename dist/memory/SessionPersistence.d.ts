/**
 * Session persistence implementation for saving and restoring session state
 */
import { SessionData, SessionPersistenceConfig, SessionManager } from '../types/session';
export declare class FileSessionPersistence implements SessionManager {
    private config;
    private logger;
    private cleanupTimer?;
    private sessionsDir;
    constructor(config: SessionPersistenceConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    saveSession(number: string, sessionData: SessionData): Promise<void>;
    loadSession(number: string): Promise<SessionData | null>;
    deleteSession(number: string): Promise<void>;
    getAllSessions(): Promise<SessionData[]>;
    cleanupExpiredSessions(): Promise<void>;
    private getSessionFilePath;
    private serializeSessionData;
    private deserializeSessionData;
}
//# sourceMappingURL=SessionPersistence.d.ts.map