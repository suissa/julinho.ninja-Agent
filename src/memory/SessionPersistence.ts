/**
 * Session persistence implementation for saving and restoring session state
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { SessionData, SessionPersistenceConfig, SerializableSessionData, SessionManager } from '../types/session';
import { ClientData, ClientStage, PatientBirthDate, PatientName, PatientPhone } from '../types/client';
import { Logger } from '../utils/logger';
import { TimeTimestampUnix, TimeDurationMS, PatientEmail } from '../types/shared';
import { PatientCpf } from '../types/shared';  
export class FileSessionPersistence implements SessionManager {
  private config: SessionPersistenceConfig;
  private logger: Logger;
  private cleanupTimer?: NodeJS.Timeout | undefined;
  private sessionsDir: string;
  private readonly sanitizePhone = (phone: string): string => phone.replace(/[^0-9]/g, '');
  constructor(config: SessionPersistenceConfig) {
    this.config = config;
    this.logger = Logger.getInstance();
    this.sessionsDir = config.filePath || './sessions';
  }

  async initialize(): Promise<void> {
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
        this.cleanupTimer = setInterval(
          () => this.cleanupExpiredSessions(),
          this.config.cleanupInterval
        );
        this.logger.info(`Session cleanup timer started with interval: ${this.config.cleanupInterval}ms`);
      }
    } catch (error) {
      this.logger.error('Failed to initialize session persistence:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
      this.logger.info('Session cleanup timer stopped');
    }
  }

  async saveSession(number: string, sessionData: SessionData): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const serializable = this.serializeSessionData(sessionData);
      const filePath = this.getSessionFilePath(number);
      
      await fs.writeFile(filePath, JSON.stringify(serializable, null, 2), 'utf8');
      
      this.logger.debug(`Session saved for phone: ${number}`);
    } catch (error) {
      this.logger.error(`Failed to save session for phone ${number}:`, error);
      throw error;
    }
  }

  async loadSession(number: string): Promise<SessionData | null> {
    if (!this.config.enabled) {
      return null;
    }

    try {
      const filePath = this.getSessionFilePath(number);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        // File doesn't exist
        return null;
      }

      const filetext = await fs.readFile(filePath, 'utf8');
      const serializable: SerializableSessionData = JSON.parse(filetext);
      
      const sessionData = this.deserializeSessionData(serializable);
      
      this.logger.debug(`Session loaded for phone: ${number}`);
      return sessionData;
    } catch (error) {
      this.logger.error(`Failed to load session for phone ${number}:`, error);
      return null;
    }
  }

  async deleteSession(number: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const filePath = this.getSessionFilePath(number);
      
      try {
        await fs.unlink(filePath);
        this.logger.debug(`Session deleted for phone: ${number}`);
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
        // File doesn't exist, which is fine
      }
    } catch (error) {
      this.logger.error(`Failed to delete session for phone ${number}:`, error);
      throw error;
    }
  }

  async getAllSessions(): Promise<SessionData[]> {
    if (!this.config.enabled) {
      return [];
    }

    try {
      const files = await fs.readdir(this.sessionsDir);
      const sessionFiles = files.filter(file => file.endsWith('.json'));
      
      const sessions: SessionData[] = [];
      
      for (const file of sessionFiles) {
        try {
          const filePath = path.join(this.sessionsDir, file);
          const filetext = await fs.readFile(filePath, 'utf8');
          const serializable: SerializableSessionData = JSON.parse(filetext);
          const sessionData = this.deserializeSessionData(serializable);
          sessions.push(sessionData);
        } catch (error) {
          this.logger.warn(`Failed to load session file ${file}:`, error);
          // Continue with other files
        }
      }
      
      return sessions;
    } catch (error) {
      this.logger.error('Failed to get all sessions:', error);
      return [];
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    if (!this.config.enabled || !this.config.sessionTimeout) {
      return;
    }

    try {
      const sessions = await this.getAllSessions();
      const now = new Date();
      const expiredSessions: string[] = [];

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
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions:', error);
    }
  }

  private getSessionFilePath(number: string): string {
    // Sanitize phone number for filename
    const sanitizedPhone = number.replace(/[^0-9]/g, '');
    return path.join(this.sessionsDir, `session_${sanitizedPhone}.json`);
  }

  private serializeSessionData(sessionData: SessionData): SerializableSessionData {
    return {
      number: sessionData.number,
      clientData: {
        number: PatientPhone.make(sessionData.clientData.number),
        name: sessionData.clientData.name,
        cpf: sessionData.clientData.cpf,
        email: sessionData.clientData.email,
        birthDate: sessionData.clientData.birthDate?.toString() || undefined,
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

  private deserializeSessionData(serializable: SerializableSessionData): SessionData {
    return {
      number: serializable.number,
      clientData: {
        number: PatientPhone.make(this.sanitizePhone(serializable.clientData.number)),
        name: serializable.clientData.name as any,
        cpf: serializable.clientData.cpf as any,
        email: serializable.clientData.email as any,
        birthDate: serializable.clientData.birthDate as any,
        currentAgent: serializable.clientData.currentAgent as string,
        startTime: new Date(TimeTimestampUnix.of(Number(serializable.clientData.startTime))),
        lastActivity: new Date(TimeTimestampUnix.of(Number(serializable.clientData.lastActivity))),
      },
      clientStage: {
        number: PatientPhone.make(this.sanitizePhone(serializable.clientStage.number)),
        currentStage: serializable.clientStage.currentStage,
        visitedStages: new Set(serializable.clientStage.visitedStages),
        stageErrors: new Map(serializable.clientStage.stageErrors),
        lastActivity: new Date(TimeTimestampUnix.of(Number(serializable.clientStage.lastActivity))),
      },
      agentsFlow: [...serializable.agentsFlow],
      lastMessageSent: TimeTimestampUnix.of(Number(serializable.lastMessageSent)) as TimeTimestampUnix,
      sessionTimeout: TimeDurationMS.of(Number(serializable.sessionTimeout)) as TimeDurationMS,
      createdAt: new Date(TimeTimestampUnix.of(Number(serializable.createdAt))),
      updatedAt: new Date(TimeTimestampUnix.of(Number(serializable.updatedAt)) as TimeTimestampUnix) as Date
    };
  }

  // Clear all session files
  async clearAllSessions(): Promise<void> {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      // List all session files
      const files = await fs.readdir(this.sessionsDir);
      const sessionFiles = files.filter((file: string) => file.startsWith('session_') && file.endsWith('.json'));

      // Delete all session files
      for (const file of sessionFiles) {
        const filePath = path.join(this.sessionsDir, file);
        try {
          await fs.unlink(filePath);
          this.logger.debug(`Deleted session file: ${file}`);
        } catch (error) {
          this.logger.warn(`Failed to delete session file ${file}:`, error);
        }
      }

      this.logger.info(`Cleared ${sessionFiles.length} session files`);
    } catch (error) {
      this.logger.error('Error clearing session files:', error);
      throw error;
    }
  }
}
