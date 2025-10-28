/**
 * ScheduleDateAgent - Handles date selection for appointments
 * Validates date availability and stores selected date
 */
import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';
export declare class ScheduleDateAgent extends BaseAgent {
    private readonly availableDates;
    constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory);
    /**
     * Get the message this agent should send to the user
     * @returns The message string asking user to select a date
     */
    getAgentMessage(): string;
    /**
     * Validate user input for date selection
     * @param input - User input to validate (should be a valid date in DD/MM/YYYY format)
     * @returns true if input is valid and available date, false otherwise
     */
    validateInput(input: string): boolean;
    /**
     * Check if a specific date is available for appointments
     * @param date - Date string in DD/MM/YYYY format
     * @returns true if date is available, false otherwise
     */
    private isDateAvailable;
    /**
     * Get available dates for display
     * @returns Array of available date strings
     */
    getAvailableDates(): string[];
    /**
     * Process and store valid date selection
     * @param number - User's phone number
     * @param input - Validated date input
     */
    processInput(number: string, input: string): void;
    /**
     * Get default value to use when user fails validation 3 times
     * @returns Default date (first available date)
     */
    getDefaultValueForErrors(): string;
    /**
     * Get next agent for this user based on their dynamic flow
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
//# sourceMappingURL=ScheduleDateAgent.d.ts.map