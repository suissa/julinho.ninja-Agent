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
export declare class Logger {
    private static instance;
    private logLevel;
    private sanitizeUserData;
    private performanceTracking;
    private logBuffer;
    private maxBufferSize;
    private flushInterval;
    private flushTimer?;
    private performanceTimers;
    private constructor();
    static getInstance(): Logger;
    configure(level: LogLevel, sanitizeUserData?: boolean, performanceTracking?: boolean): void;
    /**
     * Start automatic log buffer flushing
     */
    private startLogFlushing;
    /**
     * Flush buffered logs to console
     */
    private flushLogs;
    /**
     * Get current performance metrics
     */
    private getPerformanceMetrics;
    /**
     * Start performance timer for an operation
     */
    startPerformanceTimer(operationId: string): void;
    /**
     * End performance timer and return duration
     */
    endPerformanceTimer(operationId: string): number;
    private shouldLog;
    private sanitizeData;
    private log;
    private formatLogMessage;
    debug(message: string, context?: any, number?: string, agentName?: string, duration?: number): void;
    info(message: string, context?: any, number?: string, agentName?: string, duration?: number): void;
    warn(message: string, context?: any, number?: string, agentName?: string, duration?: number): void;
    error(message: string, context?: any, number?: string, agentName?: string, error?: Error): void;
    /**
     * Log structured agent activation with comprehensive details
     */
    agentActivation(activationData: AgentActivationLog): void;
    /**
     * Log agent activation completion with performance metrics
     */
    agentActivationComplete(agentName: string, number: string): void;
    /**
     * Log sanitized user input processing with validation results
     */
    userInputProcessed(inputData: UserInputLog): void;
    /**
     * Log agent routing with detailed transition information
     */
    agentRouting(fromAgent: string, toAgent: string, number: string, reason?: string): void;
    /**
     * Log system errors with comprehensive stack traces and context
     */
    systemError(error: Error, context?: any, number?: string, agentName?: string): void;
    /**
     * Log performance metrics for operations
     */
    performanceMetric(operationName: string, duration: number, additionalMetrics?: any): void;
    /**
     * Log session lifecycle events
     */
    sessionEvent(event: 'created' | 'restored' | 'expired' | 'cleaned', number: string, details?: any): void;
    /**
     * Log timeout events with context
     */
    timeoutEvent(type: 'user_response' | 'reminder' | 'final', number: string, agentName: string, stage: string): void;
    /**
     * Log message sending with duplicate prevention tracking
     */
    messageSent(number: string, agentName: string, messageLength: number, isDuplicate?: boolean): void;
    /**
     * Log validation errors with detailed information
     */
    validationError(number: string, agentName: string, input: string, errors: string[], attemptCount: number): void;
    /**
     * Shutdown logger and flush remaining logs
     */
    shutdown(): void;
}
//# sourceMappingURL=logger.d.ts.map