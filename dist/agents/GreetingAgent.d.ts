/**
 * GreetingAgent - Handles initial user interactions and routing
 * Implementation will be added in task 6.1 and 6.2
 */
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';
export declare class GreetingAgent {
    private sdkRabbitmq;
    private globalMemory;
    constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory);
    initialize(): Promise<void>;
    private handlePhoneMessage;
    private handleNewClient;
    private handleExistingClient;
    private activateFirstAgent;
    private sendToWhatsApp;
}
//# sourceMappingURL=GreetingAgent.d.ts.map