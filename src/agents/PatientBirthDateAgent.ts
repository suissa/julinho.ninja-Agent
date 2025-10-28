/**
 * PatientBirthDateAgent - Collects patient birth date information
 * Implementation will be added in task 5.3
 */

import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';
import { AGENT_MESSAGES, DEFAULT_VALUES } from '../types/constants';
import { validateBirthDate } from '../utils/validation';

export class PatientBirthDateAgent extends BaseAgent {
  constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory) {
    super('patient.birthDate', 'PatientBirthDateAgent', sdkRabbitmq, globalMemory);
  }

  getAgentMessage(): string {
    return AGENT_MESSAGES.PATIENT_BIRTH_DATE;
  }

  validateInput(input: string): boolean {
    if (!input || input.trim() === '') {
      return false;
    }

    // Use the validation utility to validate birth date
    return validateBirthDate(input.trim());
  }

  processInput(number: string, input: string): void {
    const trimmedInput = input.trim();
    
    // Store the birth date in global memory
    this.globalMemory.setClientData(number, 'birthDate', trimmedInput);
    
    console.log(`PatientBirthDateAgent: Stored birth date for ${number}: ${trimmedInput}`);
  }

  getDefaultValueForErrors(): string {
    return DEFAULT_VALUES.BIRTH_DATE;
  }
}
