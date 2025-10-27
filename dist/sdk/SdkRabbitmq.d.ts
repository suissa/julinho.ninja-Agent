/**
 * SdkRabbitmq - Singleton class for RabbitMQ operations
 * Provides simplified interface for RabbitMQ interactions with auto-reconnection
 */
import { ISdkRabbitmq, RabbitMQConfig, MessageCallback } from '../types/sdk';
export declare class SdkRabbitmq implements ISdkRabbitmq {
    private static instance;
    private connection;
    private channel;
    private config;
    private isConnected;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private maxReconnectDelay;
    private logger;
    private constructor();
    /**
     * Get singleton instance of SdkRabbitmq
     */
    static getInstance(config?: RabbitMQConfig): Promise<SdkRabbitmq>;
    /**
     * Establish connection to RabbitMQ with error handling
     */
    private connect;
    /**
     * Schedule reconnection with exponential backoff
     */
    private scheduleReconnect;
    /**
     * Ensure connection is available
     */
    private ensureConnection;
    /**
     * Create exchange if it doesn't exist
     */
    private ensureExchange;
    /**
     * Create queue if it doesn't exist
     */
    private ensureQueue;
    /**
     * Publish message to exchange with routing key
     */
    publish(exchange: string, routingKey: string, message: object): Promise<void>;
    /**
     * Subscribe to queue with callback for message processing
     */
    subscribe(exchange: string, queueName: string, routingKey: string, callback: MessageCallback): Promise<void>;
    /**
     * Bind queue to exchange with routing key
     */
    bind(exchange: string, queueName: string, routingKey: string): Promise<void>;
    /**
     * Unbind queue from exchange with routing key
     */
    unbind(exchange: string, queueName: string, routingKey: string): Promise<void>;
    /**
     * Purge all messages from queue
     */
    purgeQueue(queueName: string): Promise<void>;
    /**
     * Close connection and cleanup resources
     */
    close(): Promise<void>;
    /**
     * Check if SDK is connected and ready
     */
    isReady(): boolean;
    /**
     * Get current connection status
     */
    getConnectionStatus(): {
        connected: boolean;
        reconnectAttempts: number;
    };
}
//# sourceMappingURL=SdkRabbitmq.d.ts.map