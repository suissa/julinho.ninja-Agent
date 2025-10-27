"use strict";
/**
 * Environment configuration loader
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnvironmentConfig = loadEnvironmentConfig;
exports.createChatBotConfig = createChatBotConfig;
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
        LOG_LEVEL: process.env.LOG_LEVEL || 'error'
    };
}
/**
 * Create ChatBot configuration from environment
 */
function createChatBotConfig() {
    const env = loadEnvironmentConfig();
    const rabbitmqConfig = {
        host: env.RABBITMQ_HOST,
        port: parseInt(env.RABBITMQ_PORT, 10),
        username: env.RABBITMQ_USERNAME,
        password: env.RABBITMQ_PASSWORD,
        vhost: env.RABBITMQ_VHOST || '/',
        protocol: 'amqp'
    };
    const agentConfig = {
        flow: [...constants_1.DEFAULT_AGENTS_FLOW],
        timeouts: {
            userResponse: constants_1.TIMEOUTS.USER_RESPONSE,
            reminderTimeout: constants_1.TIMEOUTS.REMINDER_TIMEOUT,
            maxRetries: constants_1.TIMEOUTS.MAX_RETRIES
        },
        duplicateMessagePrevention: {
            minInterval: constants_1.TIMEOUTS.MIN_MESSAGE_INTERVAL
        }
    };
    const sessionPersistenceConfig = {
        enabled: process.env.SESSION_PERSISTENCE_ENABLED !== 'false',
        storageType: 'file',
        filePath: process.env.SESSION_STORAGE_PATH || './sessions',
        cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL || '300000', 10), // 5 minutes
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '1800000', 10) // 30 minutes
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
            sanitizeUserData: env.NODE_ENV === 'production'
        },
        sessionPersistence: sessionPersistenceConfig
    };
    return {
        rabbitmq: rabbitmqConfig,
        agents: agentConfig,
        system: systemConfig
    };
}
//# sourceMappingURL=environment.js.map