/**
 * Configuration interfaces for the ChatBot system
 */

import { RabbitMQConfig } from '@tys/sdk';
import { SessionPersistenceConfig } from '@tys/session';
import { TimeDurationMS, MetricsRetryCount } from '@tys/shared';



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