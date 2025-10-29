/**
 * ScheduleDentistAgent - Handles dentist selection for appointments
 * Validates dentist availability and stores selected dentist
 */

import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';

interface Dentist {
  id: string;
  name: string;
  specialty: string;
  available: boolean;
}

export class ScheduleDentistAgent extends BaseAgent {
  // Available dentists (in a real system, this would come from a database)
  private readonly availableDentists: Dentist[] = [
    { id: '1', name: 'Dr. João Silva', specialty: 'Clínico Geral', available: true },
    { id: '2', name: 'Dra. Maria Santos', specialty: 'Ortodontia', available: true },
    { id: '3', name: 'Dr. Pedro Costa', specialty: 'Implantodontia', available: true },
    { id: '4', name: 'Dra. Ana Oliveira', specialty: 'Endodontia', available: true },
    { id: '5', name: 'Dr. Carlos Ferreira', specialty: 'Periodontia', available: false },
    { id: '6', name: 'Dra. Lucia Mendes', specialty: 'Cirurgia Oral', available: true }
  ];

  constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory) {
    super('schedule.dentist', 'ScheduleDentistAgent', sdkRabbitmq, globalMemory);
  }

  /**
   * Get the message this agent should send to the user
   * @returns The message string asking user to select a dentist
   */
  getAgentMessage(): string {
    const availableDentistsList = this.getAvailableDentists()
      .map(dentist => `${dentist.id} - ${dentist.name} (${dentist.specialty})`)
      .join('\n');

    return `Selecione um dentista para seu agendamento:\n\n${availableDentistsList}\n\nDigite o número do dentista desejado:`;
  }

  /**
   * Validate user input for dentist selection
   * @param input - User input to validate (should be a valid dentist ID)
   * @returns true if input is valid and available dentist, false otherwise
   */
  validateInput(input: string): boolean {
    if (!input || input.trim() === '') {
      return false;
    }

    const trimmedInput = input.trim();
    
    // Check if input is a valid dentist ID (1-6)
    const dentistId = trimmedInput;
    const dentist = this.availableDentists.find(d => d.id === dentistId);
    
    if (!dentist) {
      return false;
    }

    // Check if dentist is available
    return dentist.available;
  }

  /**
   * Get available dentists (only those who are available)
   * @returns Array of available dentists
   */
  public getAvailableDentists(): Dentist[] {
    return this.availableDentists.filter(dentist => dentist.available);
  }

  /**
   * Get all dentists (including unavailable ones)
   * @returns Array of all dentists
   */
  public getAllDentists(): Dentist[] {
    return [...this.availableDentists];
  }

  /**
   * Get dentist by ID
   * @param id - Dentist ID
   * @returns Dentist object or null if not found
   */
  public getDentistById(id: string): Dentist | null {
    return this.availableDentists.find(dentist => dentist.id === id) || null;
  }

  /**
   * Check if dentist is available for appointments
   * @param dentistId - Dentist ID to check
   * @returns true if dentist is available, false otherwise
   */
  private isDentistAvailable(dentistId: string): boolean {
    const dentist = this.getDentistById(dentistId);
    return dentist ? dentist.available : false;
  }

  /**
   * Process and store valid dentist selection
   * @param number - User's phone number
   * @param input - Validated dentist ID input
   */
  processInput(number: string, input: string): void {
    const selectedDentistId = input.trim();
    const selectedDentist = this.getDentistById(selectedDentistId);
    
    if (!selectedDentist) {
      console.error(`[${this.agentName}] Dentist not found for ID: ${selectedDentistId}`);
      return;
    }

    // Store the selected dentist information
    this.globalMemory.setClientData(number, 'selectedDentistId', selectedDentistId);
    this.globalMemory.setClientData(number, 'selectedDentistName', selectedDentist.name);
    this.globalMemory.setClientData(number, 'selectedDentistSpecialty', selectedDentist.specialty);

    console.log(`[${this.agentName}] User ${number} selected dentist: ${selectedDentist.name} (${selectedDentist.specialty})`);
  }

  /**
   * Get default value to use when user fails validation 3 times
   * @returns Default dentist ID (first available dentist)
   */
  getDefaultValueForErrors(): string {
    const availableDentists = this.getAvailableDentists();
    return availableDentists.length > 0 ? (availableDentists[0]?.id || '1') : '1';
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
        selectedDentistId: clientData.selectedDentistId,
        selectedDentistName: clientData.selectedDentistName,
        selectedDentistSpecialty: clientData.selectedDentistSpecialty,
        flowType: clientData.schedulingFlowType
      });
    } else {
      console.log(`🏁 [${this.agentName}] Flow completed for ${number} - no more agents`);
    }
  }
}
