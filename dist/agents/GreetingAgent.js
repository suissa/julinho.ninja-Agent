"use strict";
/**
 * GreetingAgent - Handles initial user interactions and routing
 * Implementation will be added in task 6.1 and 6.2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GreetingAgent = void 0;
const constants_1 = require("../types/constants");
class GreetingAgent {
    constructor(sdkRabbitmq, globalMemory) {
        this.sdkRabbitmq = sdkRabbitmq;
        this.globalMemory = globalMemory;
    }
    // Initialize GreetingAgent to listen to all phone messages
    async initialize() {
        // Subscribe to all phone messages using wildcard routing key
        await this.sdkRabbitmq.subscribe(constants_1.EXCHANGES.MESSAGES, 'greeting-agent-queue', 'phone.*', (message) => this.handlePhoneMessage(message));
        console.log('GreetingAgent initialized and listening to phone.* messages');
    }
    // Handle incoming phone messages
    async handlePhoneMessage(message) {
        const number = message.number;
        // LOG DIRETO: Mensagem chegou aqui!
        console.log(`🔥 MENSAGEM CHEGOU! Número: ${number}, Texto: "${message.text}", CorrelationId: ${message.correlationId}, Timestamp: ${message.timestamp}`);
        try {
            // Check if phone number exists in global memory clients list
            if (!this.globalMemory.hasClient(number)) {
                // New client - send welcome message and add to system
                await this.handleNewClient(number);
            }
            else {
                // Existing client - route to appropriate agent
                await this.handleExistingClient(number, message);
            }
        }
        catch (error) {
            console.error(`GreetingAgent error handling message from ${number}:`, error);
        }
    }
    // Handle new client interaction
    async handleNewClient(number) {
        // Add client to global memory (thread-safe)
        const success = await this.globalMemory.addClientSafe(number);
        if (!success) {
            console.log(`GreetingAgent: Could not add client ${number} due to concurrent access`);
            return;
        }
        // Send welcome message to WhatsApp
        await this.sendToWhatsApp(number, constants_1.AGENT_MESSAGES.GREETING);
        console.log(`GreetingAgent: New client ${number} added to system`);
        // Activate the first agent in the flow sequence
        await this.activateFirstAgent(number);
    }
    // Handle existing client message routing
    async handleExistingClient(number, message) {
        // Don't process the message text - just acknowledge and route
        console.log(`GreetingAgent: Routing message from existing client ${number}`);
        // Get the next agent name from global memory flow
        const currentStage = this.globalMemory.getCurrentStage(number);
        if (currentStage) {
            // Create activation payload for current agent
            const payload = {
                number: number,
                sender: 'GreetingAgent',
                timestamp: Date.now()
            };
            // Publish to current agent queue
            await this.sdkRabbitmq.publish(constants_1.EXCHANGES.AGENTS, currentStage, payload);
            // Não reenviar a mensagem automaticamente - deixar o agente processar diretamente
            console.log(`GreetingAgent: Message forwarded to ${currentStage} for processing`);
        }
    }
    // Activate the first agent in the flow
    async activateFirstAgent(number) {
        const firstAgentRoutingKey = this.globalMemory.getNextAgent();
        if (firstAgentRoutingKey) {
            // Set the current stage for this client (thread-safe)
            const success = await this.globalMemory.setCurrentStageSafe(number, firstAgentRoutingKey);
            if (!success) {
                console.log(`GreetingAgent: Could not set stage for ${number} due to concurrent access`);
                return;
            }
            // Create activation payload
            const payload = {
                number: number,
                sender: 'GreetingAgent',
                timestamp: Date.now()
            };
            // Publish to first agent queue
            await this.sdkRabbitmq.publish(constants_1.EXCHANGES.AGENTS, firstAgentRoutingKey, payload);
            console.log(`GreetingAgent: Activated first agent ${firstAgentRoutingKey} for ${number}`);
        }
    }
    // Send message to WhatsApp
    async sendToWhatsApp(number, message) {
        // Check if we can send message (prevent duplicate messages)
        if (!this.globalMemory.canSendMessage(number)) {
            console.log(`GreetingAgent: Cannot send message to ${number}, too recent message sent.`);
            return;
        }
        // Send message to WhatsApp
        await this.sdkRabbitmq.publish(constants_1.EXCHANGES.WHATSAPP, constants_1.WHATSAPP_ROUTING_KEYS.SEND, {
            number: number,
            text: message
        });
        // Mark message as sent with timestamp
        this.globalMemory.markMessageSent(number);
        console.log(`GreetingAgent: Message sent to ${number}: ${message}`);
    }
}
exports.GreetingAgent = GreetingAgent;
//# sourceMappingURL=GreetingAgent.js.map