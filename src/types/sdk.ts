/**
 * SdkRabbitmq interfaces for RabbitMQ operations
 */

// Tipagem Semântica Atômica - Inline Implementation
// Sistema de branding sem runtime overhead
declare const __brand: unique symbol;
type Brand<T, Name extends string> = T & { readonly [__brand]: Name };

function STAMP<Name extends string>() {
  return {
    of: <T>(v: T) => v as Brand<T, Name>,
    un: <T>(v: Brand<T, Name>) => v as unknown as T,
  };
}

// Tipos Semânticos para System Domain
export type SystemPortTcp = Brand<number, "system.port.tcp">;

// Implementações dos tipos semânticos
const SystemPortTcpStamp = STAMP<"system.port.tcp">();

export const SystemPortTcp = (() => ({
  of: (v: unknown): SystemPortTcp => {
    const n = Number(v);
    if (!Number.isInteger(n)) throw new TypeError("porta deve ser um número inteiro");
    if (n < 1 || n > 65535) throw new TypeError("porta deve estar entre 1 e 65535");
    return SystemPortTcpStamp.of(n);
  },
  un: (v: SystemPortTcp): number => SystemPortTcpStamp.un(v),
  make: (value: number): SystemPortTcp => SystemPortTcp.of(value),
}))();

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
  port: SystemPortTcp;
  username: string;
  password: string;
  vhost?: string;
  protocol?: string;
}

/**
 * Message callback function type
 */
export type MessageCallback = (message: any) => void | Promise<void>;