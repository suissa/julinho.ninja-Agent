/**
 * Main ChatBot class - System entry point and orchestrator
 */
export declare class ChatBot {
    private sdkRabbitmq;
    private globalMemory;
    private greetingAgent;
    private patientNameAgent;
    private patientCPFAgent;
    private patientBirthDateAgent;
    private patientEmailAgent;
    private scheduleNewAgent;
    private scheduleDateAgent;
    private scheduleServiceAgent;
    private scheduleDentistAgent;
    private schedulePaymentAgent;
    private logger;
    constructor();
    initialize(): Promise<void>;
    private performSystemCleanup;
    private initializeAgents;
    private setupAgentSubscriptions;
    private startPeriodicSessionCleanup;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=ChatBot.d.ts.map