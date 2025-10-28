/**
 * PatientCPFAgent - Collects patient CPF information
 * Implementation will be added in task 5.2
 */
import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '@src/sdk/SdkRabbitmq';
import { IGlobalMemory } from '@src/memory/interfaces';
export declare class PatientCPFAgent extends BaseAgent {
    constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory);
    getAgentMessage(): string;
    validateInput(input: string): boolean;
    processInput(number: string, input: string): void;
    getDefaultValueForErrors(): string;
}
//# sourceMappingURL=PatientCPFAgent.d.ts.map