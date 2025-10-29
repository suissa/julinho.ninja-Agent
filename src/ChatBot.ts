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
import { SystemRoutingKey } from './types/constants';
import { SystemExchangeName } from './types/config';
import { Logger } from '@src/utils/logger';

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

      // 4.1 Clear session files on startup
      this.logger.startPerformanceTimer('session-cleanup');
      this.logger.info('Clearing old session files...');
      await this.clearSessionFiles();
      this.logger.info('Session files cleared');
      const sessionCleanupTime = this.logger.endPerformanceTimer('session-cleanup');
      this.logger.performanceMetric('session_cleanup', sessionCleanupTime);

      // 4.2 Restore sessions from persistence
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
          cleanup: sessionCleanupTime,
          sessionCleanup: sessionCleanupTime,
          memory: memoryInitTime,
          // sessionRestore: sessionRestoreTime,
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
      await this.sdkRabbitmq.publish('agents', 'test', { test: true } as any);
      await this.sdkRabbitmq.publish('messages', 'test', { test: true } as any);
      await this.sdkRabbitmq.publish('whatsapp', 'test', { test: true } as any);

      // Pre-bind queues to avoid missing the very first messages before subscribers start
      await this.sdkRabbitmq.bind('chatbot.messages', 'greeting-agent-queue', 'phone.*');

      // Agent activation queues on 'agents' exchange
      await this.sdkRabbitmq.bind('agents', 'patient-name-agent-queue', 'patient.name');
      await this.sdkRabbitmq.bind('agents', 'patient-cpf-agent-queue', 'patient.cpf');
      await this.sdkRabbitmq.bind('agents', 'patient-birthdate-agent-queue', 'patient.birthDate');
      await this.sdkRabbitmq.bind('agents', 'patient-email-agent-queue', 'patient.email');
      await this.sdkRabbitmq.bind('agents', 'schedule-new-agent-queue', 'schedule.new');
      await this.sdkRabbitmq.bind('agents', 'schedule-date-agent-queue', 'schedule.date');
      await this.sdkRabbitmq.bind('agents', 'schedule-service-agent-queue', 'schedule.service');
      await this.sdkRabbitmq.bind('agents', 'schedule-dentist-agent-queue', 'schedule.dentist');
      await this.sdkRabbitmq.bind('agents', 'schedule-payment-agent-queue', 'schedule.payment');

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

    console.log('🔗 [ChatBot] Subscribing to patient.name');
    await this.sdkRabbitmq.subscribe(
      'agents',
      'patient-name-agent-queue',
      'patient.name',
      this.patientNameAgent.onActivation.bind(this.patientNameAgent)
    );
    console.log('✅ [ChatBot] Subscribed to patient.name');

    console.log('🔗 [ChatBot] Subscribing to patient.cpf');
    await this.sdkRabbitmq.subscribe(
      'agents',
      'patient-cpf-agent-queue',
      'patient.cpf',
      this.patientCPFAgent.onActivation.bind(this.patientCPFAgent)
    );
    console.log('✅ [ChatBot] Subscribed to patient.cpf');

    console.log('🔗 [ChatBot] Subscribing to patient.birthDate');
    await this.sdkRabbitmq.subscribe(
      'agents',
      'patient-birthdate-agent-queue',
        'patient.birthDate',
      this.patientBirthDateAgent.onActivation.bind(this.patientBirthDateAgent)
    );
    console.log('✅ [ChatBot] Subscribed to patient.birthDate');

    console.log('🔗 [ChatBot] Subscribing to patient.email');
    await this.sdkRabbitmq.subscribe(
      'agents',
      'patient-email-agent-queue',
      'patient.email',
      this.patientEmailAgent.onActivation.bind(this.patientEmailAgent)
    );
    console.log('✅ [ChatBot] Subscribed to patient.email');

    // Subscribe scheduling agents to their respective routing keys
    console.log('🔗 [ChatBot] Subscribing to schedule.new');
    await this.sdkRabbitmq.subscribe(
      'agents',
      'schedule-new-agent-queue',
      'schedule.new',
      this.scheduleNewAgent.onActivation.bind(this.scheduleNewAgent)
    );
    console.log('✅ [ChatBot] Subscribed to schedule.new');

    console.log('🔗 [ChatBot] Subscribing to schedule.date');
    await this.sdkRabbitmq.subscribe(
        'agents',
      'schedule-date-agent-queue',
      'schedule.date',
      this.scheduleDateAgent.onActivation.bind(this.scheduleDateAgent)
    );
    console.log('✅ [ChatBot] Subscribed to schedule.date');

    console.log('🔗 [ChatBot] Subscribing to schedule.service');
    await this.sdkRabbitmq.subscribe(
      'agents',
      'schedule-service-agent-queue',
      'schedule.service',
      this.scheduleServiceAgent.onActivation.bind(this.scheduleServiceAgent)
    );
    console.log('✅ [ChatBot] Subscribed to schedule.service');

    console.log('🔗 [ChatBot] Subscribing to schedule.dentist');
    await this.sdkRabbitmq.subscribe(
      'agents',
      'schedule-dentist-agent-queue',
      'schedule.dentist',
      this.scheduleDentistAgent.onActivation.bind(this.scheduleDentistAgent)
    );
    console.log('✅ [ChatBot] Subscribed to schedule.dentist');

    console.log('🔗 [ChatBot] Subscribing to schedule.payment');
    await this.sdkRabbitmq.subscribe(
      'agents',
      'schedule-payment-agent-queue',
      'schedule.payment',
      this.schedulePaymentAgent.onActivation.bind(this.schedulePaymentAgent)
    );
    console.log('✅ [ChatBot] Subscribed to schedule.payment');

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

  // Clear session files on startup
  private async clearSessionFiles(): Promise<void> {
    try {
      await this.globalMemory.clearAllSessions();
    } catch (error) {
      this.logger.error('Error clearing session files:', error);
      // Don't throw - this shouldn't stop startup
    }
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
