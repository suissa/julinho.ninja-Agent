/**
 * ScheduleNewAgent - Handles initial scheduling choice selection
 * Allows users to choose what to define first: date, service, or dentist
 */
import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';
export declare class ScheduleNewAgent extends BaseAgent {
    constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory);
    /**
     * Get the message this agent should send to the user
     * @returns The message string asking user to choose what to define first
     */
    getAgentMessage(): string;
    /**
     * Validate user input for scheduling choice
     * @param input - User input to validate (should be 1, 2, or 3)
     * @returns true if input is valid choice (1, 2, or 3), false otherwise
     */
    validateInput(input: string): boolean;
    /**
     * Process and store valid user choice, set up dynamic flow
     * @param number - User's phone number
     * @param input - Validated user input (1, 2, or 3)
     */
    processInput(number: string, input: string): void;
    /**
     * Set up dynamic agent flow based on user's choice
     * @param number - User's phone number
     * @param flowType - Type of flow to set up (date-first, service-first, dentist-first)
     */
    private setupDynamicFlow;
    /**
     * Get default value to use when user fails validation 3 times
     * @returns Default choice (1 - date first)
     */
    getDefaultValueForErrors(): string;
    /**
     * Override getNextAgent to use dynamic flow instead of global flow
     * @returns Next agent routing key based on user's chosen flow
     */
    getNextAgent(): string | null;
    /**
     * Get next agent for specific user based on their dynamic flow
     * @param number - User's phone number
     * @returns Next agent routing key for this user's flow
     */
    getNextAgentForUser(number: string): string | null;
    /**
     * Override moveToNextAgent to use dynamic flow
     * @param number - User's phone number
     */
    moveToNextAgent(number: string): Promise<void>;
}
//# sourceMappingURL=ScheduleNewAgent.d.ts.map