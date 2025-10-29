/**
 * ScheduleServiceAgent - Handles service selection for appointments
 * Validates service availability and stores selected service with pricing
 */

import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  available: boolean;
}

export class ScheduleServiceAgent extends BaseAgent {
  // Available services (in a real system, this would come from a database)
  private readonly availableServices: Service[] = [
    { 
      id: '1', 
      name: 'Consulta', 
      description: 'Consulta odontológica completa', 
      price: 80.00, 
      duration: 30, 
      available: true 
    },
    { 
      id: '2', 
      name: 'Limpeza', 
      description: 'Limpeza e profilaxia dental', 
      price: 120.00, 
      duration: 45, 
      available: true 
    },
    { 
      id: '3', 
      name: 'Restauração', 
      description: 'Restauração em resina composta', 
      price: 150.00, 
      duration: 60, 
      available: true 
    },
    { 
      id: '4', 
      name: 'Canal', 
      description: 'Tratamento de canal', 
      price: 400.00, 
      duration: 90, 
      available: true 
    },
    { 
      id: '5', 
      name: 'Extração', 
      description: 'Extração dentária simples', 
      price: 100.00, 
      duration: 30, 
      available: true 
    },
    { 
      id: '6', 
      name: 'Implante', 
      description: 'Implante dentário', 
      price: 1200.00, 
      duration: 120, 
      available: false 
    },
    { 
      id: '7', 
      name: 'Clareamento', 
      description: 'Clareamento dental a laser', 
      price: 300.00, 
      duration: 60, 
      available: true 
    }
  ];

  constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory) {
    super('schedule.service', 'ScheduleServiceAgent', sdkRabbitmq, globalMemory);
  }

  /**
   * Get the message this agent should send to the user
   * @returns The message string asking user to select a service
   */
  getAgentMessage(): string {
    const availableServicesList = this.getAvailableServices()
      .map(service => `${service.id} - ${service.name} - R$ ${service.price.toFixed(2)}\n   ${service.description}`)
      .join('\n\n');

    return `Selecione um serviço para seu agendamento:\n\n${availableServicesList}\n\nDigite o número do serviço desejado:`;
  }

  /**
   * Validate user input for service selection
   * @param input - User input to validate (should be a valid service ID)
   * @returns true if input is valid and available service, false otherwise
   */
  validateInput(input: string): boolean {
    if (!input || input.trim() === '') {
      return false;
    }

    const trimmedInput = input.trim();
    
    // Check if input is a valid service ID
    const serviceId = trimmedInput;
    const service = this.availableServices.find(s => s.id === serviceId);
    
    if (!service) {
      return false;
    }

    // Check if service is available
    return service.available;
  }

  /**
   * Get available services (only those that are available)
   * @returns Array of available services
   */
  public getAvailableServices(): Service[] {
    return this.availableServices.filter(service => service.available);
  }

  /**
   * Get all services (including unavailable ones)
   * @returns Array of all services
   */
  public getAllServices(): Service[] {
    return [...this.availableServices];
  }

  /**
   * Get service by ID
   * @param id - Service ID
   * @returns Service object or null if not found
   */
  public getServiceById(id: string): Service | null {
    return this.availableServices.find(service => service.id === id) || null;
  }

  /**
   * Check if service is available
   * @param serviceId - Service ID to check
   * @returns true if service is available, false otherwise
   */
  private isServiceAvailable(serviceId: string): boolean {
    const service = this.getServiceById(serviceId);
    return service ? service.available : false;
  }

  /**
   * Format price for display
   * @param price - Price value
   * @returns Formatted price string
   */
  private formatPrice(price: number): string {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  }

  /**
   * Process and store valid service selection
   * @param number - User's phone number
   * @param input - Validated service ID input
   */
  processInput(number: string, input: string): void {
    const selectedServiceId = input.trim();
    const selectedService = this.getServiceById(selectedServiceId);
    
    if (!selectedService) {
      console.error(`[${this.agentName}] Service not found for ID: ${selectedServiceId}`);
      return;
    }

    // Store the selected service information
    this.globalMemory.setClientData(number, 'selectedServiceId', selectedServiceId);
    this.globalMemory.setClientData(number, 'selectedServiceName', selectedService.name);
    this.globalMemory.setClientData(number, 'selectedServiceDescription', selectedService.description);
    this.globalMemory.setClientData(number, 'selectedServicePrice', selectedService.price);
    this.globalMemory.setClientData(number, 'selectedServiceDuration', selectedService.duration);
    this.globalMemory.setClientData(number, 'selectedServicePriceFormatted', this.formatPrice(selectedService.price));

    console.log(`[${this.agentName}] User ${number} selected service: ${selectedService.name} - ${this.formatPrice(selectedService.price)}`);
  }

  /**
   * Get default value to use when user fails validation 3 times
   * @returns Default service ID (first available service - consultation)
   */
  getDefaultValueForErrors(): string {
    const availableServices = this.getAvailableServices();
    return availableServices.length > 0 ? (availableServices[0]?.id || '1') : '1';
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
        return 'schedule.payment';
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
      return 'schedule.payment'; // Fallback to payment agent
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

      // Send command to next agent on the unified 'agents' exchange
      await this.sdkRabbitmq.publish('agents', nextAgentRoutingKey, activationCommand);

      console.log(`✅ [${this.agentName}] Next agent ${nextAgentRoutingKey} activated for ${number}`);

      // Log current session state
      const clientData = this.globalMemory.getClientData(number);
      console.log(`📊 [${this.agentName}] Session state for ${number}:`, {
        selectedServiceId: clientData.selectedServiceId,
        selectedServiceName: clientData.selectedServiceName,
        selectedServicePrice: clientData.selectedServicePriceFormatted,
        flowType: clientData.schedulingFlowType
      });
    } else {
      console.log(`🏁 [${this.agentName}] Flow completed for ${number} - no more agents`);
    }
  }
}
