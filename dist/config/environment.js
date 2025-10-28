"use strict";
/**
 * Environment configuration loader
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnvironmentConfig = loadEnvironmentConfig;
exports.createRabbitMQConfig = createRabbitMQConfig;
exports.createChatBotConfig = createChatBotConfig;
exports.validateConfiguration = validateConfiguration;
exports.getConfigurationSummary = getConfigurationSummary;
const dotenv_1 = require("dotenv");
const constants_1 = require("../types/constants");
// Load environment variables
(0, dotenv_1.config)();
/**
 * Load and validate environment configuration
 */
function loadEnvironmentConfig() {
    const requiredVars = ['RABBITMQ_HOST', 'RABBITMQ_PORT', 'RABBITMQ_USERNAME', 'RABBITMQ_PASSWORD'];
    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            throw new Error(`Required environment variable ${varName} is not set`);
        }
    }
    return {
        RABBITMQ_HOST: process.env.RABBITMQ_HOST,
        RABBITMQ_PORT: process.env.RABBITMQ_PORT,
        RABBITMQ_USERNAME: process.env.RABBITMQ_USERNAME,
        RABBITMQ_PASSWORD: process.env.RABBITMQ_PASSWORD,
        RABBITMQ_VHOST: process.env.RABBITMQ_VHOST || '/',
        NODE_ENV: process.env.NODE_ENV || 'development',
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    };
}
/**
 * Create enhanced RabbitMQ configuration from environment
 */
function createRabbitMQConfig() {
    const env = loadEnvironmentConfig();
    return {
        host: env.RABBITMQ_HOST,
        port: parseInt(env.RABBITMQ_PORT, 10),
        username: env.RABBITMQ_USERNAME,
        password: env.RABBITMQ_PASSWORD,
        vhost: env.RABBITMQ_VHOST || '/',
        protocol: 'amqp',
        heartbeat: parseInt(process.env.RABBITMQ_HEARTBEAT || '60', 10),
        connectionTimeout: parseInt(process.env.RABBITMQ_CONNECTION_TIMEOUT || '10000', 10),
        reconnectDelay: parseInt(process.env.RABBITMQ_RECONNECT_DELAY || '5000', 10),
        maxReconnectAttempts: parseInt(process.env.RABBITMQ_MAX_RECONNECT_ATTEMPTS || '10', 10),
        prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH_COUNT || '1', 10)
    };
}
/**
 * Create ChatBot configuration from environment
 */
function createChatBotConfig() {
    const env = loadEnvironmentConfig();
    const rabbitmqConfig = createRabbitMQConfig();
    const agentConfig = {
        flow: [...constants_1.DEFAULT_AGENTS_FLOW],
        timeouts: {
            userResponse: parseInt(process.env.AGENT_TIMEOUT_USER_RESPONSE || '30000', 10),
            reminderTimeout: parseInt(process.env.AGENT_TIMEOUT_REMINDER || '60000', 10),
            maxRetries: parseInt(process.env.AGENT_MAX_RETRIES || '3', 10)
        },
        duplicateMessagePrevention: {
            minInterval: parseInt(process.env.MIN_MESSAGE_INTERVAL || '2000', 10)
        }
    };
    const sessionPersistenceConfig = {
        enabled: process.env.SESSION_PERSISTENCE_ENABLED !== 'false',
        storageType: 'file',
        filePath: process.env.SESSION_STORAGE_PATH || './sessions',
        cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL || '300000', 10),
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '1800000', 10)
    };
    const systemConfig = {
        exchanges: {
            agents: constants_1.EXCHANGES.AGENTS,
            messages: constants_1.EXCHANGES.MESSAGES,
            whatsapp: constants_1.EXCHANGES.WHATSAPP
        },
        queues: {
            prefix: 'queue-'
        },
        logging: {
            level: env.LOG_LEVEL || 'info',
            sanitizeUserData: process.env.SANITIZE_USER_DATA === 'true' || env.NODE_ENV === 'production',
            format: process.env.LOG_FORMAT || 'json',
            file: process.env.LOG_FILE || './logs/chatbot.log',
            maxFileSize: process.env.LOG_MAX_FILE_SIZE || '10MB',
            maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10)
        },
        sessionPersistence: sessionPersistenceConfig,
        monitoring: {
            enabled: process.env.MONITORING_ENABLED !== 'false',
            port: parseInt(process.env.PORT || '8080', 10),
            metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
            healthCheckPath: process.env.HEALTH_CHECK_PATH || '/health'
        },
        security: {
            encryptSensitiveData: process.env.ENCRYPT_SENSITIVE_DATA === 'true',
            dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '30', 10),
            auditLogging: process.env.AUDIT_LOGGING === 'true'
        },
        performance: {
            maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '1000', 10),
            messageProcessingTimeout: parseInt(process.env.MESSAGE_PROCESSING_TIMEOUT || '5000', 10),
            queueProcessingBatchSize: parseInt(process.env.QUEUE_PROCESSING_BATCH_SIZE || '10', 10)
        }
    };
    return {
        rabbitmq: rabbitmqConfig,
        agents: agentConfig,
        system: systemConfig
    };
}
/**
 * Validate configuration and environment
 */
function validateConfiguration() {
    try {
        const config = createChatBotConfig();
        // Validate RabbitMQ configuration
        if (!config.rabbitmq.host || !config.rabbitmq.port) {
            throw new Error('Invalid RabbitMQ configuration: host and port are required');
        }
        if (config.rabbitmq.port < 1 || config.rabbitmq.port > 65535) {
            throw new Error('Invalid RabbitMQ port: must be between 1 and 65535');
        }
        // Validate timeouts
        if (config.agents.timeouts.userResponse < 1000) {
            throw new Error('User response timeout must be at least 1000ms');
        }
        if (config.agents.timeouts.reminderTimeout < config.agents.timeouts.userResponse) {
            throw new Error('Reminder timeout must be greater than user response timeout');
        }
        // Validate performance settings
        if (config.system.performance.maxConcurrentSessions < 1) {
            throw new Error('Max concurrent sessions must be at least 1');
        }
        console.log('✅ Configuration validation passed');
    }
    catch (error) {
        console.error('❌ Configuration validation failed:', error.message);
        throw error;
    }
}
/**
 * Get configuration summary for logging
 */
function getConfigurationSummary() {
    const config = createChatBotConfig();
    return {
        environment: process.env.NODE_ENV || 'development',
        rabbitmq: {
            host: config.rabbitmq.host,
            port: config.rabbitmq.port,
            vhost: config.rabbitmq.vhost
        },
        agents: {
            flowLength: config.agents.flow.length,
            userResponseTimeout: config.agents.timeouts.userResponse,
            maxRetries: config.agents.timeouts.maxRetries
        },
        system: {
            logLevel: config.system.logging.level,
            monitoringEnabled: config.system.monitoring.enabled,
            sessionPersistenceEnabled: config.system.sessionPersistence.enabled
        }
    };
}
//# sourceMappingURL=environment.js.map