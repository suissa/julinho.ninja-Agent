/**
 * Base Agent class - Abstract base for all agents
 * Implements Specification Pattern for agent behavior
 */

import { IAgent } from '../types/agent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';
import { AgentActivationPayload, UserMessage } from '../types/messages';
import { AgentSpecification, AgentActivationCommand, AgentFlowSpecification } from '../types/specifications';
import { Logger } from '../utils/logger';

export abstract class BaseAgent implements IAgent, AgentSpecification, AgentFlowSpecification {
  protected routingKey: string;
  protected agentName: string;
  protected sdkRabbitmq: SdkRabbitmq;
  protected globalMemory: IGlobalMemory;
  protected logger: Logger;

  // Controle de estado para evitar mensagens duplicadas
  private processingUsers: Set<string> = new Set();
  private lastMessageSent: Map<string, { message: string; timestamp: number }> = new Map();

  /**
   * Constructor for BaseAgent
   * @param routingKey - RabbitMQ routing key for this agent
   * @param agentName - Human-readable name for this agent
   * @param sdkRabbitmq - RabbitMQ SDK instance
   * @param globalMemory - Global memory manager instance
   */
  constructor(
    routingKey: string,
    agentName: string,
    sdkRabbitmq: SdkRabbitmq,
    globalMemory: IGlobalMemory
  ) {
    if (!routingKey || routingKey.trim() === '') {
      throw new Error('Routing key cannot be empty');
    }
    if (!agentName || agentName.trim() === '') {
      throw new Error('Agent name cannot be empty');
    }
    if (!sdkRabbitmq) {
      throw new Error('SdkRabbitmq instance is required');
    }
    if (!globalMemory) {
      throw new Error('GlobalMemory instance is required');
    }

    this.routingKey = routingKey;
    this.agentName = agentName;
    this.sdkRabbitmq = sdkRabbitmq;
    this.globalMemory = globalMemory;
    this.logger = Logger.getInstance();
  }

  // Abstract methods to be implemented by specific agents
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

  // Specification Pattern Implementation

  /**
   * Verifica se este agent deve ser ativado para o telefone especificado
   * Pesquisa na memória se este agent é o atual no fluxo
   * Se verdadeiro, faz bind na exchange="chatbot.messages" + routingKey="phone.{telefone}"
   */
  public async isActivatedBy(command: AgentActivationCommand): Promise<boolean> {
    const { number } = command;

    // 1. Verificar se este agent é o atual no fluxo
    const currentStage = this.globalMemory.getCurrentStage(number);
    const isCurrentAgent = currentStage === this.routingKey;

    console.log(`🔍 [${this.agentName}] isActivatedBy check: currentStage=${currentStage}, routingKey=${this.routingKey}, isCurrentAgent=${isCurrentAgent}`);

    if (!isCurrentAgent) {
      console.log(`❌ [${this.agentName}] Not current agent for ${number}`);
      return false;
    }

    // 2. Verificar se este stage já foi visitado (não reprocessar)
    const clientStage = this.globalMemory.clientStages.get(number);
    if (clientStage && clientStage.visitedStages.has(this.routingKey)) {
      console.log(`⏭️ [${this.agentName}] Stage ${this.routingKey} already visited for ${number}, skipping`);
      // Mover para próximo agent automaticamente
      await this.moveToNextAgent(number);
      return false;
    }

    try {
      // 3. Fazer bind na exchange="chatbot.messages" + routingKey="phone.{telefone}"
      const queueName = `queue-${this.agentName}-${number}`;
      const routingKey = `phone.${number}`;

      console.log(`🔗 [${this.agentName}] Binding to exchange: chatbot.messages, queue: ${queueName}, routingKey: ${routingKey}`);

      await this.sdkRabbitmq.subscribe(
        'chatbot.messages',
        queueName,
        routingKey,
        (message: UserMessage) => this.handleUserMessage(message)
      );

      console.log(`✅ [${this.agentName}] Successfully bound to ${routingKey}`);
      return true;

    } catch (error) {
      console.error(`❌ [${this.agentName}] Failed to bind to phone.${number}:`, error);
      return false;
    }
  }

  /**
   * Verifica se o agent processou e validou a resposta do usuário com sucesso
   * Se verdadeiro, faz unbind da routingKey do telefone e ativa o próximo agent
   */
  public async isSatisfiedBy(number: string, userInput: string): Promise<boolean> {
    try {
      // 1. Validar entrada do usuário
      const isValid = this.validateInput(userInput);

      if (!isValid) {
        // Incrementar contador de erro
        await this.markStageAsErrorSafe(number, this.routingKey);
        const errorCount = this.globalMemory.getStageErrorCount(number, this.routingKey);

        console.log(`❌ [${this.agentName}] Invalid input from ${number} (attempt ${errorCount}/3)`);

        if (errorCount >= 3) {
          // Usar valor padrão após 3 erros
          const defaultValue = this.getDefaultValueForErrors();
          console.log(`⚠️ [${this.agentName}] Max errors reached, using default: ${defaultValue}`);

          this.processInput(number, defaultValue);
          await this.sendToWhatsApp(number, `Após 3 tentativas, definindo valor padrão. Continuando...`);

          // Considerar como satisfeito com valor padrão
          return await this.completeSatisfaction(number);
        } else {
          // Solicitar nova tentativa
          await this.sendToWhatsApp(number, `Informação inválida (tentativa ${errorCount}/3). ${this.getAgentMessage()}`);
          return false;
        }
      }

      // 2. Processar entrada válida
      console.log(`✅ [${this.agentName}] Valid input from ${number}, processing...`);
      this.processInput(number, userInput);

      // 3. Marcar como satisfeito
      return await this.completeSatisfaction(number);

    } catch (error) {
      console.error(`❌ [${this.agentName}] Error in isSatisfiedBy:`, error);
      return false;
    }
  }

  /**
   * Completa a satisfação do agent: unbind + ativar próximo
   */
  private async completeSatisfaction(number: string): Promise<boolean> {
    try {
      // 1. Marcar stage como visitado PRIMEIRO (thread-safe)
      await this.markStageAsVisitedSafe(number, this.routingKey);
      console.log(`✅ [${this.agentName}] Stage ${this.routingKey} marked as visited for ${number}`);

      // 2. Fazer unbind da routingKey do telefone
      const queueName = `queue-${this.agentName}-${number}`;
      const routingKey = `phone.${number}`;

      console.log(`🔓 [${this.agentName}] Unbinding from ${routingKey}`);
      await this.sdkRabbitmq.unbind('chatbot.messages', queueName, routingKey);

      // 3. Mover para próximo agent
      await this.moveToNextAgent(number);

      console.log(`🎯 [${this.agentName}] Satisfaction completed for ${number}`);
      return true;

    } catch (error) {
      console.error(`❌ [${this.agentName}] Error completing satisfaction:`, error);
      return false;
    }
  }

  /**
   * Verifica se este agent é o atual no fluxo para o telefone especificado
   */
  public isCurrentAgent(number: string): boolean {
    const currentStage = this.globalMemory.getCurrentStage(number);
    return currentStage === this.routingKey;
  }

  /**
   * Obtém o próximo agent no fluxo
   */
  public getNextAgent(): string | null {
    return this.globalMemory.getNextAgent();
  }

  /**
   * Marca este agent como satisfeito e move para o próximo
   */
  public async moveToNextAgent(number: string): Promise<void> {
    const nextAgentRoutingKey = this.getNextAgent();

    console.log(`🔄 [${this.agentName}] Flow transition: ${this.routingKey} → ${nextAgentRoutingKey || 'COMPLETED'} for ${number}`);

    if (nextAgentRoutingKey) {
      console.log(`🚀 [${this.agentName}] Moving to next agent: ${nextAgentRoutingKey}`);

      // 1. Atualizar stage atual (thread-safe)
      try {
        await this.setCurrentStageSafe(number, nextAgentRoutingKey);
        console.log(`📝 [${this.agentName}] Stage updated to ${nextAgentRoutingKey} for ${number}`);
      } catch (error) {
        console.error(`❌ [${this.agentName}] Failed to update stage to ${nextAgentRoutingKey} for ${number}:`, error);
        return;
      }

      // 2. Criar comando de ativação
      const activationCommand: AgentActivationCommand = {
        number: number,
        sender: this.agentName,
        timestamp: Date.now()
      };

      // 3. Enviar comando para próximo agent
      await this.sdkRabbitmq.publish('chatbot.agents', nextAgentRoutingKey, activationCommand);

      console.log(`✅ [${this.agentName}] Next agent ${nextAgentRoutingKey} activated for ${number}`);

      // 4. Log do estado atual da sessão
      const clientStage = this.globalMemory.clientStages.get(number);
      if (clientStage) {
        console.log(`📊 [${this.agentName}] Session state for ${number}:`, {
          currentStage: clientStage.currentStage,
          visitedStages: Array.from(clientStage.visitedStages),
          errorCounts: Object.fromEntries(clientStage.stageErrors)
        });
      }
    } else {
      console.log(`🏁 [${this.agentName}] Flow completed for ${number} - no more agents`);

      // Enviar mensagem de conclusão se for o último agente
      if (this.routingKey === 'patient.email') {
        try {
          const clientData = this.globalMemory.clientData.get(number);
          const completionMessage = `✅ Obrigado! Suas informações foram coletadas com sucesso.\n\n` +
            `📋 Resumo dos dados coletados:\n` +
            `👤 Nome: ${clientData?.name || 'Não informado'}\n` +
            `🆔 CPF: ${clientData?.cpf || 'Não informado'}\n` +
            `🎂 Data de Nascimento: ${clientData?.birthDate || 'Não informada'}\n` +
            `📧 Email: ${clientData?.email || 'Não informado'}\n\n` +
            `Seus dados estão seguros conosco. Em breve entraremos em contato!`;
          
          await this.sendToWhatsApp(number, completionMessage);
        } catch (error) {
          console.error(`❌ [${this.agentName}] Error sending completion message:`, error);
        }
      }

      // Log final da sessão
      const clientData = this.globalMemory.clientData.get(number);
      const clientStage = this.globalMemory.clientStages.get(number);

      console.log(`🎉 [${this.agentName}] Final session data for ${number}:`, {
        clientData: clientData ? {
          name: clientData.name,
          cpf: clientData.cpf,
          email: clientData.email,
          birthDate: clientData.birthDate
        } : 'No data',
        visitedStages: clientStage ? Array.from(clientStage.visitedStages) : []
      });
    }
  }

  // Core agent functionality methods

  /**
   * Verifica se pode enviar mensagem (evita duplicatas)
   */
  private canSendMessage(number: string, message: string): boolean {
    const lastMessage = this.lastMessageSent.get(number);
    if (!lastMessage) return true;

    const timeDiff = Date.now() - lastMessage.timestamp;
    const isSameMessage = lastMessage.message === message;
    const tooRecent = timeDiff < 1000; // 1 segundo

    if (isSameMessage && tooRecent) {
      console.log(`🚫 [${this.agentName}] Duplicate message blocked for ${number}: "${message}"`);
      return false;
    }

    return true;
  }

  /**
   * Registra mensagem enviada
   */
  private recordSentMessage(number: string, message: string): void {
    this.lastMessageSent.set(number, {
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Send message to WhatsApp user with duplicate prevention
   * @param number - User's phone number
   * @param message - Message to send
   */
  protected async sendToWhatsApp(number: string, message: string): Promise<void> {
    if (!number || number.trim() === '') {
      throw new Error('Phone number cannot be empty');
    }
    if (!message || message.trim() === '') {
      throw new Error('Message cannot be empty');
    }

    // Verificar se pode enviar mensagem (evitar duplicatas)
    if (!this.canSendMessage(number, message)) {
      return; // Bloquear mensagem duplicada
    }

    const startTime = Date.now();

    try {
      // Send message to WhatsApp
      await this.sdkRabbitmq.publish('whatsapp.message.text', 'send', {
        number: number,
        text: message
      });

      // Registrar mensagem enviada
      this.recordSentMessage(number, message);
      this.globalMemory.markMessageSent(number);

      const duration = Date.now() - startTime;
      console.log(`📤 [${this.agentName}] Message sent to ${number}: "${message}"`);
      this.logger.messageSent(number, this.agentName, message.length);
      this.logger.debug(`Message sent successfully`, { messagePreview: message.substring(0, 50) }, number, this.agentName, duration);
    } catch (error) {
      this.logger.systemError(error as Error, { operation: 'sendToWhatsApp', messageLength: message.length }, number, this.agentName);
      throw error;
    }
  }





  /**
   * Handle agent activation using Specification Pattern
   * @param payload - Activation payload with phone number and sender info
   */
  public async onActivation(payload: AgentActivationPayload): Promise<void> {
    if (!payload || !payload.number) {
      this.logger.error(`Invalid activation payload received`, { payload }, undefined, this.agentName);
      return;
    }

    const activationCommand: AgentActivationCommand = {
      number: payload.number,
      sender: payload.sender || 'unknown',
      timestamp: payload.timestamp || Date.now()
    };

    console.log(`🎯 [${this.agentName}] Received activation command for ${payload.number}`);

    try {
      // Usar Specification Pattern para verificar se deve ser ativado
      const shouldActivate = await this.isActivatedBy(activationCommand);

      if (!shouldActivate) {
        console.log(`❌ [${this.agentName}] Activation rejected for ${payload.number}`);
        return;
      }

      console.log(`✅ [${this.agentName}] Activation accepted for ${payload.number}`);

      // Enviar mensagem do agent para o usuário
      await this.sendToWhatsApp(payload.number, this.getAgentMessage());

      // Iniciar timeout para resposta do usuário
      this.globalMemory.startUserResponseTimeout(
        payload.number,
        this.routingKey,
        (phone, stage) => this.handleUserTimeout(phone, stage),
        (phone, stage) => this.handleReminderTimeout(phone, stage)
      );

      console.log(`🚀 [${this.agentName}] Agent activated and waiting for user response from ${payload.number}`);

    } catch (error) {
      console.error(`❌ [${this.agentName}] Error in onActivation:`, error);
      this.logger.systemError(error as Error, { operation: 'onActivation' }, payload.number, this.agentName);
    }
  }

  /**
   * Handle user message using Specification Pattern
   * @param message - User message from WhatsApp
   */
  private async handleUserMessage(message: UserMessage): Promise<void> {
    console.log(`📨 [${this.agentName}] Received user message:`, message);

    if (!message || !message.number || !message.text) {
      console.error(`❌ [${this.agentName}] Invalid user message received:`, message);
      return;
    }

    const number = message.number;
    const userInput = message.text.trim();

    // Verificar se já está processando para este usuário
    if (this.processingUsers.has(number)) {
      console.log(`⏳ [${this.agentName}] Already processing message for ${number}, ignoring duplicate`);
      return;
    }

    try {
      // Marcar como processando
      this.processingUsers.add(number);

      // 1. Verificar se este agent deve processar esta mensagem
      if (!this.isCurrentAgent(number)) {
        console.log(`⏭️ [${this.agentName}] Not current agent for ${number}, ignoring message`);
        return;
      }

      // 2. Limpar timeout (usuário respondeu a tempo)
      this.globalMemory.clearUserResponseTimeout(number);

      console.log(`🔄 [${this.agentName}] Processing user input: "${userInput}" from ${number}`);

      // 3. Usar Specification Pattern para verificar se está satisfeito
      const isSatisfied = await this.isSatisfiedBy(number, userInput);

      if (isSatisfied) {
        console.log(`✅ [${this.agentName}] Agent satisfied for ${number}, moving to next agent`);
      } else {
        console.log(`⏳ [${this.agentName}] Agent not satisfied for ${number}, waiting for new input`);
      }

    } catch (error) {
      console.error(`❌ [${this.agentName}] Error handling user message:`, error);
      this.logger.systemError(error as Error, { operation: 'handleUserMessage' }, number, this.agentName);
    } finally {
      // Sempre remover do processamento
      this.processingUsers.delete(number);
    }
  }

  /**
   * Handle WhatsApp message directly (alternative entry point)
   * @param number - User's phone number
   * @param message - Message text from user
   */
  public async onWhatsAppMessage(number: string, message: string): Promise<void> {
    if (!number || number.trim() === '') {
      console.error(`[${this.agentName}] Invalid phone number received`);
      return;
    }
    if (!message || message.trim() === '') {
      console.error(`[${this.agentName}] Empty message received from ${number}`);
      return;
    }

    const userInput = message.trim();
    console.log(`[${this.agentName}] Received WhatsApp message from ${number}: ${userInput}`);

    try {
      // 1. Clear any active timeout (user responded in time)
      this.globalMemory.clearUserResponseTimeout(number);

      // 2. Verify if this agent should handle this message (stage verification)
      const currentStage = this.globalMemory.getCurrentStage(number);
      if (currentStage !== this.routingKey) {
        console.log(`[${this.agentName}] Received message but current stage is ${currentStage}, ignoring.`);
        return;
      }

      // 2. Validate user input with error handling
      if (!this.validateInput(userInput)) {
        // Increment error count (thread-safe)
        await this.markStageAsErrorSafe(number, this.routingKey);

        const errorCount = this.globalMemory.getStageErrorCount(number, this.routingKey);

        if (errorCount >= 3) {
          // Set default value after 3 errors (thread-safe)
          const defaultValue = this.getDefaultValueForErrors();
          console.log(`[${this.agentName}] Max errors reached for ${number}, using default value: ${defaultValue}`);

          await this.processInputSafe(number, defaultValue);
          await this.sendToWhatsApp(number, `Após 3 tentativas, definindo valor padrão. Continuando...`);
        } else {
          console.log(`[${this.agentName}] Invalid input from ${number} (attempt ${errorCount}/3)`);
          await this.sendToWhatsApp(number, `Informação inválida (tentativa ${errorCount}/3). ${this.getAgentMessage()}`);
          return;
        }
      } else {
        // 3. Process and store valid data
        console.log(`[${this.agentName}] Processing valid input from ${number}`);
        this.processInput(number, userInput);
      }

      // 4. Mark stage as visited
      this.globalMemory.markStageAsVisited(number, this.routingKey);

      // 5. Unsubscribe from this phone (agent job done)
      const queueName = `queue-${this.agentName}-${number}`;
      const routingKey = `phone.${number}`;
      await this.sdkRabbitmq.unbind('chatbot.messages', queueName, routingKey);

      // 6. Activate next agent
      await this.moveToNextAgent(number);

      console.log(`[${this.agentName}] Successfully completed processing for ${number}`);

    } catch (error) {
      console.error(`[${this.agentName}] Error handling WhatsApp message from ${number}:`, error);
      throw error;
    }
  }

  /**
   * Handle user response timeout - send reminder message
   * @param number - User's phone number
   * @param stage - Current stage that timed out
   */
  protected async handleReminderTimeout(number: string, stage: string): Promise<void> {
    try {
      this.logger.timeoutEvent('reminder', number, this.agentName, stage);

      const reminderMessage = `⏰ Você ainda está aí? ${this.getAgentMessage()}`;
      await this.sendToWhatsApp(number, reminderMessage);

      this.logger.info(`Reminder message sent successfully`, { stage }, number, this.agentName);
    } catch (error) {
      this.logger.systemError(error as Error, { operation: 'handleReminderTimeout', stage }, number, this.agentName);
    }
  }

  /**
   * Thread-safe wrapper for processInput
   * @param number - User's phone number
   * @param input - User input to process
   */
  protected async processInputSafe(number: string, input: string): Promise<void> {
    // Use thread-safe operation through global memory
    await this.globalMemory.withSessionLock(number, `processInput:${this.routingKey}`, async () => {
      this.processInput(number, input);
      return true;
    });
  }

  /**
   * Thread-safe wrapper for stage management
   * @param number - User's phone number
   * @param stage - Stage to mark as visited
   */
  protected async markStageAsVisitedSafe(number: string, stage: string): Promise<void> {
    await this.globalMemory.markStageAsVisitedSafe(number, stage);
  }

  /**
   * Thread-safe wrapper for error marking
   * @param number - User's phone number
   * @param stage - Stage to mark as error
   */
  protected async markStageAsErrorSafe(number: string, stage: string): Promise<void> {
    await this.globalMemory.markStageAsErrorSafe(number, stage);
  }

  /**
   * Thread-safe wrapper for stage setting
   * @param number - User's phone number
   * @param stage - Stage to set as current
   */
  protected async setCurrentStageSafe(number: string, stage: string): Promise<void> {
    await this.globalMemory.setCurrentStageSafe(number, stage);
  }

  /**
   * Handle final timeout using Specification Pattern
   * @param number - User's phone number
   * @param stage - Current stage that timed out
   */
  protected async handleUserTimeout(number: string, stage: string): Promise<void> {
    try {
      console.log(`⏰ [${this.agentName}] User timeout for ${number} at stage ${stage}`);

      // Usar valor padrão após timeout
      const defaultValue = this.getDefaultValueForErrors();
      console.log(`⚠️ [${this.agentName}] Using default value due to timeout: ${defaultValue}`);

      // Processar com valor padrão
      this.processInput(number, defaultValue);

      // Enviar mensagem de timeout
      await this.sendToWhatsApp(number, `⏰ Tempo esgotado. Definindo valor padrão e continuando...`);

      // Usar Specification Pattern para completar satisfação
      await this.completeSatisfaction(number);

      console.log(`✅ [${this.agentName}] Timeout handled gracefully for ${number}`);

    } catch (error) {
      console.error(`❌ [${this.agentName}] Error handling timeout:`, error);
      this.logger.systemError(error as Error, { operation: 'handleUserTimeout', stage }, number, this.agentName);
    }
  }
}