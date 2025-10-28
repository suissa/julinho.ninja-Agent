/**
 * GlobalMemory - Manages global state and agent flow
 * Implementation will be added in task 3.1, 3.2, 3.3, and 3.4
 */

import { IGlobalMemory } from './interfaces';
import { ClientData, ClientStage } from '../types/client';
import { SessionData, SessionPersistenceConfig } from '../types/session';
import { DEFAULT_AGENTS_FLOW, COMPLETE_FLOW, SCHEDULING_FLOWS, TIMEOUTS } from '../types/constants';
import { FileSessionPersistence } from './SessionPersistence';
import { TimeoutManager, TimeoutConfig } from './TimeoutManager';
import { ConcurrentSessionManager } from './ConcurrentSessionManager';
import { Logger } from '../utils/logger';

export class GlobalMemory implements IGlobalMemory {
  public agentsFlow: string[] = [];
  public clientesVisitantes: Set<string> = new Set();
  public clientData: Map<string, ClientData> = new Map();
  public clientStages: Map<string, ClientStage> = new Map();
  public lastMessageSent: Map<string, number> = new Map();

  private sessionPersistence: FileSessionPersistence;
  private timeoutManager: TimeoutManager;
  private concurrentSessionManager: ConcurrentSessionManager;
  private logger: Logger;

  constructor(sessionConfig?: SessionPersistenceConfig, timeoutConfig?: TimeoutConfig) {
    this.logger = Logger.getInstance();

    // Initialize session persistence
    const defaultSessionConfig: SessionPersistenceConfig = {
      enabled: true,
      storageType: 'file',
      filePath: './sessions',
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      sessionTimeout: 30 * 60 * 1000 // 30 minutes
    };

    this.sessionPersistence = new FileSessionPersistence(sessionConfig || defaultSessionConfig);

    // Initialize timeout manager
    const defaultTimeoutConfig: TimeoutConfig = {
      userResponseTimeout: TIMEOUTS.USER_RESPONSE,
      reminderTimeout: TIMEOUTS.REMINDER_TIMEOUT,
      maxRetries: TIMEOUTS.MAX_RETRIES
    };

    this.timeoutManager = new TimeoutManager(timeoutConfig || defaultTimeoutConfig, this);

    // Initialize concurrent session manager
    this.concurrentSessionManager = new ConcurrentSessionManager(this);

    // Initialize with default agent flow
    this.resetAgentsFlow();
  }

  // Flow management methods - Implementation in task 3.4 (seguindo especificação FIFO)
  getNextAgent(): string | null {
    // Para dados do paciente: FIFO (remove da lista)
    // Para agendamento: usa fluxo dinâmico por usuário
    if (this.agentsFlow.length > 0) {
      return this.agentsFlow.shift() || null;
    }
    return null; // Flow complete
  }

  /**
   * Get next agent based on current stage (for scheduling flow)
   */
  getNextAgentByStage(currentStage: string): string | null {
    const patientFlow = ['patient.name', 'patient.cpf', 'patient.birthDate', 'patient.email'];
    const currentIndex = patientFlow.indexOf(currentStage);

    if (currentIndex !== -1) {
      // Still in patient data collection
      const nextIndex = currentIndex + 1;
      if (nextIndex < patientFlow.length) {
        return patientFlow[nextIndex] || null;
      } else {
        // Finished patient data, go to scheduling
        return 'schedule.new';
      }
    }

    // Already in scheduling phase - let individual agents handle their flow
    return null;
  }

  /**
   * Get next agent for a specific user based on their dynamic flow
   * @param number - User's phone number
   * @param currentStage - Current stage in the flow
   * @returns Next agent routing key or null if flow is complete
   */
  getNextAgentForUser(number: string, currentStage: string): string | null {
    try {
      const clientData = this.clientData.get(number);

      // Check if user has a dynamic scheduling flow
      if (clientData && clientData.dynamicAgentsFlow) {
        const dynamicFlow = clientData.dynamicAgentsFlow as string[];
        const currentIndex = dynamicFlow.indexOf(currentStage);

        if (currentIndex !== -1) {
          const nextIndex = currentIndex + 1;
          if (nextIndex < dynamicFlow.length) {
            return dynamicFlow[nextIndex] || null;
          }
          return null; // Dynamic flow complete
        }
      }

      // Fallback to default flow logic
      return this.getNextAgent();

    } catch (error) {
      console.error(`Error getting next agent for user ${number}:`, error);
      return this.getNextAgent();
    }
  }

  /**
   * Set up dynamic scheduling flow for a user based on their choice
   * @param number - User's phone number
   * @param flowType - Type of flow (date-first, service-first, dentist-first)
   */
  setDynamicSchedulingFlow(number: string, flowType: 'date-first' | 'service-first' | 'dentist-first'): void {
    let dynamicFlow: string[];

    switch (flowType) {
      case 'date-first':
        dynamicFlow = [...SCHEDULING_FLOWS.DATE_FIRST];
        break;
      case 'service-first':
        dynamicFlow = [...SCHEDULING_FLOWS.SERVICE_FIRST];
        break;
      case 'dentist-first':
        dynamicFlow = [...SCHEDULING_FLOWS.DENTIST_FIRST];
        break;
      default:
        dynamicFlow = [...SCHEDULING_FLOWS.DATE_FIRST];
        break;
    }

    // Store the dynamic flow for this user
    this.setClientData(number, 'dynamicAgentsFlow', dynamicFlow);
    this.setClientData(number, 'schedulingFlowType', flowType);

    console.log(`Dynamic scheduling flow set for ${number}: ${flowType} -> ${dynamicFlow.join(' → ')}`);
  }

  /**
   * Check if user is in scheduling phase
   * @param number - User's phone number
   * @returns true if user is in scheduling phase, false otherwise
   */
  isUserInSchedulingPhase(number: string): boolean {
    const currentStage = this.getCurrentStage(number);
    if (!currentStage) return false;

    const schedulingStages = [
      'schedule.new',
      'schedule.date',
      'schedule.service',
      'schedule.dentist',
      'schedule.payment'
    ];

    return schedulingStages.includes(currentStage);
  }

  /**
   * Get scheduling data for a user
   * @param number - User's phone number
   * @returns Scheduling data object or null if not found
   */
  getSchedulingData(number: string): any {
    try {
      const clientData = this.clientData.get(number);
      if (!clientData) return null;

      return {
        schedulingChoice: clientData.schedulingChoice,
        schedulingFlowType: clientData.schedulingFlowType,
        dynamicAgentsFlow: clientData.dynamicAgentsFlow,
        selectedDate: clientData.selectedDate,
        selectedDateFormatted: clientData.selectedDateFormatted,
        selectedServiceId: clientData.selectedServiceId,
        selectedServiceName: clientData.selectedServiceName,
        selectedServicePrice: clientData.selectedServicePrice,
        selectedServicePriceFormatted: clientData.selectedServicePriceFormatted,
        selectedDentistId: clientData.selectedDentistId,
        selectedDentistName: clientData.selectedDentistName,
        selectedDentistSpecialty: clientData.selectedDentistSpecialty,
        selectedPaymentId: clientData.selectedPaymentId,
        selectedPaymentName: clientData.selectedPaymentName,
        finalPrice: clientData.finalPrice,
        finalPriceFormatted: clientData.finalPriceFormatted,
        appointmentStatus: clientData.appointmentStatus
      };
    } catch (error) {
      console.error(`Error getting scheduling data for ${number}:`, error);
      return null;
    }
  }

  resetAgentsFlow(): void {
    // Reset to patient data flow only (scheduling is handled dynamically)
    this.agentsFlow = [...DEFAULT_AGENTS_FLOW];
  }

  /**
   * Reset to patient data collection flow only
   */
  resetToPatientDataFlow(): void {
    this.agentsFlow = [...DEFAULT_AGENTS_FLOW];
  }

  /**
   * Switch to scheduling flow for a specific user
   * @param number - User's phone number
   * @param flowType - Type of scheduling flow
   */
  switchToSchedulingFlow(number: string, flowType: 'date-first' | 'service-first' | 'dentist-first'): void {
    this.setDynamicSchedulingFlow(number, flowType);

    // Update current stage to first scheduling agent
    const dynamicFlow = this.getClientData(number).dynamicAgentsFlow as string[];
    if (dynamicFlow && dynamicFlow.length > 0 && dynamicFlow[0]) {
      this.setCurrentStage(number, dynamicFlow[0]);
    }
  }

  // Client management methods - Implementation in task 3.1
  addClient(number: string): void {
    if (!number || number.trim() === '') {
      throw new Error('Phone number cannot be empty');
    }

    // Add to visitantes set
    this.clientesVisitantes.add(number);

    // Initialize client data if not exists
    if (!this.clientData.has(number)) {
      const clientData: ClientData = {
        number,
        startTime: new Date(),
        lastActivity: new Date()
      };
      this.clientData.set(number, clientData);
    }

    // Initialize client stage if not exists
    if (!this.clientStages.has(number)) {
      const clientStage: ClientStage = {
        number,
        currentStage: 'patient.name', // Start with first agent
        visitedStages: new Set(),
        stageErrors: new Map(),
        lastActivity: new Date()
      };
      this.clientStages.set(number, clientStage);
    }
  }

  hasClient(number: string): boolean {
    return this.clientesVisitantes.has(number);
  }

  // Client data methods - Implementation in task 3.1
  setClientData(number: string, field: string, value: any): void {
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

  getClientData(number: string): ClientData {
    const clientData = this.clientData.get(number);
    if (!clientData) {
      throw new Error(`Client data not found for phone number: ${number}`);
    }
    return { ...clientData }; // Return a copy to prevent external modifications
  }

  // Stage management methods - Implementation in task 3.2
  getCurrentStage(number: string): string | null {
    const clientStage = this.clientStages.get(number);
    return clientStage ? clientStage.currentStage : null;
  }

  setCurrentStage(number: string, stage: string): void {
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
    } else {
      // Update existing stage
      clientStage.currentStage = stage;
      clientStage.lastActivity = new Date();
    }

    this.clientStages.set(number, clientStage);
  }

  markStageAsVisited(number: string, stage: string): void {
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
    } else {
      // Mark stage as visited
      clientStage.visitedStages.add(stage);
      clientStage.lastActivity = new Date();
    }

    this.clientStages.set(number, clientStage);
  }

  markStageAsError(number: string, stage: string): void {
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
    } else {
      // Increment error count for this stage
      const currentErrors = clientStage.stageErrors.get(stage) || 0;
      clientStage.stageErrors.set(stage, currentErrors + 1);
      clientStage.lastActivity = new Date();
    }

    this.clientStages.set(number, clientStage);
  }

  getStageErrorCount(number: string, stage: string): number {
    const clientStage = this.clientStages.get(number);
    if (!clientStage) {
      return 0;
    }
    return clientStage.stageErrors.get(stage) || 0;
  }

  // Message control methods - Seguindo especificação canSendWhatsAppMessage
  canSendMessage(number: string): boolean {
    if (!number || number.trim() === '') {
      return false;
    }

    const clientData = this.clientData.get(number);
    if (!clientData) {
      return true; // Novo cliente, pode enviar
    }

    // Verificar flag MESSAGE_SENT conforme especificação
    return !clientData.messageSent; // Se messageSent é false, pode enviar
  }

  markMessageSent(number: string): void {
    if (!number || number.trim() === '') {
      throw new Error('Phone number cannot be empty');
    }

    // Marcar flag MESSAGE_SENT como true conforme especificação
    let clientData = this.clientData.get(number);
    if (!clientData) {
      clientData = {
        number,
        startTime: new Date(),
        lastActivity: new Date(),
        messageSent: true
      };
    } else {
      clientData.messageSent = true;
      clientData.lastActivity = new Date();
    }
    
    this.clientData.set(number, clientData);
    this.lastMessageSent.set(number, Date.now());
  }

  // Resetar flag MESSAGE_SENT quando agente muda
  resetMessageSentFlag(number: string): void {
    const clientData = this.clientData.get(number);
    if (clientData) {
      clientData.messageSent = false;
      this.clientData.set(number, clientData);
    }
  }

  // Cleanup methods - Implementation in task 3.4
  clear(): void {
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
  async initializeSessionPersistence(): Promise<void> {
    await this.sessionPersistence.initialize();
    this.concurrentSessionManager.initialize();
    this.logger.info('Session persistence and concurrent session manager initialized');
  }

  async shutdownSessionPersistence(): Promise<void> {
    this.concurrentSessionManager.shutdown();
    await this.sessionPersistence.shutdown();
    this.logger.info('Session persistence and concurrent session manager shutdown');
  }

  async saveSession(number: string): Promise<void> {
    try {
      const clientData = this.clientData.get(number);
      const clientStage = this.clientStages.get(number);

      if (!clientData || !clientStage) {
        this.logger.warn(`Cannot save session for ${number}: missing data`);
        return;
      }

      const sessionData: SessionData = {
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
    } catch (error) {
      this.logger.error(`Failed to save session for ${number}:`, error);
    }
  }

  async loadSession(number: string): Promise<boolean> {
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
    } catch (error) {
      this.logger.error(`Failed to load session for ${number}:`, error);
      return false;
    }
  }

  async deleteSession(number: string): Promise<void> {
    try {
      await this.sessionPersistence.deleteSession(number);
      this.logger.debug(`Session deleted for phone: ${number}`);
    } catch (error) {
      this.logger.error(`Failed to delete session for ${number}:`, error);
    }
  }

  async restoreAllSessions(): Promise<void> {
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
    } catch (error) {
      this.logger.systemError(error as Error, { operation: 'restoreAllSessions' });
    }
  }

  // Auto-save session data when client data changes
  async setClientDataWithPersistence(number: string, field: string, value: any): Promise<void> {
    this.setClientData(number, field, value);
    await this.saveSession(number);
  }

  // Auto-save session data when stage changes
  async setCurrentStageWithPersistence(number: string, stage: string): Promise<void> {
    this.setCurrentStage(number, stage);
    await this.saveSession(number);
  }

  // Auto-save session data when stage is marked as visited
  async markStageAsVisitedWithPersistence(number: string, stage: string): Promise<void> {
    this.markStageAsVisited(number, stage);
    await this.saveSession(number);
  }

  // Timeout management methods - Implementation in task 8.2
  startUserResponseTimeout(
    number: string,
    stage: string,
    onTimeout: (number: string, stage: string) => Promise<void>,
    onReminderTimeout: (number: string, stage: string) => Promise<void>
  ): void {
    this.timeoutManager.startUserResponseTimeout(number, stage, onTimeout, onReminderTimeout);
  }

  clearUserResponseTimeout(number: string): void {
    this.timeoutManager.clearTimeout(number);
  }

  hasActiveTimeout(number: string): boolean {
    return this.timeoutManager.hasActiveTimeout(number);
  }

  getTimeoutInfo(number: string) {
    return this.timeoutManager.getTimeoutInfo(number);
  }

  // Shutdown timeout manager
  async shutdownTimeoutManager(): Promise<void> {
    this.timeoutManager.clearAllTimeouts();
    this.logger.info('Timeout manager shutdown');
  }

  // Concurrent session management methods - Implementation in task 8.3
  async setClientDataSafe(number: string, field: string, value: any): Promise<boolean> {
    return await this.concurrentSessionManager.setClientDataSafe(number, field, value);
  }

  async setCurrentStageSafe(number: string, stage: string): Promise<boolean> {
    return await this.concurrentSessionManager.setCurrentStageSafe(number, stage);
  }

  async markStageAsVisitedSafe(number: string, stage: string): Promise<boolean> {
    return await this.concurrentSessionManager.markStageAsVisitedSafe(number, stage);
  }

  async markStageAsErrorSafe(number: string, stage: string): Promise<boolean> {
    return await this.concurrentSessionManager.markStageAsErrorSafe(number, stage);
  }

  async addClientSafe(number: string): Promise<boolean> {
    return await this.concurrentSessionManager.addClientSafe(number);
  }

  getSessionInfo(number: string) {
    return this.concurrentSessionManager.getSessionInfo(number);
  }

  getAllActiveSessions(): string[] {
    return this.concurrentSessionManager.getAllActiveSessions();
  }

  getAllLockedSessions() {
    return this.concurrentSessionManager.getAllLockedSessions();
  }

  async cleanupExpiredSessions(): Promise<void> {
    const startTime = Date.now();
    try {
      await this.concurrentSessionManager.cleanupExpiredSessions();
      const duration = Date.now() - startTime;
      this.logger.sessionEvent('cleaned', 'system', { operation: 'bulk_cleanup', duration });
    } catch (error) {
      this.logger.systemError(error as Error, { operation: 'cleanupExpiredSessions' });
      throw error;
    }
  }

  async cleanupSession(number: string): Promise<void> {
    try {
      await this.concurrentSessionManager.cleanupSession(number);
      this.logger.sessionEvent('cleaned', number, { operation: 'individual_cleanup' });
    } catch (error) {
      this.logger.systemError(error as Error, { operation: 'cleanupSession' }, number);
      throw error;
    }
  }

  // Thread-safe wrapper methods for existing operations
  async withSessionLock<T>(
    number: string,
    operation: string,
    callback: () => Promise<T>
  ): Promise<T | null> {
    return await this.concurrentSessionManager.withSessionLock(number, operation, callback);
  }
}