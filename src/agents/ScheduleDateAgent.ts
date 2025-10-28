/**
 * ScheduleDateAgent - Handles date selection for appointments
 * Validates date availability and stores selected date
 */

import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';

export class ScheduleDateAgent extends BaseAgent {
  // Available appointment dates (in a real system, this would come from a database)
  private readonly availableDates: string[] = [
    '15/01/2025', '16/01/2025', '17/01/2025', '20/01/2025', '21/01/2025',
    '22/01/2025', '23/01/2025', '24/01/2025', '27/01/2025', '28/01/2025',
    '29/01/2025', '30/01/2025', '31/01/2025', '03/02/2025', '04/02/2025'
  ];

  constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory) {
    super('schedule.date', 'ScheduleDateAgent', sdkRabbitmq, globalMemory);
  }

  /**
   * Get the message this agent should send to the user
   * @returns The message string asking user to select a date
   */
  getAgentMessage(): string {
    const availableDatesText = this.availableDates.slice(0, 10).join(', ');
    return `Selecione uma data disponível para seu agendamento (formato DD/MM/AAAA):\n\nDatas disponíveis: ${availableDatesText}...\n\nPor favor, digite a data desejada:`;
  }

  /**
   * Validate user input for date selection
   * @param input - User input to validate (should be a valid date in DD/MM/YYYY format)
   * @returns true if input is valid and available date, false otherwise
   */
  validateInput(input: string): boolean {
    if (!input || input.trim() === '') {
      return false;
    }

    const trimmedInput = input.trim();
    
    // Check if input matches DD/MM/YYYY format
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = trimmedInput.match(dateRegex);
    
    if (!match) {
      return false;
    }

    const [, day, month, year] = match;
    if (!day || !month || !year) return false;
    
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    // Basic date validation
    if (dayNum < 1 || dayNum > 31) return false;
    if (monthNum < 1 || monthNum > 12) return false;
    if (yearNum < 2025 || yearNum > 2026) return false;

    // Check if date is valid (not like 31/02/2025)
    const dateObj = new Date(yearNum, monthNum - 1, dayNum);
    if (dateObj.getDate() !== dayNum || 
        dateObj.getMonth() !== monthNum - 1 || 
        dateObj.getFullYear() !== yearNum) {
      return false;
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) {
      return false;
    }

    // Check if date is available
    return this.isDateAvailable(trimmedInput);
  }

  /**
   * Check if a specific date is available for appointments
   * @param date - Date string in DD/MM/YYYY format
   * @returns true if date is available, false otherwise
   */
  private isDateAvailable(date: string): boolean {
    return this.availableDates.includes(date);
  }

  /**
   * Get available dates for display
   * @returns Array of available date strings
   */
  public getAvailableDates(): string[] {
    return [...this.availableDates];
  }

  /**
   * Process and store valid date selection
   * @param number - User's phone number
   * @param input - Validated date input
   */
  processInput(number: string, input: string): void {
    const selectedDate = input.trim();
    
    // Store the selected date
    this.globalMemory.setClientData(number, 'selectedDate', selectedDate);

    // Parse date for additional information
    const [day, month, year] = selectedDate.split('/');
    if (!day || !month || !year) return;
    
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const dayOfWeek = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });

    // Store additional date information
    this.globalMemory.setClientData(number, 'selectedDateFormatted', `${dayOfWeek}, ${selectedDate}`);

    console.log(`[${this.agentName}] User ${number} selected date: ${selectedDate} (${dayOfWeek})`);
  }

  /**
   * Get default value to use when user fails validation 3 times
   * @returns Default date (first available date)
   */
  getDefaultValueForErrors(): string {
    return this.availableDates[0] || '15/01/2025';
  }

  /**
   * Get next agent for this user based on their dynamic flow
   * @param number - User's phone number
   * @returns Next agent routing key for this user's flow
   */
  public getNextAgentForUser(number: string): string | null {
    try {
      const clientData = this.globalMemory.getClientData(number);
      const dynamicFlow = clientData.dynamicAgentsFlow as string[];
      
      if (!dynamicFlow || dynamicFlow.length === 0) {
        console.log(`[${this.agentName}] No dynamic flow found for ${number}, using default next agent`);
        return 'schedule.service';
      }

      // Find current position in flow and return next agent
      const currentIndex = dynamicFlow.indexOf(this.routingKey);
      if (currentIndex === -1) {
        console.log(`[${this.agentName}] Current agent not found in flow for ${number}`);
        return dynamicFlow[0] || null; // Return first agent as fallback
      }

      const nextIndex = currentIndex + 1;
      if (nextIndex < dynamicFlow.length) {
        const nextAgent = dynamicFlow[nextIndex];
        console.log(`[${this.agentName}] Next agent for ${number}: ${nextAgent}`);
        return nextAgent || null;
      }

      console.log(`[${this.agentName}] Flow completed for ${number}`);
      return null; // Flow completed
      
    } catch (error) {
      console.error(`[${this.agentName}] Error getting next agent for ${number}:`, error);
      return 'schedule.service'; // Fallback to service agent
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
        selectedDate: clientData.selectedDate,
        selectedDateFormatted: clientData.selectedDateFormatted,
        flowType: clientData.schedulingFlowType
      });
    } else {
      console.log(`🏁 [${this.agentName}] Flow completed for ${number} - no more agents`);
    }
  }
}