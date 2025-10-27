/**
 * PatientEmailAgent - Collects patient email information
 * Implementation will be added in task 5.4
 */
import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';
export declare class PatientEmailAgent extends BaseAgent {
    constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory);
    getAgentMessage(): string;
    validateInput(input: string): boolean;
    processInput(number: string, input: string): void;
    getDefaultValueForErrors(): string;
}
//# sourceMappingURL=PatientEmailAgent.d.ts.map