/**
 * SdkRabbitmq interfaces for RabbitMQ operations
 */

export interface ISdkRabbitmq {
  /**
   * Publish message to exchange with routing key
   */
  publish(exchange: string, routingKey: string, message: object): Promise<void>;
  
  /**
   * Subscribe to queue with callback for message processing
   */
  subscribe(exchange: string, queueName: string, routingKey: string, callback: Function): Promise<void>;
  
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
}

/**
 * SdkRabbitmq class interface (for implementation)
 */
export interface SdkRabbitmq extends ISdkRabbitmq {
  // Static method for singleton pattern
}

/**
 * RabbitMQ connection configuration
 */
export interface RabbitMQConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  vhost?: string;
  protocol?: string;
}

/**
 * Message callback function type
 */
export type MessageCallback = (message: any) => void | Promise<void>;