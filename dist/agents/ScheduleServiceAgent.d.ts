/**
 * ScheduleServiceAgent - Handles service selection for appointments
 * Validates service availability and stores selected service with pricing
 */
import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';
interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    available: boolean;
}
export declare class ScheduleServiceAgent extends BaseAgent {
    private readonly availableServices;
    constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory);
    /**
     * Get the message this agent should send to the user
     * @returns The message string asking user to select a service
     */
    getAgentMessage(): string;
    /**
     * Validate user input for service selection
     * @param input - User input to validate (should be a valid service ID)
     * @returns true if input is valid and available service, false otherwise
     */
    validateInput(input: string): boolean;
    /**
     * Get available services (only those that are available)
     * @returns Array of available services
     */
    getAvailableServices(): Service[];
    /**
     * Get all services (including unavailable ones)
     * @returns Array of all services
     */
    getAllServices(): Service[];
    /**
     * Get service by ID
     * @param id - Service ID
     * @returns Service object or null if not found
     */
    getServiceById(id: string): Service | null;
    /**
     * Check if service is available
     * @param serviceId - Service ID to check
     * @returns true if service is available, false otherwise
     */
    private isServiceAvailable;
    /**
     * Format price for display
     * @param price - Price value
     * @returns Formatted price string
     */
    private formatPrice;
    /**
     * Process and store valid service selection
     * @param number - User's phone number
     * @param input - Validated service ID input
     */
    processInput(number: string, input: string): void;
    /**
     * Get default value to use when user fails validation 3 times
     * @returns Default service ID (first available service - consultation)
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
//# sourceMappingURL=ScheduleServiceAgent.d.ts.map