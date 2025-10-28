/**
 * ScheduleNewAgent - Handles initial scheduling choice selection
 * Allows users to choose what to define first: date, service, or dentist
 */

import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';

export class ScheduleNewAgent extends BaseAgent {
  constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory) {
    super('schedule.new', 'ScheduleNewAgent', sdkRabbitmq, globalMemory);
  }

  /**
   * Get the message this agent should send to the user
   * @returns The message string asking user to choose what to define first
   */
  getAgentMessage(): string {
    return "O que você deseja definir nesse momento? 1- data, 2- serviço ou 3- dentista";
  }

  /**
   * Validate user input for scheduling choice
   * @param input - User input to validate (should be 1, 2, or 3)
   * @returns true if input is valid choice (1, 2, or 3), false otherwise
   */
  validateInput(input: string): boolean {
    if (!input || input.trim() === '') {
      return false;
    }

    const trimmedInput = input.trim();

    // Accept numeric choices: 1, 2, 3
    if (['1', '2', '3'].includes(trimmedInput)) {
      return true;
    }

    // Accept text choices (case insensitive)
    const lowerInput = trimmedInput.toLowerCase();
    if (['data', 'serviço', 'servico', 'dentista'].includes(lowerInput)) {
      return true;
    }

    return false;
  }

  /**
   * Process and store valid user choice, set up dynamic flow
   * @param number - User's phone number
   * @param input - Validated user input (1, 2, or 3)
   */
  processInput(number: string, input: string): void {
    const trimmedInput = input.trim();
    let choice: string;
    let flowType: string;

    // Normalize input to choice number
    if (trimmedInput === '1' || trimmedInput.toLowerCase() === 'data') {
      choice = '1';
      flowType = 'date-first';
    } else if (trimmedInput === '2' || ['serviço', 'servico'].includes(trimmedInput.toLowerCase())) {
      choice = '2';
      flowType = 'service-first';
    } else if (trimmedInput === '3' || trimmedInput.toLowerCase() === 'dentista') {
      choice = '3';
      flowType = 'dentist-first';
    } else {
      // Fallback to date-first if somehow invalid input gets here
      choice = '1';
      flowType = 'date-first';
    }

    // Store the user's scheduling choice
    this.globalMemory.setClientData(number, 'schedulingChoice', choice);
    this.globalMemory.setClientData(number, 'schedulingFlowType', flowType);

    // Set up dynamic flow based on user choice
    this.setupDynamicFlow(number, flowType);

    console.log(`[${this.agentName}] User ${number} chose option ${choice} (${flowType})`);
  }

  /**
   * Set up dynamic agent flow based on user's choice
   * @param number - User's phone number
   * @param flowType - Type of flow to set up (date-first, service-first, dentist-first)
   */
  private setupDynamicFlow(number: string, flowType: string): void {
    let dynamicFlow: string[];

    switch (flowType) {
      case 'date-first':
        dynamicFlow = ['schedule.date', 'schedule.service', 'schedule.dentist', 'schedule.payment'];
        break;
      case 'service-first':
        dynamicFlow = ['schedule.service', 'schedule.date', 'schedule.dentist', 'schedule.payment'];
        break;
      case 'dentist-first':
        dynamicFlow = ['schedule.dentist', 'schedule.date', 'schedule.service', 'schedule.payment'];
        break;
      default:
        // Default to date-first flow
        dynamicFlow = ['schedule.date', 'schedule.service', 'schedule.dentist', 'schedule.payment'];
        break;
    }

    // Store the dynamic flow for this specific user session
    this.globalMemory.setClientData(number, 'dynamicAgentsFlow', dynamicFlow);

    console.log(`[${this.agentName}] Dynamic flow set for ${number}: ${dynamicFlow.join(' → ')}`);
  }

  /**
   * Get default value to use when user fails validation 3 times
   * @returns Default choice (1 - date first)
   */
  getDefaultValueForErrors(): string {
    return '1'; // Default to date-first option
  }

  /**
   * Override getNextAgent to use dynamic flow instead of global flow
   * @returns Next agent routing key based on user's chosen flow
   */
  public getNextAgent(): string | null {
    // This method should be called with the user's number context
    // For now, return the first agent in date-first flow as default
    return 'schedule.date';
  }

  /**
   * Get next agent for specific user based on their dynamic flow
   * @param number - User's phone number
   * @returns Next agent routing key for this user's flow
   */
  public getNextAgentForUser(number: string): string | null {
    try {
      const clientData = this.globalMemory.getClientData(number);
      const dynamicFlow = clientData.dynamicAgentsFlow as string[];

      if (!dynamicFlow || dynamicFlow.length === 0) {
        console.log(`[${this.agentName}] No dynamic flow found for ${number}, using default`);
        return 'schedule.date';
      }

      // Return the first agent in the dynamic flow
      const nextAgent = dynamicFlow[0];
      console.log(`[${this.agentName}] Next agent for ${number}: ${nextAgent}`);
      return nextAgent || null;

    } catch (error) {
      console.error(`[${this.agentName}] Error getting next agent for ${number}:`, error);
      return 'schedule.date'; // Fallback to date agent
    }
  }

  /**
   * Override moveToNextAgent to use dynamic flow
   * @param number - User's phone number
   */
  public async moveToNextAgent(number: string): Promise<void> {
    const nextAgentRoutingKey = this.getNextAgentForUser(number);

    console.log(`🔄 [${this.agentName}] Flow transition: ${this.routingKey} → ${nextAgentRoutingKey || 'COMPLETED'} for ${number}`);

    if (nextAgentRoutingKey) {
      console.log(`🚀 [${this.agentName}] Moving to next agent: ${nextAgentRoutingKey}`);

      // Update stage to next agent (thread-safe)
      try {
        await this.setCurrentStageSafe(number, nextAgentRoutingKey);
        console.log(`📝 [${this.agentName}] Stage updated to ${nextAgentRoutingKey} for ${number}`);
      } catch (error) {
        console.error(`❌ [${this.agentName}] Failed to update stage to ${nextAgentRoutingKey} for ${number}:`, error);
        return;
      }

      // Create activation command
      const activationCommand = {
        number: number,
        sender: this.agentName,
        timestamp: Date.now()
      };

      // Send command to next agent
      await this.sdkRabbitmq.publish('chatbot.agents', nextAgentRoutingKey, activationCommand);

      console.log(`✅ [${this.agentName}] Next agent ${nextAgentRoutingKey} activated for ${number}`);

      // Log current session state
      const clientData = this.globalMemory.getClientData(number);
      console.log(`📊 [${this.agentName}] Session state for ${number}:`, {
        schedulingChoice: clientData.schedulingChoice,
        flowType: clientData.schedulingFlowType,
        dynamicFlow: clientData.dynamicAgentsFlow
      });
    } else {
      console.log(`🏁 [${this.agentName}] Flow completed for ${number} - no more agents`);
    }
  }
}