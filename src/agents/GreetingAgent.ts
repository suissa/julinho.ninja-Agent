/**
 * GreetingAgent - Handles initial user interactions and routing
 * Implementation will be added in task 6.1 and 6.2
 */

import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';
import { UserMessage, AgentActivationPayload } from '../types/messages';
import { AGENT_MESSAGES, SystemAgentName, SystemRoutingKey } from '../types/constants';
import { TimeTimestampUnix } from '@tys/shared';

export class GreetingAgent {
  private sdkRabbitmq: SdkRabbitmq;
  private globalMemory: IGlobalMemory;

  constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory) {
    this.sdkRabbitmq = sdkRabbitmq;
    this.globalMemory = globalMemory;
  }

  // Initialize GreetingAgent to listen to all phone messages
  public async initialize(): Promise<void> {
    // Subscribe to all phone messages using wildcard routing key
    await this.sdkRabbitmq.subscribe(
      'chatbot.messages',
      'greeting-agent-queue',
      'phone.*',
      (message: UserMessage) => this.handlePhoneMessage(message)
    );

    console.log('GreetingAgent initialized and listening to phone.* messages');
  }

  // Handle incoming phone messages
  private async handlePhoneMessage(message: UserMessage): Promise<void> {
    const number = message.number;
    
    // LOG DIRETO: Mensagem chegou aqui!
    console.log(`🔥 MENSAGEM CHEGOU! Número: ${number}, Texto: "${message.text}", CorrelationId: ${message.correlationId}, Timestamp: ${message.timestamp}`);
    
    try {
      // Check if phone number exists in global memory clients list
      if (!this.globalMemory.hasClient(number)) {
        // New client - send welcome message and add to system
        await this.handleNewClient(number);
      } else {
        // Existing client - route to appropriate agent
        await this.handleExistingClient(number, message);
      }
    } catch (error) {
      console.error(`GreetingAgent error handling message from ${number}:`, error);
    }
  }

  // Handle new client interaction
  private async handleNewClient(number: string): Promise<void> {
    // Add client to global memory (thread-safe)
    const success = await this.globalMemory.addClientSafe(number);
    
    if (!success) {
      console.log(`GreetingAgent: Could not add client ${number} due to concurrent access`);
      return;
    }
    
    // Send welcome message to WhatsApp
    await this.sendToWhatsApp(number, AGENT_MESSAGES.PATIENT_NAME.DEFAULT_SET);
    
    console.log(`GreetingAgent: New client ${number} added to system`);
    
    // Activate the first agent in the flow sequence
    await this.activateFirstAgent(number);
  }

  // Handle existing client message routing
  private async handleExistingClient(number: string, message: UserMessage): Promise<void> {
    // Don't process the message text - just acknowledge and route
    console.log(`GreetingAgent: Routing message from existing client ${number}`);
    
    // Get the next agent name from global memory flow
    const currentStage = this.globalMemory.getCurrentStage(number);
    
    if (currentStage) {
      // Create activation payload for current agent
      const payload: AgentActivationPayload = {
        number: number,
        sender: 'GreetingAgent',
        timestamp: TimeTimestampUnix.make(Math.floor(Date.now() / 1000)) as TimeTimestampUnix
      };
      
      // Publish to current agent queue
      await this.sdkRabbitmq.publish(SystemAgentName.make('agents'), SystemRoutingKey.make(currentStage), payload);
      
      // Não reenviar a mensagem automaticamente - deixar o agente processar diretamente
      console.log(`GreetingAgent: Message forwarded to ${currentStage} for processing`);
    }
  }

  // Activate the first agent in the flow
  private async activateFirstAgent(number: string): Promise<void> {
    console.log(`🎯 [GreetingAgent] activateFirstAgent chamado para ${number}`);

    const firstAgentRoutingKey = this.globalMemory.getNextAgent(number);
    console.log(`🎯 [GreetingAgent] getNextAgent(${number}) retornou: ${firstAgentRoutingKey}`);

    if (firstAgentRoutingKey) {
      console.log(`🎯 [GreetingAgent] Tentando definir stage ${firstAgentRoutingKey} para ${number}`);
      // Set the current stage for this client (thread-safe)
      const success = await this.globalMemory.setCurrentStageSafe(number, firstAgentRoutingKey);
      console.log(`🎯 [GreetingAgent] setCurrentStageSafe retornou: ${success}`);
      
      if (!success) {
        console.log(`GreetingAgent: Could not set stage for ${number} due to concurrent access`);
        return;
      }
      
      console.log(`🎯 [GreetingAgent] Criando payload de ativação para ${firstAgentRoutingKey}`);

      // Create activation payload
      const payload: AgentActivationPayload = {
        number: number,
        sender: 'GreetingAgent',
        timestamp: TimeTimestampUnix.make(Math.floor(Date.now() / 1000)) as TimeTimestampUnix
      };

      console.log(`🎯 [GreetingAgent] Payload criado:`, payload);
      console.log(`🎯 [GreetingAgent] Publicando para exchange 'agents' com routing key '${firstAgentRoutingKey}'`);

      // Publish to first agent queue
      await this.sdkRabbitmq.publish(SystemAgentName.make('agents'), SystemRoutingKey.make(firstAgentRoutingKey), payload);

      console.log(`✅ [GreetingAgent] Ativação publicada com sucesso para ${firstAgentRoutingKey}`);
      console.log(`GreetingAgent: Activated first agent ${firstAgentRoutingKey} for ${number}`);
    }
  }

  // Send message to WhatsApp
  private async sendToWhatsApp(number: string, message: string): Promise<void> {
    // GreetingAgent pode sempre enviar mensagens (não tem restrições de timing)
    // Send message to WhatsApp
    await this.sdkRabbitmq.publish('whatsapp.message.text', 'send', {
      number: number,
      text: message
    });

    console.log(`GreetingAgent: Message sent to ${number}: ${message}`);
  }
}
