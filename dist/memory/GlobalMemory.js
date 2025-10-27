"use strict";
/**
 * GlobalMemory - Manages global state and agent flow
 * Implementation will be added in task 3.1, 3.2, 3.3, and 3.4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalMemory = void 0;
const constants_1 = require("../types/constants");
const SessionPersistence_1 = require("./SessionPersistence");
const TimeoutManager_1 = require("./TimeoutManager");
const ConcurrentSessionManager_1 = require("./ConcurrentSessionManager");
const logger_1 = require("../utils/logger");
class GlobalMemory {
    constructor(sessionConfig, timeoutConfig) {
        this.agentsFlow = [];
        this.clientesVisitantes = new Set();
        this.clientData = new Map();
        this.clientStages = new Map();
        this.lastMessageSent = new Map();
        this.logger = logger_1.Logger.getInstance();
        // Initialize session persistence
        const defaultSessionConfig = {
            enabled: true,
            storageType: 'file',
            filePath: './sessions',
            cleanupInterval: 5 * 60 * 1000, // 5 minutes
            sessionTimeout: 30 * 60 * 1000 // 30 minutes
        };
        this.sessionPersistence = new SessionPersistence_1.FileSessionPersistence(sessionConfig || defaultSessionConfig);
        // Initialize timeout manager
        const defaultTimeoutConfig = {
            userResponseTimeout: constants_1.TIMEOUTS.USER_RESPONSE,
            reminderTimeout: constants_1.TIMEOUTS.REMINDER_TIMEOUT,
            maxRetries: constants_1.TIMEOUTS.MAX_RETRIES
        };
        this.timeoutManager = new TimeoutManager_1.TimeoutManager(timeoutConfig || defaultTimeoutConfig, this);
        // Initialize concurrent session manager
        this.concurrentSessionManager = new ConcurrentSessionManager_1.ConcurrentSessionManager(this);
        // Initialize with default agent flow
        this.resetAgentsFlow();
    }
    // Flow management methods - Implementation in task 3.4
    getNextAgent() {
        if (this.agentsFlow.length > 0) {
            // Remove and return the first item from the list (FIFO)
            return this.agentsFlow.shift() || null;
        }
        return null; // Flow complete
    }
    resetAgentsFlow() {
        // Reset to default agent flow sequence
        this.agentsFlow = [...constants_1.DEFAULT_AGENTS_FLOW];
    }
    // Client management methods - Implementation in task 3.1
    addClient(number) {
        if (!number || number.trim() === '') {
            throw new Error('Phone number cannot be empty');
        }
        // Add to visitantes set
        this.clientesVisitantes.add(number);
        // Initialize client data if not exists
        if (!this.clientData.has(number)) {
            const clientData = {
                number,
                startTime: new Date(),
                lastActivity: new Date()
            };
            this.clientData.set(number, clientData);
        }
        // Initialize client stage if not exists
        if (!this.clientStages.has(number)) {
            const clientStage = {
                number,
                currentStage: 'patient.name', // Start with first agent
                visitedStages: new Set(),
                stageErrors: new Map(),
                lastActivity: new Date()
            };
            this.clientStages.set(number, clientStage);
        }
    }
    hasClient(number) {
        return this.clientesVisitantes.has(number);
    }
    // Client data methods - Implementation in task 3.1
    setClientData(number, field, value) {
        if (!number || number.trim() === '') {
            throw new Error('Phone number cannot be empty');
        }
        let clientData = this.clientData.get(number);
        if (!clientData) {
            // Create new client data if doesn't exist
            clientData = {
                number,
                startTime: new Date(),
                lastActivity: new Date()
            };
        }
        // Update the specific field
        switch (field) {
            case 'name':
                clientData.name = value;
                break;
            case 'cpf':
                clientData.cpf = value;
                break;
            case 'email':
                clientData.email = value;
                break;
            case 'birthDate':
                clientData.birthDate = value;
                break;
            case 'currentAgent':
                clientData.currentAgent = value;
                break;
            default:
                throw new Error(`Unknown field: ${field}`);
        }
        // Update last activity
        clientData.lastActivity = new Date();
        // Save back to map
        this.clientData.set(number, clientData);
    }
    getClientData(number) {
        const clientData = this.clientData.get(number);
        if (!clientData) {
            throw new Error(`Client data not found for phone number: ${number}`);
        }
        return { ...clientData }; // Return a copy to prevent external modifications
    }
    // Stage management methods - Implementation in task 3.2
    getCurrentStage(number) {
        const clientStage = this.clientStages.get(number);
        return clientStage ? clientStage.currentStage : null;
    }
    setCurrentStage(number, stage) {
        if (!number || number.trim() === '') {
            throw new Error('Phone number cannot be empty');
        }
        if (!stage || stage.trim() === '') {
            throw new Error('Stage cannot be empty');
        }
        let clientStage = this.clientStages.get(number);
        if (!clientStage) {
            // Create new client stage if doesn't exist
            clientStage = {
                number,
                currentStage: stage,
                visitedStages: new Set(),
                stageErrors: new Map(),
                lastActivity: new Date()
            };
        }
        else {
            // Update existing stage
            clientStage.currentStage = stage;
            clientStage.lastActivity = new Date();
        }
        this.clientStages.set(number, clientStage);
    }
    markStageAsVisited(number, stage) {
        if (!number || number.trim() === '') {
            throw new Error('Phone number cannot be empty');
        }
        if (!stage || stage.trim() === '') {
            throw new Error('Stage cannot be empty');
        }
        let clientStage = this.clientStages.get(number);
        if (!clientStage) {
            // Create new client stage if doesn't exist
            clientStage = {
                number,
                currentStage: stage,
                visitedStages: new Set([stage]),
                stageErrors: new Map(),
                lastActivity: new Date()
            };
        }
        else {
            // Mark stage as visited
            clientStage.visitedStages.add(stage);
            clientStage.lastActivity = new Date();
        }
        this.clientStages.set(number, clientStage);
    }
    markStageAsError(number, stage) {
        if (!number || number.trim() === '') {
            throw new Error('Phone number cannot be empty');
        }
        if (!stage || stage.trim() === '') {
            throw new Error('Stage cannot be empty');
        }
        let clientStage = this.clientStages.get(number);
        if (!clientStage) {
            // Create new client stage if doesn't exist
            clientStage = {
                number,
                currentStage: stage,
                visitedStages: new Set(),
                stageErrors: new Map([[stage, 1]]),
                lastActivity: new Date()
            };
        }
        else {
            // Increment error count for this stage
            const currentErrors = clientStage.stageErrors.get(stage) || 0;
            clientStage.stageErrors.set(stage, currentErrors + 1);
            clientStage.lastActivity = new Date();
        }
        this.clientStages.set(number, clientStage);
    }
    getStageErrorCount(number, stage) {
        const clientStage = this.clientStages.get(number);
        if (!clientStage) {
            return 0;
        }
        return clientStage.stageErrors.get(stage) || 0;
    }
    // Message control methods - Implementation in task 3.3
    canSendMessage(number) {
        if (!number || number.trim() === '') {
            return false;
        }
        const lastSent = this.lastMessageSent.get(number);
        if (!lastSent) {
            return true; // No previous message sent
        }
        const timeDiff = Date.now() - lastSent;
        const MIN_INTERVAL = 2000; // 2 seconds minimum between messages
        return timeDiff >= MIN_INTERVAL;
    }
    markMessageSent(number) {
        if (!number || number.trim() === '') {
            throw new Error('Phone number cannot be empty');
        }
        this.lastMessageSent.set(number, Date.now());
    }
    // Cleanup methods - Implementation in task 3.4
    clear() {
        // Clear all data structures
        this.agentsFlow = [];
        this.clientesVisitantes.clear();
        this.clientData.clear();
        this.clientStages.clear();
        this.lastMessageSent.clear();
        // Reset to default flow
        this.resetAgentsFlow();
    }
    // Session persistence methods - Implementation in task 8.1
    async initializeSessionPersistence() {
        await this.sessionPersistence.initialize();
        this.concurrentSessionManager.initialize();
        this.logger.info('Session persistence and concurrent session manager initialized');
    }
    async shutdownSessionPersistence() {
        this.concurrentSessionManager.shutdown();
        await this.sessionPersistence.shutdown();
        this.logger.info('Session persistence and concurrent session manager shutdown');
    }
    async saveSession(number) {
        try {
            const clientData = this.clientData.get(number);
            const clientStage = this.clientStages.get(number);
            if (!clientData || !clientStage) {
                this.logger.warn(`Cannot save session for ${number}: missing data`);
                return;
            }
            const sessionData = {
                number,
                clientData,
                clientStage,
                agentsFlow: [...this.agentsFlow],
                lastMessageSent: this.lastMessageSent.get(number),
                createdAt: clientData.startTime,
                updatedAt: new Date()
            };
            await this.sessionPersistence.saveSession(number, sessionData);
            this.logger.debug(`Session saved for phone: ${number}`);
        }
        catch (error) {
            this.logger.error(`Failed to save session for ${number}:`, error);
        }
    }
    async loadSession(number) {
        try {
            const sessionData = await this.sessionPersistence.loadSession(number);
            if (!sessionData) {
                return false;
            }
            // Restore session data to memory
            this.clientData.set(number, sessionData.clientData);
            this.clientStages.set(number, sessionData.clientStage);
            this.clientesVisitantes.add(number);
            if (sessionData.lastMessageSent) {
                this.lastMessageSent.set(number, sessionData.lastMessageSent);
            }
            // Restore agents flow for this specific session
            this.agentsFlow = [...sessionData.agentsFlow];
            this.logger.info(`Session restored for phone: ${number}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to load session for ${number}:`, error);
            return false;
        }
    }
    async deleteSession(number) {
        try {
            await this.sessionPersistence.deleteSession(number);
            this.logger.debug(`Session deleted for phone: ${number}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete session for ${number}:`, error);
        }
    }
    async restoreAllSessions() {
        const startTime = Date.now();
        try {
            const sessions = await this.sessionPersistence.getAllSessions();
            for (const session of sessions) {
                // Restore each session to memory
                this.clientData.set(session.number, session.clientData);
                this.clientStages.set(session.number, session.clientStage);
                this.clientesVisitantes.add(session.number);
                if (session.lastMessageSent) {
                    this.lastMessageSent.set(session.number, session.lastMessageSent);
                }
                // Log individual session restoration
                this.logger.sessionEvent('restored', session.number, {
                    currentStage: session.clientStage.currentStage,
                    visitedStages: session.clientStage.visitedStages.size,
                    hasClientData: !!session.clientData
                });
            }
            const duration = Date.now() - startTime;
            this.logger.performanceMetric('session_restoration_complete', duration, {
                sessionsRestored: sessions.length
            });
        }
        catch (error) {
            this.logger.systemError(error, { operation: 'restoreAllSessions' });
        }
    }
    // Auto-save session data when client data changes
    async setClientDataWithPersistence(number, field, value) {
        this.setClientData(number, field, value);
        await this.saveSession(number);
    }
    // Auto-save session data when stage changes
    async setCurrentStageWithPersistence(number, stage) {
        this.setCurrentStage(number, stage);
        await this.saveSession(number);
    }
    // Auto-save session data when stage is marked as visited
    async markStageAsVisitedWithPersistence(number, stage) {
        this.markStageAsVisited(number, stage);
        await this.saveSession(number);
    }
    // Timeout management methods - Implementation in task 8.2
    startUserResponseTimeout(number, stage, onTimeout, onReminderTimeout) {
        this.timeoutManager.startUserResponseTimeout(number, stage, onTimeout, onReminderTimeout);
    }
    clearUserResponseTimeout(number) {
        this.timeoutManager.clearTimeout(number);
    }
    hasActiveTimeout(number) {
        return this.timeoutManager.hasActiveTimeout(number);
    }
    getTimeoutInfo(number) {
        return this.timeoutManager.getTimeoutInfo(number);
    }
    // Shutdown timeout manager
    async shutdownTimeoutManager() {
        this.timeoutManager.clearAllTimeouts();
        this.logger.info('Timeout manager shutdown');
    }
    // Concurrent session management methods - Implementation in task 8.3
    async setClientDataSafe(number, field, value) {
        return await this.concurrentSessionManager.setClientDataSafe(number, field, value);
    }
    async setCurrentStageSafe(number, stage) {
        return await this.concurrentSessionManager.setCurrentStageSafe(number, stage);
    }
    async markStageAsVisitedSafe(number, stage) {
        return await this.concurrentSessionManager.markStageAsVisitedSafe(number, stage);
    }
    async markStageAsErrorSafe(number, stage) {
        return await this.concurrentSessionManager.markStageAsErrorSafe(number, stage);
    }
    async addClientSafe(number) {
        return await this.concurrentSessionManager.addClientSafe(number);
    }
    getSessionInfo(number) {
        return this.concurrentSessionManager.getSessionInfo(number);
    }
    getAllActiveSessions() {
        return this.concurrentSessionManager.getAllActiveSessions();
    }
    getAllLockedSessions() {
        return this.concurrentSessionManager.getAllLockedSessions();
    }
    async cleanupExpiredSessions() {
        const startTime = Date.now();
        try {
            await this.concurrentSessionManager.cleanupExpiredSessions();
            const duration = Date.now() - startTime;
            this.logger.sessionEvent('cleaned', 'system', { operation: 'bulk_cleanup', duration });
        }
        catch (error) {
            this.logger.systemError(error, { operation: 'cleanupExpiredSessions' });
            throw error;
        }
    }
    async cleanupSession(number) {
        try {
            await this.concurrentSessionManager.cleanupSession(number);
            this.logger.sessionEvent('cleaned', number, { operation: 'individual_cleanup' });
        }
        catch (error) {
            this.logger.systemError(error, { operation: 'cleanupSession' }, number);
            throw error;
        }
    }
    // Thread-safe wrapper methods for existing operations
    async withSessionLock(number, operation, callback) {
        return await this.concurrentSessionManager.withSessionLock(number, operation, callback);
    }
}
exports.GlobalMemory = GlobalMemory;
//# sourceMappingURL=GlobalMemory.js.map