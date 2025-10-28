/**
 * PatientCPFAgent - Collects patient CPF information
 * Implementation will be added in task 5.2
 */

import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '@src/sdk/SdkRabbitmq';
import { IGlobalMemory } from '@src/memory/interfaces';
import { AGENT_MESSAGES, DEFAULT_VALUES } from '@types/constants';
import { validateCPF } from '@src/utils/validation';

export class PatientCPFAgent extends BaseAgent {
  constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory) {
    super('patient.cpf', 'PatientCPFAgent', sdkRabbitmq, globalMemory);
  }

  getAgentMessage(): string {
    return AGENT_MESSAGES.PATIENT_CPF;
  }

  validateInput(input: string): boolean {
    if (!input || input.trim() === '') {
      return false;
    }

    // Use the validation utility to validate CPF
    return validateCPF(input.trim());
  }

  processInput(number: string, input: string): void {
    // Clean CPF (remove any non-numeric characters)
    const cleanedCPF = input.replace(/\D/g, '');
    
    // Store the CPF in global memory
    this.globalMemory.setClientData(number, 'cpf', cleanedCPF);
    
    console.log(`PatientCPFAgent: Stored CPF for ${number}: ${cleanedCPF}`);
  }

  getDefaultValueForErrors(): string {
    return DEFAULT_VALUES.CPF;
  }
}
