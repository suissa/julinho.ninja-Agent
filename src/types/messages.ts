/**
 * Message payload structures for agent communication
 */

import { TimeTimestampUnix } from '@tys/shared';

export interface AgentActivationPayload {
  number: string;
  sender: string;
  timestamp: TimeTimestampUnix;
}

export interface WhatsAppMessage {
  number: string;
  text: string;
  timestamp?: TimeTimestampUnix;
}

export interface UserMessage {
  number: string;
  text: string;
  timestamp: Date;
  correlationId?: string;
}
