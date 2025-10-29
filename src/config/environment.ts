/**
 * Environment configuration loader
 */

import { config } from 'dotenv';
import { EnvironmentConfig, ChatBotConfig, RabbitMQConfig, AgentConfig, SystemConfig, SystemQueuePrefix, SystemSanitizeData, SystemLogLevel, EnvLogLevel, EnvNodeEnv, EnvRabbitHost, EnvRabbitPassword, EnvRabbitPort, EnvRabbitUsername, EnvRabbitVhost, SystemPortTcp } from '../types';
import { SessionPersistenceConfig } from '../types/session';
import { DEFAULT_AGENTS_FLOW, EXCHANGES, TIMEOUTS } from '../types/constants';
import { TimeDurationMS } from '@tys/shared/time-duration-ms';
import { MetricsRetryCount } from '@tys/shared';

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
    RABBITMQ_HOST: EnvRabbitHost.make(process.env.RABBITMQ_HOST!),
    RABBITMQ_PORT: EnvRabbitPort.make(process.env.RABBITMQ_PORT!),
    RABBITMQ_USERNAME: EnvRabbitUsername.make(process.env.RABBITMQ_USERNAME!),
    RABBITMQ_PASSWORD: EnvRabbitPassword.make(process.env.RABBITMQ_PASSWORD!),
    RABBITMQ_VHOST: EnvRabbitVhost.make(process.env.RABBITMQ_VHOST ? process.env.RABBITMQ_VHOST : '/'),
    NODE_ENV: EnvNodeEnv.make(
      process.env.NODE_ENV === 'production'
        ? 'production'
        : process.env.NODE_ENV === 'test'
        ? 'test'
        : 'development'
    ),
    LOG_LEVEL: EnvLogLevel.make(
      process.env.LOG_LEVEL === 'debug'
        ? 'debug'
        : process.env.LOG_LEVEL === 'warn'
        ? 'warn'
        : process.env.LOG_LEVEL === 'error'
        ? 'error'
        : 'info'
    ),
  };
}


/**
 * Create ChatBot configuration from environment
 */
export function createChatBotConfig(): ChatBotConfig {
  const env = loadEnvironmentConfig();

  const agentConfig: AgentConfig = {
    flow: [...DEFAULT_AGENTS_FLOW],
    timeouts: {
      userResponse: TimeDurationMS.make(parseInt(process.env.AGENT_TIMEOUT_USER_RESPONSE || '30000', 10)),
      reminderTimeout: TimeDurationMS.make(parseInt(process.env.AGENT_TIMEOUT_REMINDER || '60000', 10)),
      maxRetries: MetricsRetryCount.make(parseInt(process.env.AGENT_MAX_RETRIES || '3', 10))
    },
    duplicateMessagePrevention: {
      minInterval: TimeDurationMS.make(parseInt(process.env.MIN_MESSAGE_INTERVAL || '2000', 10))
    }
  };

  const sessionPersistenceConfig: SessionPersistenceConfig = {
    enabled: process.env.SESSION_PERSISTENCE_ENABLED !== 'false',
    storageType: 'file',
    filePath: process.env.SESSION_STORAGE_PATH || './sessions',
    cleanupInterval: TimeDurationMS.make(parseInt(process.env.SESSION_CLEANUP_INTERVAL || '300000', 10)),
    sessionTimeout: TimeDurationMS.make(parseInt(process.env.SESSION_TIMEOUT || '1800000', 10))
  };

  const systemConfig: SystemConfig = {
    exchanges: {
      agents: EXCHANGES.AGENTS,
      messages: EXCHANGES.MESSAGES,
      whatsapp: EXCHANGES.WHATSAPP
    },
    queues: {
      prefix: SystemQueuePrefix.make('queue-')
    },
    logging: {
      level: SystemLogLevel.make((env.LOG_LEVEL as any) || 'info'),
      sanitizeUserData: SystemSanitizeData.make(process.env.SANITIZE_USER_DATA === 'true' || env.NODE_ENV === 'production') as any,
    },
    sessionPersistence: sessionPersistenceConfig,
  };

  return {
    rabbitmq: {
      host: EnvRabbitHost.make(env.RABBITMQ_HOST),
      port: SystemPortTcp.make(EnvRabbitPort.make(env.RABBITMQ_PORT) as unknown as number),
      username: EnvRabbitUsername.make(env.RABBITMQ_USERNAME),
      password: EnvRabbitPassword.make(env.RABBITMQ_PASSWORD),
      vhost: EnvRabbitVhost.make(env.RABBITMQ_VHOST as unknown as string),
      protocol: 'amqp',
    },
    agents: agentConfig,
    system: systemConfig
  };
}

/**
 * Validate configuration and environment
 */
export function validateConfiguration(): void {
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
    if (TimeDurationMS.un(config.agents.timeouts.userResponse) < 1000 || TimeDurationMS.un(config.agents.timeouts.userResponse) === 0 || TimeDurationMS.un(config.agents.timeouts.userResponse) === undefined || TimeDurationMS.un(config.agents.timeouts.userResponse) === null) {
      throw new Error('User response timeout must be at least 1000ms');
    }

    if (TimeDurationMS.un(config.agents.timeouts.reminderTimeout) < TimeDurationMS.un(config.agents.timeouts.userResponse)  || TimeDurationMS.un(config.agents.timeouts.reminderTimeout) === 0 || TimeDurationMS.un(config.agents.timeouts.reminderTimeout) === undefined || TimeDurationMS.un(config.agents.timeouts.reminderTimeout) === null) {
      throw new Error('Reminder timeout must be greater than user response timeout');
    }

    // Validate performance settings
    if (config.system.sessionPersistence.enabled && TimeDurationMS.un(config.system.sessionPersistence.sessionTimeout ?? TimeDurationMS.make(0)) < 60000 || TimeDurationMS.un(config.system.sessionPersistence.sessionTimeout ?? TimeDurationMS.make(0)) === 0 || TimeDurationMS.un(config.system.sessionPersistence.sessionTimeout ?? TimeDurationMS.make(0)) === undefined || TimeDurationMS.un(config.system.sessionPersistence.sessionTimeout ?? TimeDurationMS.make(0)) === null || TimeDurationMS.un(config.system.sessionPersistence.sessionTimeout ?? TimeDurationMS.make(0)) === undefined) {
      throw new Error('Session timeout must be at least 60 seconds');
    }
    
    console.log('✅ Configuration validation passed');
  } catch (error) {
    console.error('❌ Configuration validation failed:', (error as Error).message);
    throw error;
  }
}

/**
 * Get configuration summary for logging
 */
export function getConfigurationSummary(): object {
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
      sessionPersistenceEnabled: config.system.sessionPersistence.enabled
    }
  };
}
