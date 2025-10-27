/**
 * Client data structures for patient information and session management
 */
export interface ClientData {
    number: string;
    name?: string | undefined;
    cpf?: string | undefined;
    email?: string | undefined;
    birthDate?: string | undefined;
    currentAgent?: string | undefined;
    startTime: Date;
    lastActivity: Date;
}
export interface ClientStage {
    number: string;
    currentStage: string;
    visitedStages: Set<string>;
    stageErrors: Map<string, number>;
    lastActivity: Date;
}
//# sourceMappingURL=client.d.ts.map