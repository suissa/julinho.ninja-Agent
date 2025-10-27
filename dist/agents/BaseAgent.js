"use strict";
/**
 * Base Agent class - Abstract base for all agents
 * Provides common functionality for all agent implementations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const logger_1 = require("../utils/logger");
class BaseAgent {
    /**
     * Constructor for BaseAgent
     * @param routingKey - RabbitMQ routing key for this agent
     * @param agentName - Human-readable name for this agent
     * @param sdkRabbitmq - RabbitMQ SDK instance
     * @param globalMemory - Global memory manager instance
     */
    constructor(routingKey, agentName, sdkRabbitmq, globalMemory) {
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
        this.logger = logger_1.Logger.getInstance();
    }
    // Core agent functionality methods
    /**
     * Send message to WhatsApp user with duplicate prevention
     * @param number - User's phone number
     * @param message - Message to send
     */
    async sendToWhatsApp(number, message) {
        if (!number || number.trim() === '') {
            throw new Error('Phone number cannot be empty');
        }
        if (!message || message.trim() === '') {
            throw new Error('Message cannot be empty');
        }
        // CRITICAL: Check if we can send message (prevent duplicate messages)
        if (!this.globalMemory.canSendMessage(number)) {
            const isDuplicate = true;
            this.logger.messageSent(number, this.agentName, message.length, isDuplicate);
            throw new Error(`BLOCKED: Cannot send duplicate message to ${number}. Last message sent too recently.`);
        }
        const startTime = Date.now();
        try {
            // Send message to WhatsApp
            await this.sdkRabbitmq.publish('whatsapp.message.text', 'send', {
                number: number,
                text: message
            });
            // Mark message as sent with timestamp
            this.globalMemory.markMessageSent(number);
            const duration = Date.now() - startTime;
            this.logger.messageSent(number, this.agentName, message.length);
            this.logger.debug(`Message sent successfully`, { messagePreview: message.substring(0, 50) }, number, this.agentName, duration);
        }
        catch (error) {
            this.logger.systemError(error, { operation: 'sendToWhatsApp', messageLength: message.length }, number, this.agentName);
            throw error;
        }
    }
    /**
     * Activate the next agent in the flow sequence
     * @param number - User's phone number
     */
    async activateNextAgent(number) {
        if (!number || number.trim() === '') {
            throw new Error('Phone number cannot be empty');
        }
        const startTime = Date.now();
        try {
            // 1. Get next agent routing key from global memory
            const nextAgentRoutingKey = this.globalMemory.getNextAgent();
            if (nextAgentRoutingKey) {
                this.logger.agentRouting(this.agentName, nextAgentRoutingKey, number, 'normal_flow');
                // 2. Update current stage in global memory (thread-safe)
                await this.setCurrentStageSafe(number, nextAgentRoutingKey);
                // 3. Create activation payload
                const payload = {
                    number: number,
                    sender: this.agentName,
                    timestamp: Date.now()
                };
                // 4. Publish to next agent queue
                await this.sdkRabbitmq.publish('chatbot.agents', nextAgentRoutingKey, payload);
                const duration = Date.now() - startTime;
                this.logger.info(`Next agent activated successfully`, { nextAgent: nextAgentRoutingKey }, number, this.agentName, duration);
                // 5. Wait 5 seconds before allowing next operations
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
            else {
                this.logger.info(`Flow completed - no more agents`, { action: 'flow_complete' }, number, this.agentName);
            }
        }
        catch (error) {
            this.logger.systemError(error, { operation: 'activateNextAgent' }, number, this.agentName);
            throw error;
        }
    }
    /**
     * Subscribe to messages from a specific phone number
     * @param number - User's phone number to subscribe to
     */
    async subscribeToPhone(number) {
        if (!number || number.trim() === '') {
            throw new Error('Phone number cannot be empty');
        }
        const startTime = Date.now();
        try {
            const queueName = `queue-${this.agentName}-${number}`;
            const routingKey = `phone.${number}`;
            this.logger.debug(`Subscribing to phone messages`, { queueName, routingKey }, number, this.agentName);
            await this.sdkRabbitmq.subscribe('chatbot.messages', queueName, routingKey, (message) => this.handleUserMessage(message));
            const duration = Date.now() - startTime;
            this.logger.debug(`Successfully subscribed to phone messages`, { queueName, routingKey }, number, this.agentName, duration);
        }
        catch (error) {
            this.logger.systemError(error, { operation: 'subscribeToPhone', queueName: `queue-${this.agentName}-${number}` }, number, this.agentName);
            throw error;
        }
    }
    /**
     * Unsubscribe from messages from a specific phone number
     * @param number - User's phone number to unsubscribe from
     */
    async unsubscribeFromPhone(number) {
        if (!number || number.trim() === '') {
            throw new Error('Phone number cannot be empty');
        }
        try {
            const queueName = `queue-${this.agentName}-${number}`;
            const routingKey = `phone.${number}`;
            console.log(`[${this.agentName}] Unsubscribing from phone messages: ${routingKey}`);
            await this.sdkRabbitmq.unbind('chatbot.messages', queueName, routingKey);
            console.log(`[${this.agentName}] Successfully unsubscribed from ${routingKey}`);
        }
        catch (error) {
            console.error(`[${this.agentName}] Failed to unsubscribe from phone ${number}:`, error);
            throw error;
        }
    }
    /**
     * Handle agent activation - called when this agent should become active
     * @param payload - Activation payload with phone number and sender info
     */
    async onActivation(payload) {
        if (!payload || !payload.number) {
            this.logger.error(`Invalid activation payload received`, { payload }, undefined, this.agentName);
            return;
        }
        const number = payload.number;
        const currentStage = this.globalMemory.getCurrentStage(number);
        // Log structured agent activation
        this.logger.agentActivation({
            agentName: this.agentName,
            number,
            activatedBy: payload.sender || 'unknown',
            timestamp: payload.timestamp || Date.now(),
            stage: currentStage || this.routingKey,
            sessionId: `session-${number}-${Date.now()}`
        });
        try {
            // 1. Verify if this agent should be active for this stage
            if (currentStage !== this.routingKey) {
                this.logger.warn(`Activation ignored - stage mismatch`, {
                    expectedStage: this.routingKey,
                    currentStage
                }, number, this.agentName);
                return;
            }
            // 2. Check if we can send message (prevent duplicate messages)
            if (!this.globalMemory.canSendMessage(number)) {
                this.logger.warn(`Cannot send message - too recent`, { action: 'duplicate_prevention' }, number, this.agentName);
                return;
            }
            // 3. Subscribe to phone messages
            await this.subscribeToPhone(number);
            // 4. Send agent message to WhatsApp user
            await this.sendToWhatsApp(number, this.getAgentMessage());
            // 5. Start user response timeout
            this.globalMemory.startUserResponseTimeout(number, this.routingKey, (phone, stage) => this.handleUserTimeout(phone, stage), (phone, stage) => this.handleReminderTimeout(phone, stage));
            // Log activation completion
            this.logger.agentActivationComplete(this.agentName, number);
            // Note: User response will be handled by handleUserMessage callback
        }
        catch (error) {
            this.logger.systemError(error, { operation: 'onActivation' }, number, this.agentName);
            throw error;
        }
    }
    /**
     * Handle user message received via subscription callback
     * @param message - User message from WhatsApp
     */
    async handleUserMessage(message) {
        console.log("\n\n\n\n\n\n =====> ripa na xulipa: ", message);
        if (!message || !message.number || !message.text) {
            this.logger.error(`Invalid user message received`, { message }, undefined, this.agentName);
            return;
        }
        const number = message.number;
        const userInput = message.text.trim();
        const processingStartTime = Date.now();
        this.logger.debug(`Received user message`, { inputLength: userInput.length }, number, this.agentName);
        try {
            // 1. Clear any active timeout (user responded in time)
            this.globalMemory.clearUserResponseTimeout(number);
            // 2. Verify if this agent should handle this message (stage verification)
            const currentStage = this.globalMemory.getCurrentStage(number);
            if (currentStage !== this.routingKey) {
                console.log(`[${this.agentName}] Received message but current stage is ${currentStage}, ignoring.`);
                return;
            }
            // 2. Validate user input
            const isValid = this.validateInput(userInput);
            const processingTime = Date.now() - processingStartTime;
            // Log user input processing
            this.logger.userInputProcessed({
                number,
                agentName: this.agentName,
                inputLength: userInput.length,
                isValid,
                processingTime,
                sanitizedInput: userInput.substring(0, 20) + (userInput.length > 20 ? '...' : '')
            });
            if (!isValid) {
                // Increment error count (thread-safe)
                await this.markStageAsErrorSafe(number, this.routingKey);
                const errorCount = this.globalMemory.getStageErrorCount(number, this.routingKey);
                // Log validation error
                this.logger.validationError(number, this.agentName, userInput, ['Invalid format'], errorCount);
                if (errorCount >= 3) {
                    // Set default value after 3 errors (thread-safe)
                    const defaultValue = this.getDefaultValueForErrors();
                    this.logger.warn(`Max validation errors reached, using default value`, {
                        defaultValue,
                        errorCount
                    }, number, this.agentName);
                    await this.processInputSafe(number, defaultValue);
                    await this.sendToWhatsApp(number, `Após 3 tentativas, definindo valor padrão. Continuando...`);
                }
                else {
                    this.logger.info(`Validation failed, requesting retry`, {
                        attempt: errorCount,
                        maxAttempts: 3
                    }, number, this.agentName);
                    await this.sendToWhatsApp(number, `Informação inválida (tentativa ${errorCount}/3). ${this.getAgentMessage()}`);
                    return;
                }
            }
            else {
                // 3. Process and store valid data
                this.logger.info(`Processing valid input`, { action: 'input_accepted' }, number, this.agentName);
                this.processInput(number, userInput);
            }
            // 4. Mark stage as visited
            this.globalMemory.markStageAsVisited(number, this.routingKey);
            // 5. Unsubscribe from this phone (agent job done)
            await this.unsubscribeFromPhone(number);
            // 6. Activate next agent
            await this.activateNextAgent(number);
            const totalProcessingTime = Date.now() - processingStartTime;
            this.logger.info(`Successfully completed message processing`, {
                action: 'message_processing_complete'
            }, number, this.agentName, totalProcessingTime);
        }
        catch (error) {
            this.logger.systemError(error, { operation: 'handleUserMessage' }, number, this.agentName);
            throw error;
        }
    }
    /**
     * Handle WhatsApp message directly (alternative entry point)
     * @param number - User's phone number
     * @param message - Message text from user
     */
    async onWhatsAppMessage(number, message) {
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
                }
                else {
                    console.log(`[${this.agentName}] Invalid input from ${number} (attempt ${errorCount}/3)`);
                    await this.sendToWhatsApp(number, `Informação inválida (tentativa ${errorCount}/3). ${this.getAgentMessage()}`);
                    return;
                }
            }
            else {
                // 3. Process and store valid data
                console.log(`[${this.agentName}] Processing valid input from ${number}`);
                this.processInput(number, userInput);
            }
            // 4. Mark stage as visited
            this.globalMemory.markStageAsVisited(number, this.routingKey);
            // 5. Unsubscribe from this phone (agent job done)
            await this.unsubscribeFromPhone(number);
            // 6. Activate next agent
            await this.activateNextAgent(number);
            console.log(`[${this.agentName}] Successfully completed processing for ${number}`);
        }
        catch (error) {
            console.error(`[${this.agentName}] Error handling WhatsApp message from ${number}:`, error);
            throw error;
        }
    }
    /**
     * Handle user response timeout - send reminder message
     * @param number - User's phone number
     * @param stage - Current stage that timed out
     */
    async handleReminderTimeout(number, stage) {
        try {
            this.logger.timeoutEvent('reminder', number, this.agentName, stage);
            const reminderMessage = `⏰ Você ainda está aí? ${this.getAgentMessage()}`;
            await this.sendToWhatsApp(number, reminderMessage);
            this.logger.info(`Reminder message sent successfully`, { stage }, number, this.agentName);
        }
        catch (error) {
            this.logger.systemError(error, { operation: 'handleReminderTimeout', stage }, number, this.agentName);
        }
    }
    /**
     * Thread-safe wrapper for processInput
     * @param number - User's phone number
     * @param input - User input to process
     */
    async processInputSafe(number, input) {
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
    async markStageAsVisitedSafe(number, stage) {
        await this.globalMemory.markStageAsVisitedSafe(number, stage);
    }
    /**
     * Thread-safe wrapper for error marking
     * @param number - User's phone number
     * @param stage - Stage to mark as error
     */
    async markStageAsErrorSafe(number, stage) {
        await this.globalMemory.markStageAsErrorSafe(number, stage);
    }
    /**
     * Thread-safe wrapper for stage setting
     * @param number - User's phone number
     * @param stage - Stage to set as current
     */
    async setCurrentStageSafe(number, stage) {
        await this.globalMemory.setCurrentStageSafe(number, stage);
    }
    /**
     * Handle final timeout - end session gracefully
     * @param number - User's phone number
     * @param stage - Current stage that timed out
     */
    async handleUserTimeout(number, stage) {
        try {
            this.logger.timeoutEvent('final', number, this.agentName, stage);
            // Use default value for this agent (thread-safe)
            const defaultValue = this.getDefaultValueForErrors();
            await this.processInputSafe(number, defaultValue);
            // Send timeout message
            const timeoutMessage = `⏰ Tempo esgotado. Definindo valor padrão e continuando com o próximo passo.`;
            await this.sendToWhatsApp(number, timeoutMessage);
            // Mark stage as visited (thread-safe)
            await this.markStageAsVisitedSafe(number, this.routingKey);
            // Unsubscribe from this phone
            await this.unsubscribeFromPhone(number);
            // Activate next agent
            await this.activateNextAgent(number);
            this.logger.info(`Session ended gracefully due to timeout`, {
                stage,
                defaultValue,
                action: 'timeout_recovery'
            }, number, this.agentName);
        }
        catch (error) {
            this.logger.systemError(error, { operation: 'handleUserTimeout', stage }, number, this.agentName);
            // Fallback: just clear the timeout and move on
            try {
                await this.unsubscribeFromPhone(number);
                await this.activateNextAgent(number);
                this.logger.warn(`Fallback timeout recovery executed`, { stage }, number, this.agentName);
            }
            catch (fallbackError) {
                this.logger.systemError(fallbackError, { operation: 'handleUserTimeout_fallback', stage }, number, this.agentName);
            }
        }
    }
}
exports.BaseAgent = BaseAgent;
//# sourceMappingURL=BaseAgent.js.map