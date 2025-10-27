/**
 * Environment configuration loader
 */

import { config } from 'dotenv';
import { EnvironmentConfig, ChatBotConfig, RabbitMQConfig, AgentConfig, SystemConfig } from '../types';
import { SessionPersistenceConfig } from '../types/session';
import { DEFAULT_AGENTS_FLOW, EXCHANGES, TIMEOUTS } from '../types/constants';

// Load environment variables
config();

/**
 * Load and validate environment configuration
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  const requiredVars = ['RABBITMQ_HOST', 'RABBITMQ_PORT', 'RABBITMQ_USERNAME', 'RABBITMQ_PASSWORD'];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Required environment variable ${varName} is not set`);
    }
  }

  return {
    RABBITMQ_HOST: process.env.RABBITMQ_HOST!,
    RABBITMQ_PORT: process.env.RABBITMQ_PORT!,
    RABBITMQ_USERNAME: process.env.RABBITMQ_USERNAME!,
    RABBITMQ_PASSWORD: process.env.RABBITMQ_PASSWORD!,
    RABBITMQ_VHOST: process.env.RABBITMQ_VHOST || '/',
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
  };
}

/**
 * Create ChatBot configuration from environment
 */
export function createChatBotConfig(): ChatBotConfig {
  const env = loadEnvironmentConfig();

  const rabbitmqConfig: RabbitMQConfig = {
    host: env.RABBITMQ_HOST,
    port: parseInt(env.RABBITMQ_PORT, 10),
    username: env.RABBITMQ_USERNAME,
    password: env.RABBITMQ_PASSWORD,
    vhost: env.RABBITMQ_VHOST || '/',
    protocol: 'amqp'
  };

  const agentConfig: AgentConfig = {
    flow: [...DEFAULT_AGENTS_FLOW],
    timeouts: {
      userResponse: TIMEOUTS.USER_RESPONSE,
      reminderTimeout: TIMEOUTS.REMINDER_TIMEOUT,
      maxRetries: TIMEOUTS.MAX_RETRIES
    },
    duplicateMessagePrevention: {
      minInterval: TIMEOUTS.MIN_MESSAGE_INTERVAL
    }
  };

  const sessionPersistenceConfig: SessionPersistenceConfig = {
    enabled: process.env.SESSION_PERSISTENCE_ENABLED !== 'false',
    storageType: 'file',
    filePath: process.env.SESSION_STORAGE_PATH || './sessions',
    cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL || '300000', 10), // 5 minutes
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '1800000', 10) // 30 minutes
  };

  const systemConfig: SystemConfig = {
    exchanges: {
      agents: EXCHANGES.AGENTS,
      messages: EXCHANGES.MESSAGES,
      whatsapp: EXCHANGES.WHATSAPP
    },
    queues: {
      prefix: 'queue-'
    },
    logging: {
      level: (env.LOG_LEVEL as any) || 'error',
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