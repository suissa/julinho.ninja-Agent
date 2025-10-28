"use strict";
/**
 * Main ChatBot class - System entry point and orchestrator
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatBot = void 0;
const SdkRabbitmq_1 = require("./sdk/SdkRabbitmq");
const GlobalMemory_1 = require("./memory/GlobalMemory");
const GreetingAgent_1 = require("./agents/GreetingAgent");
const PatientNameAgent_1 = require("./agents/PatientNameAgent");
const PatientCPFAgent_1 = require("./agents/PatientCPFAgent");
const PatientBirthDateAgent_1 = require("./agents/PatientBirthDateAgent");
const PatientEmailAgent_1 = require("./agents/PatientEmailAgent");
const ScheduleNewAgent_1 = require("./agents/ScheduleNewAgent");
const ScheduleDateAgent_1 = require("./agents/ScheduleDateAgent");
const ScheduleServiceAgent_1 = require("./agents/ScheduleServiceAgent");
const ScheduleDentistAgent_1 = require("./agents/ScheduleDentistAgent");
const SchedulePaymentAgent_1 = require("./agents/SchedulePaymentAgent");
const environment_1 = require("./config/environment");
const constants_1 = require("@typez/constants");
const logger_1 = require("@src/utils/logger");
class ChatBot {
    constructor() {
        this.logger = logger_1.Logger.getInstance();
    }
    async initialize() {
        const initStartTime = Date.now();
        try {
            this.logger.info('ChatBot initialization started');
            // 1. Load configuration
            const config = (0, environment_1.createChatBotConfig)();
            // Configure logger with performance tracking
            this.logger.configure(config.system.logging.level, config.system.logging.sanitizeUserData, true // Enable performance tracking
            );
            // 2. Initialize SdkRabbitmq singleton instance
            this.logger.startPerformanceTimer('rabbitmq-init');
            this.sdkRabbitmq = await SdkRabbitmq_1.SdkRabbitmq.getInstance(config.rabbitmq);
            const rabbitmqInitTime = this.logger.endPerformanceTimer('rabbitmq-init');
            this.logger.performanceMetric('rabbitmq_initialization', rabbitmqInitTime);
            // 3. System cleanup on startup
            this.logger.startPerformanceTimer('system-cleanup');
            await this.performSystemCleanup();
            const cleanupTime = this.logger.endPerformanceTimer('system-cleanup');
            this.logger.performanceMetric('system_cleanup', cleanupTime);
            // 4. Initialize Global Memory
            this.logger.startPerformanceTimer('memory-init');
            this.globalMemory = new GlobalMemory_1.GlobalMemory(config.system.sessionPersistence);
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
        }
        catch (error) {
            this.logger.systemError(error, { operation: 'chatbot_initialization' });
            throw error;
        }
    }
    // System cleanup on startup
    async performSystemCleanup() {
        this.logger.info('Performing system cleanup...');
        try {
            // Create exchanges if they don't exist
            await this.sdkRabbitmq.publish(constants_1.EXCHANGES.AGENTS, 'test', { test: true });
            await this.sdkRabbitmq.publish(constants_1.EXCHANGES.MESSAGES, 'test', { test: true });
            await this.sdkRabbitmq.publish(constants_1.EXCHANGES.WHATSAPP, 'test', { test: true });
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
                }
                catch (error) {
                    // Queue might not exist yet, which is fine
                    this.logger.debug(`Queue ${queueName} not found during cleanup (expected for first run)`);
                }
            }
            // Unbind all existing queue bindings (will be recreated during agent initialization)
            // Note: We'll let agents handle their own binding setup
            this.logger.info('System cleanup completed', { purgedQueues, totalQueues: agentQueues.length });
        }
        catch (error) {
            this.logger.systemError(error, { operation: 'system_cleanup' });
            throw error;
        }
    }
    // Initialize all agent instances
    async initializeAgents() {
        this.logger.info('Initializing agents...');
        // Create patient data collection agent instances
        this.greetingAgent = new GreetingAgent_1.GreetingAgent(this.sdkRabbitmq, this.globalMemory);
        this.patientNameAgent = new PatientNameAgent_1.PatientNameAgent(this.sdkRabbitmq, this.globalMemory);
        this.patientCPFAgent = new PatientCPFAgent_1.PatientCPFAgent(this.sdkRabbitmq, this.globalMemory);
        this.patientBirthDateAgent = new PatientBirthDateAgent_1.PatientBirthDateAgent(this.sdkRabbitmq, this.globalMemory);
        this.patientEmailAgent = new PatientEmailAgent_1.PatientEmailAgent(this.sdkRabbitmq, this.globalMemory);
        // Create scheduling agent instances
        this.scheduleNewAgent = new ScheduleNewAgent_1.ScheduleNewAgent(this.sdkRabbitmq, this.globalMemory);
        this.scheduleDateAgent = new ScheduleDateAgent_1.ScheduleDateAgent(this.sdkRabbitmq, this.globalMemory);
        this.scheduleServiceAgent = new ScheduleServiceAgent_1.ScheduleServiceAgent(this.sdkRabbitmq, this.globalMemory);
        this.scheduleDentistAgent = new ScheduleDentistAgent_1.ScheduleDentistAgent(this.sdkRabbitmq, this.globalMemory);
        this.schedulePaymentAgent = new SchedulePaymentAgent_1.SchedulePaymentAgent(this.sdkRabbitmq, this.globalMemory);
        // Set up agent subscriptions to their respective queues
        await this.setupAgentSubscriptions();
        this.logger.info('All agents initialized');
    }
    // Set up agent subscriptions
    async setupAgentSubscriptions() {
        // Subscribe patient data collection agents to their respective routing keys
        await this.sdkRabbitmq.subscribe(constants_1.EXCHANGES.AGENTS, 'patient-name-agent-queue', constants_1.AGENT_ROUTING_KEYS.PATIENT_NAME, (payload) => this.patientNameAgent.onActivation(payload));
        await this.sdkRabbitmq.subscribe(constants_1.EXCHANGES.AGENTS, 'patient-cpf-agent-queue', constants_1.AGENT_ROUTING_KEYS.PATIENT_CPF, (payload) => this.patientCPFAgent.onActivation(payload));
        await this.sdkRabbitmq.subscribe(constants_1.EXCHANGES.AGENTS, 'patient-birthdate-agent-queue', constants_1.AGENT_ROUTING_KEYS.PATIENT_BIRTH_DATE, (payload) => this.patientBirthDateAgent.onActivation(payload));
        await this.sdkRabbitmq.subscribe(constants_1.EXCHANGES.AGENTS, 'patient-email-agent-queue', constants_1.AGENT_ROUTING_KEYS.PATIENT_EMAIL, (payload) => this.patientEmailAgent.onActivation(payload));
        // Subscribe scheduling agents to their respective routing keys
        await this.sdkRabbitmq.subscribe(constants_1.EXCHANGES.AGENTS, 'schedule-new-agent-queue', constants_1.AGENT_ROUTING_KEYS.SCHEDULE_NEW, (payload) => this.scheduleNewAgent.onActivation(payload));
        await this.sdkRabbitmq.subscribe(constants_1.EXCHANGES.AGENTS, 'schedule-date-agent-queue', constants_1.AGENT_ROUTING_KEYS.SCHEDULE_DATE, (payload) => this.scheduleDateAgent.onActivation(payload));
        await this.sdkRabbitmq.subscribe(constants_1.EXCHANGES.AGENTS, 'schedule-service-agent-queue', constants_1.AGENT_ROUTING_KEYS.SCHEDULE_SERVICE, (payload) => this.scheduleServiceAgent.onActivation(payload));
        await this.sdkRabbitmq.subscribe(constants_1.EXCHANGES.AGENTS, 'schedule-dentist-agent-queue', constants_1.AGENT_ROUTING_KEYS.SCHEDULE_DENTIST, (payload) => this.scheduleDentistAgent.onActivation(payload));
        await this.sdkRabbitmq.subscribe(constants_1.EXCHANGES.AGENTS, 'schedule-payment-agent-queue', constants_1.AGENT_ROUTING_KEYS.SCHEDULE_PAYMENT, (payload) => this.schedulePaymentAgent.onActivation(payload));
        this.logger.info('All agent subscriptions configured', {
            patientAgents: 4,
            schedulingAgents: 5,
            totalAgents: 9
        });
    }
    // Start periodic session cleanup
    startPeriodicSessionCleanup() {
        // Run cleanup every 10 minutes
        setInterval(async () => {
            const cleanupStartTime = Date.now();
            try {
                this.logger.startPerformanceTimer('session-cleanup');
                await this.globalMemory.cleanupExpiredSessions();
                const cleanupTime = this.logger.endPerformanceTimer('session-cleanup');
                this.logger.performanceMetric('periodic_session_cleanup', cleanupTime);
            }
            catch (error) {
                this.logger.systemError(error, { operation: 'periodic_session_cleanup' });
            }
        }, 10 * 60 * 1000); // 10 minutes
        this.logger.info('Periodic session cleanup started', { intervalMinutes: 10 });
    }
    async shutdown() {
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
        }
        catch (error) {
            this.logger.systemError(error, { operation: 'chatbot_shutdown' });
            throw error;
        }
    }
}
exports.ChatBot = ChatBot;
//# sourceMappingURL=ChatBot.js.map