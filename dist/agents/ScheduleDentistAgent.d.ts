/**
 * ScheduleDentistAgent - Handles dentist selection for appointments
 * Validates dentist availability and stores selected dentist
 */
import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';
interface Dentist {
    id: string;
    name: string;
    specialty: string;
    available: boolean;
}
export declare class ScheduleDentistAgent extends BaseAgent {
    private readonly availableDentists;
    constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory);
    /**
     * Get the message this agent should send to the user
     * @returns The message string asking user to select a dentist
     */
    getAgentMessage(): string;
    /**
     * Validate user input for dentist selection
     * @param input - User input to validate (should be a valid dentist ID)
     * @returns true if input is valid and available dentist, false otherwise
     */
    validateInput(input: string): boolean;
    /**
     * Get available dentists (only those who are available)
     * @returns Array of available dentists
     */
    getAvailableDentists(): Dentist[];
    /**
     * Get all dentists (including unavailable ones)
     * @returns Array of all dentists
     */
    getAllDentists(): Dentist[];
    /**
     * Get dentist by ID
     * @param id - Dentist ID
     * @returns Dentist object or null if not found
     */
    getDentistById(id: string): Dentist | null;
    /**
     * Check if dentist is available for appointments
     * @param dentistId - Dentist ID to check
     * @returns true if dentist is available, false otherwise
     */
    private isDentistAvailable;
    /**
     * Process and store valid dentist selection
     * @param number - User's phone number
     * @param input - Validated dentist ID input
     */
    processInput(number: string, input: string): void;
    /**
     * Get default value to use when user fails validation 3 times
     * @returns Default dentist ID (first available dentist)
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
export {};
//# sourceMappingURL=ScheduleDentistAgent.d.ts.map