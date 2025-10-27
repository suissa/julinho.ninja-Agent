/**
 * Base Agent class - Abstract base for all agents
 * Provides common functionality for all agent implementations
 */
import { IAgent } from '../types/agent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';
import { AgentActivationPayload } from '../types/messages';
import { Logger } from '../utils/logger';
export declare abstract class BaseAgent implements IAgent {
    protected routingKey: string;
    protected agentName: string;
    protected sdkRabbitmq: SdkRabbitmq;
    protected globalMemory: IGlobalMemory;
    protected logger: Logger;
    /**
     * Constructor for BaseAgent
     * @param routingKey - RabbitMQ routing key for this agent
     * @param agentName - Human-readable name for this agent
     * @param sdkRabbitmq - RabbitMQ SDK instance
     * @param globalMemory - Global memory manager instance
     */
    constructor(routingKey: string, agentName: string, sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory);
    /**
     * Get the message this agent should send to the user
     * @returns The message string to send to WhatsApp user
     */
    abstract getAgentMessage(): string;
    /**
     * Validate user input for this agent's requirements
     * @param input - User input to validate
     * @returns true if input is valid, false otherwise
     */
    abstract validateInput(input: string): boolean;
    /**
     * Process and store valid user input
     * @param number - User's phone number
     * @param input - Validated user input
     */
    abstract processInput(number: string, input: string): void;
    /**
     * Get default value to use when user fails validation 3 times
     * @returns Default value for this agent's data field
     */
    abstract getDefaultValueForErrors(): string;
    /**
     * Send message to WhatsApp user with duplicate prevention
     * @param number - User's phone number
     * @param message - Message to send
     */
    protected sendToWhatsApp(number: string, message: string): Promise<void>;
    /**
     * Activate the next agent in the flow sequence
     * @param number - User's phone number
     */
    protected activateNextAgent(number: string): Promise<void>;
    /**
     * Subscribe to messages from a specific phone number
     * @param number - User's phone number to subscribe to
     */
    protected subscribeToPhone(number: string): Promise<void>;
    /**
     * Unsubscribe from messages from a specific phone number
     * @param number - User's phone number to unsubscribe from
     */
    protected unsubscribeFromPhone(number: string): Promise<void>;
    /**
     * Handle agent activation - called when this agent should become active
     * @param payload - Activation payload with phone number and sender info
     */
    onActivation(payload: AgentActivationPayload): Promise<void>;
    /**
     * Handle user message received via subscription callback
     * @param message - User message from WhatsApp
     */
    private handleUserMessage;
    /**
     * Handle WhatsApp message directly (alternative entry point)
     * @param number - User's phone number
     * @param message - Message text from user
     */
    onWhatsAppMessage(number: string, message: string): Promise<void>;
    /**
     * Handle user response timeout - send reminder message
     * @param number - User's phone number
     * @param stage - Current stage that timed out
     */
    protected handleReminderTimeout(number: string, stage: string): Promise<void>;
    /**
     * Thread-safe wrapper for processInput
     * @param number - User's phone number
     * @param input - User input to process
     */
    protected processInputSafe(number: string, input: string): Promise<void>;
    /**
     * Thread-safe wrapper for stage management
     * @param number - User's phone number
     * @param stage - Stage to mark as visited
     */
    protected markStageAsVisitedSafe(number: string, stage: string): Promise<void>;
    /**
     * Thread-safe wrapper for error marking
     * @param number - User's phone number
     * @param stage - Stage to mark as error
     */
    protected markStageAsErrorSafe(number: string, stage: string): Promise<void>;
    /**
     * Thread-safe wrapper for stage setting
     * @param number - User's phone number
     * @param stage - Stage to set as current
     */
    protected setCurrentStageSafe(number: string, stage: string): Promise<void>;
    /**
     * Handle final timeout - end session gracefully
     * @param number - User's phone number
     * @param stage - Current stage that timed out
     */
    protected handleUserTimeout(number: string, stage: string): Promise<void>;
}
//# sourceMappingURL=BaseAgent.d.ts.map