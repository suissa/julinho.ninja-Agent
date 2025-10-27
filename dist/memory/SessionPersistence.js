"use strict";
/**
 * Session persistence implementation for saving and restoring session state
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSessionPersistence = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
class FileSessionPersistence {
    constructor(config) {
        this.config = config;
        this.logger = logger_1.Logger.getInstance();
        this.sessionsDir = config.filePath || './sessions';
    }
    async initialize() {
        if (!this.config.enabled) {
            this.logger.info('Session persistence is disabled');
            return;
        }
        try {
            // Create sessions directory if it doesn't exist
            await fs.mkdir(this.sessionsDir, { recursive: true });
            this.logger.info(`Session persistence initialized with directory: ${this.sessionsDir}`);
            // Start cleanup timer if configured
            if (this.config.cleanupInterval && this.config.cleanupInterval > 0) {
                this.cleanupTimer = setInterval(() => this.cleanupExpiredSessions(), this.config.cleanupInterval);
                this.logger.info(`Session cleanup timer started with interval: ${this.config.cleanupInterval}ms`);
            }
        }
        catch (error) {
            this.logger.error('Failed to initialize session persistence:', error);
            throw error;
        }
    }
    async shutdown() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
            this.logger.info('Session cleanup timer stopped');
        }
    }
    async saveSession(number, sessionData) {
        if (!this.config.enabled) {
            return;
        }
        try {
            const serializable = this.serializeSessionData(sessionData);
            const filePath = this.getSessionFilePath(number);
            await fs.writeFile(filePath, JSON.stringify(serializable, null, 2), 'utf8');
            this.logger.debug(`Session saved for phone: ${number}`);
        }
        catch (error) {
            this.logger.error(`Failed to save session for phone ${number}:`, error);
            throw error;
        }
    }
    async loadSession(number) {
        if (!this.config.enabled) {
            return null;
        }
        try {
            const filePath = this.getSessionFilePath(number);
            // Check if file exists
            try {
                await fs.access(filePath);
            }
            catch {
                // File doesn't exist
                return null;
            }
            const filetext = await fs.readFile(filePath, 'utf8');
            const serializable = JSON.parse(filetext);
            const sessionData = this.deserializeSessionData(serializable);
            this.logger.debug(`Session loaded for phone: ${number}`);
            return sessionData;
        }
        catch (error) {
            this.logger.error(`Failed to load session for phone ${number}:`, error);
            return null;
        }
    }
    async deleteSession(number) {
        if (!this.config.enabled) {
            return;
        }
        try {
            const filePath = this.getSessionFilePath(number);
            try {
                await fs.unlink(filePath);
                this.logger.debug(`Session deleted for phone: ${number}`);
            }
            catch (error) {
                if (error.code !== 'ENOENT') {
                    throw error;
                }
                // File doesn't exist, which is fine
            }
        }
        catch (error) {
            this.logger.error(`Failed to delete session for phone ${number}:`, error);
            throw error;
        }
    }
    async getAllSessions() {
        if (!this.config.enabled) {
            return [];
        }
        try {
            const files = await fs.readdir(this.sessionsDir);
            const sessionFiles = files.filter(file => file.endsWith('.json'));
            const sessions = [];
            for (const file of sessionFiles) {
                try {
                    const filePath = path.join(this.sessionsDir, file);
                    const filetext = await fs.readFile(filePath, 'utf8');
                    const serializable = JSON.parse(filetext);
                    const sessionData = this.deserializeSessionData(serializable);
                    sessions.push(sessionData);
                }
                catch (error) {
                    this.logger.warn(`Failed to load session file ${file}:`, error);
                    // Continue with other files
                }
            }
            return sessions;
        }
        catch (error) {
            this.logger.error('Failed to get all sessions:', error);
            return [];
        }
    }
    async cleanupExpiredSessions() {
        if (!this.config.enabled || !this.config.sessionTimeout) {
            return;
        }
        try {
            const sessions = await this.getAllSessions();
            const now = new Date();
            const expiredSessions = [];
            for (const session of sessions) {
                const lastActivity = new Date(session.clientStage.lastActivity);
                const timeDiff = now.getTime() - lastActivity.getTime();
                if (timeDiff > this.config.sessionTimeout) {
                    expiredSessions.push(session.number);
                }
            }
            for (const number of expiredSessions) {
                await this.deleteSession(number);
                this.logger.info(`Expired session cleaned up for phone: ${number}`);
            }
            if (expiredSessions.length > 0) {
                this.logger.info(`Cleaned up ${expiredSessions.length} expired sessions`);
            }
        }
        catch (error) {
            this.logger.error('Failed to cleanup expired sessions:', error);
        }
    }
    getSessionFilePath(number) {
        // Sanitize phone number for filename
        const sanitizedPhone = number.replace(/[^0-9]/g, '');
        return path.join(this.sessionsDir, `session_${sanitizedPhone}.json`);
    }
    serializeSessionData(sessionData) {
        return {
            number: sessionData.number,
            clientData: {
                number: sessionData.clientData.number,
                name: sessionData.clientData.name,
                cpf: sessionData.clientData.cpf,
                email: sessionData.clientData.email,
                birthDate: sessionData.clientData.birthDate,
                currentAgent: sessionData.clientData.currentAgent,
                startTime: sessionData.clientData.startTime.toISOString(),
                lastActivity: sessionData.clientData.lastActivity.toISOString()
            },
            clientStage: {
                number: sessionData.clientStage.number,
                currentStage: sessionData.clientStage.currentStage,
                visitedStages: Array.from(sessionData.clientStage.visitedStages),
                stageErrors: Array.from(sessionData.clientStage.stageErrors.entries()),
                lastActivity: sessionData.clientStage.lastActivity.toISOString()
            },
            agentsFlow: [...sessionData.agentsFlow],
            lastMessageSent: sessionData.lastMessageSent,
            sessionTimeout: sessionData.sessionTimeout,
            createdAt: sessionData.createdAt.toISOString(),
            updatedAt: sessionData.updatedAt.toISOString()
        };
    }
    deserializeSessionData(serializable) {
        return {
            number: serializable.number,
            clientData: {
                number: serializable.clientData.number,
                name: serializable.clientData.name,
                cpf: serializable.clientData.cpf,
                email: serializable.clientData.email,
                birthDate: serializable.clientData.birthDate,
                currentAgent: serializable.clientData.currentAgent,
                startTime: new Date(serializable.clientData.startTime),
                lastActivity: new Date(serializable.clientData.lastActivity)
            },
            clientStage: {
                number: serializable.clientStage.number,
                currentStage: serializable.clientStage.currentStage,
                visitedStages: new Set(serializable.clientStage.visitedStages),
                stageErrors: new Map(serializable.clientStage.stageErrors),
                lastActivity: new Date(serializable.clientStage.lastActivity)
            },
            agentsFlow: [...serializable.agentsFlow],
            lastMessageSent: serializable.lastMessageSent,
            sessionTimeout: serializable.sessionTimeout,
            createdAt: new Date(serializable.createdAt),
            updatedAt: new Date(serializable.updatedAt)
        };
    }
}
exports.FileSessionPersistence = FileSessionPersistence;
//# sourceMappingURL=SessionPersistence.js.map