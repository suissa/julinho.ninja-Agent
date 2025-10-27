/**
 * PatientBirthDateAgent - Collects patient birth date information
 * Implementation will be added in task 5.3
 */
import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';
export declare class PatientBirthDateAgent extends BaseAgent {
    constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory);
    getAgentMessage(): string;
    validateInput(input: string): boolean;
    processInput(number: string, input: string): void;
    getDefaultValueForErrors(): string;
}
//# sourceMappingURL=PatientBirthDateAgent.d.ts.map