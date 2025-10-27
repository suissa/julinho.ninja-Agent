/**
 * Message payload structures for agent communication
 */

export interface AgentActivationPayload {
  number: string;
  sender: string;
  timestamp: number;
}

export interface WhatsAppMessage {
  number: string;
  text: string;
  timestamp?: number;
}

export interface UserMessage {
  number: string;
  text: string;
  timestamp: Date;
  correlationId?: string;
}