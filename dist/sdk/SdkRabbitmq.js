"use strict";
/**
 * SdkRabbitmq - Singleton class for RabbitMQ operations
 * Provides simplified interface for RabbitMQ interactions with auto-reconnection
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SdkRabbitmq = void 0;
const amqp = __importStar(require("amqplib"));
const logger_1 = require("../utils/logger");
class SdkRabbitmq {
    constructor(config) {
        this.connection = null;
        this.channel = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000; // Start with 1 second
        this.maxReconnectDelay = 30000; // Max 30 seconds
        this.config = config;
        this.logger = logger_1.Logger.getInstance();
    }
    /**
     * Get singleton instance of SdkRabbitmq
     */
    static async getInstance(config) {
        if (!SdkRabbitmq.instance) {
            if (!config) {
                throw new Error('Configuration required for first initialization');
            }
            SdkRabbitmq.instance = new SdkRabbitmq(config);
            await SdkRabbitmq.instance.connect();
        }
        return SdkRabbitmq.instance;
    }
    /**
     * Establish connection to RabbitMQ with error handling
     */
    async connect() {
        try {
            const connectionUrl = `${this.config.protocol || 'amqp'}://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}${this.config.vhost || ''}`;
            this.logger.info('Connecting to RabbitMQ...', { host: this.config.host, port: this.config.port });
            this.connection = await amqp.connect(connectionUrl);
            this.channel = await this.connection.createChannel();
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000; // Reset delay on successful connection
            this.logger.info('Successfully connected to RabbitMQ');
            // Set up connection error handlers
            if (this.connection) {
                this.connection.on('error', (error) => {
                    this.logger.error('RabbitMQ connection error:', error);
                    this.isConnected = false;
                    this.scheduleReconnect();
                });
                this.connection.on('close', () => {
                    this.logger.warn('RabbitMQ connection closed');
                    this.isConnected = false;
                    this.scheduleReconnect();
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to connect to RabbitMQ:', error);
            this.isConnected = false;
            this.scheduleReconnect();
            throw error;
        }
    }
    /**
     * Schedule reconnection with exponential backoff
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error('Max reconnection attempts reached. Giving up.');
            return;
        }
        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
        this.logger.info(`Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        setTimeout(async () => {
            try {
                await this.connect();
            }
            catch (error) {
                this.logger.error('Reconnection attempt failed:', error);
            }
        }, delay);
    }
    /**
     * Ensure connection is available
     */
    async ensureConnection() {
        if (!this.isConnected || !this.channel) {
            throw new Error('RabbitMQ connection not available');
        }
    }
    /**
     * Create exchange if it doesn't exist
     */
    async ensureExchange(exchange, type = 'topic') {
        await this.ensureConnection();
        await this.channel.assertExchange(exchange, type, { durable: true });
    }
    /**
     * Create queue if it doesn't exist
     */
    async ensureQueue(queueName) {
        await this.ensureConnection();
        await this.channel.assertQueue(queueName, { durable: true });
    }
    /**
     * Publish message to exchange with routing key
     */
    async publish(exchange, routingKey, message) {
        try {
            await this.ensureConnection();
            await this.ensureExchange(exchange);
            const messageBuffer = Buffer.from(JSON.stringify(message));
            const published = this.channel.publish(exchange, routingKey, messageBuffer, {
                persistent: true,
                timestamp: Date.now()
            });
            if (!published) {
                throw new Error('Failed to publish message - channel buffer full');
            }
            this.logger.debug('Message published', { exchange, routingKey, message });
        }
        catch (error) {
            this.logger.error('Failed to publish message:', error);
            throw error;
        }
    }
    /**
     * Subscribe to queue with callback for message processing
     */
    async subscribe(exchange, queueName, routingKey, callback) {
        try {
            await this.ensureConnection();
            await this.ensureExchange(exchange);
            await this.ensureQueue(queueName);
            // Bind queue to exchange with routing key
            await this.channel.bindQueue(queueName, exchange, routingKey);
            // Set up consumer
            await this.channel.consume(queueName, async (msg) => {
                if (msg) {
                    try {
                        console.log(`🔥 RAW MESSAGE RECEIVED - Queue: ${queueName}, Content: ${msg.content.toString()}`);
                        const content = JSON.parse(msg.content.toString());
                        this.logger.debug('Message received', { exchange, queueName, routingKey, content });
                        await callback(content);
                        this.channel.ack(msg);
                    }
                    catch (error) {
                        console.error(`❌ ERROR PROCESSING MESSAGE - Queue: ${queueName}, Error:`, error);
                        console.error(`❌ RAW MESSAGE CONTENT:`, msg.content?.toString());
                        this.logger.error('Error processing message:', error);
                        this.channel.nack(msg, false, false); // Don't requeue failed messages
                    }
                }
            });
            this.logger.info('Subscribed to queue', { exchange, queueName, routingKey });
        }
        catch (error) {
            this.logger.error('Failed to subscribe to queue:', error);
            throw error;
        }
    }
    /**
     * Bind queue to exchange with routing key
     */
    async bind(exchange, queueName, routingKey) {
        try {
            await this.ensureConnection();
            await this.ensureExchange(exchange);
            await this.ensureQueue(queueName);
            await this.channel.bindQueue(queueName, exchange, routingKey);
            this.logger.info('Queue bound to exchange', { exchange, queueName, routingKey });
        }
        catch (error) {
            this.logger.error('Failed to bind queue:', error);
            throw error;
        }
    }
    /**
     * Unbind queue from exchange with routing key
     */
    async unbind(exchange, queueName, routingKey) {
        try {
            await this.ensureConnection();
            await this.channel.unbindQueue(queueName, exchange, routingKey);
            this.logger.info('Queue unbound from exchange', { exchange, queueName, routingKey });
        }
        catch (error) {
            this.logger.error('Failed to unbind queue:', error);
            throw error;
        }
    }
    /**
     * Purge all messages from queue
     */
    async purgeQueue(queueName) {
        try {
            await this.ensureConnection();
            await this.ensureQueue(queueName);
            const result = await this.channel.purgeQueue(queueName);
            this.logger.info('Queue purged', { queueName, messageCount: result.messageCount });
        }
        catch (error) {
            this.logger.error('Failed to purge queue:', error);
            throw error;
        }
    }
    /**
     * Close connection and cleanup resources
     */
    async close() {
        try {
            if (this.channel) {
                await this.channel.close();
                this.channel = null;
            }
            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }
            this.isConnected = false;
            SdkRabbitmq.instance = null;
            this.logger.info('RabbitMQ connection closed');
        }
        catch (error) {
            this.logger.error('Error closing RabbitMQ connection:', error);
            throw error;
        }
    }
    /**
     * Check if SDK is connected and ready
     */
    isReady() {
        return this.isConnected && this.channel !== null;
    }
    /**
     * Get current connection status
     */
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}
exports.SdkRabbitmq = SdkRabbitmq;
SdkRabbitmq.instance = null;
//# sourceMappingURL=SdkRabbitmq.js.map