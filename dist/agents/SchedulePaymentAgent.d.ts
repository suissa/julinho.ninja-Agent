/**
 * SchedulePaymentAgent - Handles payment method selection and generates final appointment summary
 * Validates payment method and creates complete appointment confirmation
 */
import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';
interface PaymentMethod {
    id: string;
    name: string;
    description: string;
    available: boolean;
    hasDiscount?: boolean;
    discountPercentage?: number;
}
export declare class SchedulePaymentAgent extends BaseAgent {
    private readonly paymentMethods;
    constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory);
    /**
     * Get the message this agent should send to the user
     * @returns The message string asking user to select a payment method
     */
    getAgentMessage(): string;
    /**
     * Validate user input for payment method selection
     * @param input - User input to validate (should be a valid payment method ID)
     * @returns true if input is valid and available payment method, false otherwise
     */
    validateInput(input: string): boolean;
    /**
     * Get available payment methods (only those that are available)
     * @returns Array of available payment methods
     */
    getAvailablePaymentMethods(): PaymentMethod[];
    /**
     * Get payment method by ID
     * @param id - Payment method ID
     * @returns Payment method object or null if not found
     */
    getPaymentMethodById(id: string): PaymentMethod | null;
    /**
     * Calculate final price with discount if applicable
     * @param originalPrice - Original service price
     * @param paymentMethod - Selected payment method
     * @returns Final price after discount
     */
    private calculateFinalPrice;
    /**
     * Format price for display
     * @param price - Price value
     * @returns Formatted price string
     */
    private formatPrice;
    /**
     * Generate appointment summary
     * @param number - User's phone number
     * @returns Formatted appointment summary string
     */
    private generateAppointmentSummary;
    /**
     * Process and store valid payment method selection
     * @param number - User's phone number
     * @param input - Validated payment method ID input
     */
    processInput(number: string, input: string): void;
    /**
     * Get default value to use when user fails validation 3 times
     * @returns Default payment method ID (PIX - good discount and convenience)
     */
    getDefaultValueForErrors(): string;
    /**
     * Override moveToNextAgent to send final summary instead of moving to next agent
     * @param number - User's phone number
     */
    moveToNextAgent(number: string): Promise<void>;
    /**
     * Get next agent - always returns null as this is the final agent
     * @returns null (no next agent)
     */
    getNextAgent(): string | null;
    /**
     * Get next agent for specific user - always returns null as this is the final agent
     * @param number - User's phone number
     * @returns null (no next agent)
     */
    getNextAgentForUser(number: string): string | null;
}
export {};
//# sourceMappingURL=SchedulePaymentAgent.d.ts.map