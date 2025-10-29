/**
 * Configuration interfaces for the ChatBot system
 */

import { RabbitMQConfig } from '@tys/sdk';
import { SessionPersistenceConfig } from '@tys/session';
import { TimeDurationMS, MetricsRetryCount } from '@tys/shared';

// Tipagem Semântica Atômica - Inline Implementation (Tipos únicos para config)
// Sistema de branding sem runtime overhead
declare const __brand: unique symbol;
type Brand<T, Name extends string> = T & { readonly [__brand]: Name };

function STAMP<Name extends string>() {
  return {
    of: <T>(v: T) => v as Brand<T, Name>,
    un: <T>(v: Brand<T, Name>) => v as unknown as T,
  };
}

// Tipos Semânticos para System Domain (RabbitMQ/Config)
export type SystemExchangeName = Brand<string, "system.exchange.name">;
export type SystemQueuePrefix = Brand<string, "system.queue.prefix">;
export type SystemLogLevel = Brand<'debug' | 'info' | 'warn' | 'error', "system.log.level">;
export type SystemSanitizeData = Brand<boolean, "system.sanitize.data">;

// Tipos Semânticos para Environment Domain (RabbitMQ env vars)
export type EnvRabbitHost = Brand<string, "env.rabbitmq.host">;
export type EnvRabbitPort = Brand<string, "env.rabbitmq.port">;
export type EnvRabbitUsername = Brand<string, "env.rabbitmq.username">;
export type EnvRabbitPassword = Brand<string, "env.rabbitmq.password">;
export type EnvRabbitVhost = Brand<string, "env.rabbitmq.vhost">;
export type EnvNodeEnv = Brand<'development' | 'production' | 'test', "env.node.env">;
export type EnvLogLevel = Brand<string, "env.log.level">;

// Implementações dos tipos únicos
const SystemExchangeNameStamp = STAMP<"system.exchange.name">();
const SystemQueuePrefixStamp = STAMP<"system.queue.prefix">();
const SystemLogLevelStamp = STAMP<"system.log.level">();
const SystemSanitizeDataStamp = STAMP<"system.sanitize.data">();
const EnvRabbitHostStamp = STAMP<"env.rabbitmq.host">();
const EnvRabbitPortStamp = STAMP<"env.rabbitmq.port">();
const EnvRabbitUsernameStamp = STAMP<"env.rabbitmq.username">();
const EnvRabbitPasswordStamp = STAMP<"env.rabbitmq.password">();
const EnvRabbitVhostStamp = STAMP<"env.rabbitmq.vhost">();
const EnvNodeEnvStamp = STAMP<"env.node.env">();
const EnvLogLevelStamp = STAMP<"env.log.level">();

export const SystemExchangeName = (() => ({
  of: (v: unknown): SystemExchangeName => SystemExchangeNameStamp.of(String(v)),
  un: (v: SystemExchangeName): string => SystemExchangeNameStamp.un(v),
  make: (value: string): SystemExchangeName => SystemExchangeName.of(value),
}))();

export const SystemQueuePrefix = (() => ({
  of: (v: unknown): SystemQueuePrefix => SystemQueuePrefixStamp.of(String(v)),
  un: (v: SystemQueuePrefix): string => SystemQueuePrefixStamp.un(v),
  make: (value: string): SystemQueuePrefix => SystemQueuePrefix.of(value),
}))();

export const SystemLogLevel = (() => ({
  of: (v: unknown): SystemLogLevel => SystemLogLevelStamp.of(v as 'debug' | 'info' | 'warn' | 'error'),
  un: (v: SystemLogLevel): 'debug' | 'info' | 'warn' | 'error' => SystemLogLevelStamp.un(v),
  make: (value: 'debug' | 'info' | 'warn' | 'error'): SystemLogLevel => SystemLogLevel.of(value),
}))();

export const SystemSanitizeData = (() => ({
  of: (v: unknown): SystemSanitizeData => SystemSanitizeDataStamp.of(Boolean(v)),
  un: (v: SystemSanitizeData): boolean => SystemSanitizeDataStamp.un(v),
  make: (value: boolean): SystemSanitizeData => SystemSanitizeData.of(value),
}))();

export const EnvRabbitHost = (() => ({
  of: (v: unknown): EnvRabbitHost => EnvRabbitHostStamp.of(String(v)),
  un: (v: EnvRabbitHost): string => EnvRabbitHostStamp.un(v),
  make: (value: string): EnvRabbitHost => EnvRabbitHost.of(value),
}))();

export const EnvRabbitPort = (() => ({
  of: (v: unknown): EnvRabbitPort => EnvRabbitPortStamp.of(String(v)),
  un: (v: EnvRabbitPort): string => EnvRabbitPortStamp.un(v),
  make: (value: string): EnvRabbitPort => EnvRabbitPort.of(value),
}))();

export const EnvRabbitUsername = (() => ({
  of: (v: unknown): EnvRabbitUsername => EnvRabbitUsernameStamp.of(String(v)),
  un: (v: EnvRabbitUsername): string => EnvRabbitUsernameStamp.un(v),
  make: (value: string): EnvRabbitUsername => EnvRabbitUsername.of(value),
}))();

export const EnvRabbitPassword = (() => ({
  of: (v: unknown): EnvRabbitPassword => EnvRabbitPasswordStamp.of(String(v)),
  un: (v: EnvRabbitPassword): string => EnvRabbitPasswordStamp.un(v),
  make: (value: string): EnvRabbitPassword => EnvRabbitPassword.of(value),
}))();

export const EnvRabbitVhost = (() => ({
  of: (v: unknown): EnvRabbitVhost => EnvRabbitVhostStamp.of(String(v)),
  un: (v: EnvRabbitVhost): string => EnvRabbitVhostStamp.un(v),
  make: (value: string): EnvRabbitVhost => EnvRabbitVhost.of(value),
}))();

export const EnvNodeEnv = (() => ({
  of: (v: unknown): EnvNodeEnv => EnvNodeEnvStamp.of(v as 'development' | 'production' | 'test'),
  un: (v: EnvNodeEnv): 'development' | 'production' | 'test' => EnvNodeEnvStamp.un(v),
  make: (value: 'development' | 'production' | 'test'): EnvNodeEnv => EnvNodeEnv.of(value),
}))();

export const EnvLogLevel = (() => ({
  of: (v: unknown): EnvLogLevel => EnvLogLevelStamp.of(String(v)),
  un: (v: EnvLogLevel): string => EnvLogLevelStamp.un(v),
  make: (value: string): EnvLogLevel => EnvLogLevel.of(value),
}))();

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
    agents: SystemExchangeName;
    messages: SystemExchangeName;
    whatsapp: SystemExchangeName;
  };
  queues: {
    prefix: SystemQueuePrefix;
  };
  logging: {
    level: SystemLogLevel;
    sanitizeUserData: SystemSanitizeData;
  };
  sessionPersistence: SessionPersistenceConfig;
}

/**
 * Environment variables interface
 */
export interface EnvironmentConfig {
  RABBITMQ_HOST: EnvRabbitHost;
  RABBITMQ_PORT: EnvRabbitPort;
  RABBITMQ_USERNAME: EnvRabbitUsername;
  RABBITMQ_PASSWORD: EnvRabbitPassword;
  RABBITMQ_VHOST?: EnvRabbitVhost;
  NODE_ENV: EnvNodeEnv;
  LOG_LEVEL?: EnvLogLevel;
}