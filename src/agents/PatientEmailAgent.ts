/**
 * PatientEmailAgent - Collects patient email information
 * Implementation will be added in task 5.4
 */

import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';
import { AGENT_MESSAGES, DEFAULT_VALUES } from '../types/constants';
import { validateEmail } from '../utils/validation';

export class PatientEmailAgent extends BaseAgent {
  constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory) {
    super('patient.email', 'PatientEmailAgent', sdkRabbitmq, globalMemory);
  }

  getAgentMessage(): string {
    return AGENT_MESSAGES.PATIENT_EMAIL;
  }

  validateInput(input: string): boolean {
    if (!input || input.trim() === '') {
      return false;
    }

    // Use the validation utility to validate email
    return validateEmail(input.trim());
  }

  processInput(number: string, input: string): void {
    const trimmedInput = input.trim().toLowerCase(); // Store email in lowercase
    
    // Store the email in global memory
    this.globalMemory.setClientData(number, 'email', trimmedInput);
    
    console.log(`PatientEmailAgent: Stored email for ${number}: ${trimmedInput}`);
  }

  getDefaultValueForErrors(): string {
    return DEFAULT_VALUES.EMAIL;
  }




}