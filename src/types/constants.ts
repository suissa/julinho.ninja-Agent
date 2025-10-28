/**
 * System constants for exchanges, routing keys, and configuration
 */

import { PatientCpf, PatientEmail, TimeDurationMS, MetricsRetryCount } from './shared';

import { SystemExchangeName } from './config';

// Tipagem Semântica Atômica - Inline Implementation (Tipos únicos para constants)
// Sistema de branding sem runtime overhead
declare const __brand: unique symbol;
type Brand<T, Name extends string> = T & { readonly [__brand]: Name };

function STAMP<Name extends string>() {
  return {
    of: <T>(v: T) => v as Brand<T, Name>,
    un: <T>(v: Brand<T, Name>) => v as unknown as T,
  };
}

// Tipos Semânticos para System Domain (Exchanges/Routing)
export type SystemRoutingKey = Brand<string, "system.routing.key">;
export type SystemAgentName = Brand<string, "system.agent.name">;

// Implementações dos tipos únicos
const SystemRoutingKeyStamp = STAMP<"system.routing.key">();
const SystemAgentNameStamp = STAMP<"system.agent.name">();

export const SystemRoutingKey = (() => ({
  of: (v: unknown): SystemRoutingKey => {
    const s = String(v);
    if (!s || s.trim().length === 0) throw new TypeError("routing key não pode ser vazia");
    if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(s)) throw new TypeError("routing key deve conter apenas letras, números, pontos, underscores e hífens");
    return SystemRoutingKeyStamp.of(s);
  },
  un: (v: SystemRoutingKey): string => SystemRoutingKeyStamp.un(v),
  make: (value: string): SystemRoutingKey => SystemRoutingKey.of(value),
}))();

export const SystemAgentName = (() => ({
  of: (v: unknown): SystemAgentName => {
    const s = String(v);
    if (!s || s.trim().length === 0) throw new TypeError("nome do agente não pode ser vazio");
    if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(s)) throw new TypeError("nome do agente deve conter apenas letras, números, pontos, underscores e hífens");
    return SystemAgentNameStamp.of(s);
  },
  un: (v: SystemAgentName): string => SystemAgentNameStamp.un(v),
  make: (value: string): SystemAgentName => SystemAgentName.of(value),
}))();

// RabbitMQ Exchanges
export const EXCHANGES = {
  AGENTS: SystemExchangeName.make('agents'),
  MESSAGES: SystemExchangeName.make('messages'),
  WHATSAPP: SystemExchangeName.make('whatsapp'),
} as const;

// Agent Routing Keys
export const AGENT_ROUTING_KEYS = {
  PATIENT_NAME: SystemRoutingKey.make('patient.name'),
  PATIENT_CPF: SystemRoutingKey.make('patient.cpf'),
  PATIENT_BIRTH_DATE: SystemRoutingKey.make('patient.birthDate'),
  PATIENT_EMAIL: SystemRoutingKey.make('patient.email'),
  SCHEDULE_SERVICE: SystemRoutingKey.make('schedule.service'),
  SCHEDULE_DATE: SystemRoutingKey.make('schedule.date'),
  SCHEDULE_DENTIST: SystemRoutingKey.make('schedule.dentist'),
  SCHEDULE_NEW: SystemRoutingKey.make('schedule.new'),
} as const;

// Default Agent Flow
export const DEFAULT_AGENTS_FLOW: SystemAgentName[] = [
  SystemAgentName.make('patient.name'),
  SystemAgentName.make('patient.cpf'),
  SystemAgentName.make('patient.birthDate'),
  SystemAgentName.make('patient.email'),
] as const;

// Scheduling Flows
export const SCHEDULING_FLOWS = {
  COMPLETE_FLOW: [
    SystemAgentName.make('schedule.service'),
    SystemAgentName.make('schedule.date'),
    SystemAgentName.make('schedule.dentist'),
    SystemAgentName.make('schedule.new'),
  ] as const,
  SERVICE_ONLY: [
    SystemAgentName.make('schedule.service'),
  ] as const,
  DATE_ONLY: [
    SystemAgentName.make('schedule.date'),
  ] as const,
  DATE_FIRST: [
    SystemAgentName.make('schedule.date'),
    SystemAgentName.make('schedule.service'),
    SystemAgentName.make('schedule.dentist'),
    SystemAgentName.make('schedule.new'),
  ] as const,
  SERVICE_FIRST: [
    SystemAgentName.make('schedule.service'),
    SystemAgentName.make('schedule.date'),
    SystemAgentName.make('schedule.dentist'),
    SystemAgentName.make('schedule.new'),
  ] as const,
  DENTIST_FIRST: [
    SystemAgentName.make('schedule.dentist'),
    SystemAgentName.make('schedule.service'),
    SystemAgentName.make('schedule.date'),
    SystemAgentName.make('schedule.new'),
  ] as const,
} as const;

// Timeouts Configuration
export const TIMEOUTS = {
  USER_RESPONSE: TimeDurationMS.make(30000), // 30 seconds
  REMINDER_TIMEOUT: TimeDurationMS.make(60000), // 60 seconds
  AGENT_ACTIVATION_DELAY: TimeDurationMS.make(5000), // 5 seconds
  MIN_MESSAGE_INTERVAL: TimeDurationMS.make(2000), // 2 seconds
  MAX_RETRIES: MetricsRetryCount.make(3)
} as const;

// Default Values
export const DEFAULT_VALUES = {
  NAME: 'Nome Não Informado',
  get CPF() { return PatientCpf.makeDefault(); }, // Lazy loading - só executa quando acessado
  EMAIL: PatientEmail.make('nao-informado@sistema.com'), // Email padrão para erros
  BIRTH_DATE: '01/01/1970'
} as const;

// Função para obter CPF padrão quando necessário
export const getDefaultCpf = (): PatientCpf => PatientCpf.makeDefault();

// Agent Messages
export const AGENT_MESSAGES = {
  PATIENT_NAME: {
    REQUEST: 'Olá! Qual é o seu nome completo?',
    INVALID: 'Nome inválido. Por favor, forneça seu nome completo.',
    RETRY: 'Informação inválida (tentativa {attempt}/3). Qual é o seu nome completo?',
    DEFAULT_SET: 'Após 3 tentativas, definindo valor padrão. Continuando...'
  },
  PATIENT_CPF: {
    REQUEST: 'Agora preciso do seu CPF (apenas números):',
    INVALID: 'CPF inválido. Por favor, forneça um CPF válido.',
    RETRY: 'Informação inválida (tentativa {attempt}/3). Por favor, forneça seu CPF:',
    DEFAULT_SET: 'Após 3 tentativas, definindo valor padrão. Continuando...'
  },
  PATIENT_BIRTH_DATE: {
    REQUEST: 'Qual sua data de nascimento? (formato: DD/MM/AAAA)',
    INVALID: 'Data inválida. Por favor, use o formato DD/MM/AAAA e forneça uma data válida.',
    RETRY: 'Informação inválida (tentativa {attempt}/3). Qual sua data de nascimento? (formato: DD/MM/AAAA)',
    DEFAULT_SET: 'Após 3 tentativas, definindo valor padrão. Continuando...'
  },
  PATIENT_EMAIL: {
    REQUEST: 'Por último, informe seu e-mail:',
    INVALID: 'E-mail inválido. Por favor, forneça um e-mail válido.',
    RETRY: 'Informação inválida (tentativa {attempt}/3). Por último, informe seu e-mail:',
    DEFAULT_SET: 'Após 3 tentativas, definindo valor padrão. Continuando...',
    COMPLETION: 'Obrigado! Coletamos todas as informações necessárias:\n\nNome: {name}\nCPF: {cpf}\nData de Nascimento: {birthDate}\nE-mail: {email}\n\nSeu atendimento foi registrado com sucesso!'
  }
} as const;
