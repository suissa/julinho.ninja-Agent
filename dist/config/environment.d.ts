/**
 * Environment configuration loader
 */
import { EnvironmentConfig, ChatBotConfig, RabbitMQConfig } from '../types';
/**
 * Load and validate environment configuration
 */
export declare function loadEnvironmentConfig(): EnvironmentConfig;
/**
 * Create enhanced RabbitMQ configuration from environment
 */
export declare function createRabbitMQConfig(): RabbitMQConfig;
/**
 * Create ChatBot configuration from environment
 */
export declare function createChatBotConfig(): ChatBotConfig;
/**
 * Validate configuration and environment
 */
export declare function validateConfiguration(): void;
/**
 * Get configuration summary for logging
 */
export declare function getConfigurationSummary(): object;
//# sourceMappingURL=environment.d.ts.map