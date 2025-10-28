/**
 * Configuration interfaces for the ChatBot system
 */

import { RabbitMQConfig } from './sdk';
import { SessionPersistenceConfig } from './session';
import { TimeDurationMS, MetricsRetryCount } from './shared';

/**
 * Main ChatBot configuration
 */
export interface ChatBotConfig {
  rabbitmq: RabbitMQConfig;
  agents: AgentConfig;
  system: SystemConfig;
}

/**
 * Agent configuration settings
 */
export interface AgentConfig {
  flow: string[];
  timeouts: {
    userResponse: TimeDurationMS;
    reminderTimeout: TimeDurationMS;
    maxRetries: MetricsRetryCount;
  };
  duplicateMessagePrevention: {
    minInterval: TimeDurationMS;
  };
}

/**
 * System-wide configuration
 */
export interface SystemConfig {
  exchanges: {
    agents: string;
    messages: string;
    whatsapp: string;
  };
  queues: {
    prefix: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    sanitizeUserData: boolean;
  };
  sessionPersistence: SessionPersistenceConfig;
}

/**
 * Environment variables interface
 */
export interface EnvironmentConfig {
  RABBITMQ_HOST: string;
  RABBITMQ_PORT: string;
  RABBITMQ_USERNAME: string;
  RABBITMQ_PASSWORD: string;
  RABBITMQ_VHOST?: string;
  NODE_ENV: 'development' | 'production' | 'test';
  LOG_LEVEL?: string;
}