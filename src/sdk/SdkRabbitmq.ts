/**
 * SdkRabbitmq - Singleton class for RabbitMQ operations
 * Provides simplified interface for RabbitMQ interactions with auto-reconnection
 */

import * as amqp from 'amqplib';
import { ISdkRabbitmq, RabbitMQConfig, MessageCallback } from '../types/sdk';
import { Logger } from '../utils/logger';

export class SdkRabbitmq implements ISdkRabbitmq {
  private static instance: SdkRabbitmq | null = null;
  private connection: any = null;
  private channel: any = null;
  private config: RabbitMQConfig;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000; // Start with 1 second
  private maxReconnectDelay: number = 30000; // Max 30 seconds
  private logger: Logger;

  private constructor(config: RabbitMQConfig) {
    this.config = config;
    this.logger = Logger.getInstance();
  }

  /**
   * Get singleton instance of SdkRabbitmq
   */
  public static async getInstance(config?: RabbitMQConfig): Promise<SdkRabbitmq> {
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
  private async connect(): Promise<void> {
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
        this.connection.on('error', (error: any) => {
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

    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      this.isConnected = false;
      this.scheduleReconnect();
      throw error;
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
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
      } catch (error) {
        this.logger.error('Reconnection attempt failed:', error);
      }
    }, delay);
  }

  /**
   * Ensure connection is available
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ connection not available');
    }
  }

  /**
   * Create exchange if it doesn't exist
   */
  private async ensureExchange(exchange: string, type: string = 'topic'): Promise<void> {
    await this.ensureConnection();
    await this.channel!.assertExchange(exchange, type, { durable: true });
  }

  /**
   * Create queue if it doesn't exist
   */
  private async ensureQueue(queueName: string): Promise<void> {
    await this.ensureConnection();
    await this.channel!.assertQueue(queueName, { durable: true });
  }

  /**
   * Publish message to exchange with routing key
   */
  public async publish(exchange: string, routingKey: string, message: object): Promise<void> {
    try {
      await this.ensureConnection();
      await this.ensureExchange(exchange);
      
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const published = this.channel!.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        timestamp: Date.now()
      });

      if (!published) {
        throw new Error('Failed to publish message - channel buffer full');
      }

      this.logger.debug('Message published', { exchange, routingKey, message });
    } catch (error) {
      this.logger.error('Failed to publish message:', error);
      throw error;
    }
  }

  /**
   * Subscribe to queue with callback for message processing
   */
  public async subscribe(exchange: string, queueName: string, routingKey: string, callback: MessageCallback): Promise<void> {
    try {
      await this.ensureConnection();
      await this.ensureExchange(exchange);
      await this.ensureQueue(queueName);
      
      // Bind queue to exchange with routing key
      await this.channel!.bindQueue(queueName, exchange, routingKey);
      
      // Set up consumer
      await this.channel!.consume(queueName, async (msg: any) => {
        if (msg) {
          try {
            // Log focado em exchange/routing (não enfatiza a queue)
            console.log(`🔥 MESSAGE RECEIVED - ${exchange}:${routingKey} :: ${msg.content.toString()}`);
            const content = JSON.parse(msg.content.toString());
            this.logger.debug('Message received', { exchange, queueName, routingKey, content });
            
            await callback(content);
            this.channel!.ack(msg);
          } catch (error) {
            console.error(`❌ ERROR PROCESSING MESSAGE - Queue: ${queueName}, Error:`, error);
            console.error(`❌ RAW MESSAGE CONTENT:`, msg.content?.toString());
            this.logger.error('Error processing message:', error);
            this.channel!.nack(msg, false, false); // Don't requeue failed messages
          }
        }
      });

      this.logger.info('Subscribed to queue', { exchange, queueName, routingKey });
    } catch (error) {
      this.logger.error('Failed to subscribe to queue:', error);
      throw error;
    }
  }

  /**
   * Bind queue to exchange with routing key
   */
  public async bind(exchange: string, queueName: string, routingKey: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.ensureExchange(exchange);
      await this.ensureQueue(queueName);
      
      await this.channel!.bindQueue(queueName, exchange, routingKey);
      this.logger.info('Queue bound to exchange', { exchange, queueName, routingKey });
    } catch (error) {
      this.logger.error('Failed to bind queue:', error);
      throw error;
    }
  }

  /**
   * Unbind queue from exchange with routing key
   */
  public async unbind(exchange: string, queueName: string, routingKey: string): Promise<void> {
    try {
      await this.ensureConnection();
      
      await this.channel!.unbindQueue(queueName, exchange, routingKey);
      this.logger.info('Queue unbound from exchange', { exchange, queueName, routingKey });
    } catch (error) {
      this.logger.error('Failed to unbind queue:', error);
      throw error;
    }
  }

  /**
   * Purge all messages from queue
   */
  public async purgeQueue(queueName: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.ensureQueue(queueName);
      
      const result = await this.channel!.purgeQueue(queueName);
      this.logger.info('Queue purged', { queueName, messageCount: result.messageCount });
    } catch (error) {
      this.logger.error('Failed to purge queue:', error);
      throw error;
    }
  }

  /**
   * Close connection and cleanup resources
   */
  public async close(): Promise<void> {
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
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection:', error);
      throw error;
    }
  }

  /**
   * Check if SDK is connected and ready
   */
  public isReady(): boolean {
    return this.isConnected && this.channel !== null;
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): { connected: boolean; reconnectAttempts: number } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}
