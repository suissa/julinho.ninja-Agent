/**
 * PatientNameAgent - Collects patient name information
 * Implementation will be added in task 5.1
 */

import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';
import { AGENT_MESSAGES, DEFAULT_VALUES } from '../types/constants';

export class PatientNameAgent extends BaseAgent {
  constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory) {
    super('patient.name', 'PatientNameAgent', sdkRabbitmq, globalMemory);
  }

  getAgentMessage(): string {
    return AGENT_MESSAGES.PATIENT_NAME;
  }

  validateInput(input: string): boolean {
    if (!input || input.trim() === '') {
      return false;
    }

    const trimmedInput = input.trim();
    
    // Check minimum length
    if (trimmedInput.length < 2) {
      return false;
    }

    // Check for at least 2 words (first name and last name)
    const words = trimmedInput.split(/\s+/).filter(word => word.length > 0);
    if (words.length < 2) {
      return false;
    }

    // Check for valid name characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
    if (!nameRegex.test(trimmedInput)) {
      return false;
    }

    return true;
  }

  processInput(number: string, input: string): void {
    const trimmedInput = input.trim();
    
    // Store the name in global memory
    this.globalMemory.setClientData(number, 'name', trimmedInput);
    
    console.log(`PatientNameAgent: Stored name for ${number}: ${trimmedInput}`);
  }

  getDefaultValueForErrors(): string {
    return DEFAULT_VALUES.NAME;
  }
}