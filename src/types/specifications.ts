/**
 * Specification Pattern interfaces for Agent behavior
 */

import { TimeTimestampUnix } from './shared';

export interface AgentActivationCommand {
  number: string;
  sender: string;
  timestamp: TimeTimestampUnix;
}

export interface AgentSpecification {
  /**
   * Verifica se este agent deve ser ativado para o telefone especificado
   * Pesquisa na memória se este agent é o atual no fluxo
   * Se verdadeiro, faz bind na exchange="chatbot.messages" + routingKey="phone.{telefone}"
   */
  isActivatedBy(command: AgentActivationCommand): Promise<boolean>;

  /**
   * Verifica se o agent processou e validou a resposta do usuário com sucesso
   * Se verdadeiro, faz unbind da routingKey do telefone e ativa o próximo agent
   */
  isSatisfiedBy(number: string, userInput: string): Promise<boolean>;
}

export interface AgentFlowSpecification {
  /**
   * Verifica se este agent é o atual no fluxo para o telefone especificado
   */
  isCurrentAgent(number: string): boolean;

  /**
   * Obtém o próximo agent no fluxo
   */
  getNextAgent(): string | null;

  /**
   * Marca este agent como satisfeito e move para o próximo
   */
  moveToNextAgent(number: string): Promise<void>;
}