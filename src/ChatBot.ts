/**
 * Main ChatBot class - System entry point and orchestrator
 */

import { SdkRabbitmq } from './sdk/SdkRabbitmq';
import { GlobalMemory } from './memory/GlobalMemory';
import { GreetingAgent } from './agents/GreetingAgent';
import { PatientNameAgent } from './agents/PatientNameAgent';
import { PatientCPFAgent } from './agents/PatientCPFAgent';
import { PatientBirthDateAgent } from './agents/PatientBirthDateAgent';
import { PatientEmailAgent } from './agents/PatientEmailAgent';
import { ScheduleNewAgent } from './agents/ScheduleNewAgent';
import { ScheduleDateAgent } from './agents/ScheduleDateAgent';
import { ScheduleServiceAgent } from './agents/ScheduleServiceAgent';
import { ScheduleDentistAgent } from './agents/ScheduleDentistAgent';
import { SchedulePaymentAgent } from './agents/SchedulePaymentAgent';
import { createChatBotConfig } from './config/environment';
import { EXCHANGES, AGENT_ROUTING_KEYS } from './types/constants';
import { Logger } from './utils/logger';

export class ChatBot {
  private sdkRabbitmq!: SdkRabbitmq;
  private globalMemory!: GlobalMemory;
  private greetingAgent!: GreetingAgent;
  private patientNameAgent!: PatientNameAgent;
  private patientCPFAgent!: PatientCPFAgent;
  private patientBirthDateAgent!: PatientBirthDateAgent;
  private patientEmailAgent!: PatientEmailAgent;
  // Scheduling agents
  private scheduleNewAgent!: ScheduleNewAgent;
  private scheduleDateAgent!: ScheduleDateAgent;
  private scheduleServiceAgent!: ScheduleServiceAgent;
  private scheduleDentistAgent!: ScheduleDentistAgent;
  private schedulePaymentAgent!: SchedulePaymentAgent;
  private logger: Logger;

  constructor() {
    this.logger = Logger.getInstance();
  }

  public async initialize(): Promise<void> {
    const initStartTime = Date.now();
    
    try {
      this.logger.info('ChatBot initialization started');

      // 1. Load configuration
      const config = createChatBotConfig();
      
      // Configure logger with performance tracking
      this.logger.configure(
        config.system.logging.level as any, 
        config.system.logging.sanitizeUserData,
        true // Enable performance tracking
      );

      // 2. Initialize SdkRabbitmq singleton instance
      this.logger.startPerformanceTimer('rabbitmq-init');
      this.sdkRabbitmq = await SdkRabbitmq.getInstance(config.rabbitmq);
      const rabbitmqInitTime = this.logger.endPerformanceTimer('rabbitmq-init');
      this.logger.performanceMetric('rabbitmq_initialization', rabbitmqInitTime);

      // 3. System cleanup on startup
      this.logger.startPerformanceTimer('system-cleanup');
      await this.performSystemCleanup();
      const cleanupTime = this.logger.endPerformanceTimer('system-cleanup');
      this.logger.performanceMetric('system_cleanup', cleanupTime);

      // 4. Initialize Global Memory
      this.logger.startPerformanceTimer('memory-init');
      this.globalMemory = new GlobalMemory(config.system.sessionPersistence);
      await this.globalMemory.initializeSessionPersistence();
      const memoryInitTime = this.logger.endPerformanceTimer('memory-init');
      this.logger.performanceMetric('memory_initialization', memoryInitTime);

      // 4.1 Restore sessions from persistence
      this.logger.startPerformanceTimer('session-restore');
      await this.globalMemory.restoreAllSessions();
      const sessionRestoreTime = this.logger.endPerformanceTimer('session-restore');
      this.logger.performanceMetric('session_restoration', sessionRestoreTime);

      // 4.2 Start periodic session cleanup
      this.startPeriodicSessionCleanup();

      // 5. Set up agentsFlow in global memory (already done in constructor)
      this.logger.info('Agents flow configured', { flow: this.globalMemory.agentsFlow });

      // 6. Initialize all agents
      this.logger.startPerformanceTimer('agents-init');
      await this.initializeAgents();
      const agentsInitTime = this.logger.endPerformanceTimer('agents-init');
      this.logger.performanceMetric('agents_initialization', agentsInitTime);

      // 7. Initialize GreetingAgent with phone.* subscription
      await this.greetingAgent.initialize();

      const totalInitTime = Date.now() - initStartTime;
      this.logger.performanceMetric('chatbot_initialization_complete', totalInitTime, {
        components: {
          rabbitmq: rabbitmqInitTime,
          cleanup: cleanupTime,
          memory: memoryInitTime,
          sessionRestore: sessionRestoreTime,
          agents: agentsInitTime
        }
      });
      
      this.logger.info('ChatBot initialization completed successfully', undefined, undefined, undefined, totalInitTime);
    } catch (error) {
      this.logger.systemError(error as Error, { operation: 'chatbot_initialization' });
      throw error;
    }
  }

  // System cleanup on startup
  private async performSystemCleanup(): Promise<void> {
    this.logger.info('Performing system cleanup...');

    try {
      // Create exchanges if they don't exist
      await this.sdkRabbitmq.publish(EXCHANGES.AGENTS, 'test', { test: true });
      await this.sdkRabbitmq.publish(EXCHANGES.MESSAGES, 'test', { test: true });
      await this.sdkRabbitmq.publish(EXCHANGES.WHATSAPP, 'test', { test: true });

      // Purge all existing messages from agent queues
      const agentQueues = [
        'greeting-agent-queue',
        'patient-name-agent-queue',
        'patient-cpf-agent-queue',
        'patient-birthdate-agent-queue',
        'patient-email-agent-queue',
        // Scheduling agent queues
        'schedule-new-agent-queue',
        'schedule-date-agent-queue',
        'schedule-service-agent-queue',
        'schedule-dentist-agent-queue',
        'schedule-payment-agent-queue'
      ];

      let purgedQueues = 0;
      for (const queueName of agentQueues) {
        try {
          await this.sdkRabbitmq.purgeQueue(queueName);
          purgedQueues++;
        } catch (error) {
          // Queue might not exist yet, which is fine
          this.logger.debug(`Queue ${queueName} not found during cleanup (expected for first run)`);
        }
      }

      // Unbind all existing queue bindings (will be recreated during agent initialization)
      // Note: We'll let agents handle their own binding setup

      this.logger.info('System cleanup completed', { purgedQueues, totalQueues: agentQueues.length });
    } catch (error) {
      this.logger.systemError(error as Error, { operation: 'system_cleanup' });
      throw error;
    }
  }

  // Initialize all agent instances
  private async initializeAgents(): Promise<void> {
    this.logger.info('Initializing agents...');

    // Create patient data collection agent instances
    this.greetingAgent = new GreetingAgent(this.sdkRabbitmq, this.globalMemory);
    this.patientNameAgent = new PatientNameAgent(this.sdkRabbitmq, this.globalMemory);
    this.patientCPFAgent = new PatientCPFAgent(this.sdkRabbitmq, this.globalMemory);
    this.patientBirthDateAgent = new PatientBirthDateAgent(this.sdkRabbitmq, this.globalMemory);
    this.patientEmailAgent = new PatientEmailAgent(this.sdkRabbitmq, this.globalMemory);

    // Create scheduling agent instances
    this.scheduleNewAgent = new ScheduleNewAgent(this.sdkRabbitmq, this.globalMemory);
    this.scheduleDateAgent = new ScheduleDateAgent(this.sdkRabbitmq, this.globalMemory);
    this.scheduleServiceAgent = new ScheduleServiceAgent(this.sdkRabbitmq, this.globalMemory);
    this.scheduleDentistAgent = new ScheduleDentistAgent(this.sdkRabbitmq, this.globalMemory);
    this.schedulePaymentAgent = new SchedulePaymentAgent(this.sdkRabbitmq, this.globalMemory);

    // Set up agent subscriptions to their respective queues
    await this.setupAgentSubscriptions();

    this.logger.info('All agents initialized');
  }

  // Set up agent subscriptions
  private async setupAgentSubscriptions(): Promise<void> {
    // Subscribe patient data collection agents to their respective routing keys
    await this.sdkRabbitmq.subscribe(
      EXCHANGES.AGENTS,
      'patient-name-agent-queue',
      AGENT_ROUTING_KEYS.PATIENT_NAME,
      (payload) => this.patientNameAgent.onActivation(payload)
    );

    await this.sdkRabbitmq.subscribe(
      EXCHANGES.AGENTS,
      'patient-cpf-agent-queue',
      AGENT_ROUTING_KEYS.PATIENT_CPF,
      (payload) => this.patientCPFAgent.onActivation(payload)
    );

    await this.sdkRabbitmq.subscribe(
      EXCHANGES.AGENTS,
      'patient-birthdate-agent-queue',
      AGENT_ROUTING_KEYS.PATIENT_BIRTH_DATE,
      (payload) => this.patientBirthDateAgent.onActivation(payload)
    );

    await this.sdkRabbitmq.subscribe(
      EXCHANGES.AGENTS,
      'patient-email-agent-queue',
      AGENT_ROUTING_KEYS.PATIENT_EMAIL,
      (payload) => this.patientEmailAgent.onActivation(payload)
    );

    // Subscribe scheduling agents to their respective routing keys
    await this.sdkRabbitmq.subscribe(
      EXCHANGES.AGENTS,
      'schedule-new-agent-queue',
      AGENT_ROUTING_KEYS.SCHEDULE_NEW,
      (payload) => this.scheduleNewAgent.onActivation(payload)
    );

    await this.sdkRabbitmq.subscribe(
      EXCHANGES.AGENTS,
      'schedule-date-agent-queue',
      AGENT_ROUTING_KEYS.SCHEDULE_DATE,
      (payload) => this.scheduleDateAgent.onActivation(payload)
    );

    await this.sdkRabbitmq.subscribe(
      EXCHANGES.AGENTS,
      'schedule-service-agent-queue',
      AGENT_ROUTING_KEYS.SCHEDULE_SERVICE,
      (payload) => this.scheduleServiceAgent.onActivation(payload)
    );

    await this.sdkRabbitmq.subscribe(
      EXCHANGES.AGENTS,
      'schedule-dentist-agent-queue',
      AGENT_ROUTING_KEYS.SCHEDULE_DENTIST,
      (payload) => this.scheduleDentistAgent.onActivation(payload)
    );

    await this.sdkRabbitmq.subscribe(
      EXCHANGES.AGENTS,
      'schedule-payment-agent-queue',
      AGENT_ROUTING_KEYS.SCHEDULE_PAYMENT,
      (payload) => this.schedulePaymentAgent.onActivation(payload)
    );

    this.logger.info('All agent subscriptions configured', { 
      patientAgents: 4, 
      schedulingAgents: 5, 
      totalAgents: 9 
    });
  }

  // Start periodic session cleanup
  private startPeriodicSessionCleanup(): void {
    // Run cleanup every 10 minutes
    setInterval(async () => {
      const cleanupStartTime = Date.now();
      try {
        this.logger.startPerformanceTimer('session-cleanup');
        await this.globalMemory.cleanupExpiredSessions();
        const cleanupTime = this.logger.endPerformanceTimer('session-cleanup');
        this.logger.performanceMetric('periodic_session_cleanup', cleanupTime);
      } catch (error) {
        this.logger.systemError(error as Error, { operation: 'periodic_session_cleanup' });
      }
    }, 10 * 60 * 1000); // 10 minutes

    this.logger.info('Periodic session cleanup started', { intervalMinutes: 10 });
  }

  public async shutdown(): Promise<void> {
    const shutdownStartTime = Date.now();
    this.logger.info('ChatBot shutdown initiated');
    
    try {
      if (this.globalMemory) {
        this.logger.startPerformanceTimer('memory-shutdown');
        await this.globalMemory.shutdownTimeoutManager();
        await this.globalMemory.shutdownSessionPersistence();
        const memoryShutdownTime = this.logger.endPerformanceTimer('memory-shutdown');
        this.logger.performanceMetric('memory_shutdown', memoryShutdownTime);
      }
      
      if (this.sdkRabbitmq) {
        this.logger.startPerformanceTimer('rabbitmq-shutdown');
        await this.sdkRabbitmq.close();
        const rabbitmqShutdownTime = this.logger.endPerformanceTimer('rabbitmq-shutdown');
        this.logger.performanceMetric('rabbitmq_shutdown', rabbitmqShutdownTime);
      }
      
      const totalShutdownTime = Date.now() - shutdownStartTime;
      this.logger.performanceMetric('chatbot_shutdown_complete', totalShutdownTime);
      this.logger.info('ChatBot shutdown completed', undefined, undefined, undefined, totalShutdownTime);
      
      // Shutdown logger last to ensure all logs are flushed
      this.logger.shutdown();
    } catch (error) {
      this.logger.systemError(error as Error, { operation: 'chatbot_shutdown' });
      throw error;
    }
  }
}