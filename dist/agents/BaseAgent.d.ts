/**
 * Base Agent class - Abstract base for all agents
 * Implements Specification Pattern for agent behavior
 */
import { IAgent } from '@typez/agent';
import { SdkRabbitmq } from '@src/sdk/SdkRabbitmq';
import { IGlobalMemory } from '@src/memory/interfaces';
import { AgentActivationPayload } from '@typez/messages';
import { AgentSpecification, AgentActivationCommand, AgentFlowSpecification } from '@typez/specifications';
import { Logger } from '@src/utils/logger';
export declare abstract class BaseAgent implements IAgent, AgentSpecification, AgentFlowSpecification {
    protected routingKey: string;
    protected agentName: string;
    protected sdkRabbitmq: SdkRabbitmq;
    protected globalMemory: IGlobalMemory;
    protected logger: Logger;
    private processingUsers;
    private lastMessageSent;
    /**
     * Constructor for BaseAgent
     * @param routingKey - RabbitMQ routing key for this agent
     * @param agentName - Human-readable name for this agent
     * @param sdkRabbitmq - RabbitMQ SDK instance
     * @param globalMemory - Global memory manager instance
     */
    constructor(routingKey: string, agentName: string, sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory);
    /**
     * Get the message this agent should send to the user
     * @returns The message string to send to WhatsApp user
     */
    abstract getAgentMessage(): string;
    /**
     * Validate user input for this agent's requirements
     * @param input - User input to validate
     * @returns true if input is valid, false otherwise
     */
    abstract validateInput(input: string): boolean;
    /**
     * Process and store valid user input
     * @param number - User's phone number
     * @param input - Validated user input
     */
    abstract processInput(number: string, input: string): void;
    /**
     * Get default value to use when user fails validation 3 times
     * @returns Default value for this agent's data field
     */
    abstract getDefaultValueForErrors(): string;
    /**
     * ESPECIFICAÇÃO canIActivate
     * Verifica se o agente pode ser ativado ou não
     * Recebe payload na fila de roteamento específica com telefone do usuário
     * Verifica na memória se está marcado como agente atual
     * Se sim → retorna true (pode ser ativado)
     */
    canIActivate(command: AgentActivationCommand): Promise<boolean>;
    /**
     * Wrapper para compatibilidade - usa canIActivate
     */
    isActivatedBy(command: AgentActivationCommand): Promise<boolean>;
    /**
     * Verifica se o agent processou e validou a resposta do usuário com sucesso
     * Se verdadeiro, faz unbind da routingKey do telefone e ativa o próximo agent
     */
    isSatisfiedBy(number: string, userInput: string): Promise<boolean>;
    /**
     * Completa a satisfação do agent: unbind + ativar próximo
     */
    private completeSatisfaction;
    /**
     * Verifica se este agent é o atual no fluxo para o telefone especificado
     */
    isCurrentAgent(number: string): boolean;
    /**
     * Obtém o próximo agent no fluxo POR USUÁRIO
     */
    getNextAgent(number: string): string | null;
    /**
     * Marca este agent como satisfeito e move para o próximo
     */
    /**
     * ESPECIFICAÇÃO canIActivateNextAgent
     * Verifica se o Agent atual deve ativar o próximo Agente
     * Deve ter feito unbind na routingKey do telefone E ter marcado seu stage como visitado/concluído
     * E ter colocado a informação na Memory E pegar a routingKey do próximo Agent
     */
    protected canIActivateNextAgent(number: string): Promise<boolean>;
    /**
     * Move para próximo agente seguindo especificação canIActivateNextAgent
     */
    moveToNextAgent(number: string): Promise<void>;
    /**
     * ESPECIFICAÇÃO canSendWhatsAppMessage
     * Verifica se o agente pode enviar uma mensagem para o WhatsApp do usuário
     * Precisa estar ativado E estar ouvindo a routingKey do WhatsApp do usuário
     * E validar na memória se é o agente atual E principalmente se a flag MESSAGE_SENT for false PARA ESTE AGENTE
     * Se tudo OK → retorna true
     */
    protected canSendWhatsAppMessage(number: string): boolean;
    /**
     * Send message to WhatsApp user seguindo especificação canSendWhatsAppMessage
     * @param number - User's phone number
     * @param message - Message to send
     */
    protected sendToWhatsApp(number: string, message: string): Promise<void>;
    /**
     * Handle agent activation using Specification Pattern
     * @param payload - Activation payload with phone number and sender info
     */
    onActivation(payload: AgentActivationPayload): Promise<void>;
    /**
     * Handle user message using Specification Pattern
     * @param message - User message from WhatsApp
     */
    private handleUserMessage;
    /**
     * Handle WhatsApp message directly (alternative entry point)
     * @param number - User's phone number
     * @param message - Message text from user
     */
    onWhatsAppMessage(number: string, message: string): Promise<void>;
    /**
     * Handle user response timeout - send reminder message
     * @param number - User's phone number
     * @param stage - Current stage that timed out
     */
    protected handleReminderTimeout(number: string, stage: string): Promise<void>;
    /**
     * Thread-safe wrapper for processInput
     * @param number - User's phone number
     * @param input - User input to process
     */
    protected processInputSafe(number: string, input: string): Promise<void>;
    /**
     * Thread-safe wrapper for stage management
     * @param number - User's phone number
     * @param stage - Stage to mark as visited
     */
    protected markStageAsVisitedSafe(number: string, stage: string): Promise<void>;
    /**
     * Thread-safe wrapper for error marking
     * @param number - User's phone number
     * @param stage - Stage to mark as error
     */
    protected markStageAsErrorSafe(number: string, stage: string): Promise<void>;
    /**
     * Thread-safe wrapper for stage setting
     * @param number - User's phone number
     * @param stage - Stage to set as current
     */
    protected setCurrentStageSafe(number: string, stage: string): Promise<void>;
    /**
     * Handle final timeout using Specification Pattern
     * @param number - User's phone number
     * @param stage - Current stage that timed out
     */
    protected handleUserTimeout(number: string, stage: string): Promise<void>;
}
//# sourceMappingURL=BaseAgent.d.ts.map