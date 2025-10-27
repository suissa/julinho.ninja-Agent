/**
 * Agent-related interfaces and types
 */

export interface IAgent {
  getAgentMessage(): string;
  validateInput(input: string): boolean;
  processInput(number: string, input: string): void;
  getDefaultValueForErrors(): string;
}