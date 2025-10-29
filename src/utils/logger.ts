/**
 * Logging utility for the ChatBot system
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: any;
  number?: string;
  agentName?: string;
  duration?: number;
  errorStack?: string;
  performanceMetrics?: PerformanceMetrics;
}

export interface PerformanceMetrics {
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  operationDuration?: number;
  queueSize?: number;
  activeConnections?: number;
}

export interface AgentActivationLog {
  agentName: string;
  number: string;
  activatedBy: string;
  timestamp: number;
  stage: string;
  sessionId?: string;
}

export interface UserInputLog {
  number: string;
  agentName: string;
  inputLength: number;
  isValid: boolean;
  validationErrors?: string[];
  processingTime: number;
  sanitizedInput?: string;
}

/**
 * Comprehensive logger implementation with structured logging, performance monitoring, and error tracking
 */
export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = 'info';
  private sanitizeUserData: boolean = true;
  private performanceTracking: boolean = true;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize: number = 1000;
  private flushInterval: number = 5000; // 5 seconds
  private flushTimer?: NodeJS.Timeout;
  private performanceTimers: Map<string, { start: number; cpuStart?: NodeJS.CpuUsage }> = new Map();

  private constructor() {
    this.startLogFlushing();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  configure(level: LogLevel, sanitizeUserData: boolean = true, performanceTracking: boolean = true): void {
    this.logLevel = level;
    this.sanitizeUserData = sanitizeUserData;
    this.performanceTracking = performanceTracking;
  }

  /**
   * Start automatic log buffer flushing
   */
  private startLogFlushing(): void {
    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  /**
   * Flush buffered logs to console
   */
  private flushLogs(): void {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    logsToFlush.forEach(entry => {
      const logMessage = this.formatLogMessage(entry);
      
      switch (entry.level) {
        case 'error':
          console.error(logMessage);
          break;
        case 'warn':
          console.warn(logMessage);
          break;
        case 'debug':
          console.debug(logMessage);
          break;
        default:
          console.log(logMessage);
      }
    });
  }

  /**
   * Get current performance metrics
   */
  private getPerformanceMetrics(): PerformanceMetrics {
    if (!this.performanceTracking) return {};

    return {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  }

  /**
   * Start performance timer for an operation
   */
  startPerformanceTimer(operationId: string): void {
    if (!this.performanceTracking) return;

    this.performanceTimers.set(operationId, {
      start: Date.now(),
      cpuStart: process.cpuUsage()
    });
  }

  /**
   * End performance timer and return duration
   */
  endPerformanceTimer(operationId: string): number {
    if (!this.performanceTracking) return 0;

    const timer = this.performanceTimers.get(operationId);
    if (!timer) return 0;

    const duration = Date.now() - timer.start;
    this.performanceTimers.delete(operationId);
    return duration;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private sanitizeData(data: any): any {
    if (!this.sanitizeUserData) {
      return data;
    }

    if (typeof data === 'string') {
      // Sanitize potential PII
      return data.replace(/\b\d{11}\b/g, '***CPF***')
                 .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***EMAIL***');
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (key.toLowerCase().includes('cpf')) {
          sanitized[key] = '***CPF***';
        } else if (key.toLowerCase().includes('email')) {
          sanitized[key] = '***EMAIL***';
        } else if (key.toLowerCase().includes('name')) {
          sanitized[key] = '***NAME***';
        } else {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  private log(level: LogLevel, message: string, context?: any, number?: string, agentName?: string, duration?: number, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      ...(context && { context: this.sanitizeData(context) }),
      ...(number && { number: this.sanitizeData(number) }),
      ...(agentName && { agentName }),
      ...(duration !== undefined && { duration }),
      ...(error?.stack && { errorStack: error.stack }),
      ...(this.performanceTracking && { performanceMetrics: this.getPerformanceMetrics() })
    };

    // Add to buffer for batch processing
    this.logBuffer.push(logEntry);

    // Flush immediately for errors or if buffer is full
    if (level === 'error' || this.logBuffer.length >= this.maxBufferSize) {
      this.flushLogs();
    }
  }

  private formatLogMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    
    let message = `[${timestamp}] ${level} ${entry.message}`;
    
    if (entry.agentName) {
      message += ` [Agent: ${entry.agentName}]`;
    }
    
    if (entry.number) {
      message += ` [Phone: ${entry.number}]`;
    }

    if (entry.duration !== undefined) {
      message += ` [Duration: ${entry.duration}ms]`;
    }
    
    if (entry.context) {
      message += ` [Context: ${JSON.stringify(entry.context)}]`;
    }

    if (entry.performanceMetrics && this.performanceTracking) {
      const metrics = entry.performanceMetrics;
      if (metrics.memoryUsage) {
        const memMB = Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024);
        message += ` [Memory: ${memMB}MB]`;
      }
    }

    if (entry.errorStack) {
      message += `\nStack Trace:\n${entry.errorStack}`;
    }
    
    return message;
  }

  debug(message: string, context?: any, number?: string, agentName?: string, duration?: number): void {
    this.log('debug', message, context, number, agentName, duration);
  }

  info(message: string, context?: any, number?: string, agentName?: string, duration?: number): void {
    this.log('info', message, context, number, agentName, duration);
  }

  warn(message: string, context?: any, number?: string, agentName?: string, duration?: number): void {
    this.log('warn', message, context, number, agentName, duration);
  }

  error(message: string, context?: any, number?: string, agentName?: string, error?: Error): void {
    this.log('error', message, context, number, agentName, undefined, error);
  }

  // Specific logging methods for common scenarios
  
  /**
   * Log structured agent activation with comprehensive details
   */
  agentActivation(activationData: AgentActivationLog): void {
    const operationId = `activation-${activationData.number}-${activationData.agentName}`;
    this.startPerformanceTimer(operationId);
    
    this.info(`Agent activated`, {
      action: 'activation',
      activatedBy: activationData.activatedBy,
      stage: activationData.stage,
      sessionId: activationData.sessionId,
      timestamp: activationData.timestamp
    }, activationData.number, activationData.agentName);
  }

  /**
   * Log agent activation completion with performance metrics
   */
  agentActivationComplete(agentName: string, number: string): void {
    const operationId = `activation-${number}-${agentName}`;
    const duration = this.endPerformanceTimer(operationId);
    
    this.info(`Agent activation completed`, {
      action: 'activation_complete'
    }, number, agentName, duration);
  }

  /**
   * Log sanitized user input processing with validation results
   */
  userInputProcessed(inputData: UserInputLog): void {
    this.info(`User input processed`, {
      action: 'input_processing',
      inputLength: inputData.inputLength,
      valid: inputData.isValid,
      validationErrors: inputData.validationErrors,
      sanitizedInput: inputData.sanitizedInput
    }, inputData.number, inputData.agentName, inputData.processingTime);
  }

  /**
   * Log agent routing with detailed transition information
   */
  agentRouting(fromAgent: string, toAgent: string, number: string, reason?: string): void {
    this.info(`Agent routing`, {
      action: 'routing',
      from: fromAgent,
      to: toAgent,
      reason: reason || 'normal_flow'
    }, number, fromAgent);
  }

  /**
   * Log system errors with comprehensive stack traces and context
   */
  systemError(error: Error, context?: any, number?: string, agentName?: string): void {
    this.error(`System error: ${error.message}`, {
      errorName: error.name,
      ...context
    }, number, agentName, error);
  }

  /**
   * Log performance metrics for operations
   */
  performanceMetric(operationName: string, duration: number, additionalMetrics?: any): void {
    this.info(`Performance metric`, {
      action: 'performance',
      operation: operationName,
      ...additionalMetrics
    }, undefined, undefined, duration);
  }

  /**
   * Log session lifecycle events
   */
  sessionEvent(event: 'created' | 'restored' | 'expired' | 'cleaned', number: string, details?: any): void {
    this.info(`Session ${event}`, {
      action: 'session_lifecycle',
      event,
      ...details
    }, number);
  }

  /**
   * Log timeout events with context
   */
  timeoutEvent(type: 'user_response' | 'reminder' | 'final', number: string, agentName: string, stage: string): void {
    this.warn(`Timeout occurred`, {
      action: 'timeout',
      type,
      stage
    }, number, agentName);
  }

  /**
   * Log message sending with duplicate prevention tracking
   */
  messageSent(number: string, agentName: string, messageLength: number, isDuplicate: boolean = false): void {
    this.info(`Message sent to WhatsApp`, {
      action: 'message_sent',
      messageLength,
      isDuplicate
    }, number, agentName);
  }

  /**
   * Log validation errors with detailed information
   */
  validationError(number: string, agentName: string, input: string, errors: string[], attemptCount: number): void {
    this.warn(`Input validation failed`, {
      action: 'validation_error',
      errors,
      attemptCount,
      inputLength: input.length
    }, number, agentName);
  }

  /**
   * Shutdown logger and flush remaining logs
   */
  shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushLogs();
    this.info('Logger shutdown completed');
  }
}
