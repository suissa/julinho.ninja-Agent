/**
 * System constants for exchanges, routing keys, and configuration
 */

/**
 * RabbitMQ Exchange names
 */
export const EXCHANGES = {
  AGENTS: 'chatbot.agents',
  MESSAGES: 'chatbot.messages',
  WHATSAPP: 'whatsapp.message.text'
} as const;

/**
 * Agent routing keys
 */
export const AGENT_ROUTING_KEYS = {
  PATIENT_NAME: 'patient.name',
  PATIENT_CPF: 'patient.cpf',
  PATIENT_EMAIL: 'patient.email',
  PATIENT_BIRTH_DATE: 'patient.birthDate',
  // Scheduling agents
  SCHEDULE_NEW: 'schedule.new',
  SCHEDULE_DATE: 'schedule.date',
  SCHEDULE_SERVICE: 'schedule.service',
  SCHEDULE_DENTIST: 'schedule.dentist',
  SCHEDULE_PAYMENT: 'schedule.payment'
} as const;

/**
 * WhatsApp routing keys
 */
export const WHATSAPP_ROUTING_KEYS = {
  SEND: 'send',
  PHONE_PREFIX: 'phone.'
} as const;

/**
 * Default agent flow sequence for patient data collection
 */
export const DEFAULT_AGENTS_FLOW = [
  AGENT_ROUTING_KEYS.PATIENT_NAME,
  AGENT_ROUTING_KEYS.PATIENT_CPF,
  AGENT_ROUTING_KEYS.PATIENT_BIRTH_DATE,
  AGENT_ROUTING_KEYS.PATIENT_EMAIL
] as const;

/**
 * Scheduling flow sequences based on user choice
 */
export const SCHEDULING_FLOWS = {
  DATE_FIRST: [
    AGENT_ROUTING_KEYS.SCHEDULE_DATE,
    AGENT_ROUTING_KEYS.SCHEDULE_SERVICE,
    AGENT_ROUTING_KEYS.SCHEDULE_DENTIST,
    AGENT_ROUTING_KEYS.SCHEDULE_PAYMENT
  ],
  SERVICE_FIRST: [
    AGENT_ROUTING_KEYS.SCHEDULE_SERVICE,
    AGENT_ROUTING_KEYS.SCHEDULE_DATE,
    AGENT_ROUTING_KEYS.SCHEDULE_DENTIST,
    AGENT_ROUTING_KEYS.SCHEDULE_PAYMENT
  ],
  DENTIST_FIRST: [
    AGENT_ROUTING_KEYS.SCHEDULE_DENTIST,
    AGENT_ROUTING_KEYS.SCHEDULE_DATE,
    AGENT_ROUTING_KEYS.SCHEDULE_SERVICE,
    AGENT_ROUTING_KEYS.SCHEDULE_PAYMENT
  ]
} as const;

/**
 * Complete flow including patient data collection and scheduling
 */
export const COMPLETE_FLOW = [
  ...DEFAULT_AGENTS_FLOW,
  AGENT_ROUTING_KEYS.SCHEDULE_NEW
] as const;

/**
 * System timeouts and intervals
 */
export const TIMEOUTS = {
  USER_RESPONSE: 30000, // 30 seconds
  REMINDER_TIMEOUT: 60000, // 60 seconds
  AGENT_ACTIVATION_DELAY: 5000, // 5 seconds
  MIN_MESSAGE_INTERVAL: 2000, // 2 seconds
  MAX_RETRIES: 3
} as const;

/**
 * Default values for error cases
 */
export const DEFAULT_VALUES = {
  NAME: 'Nome Não Informado',
  CPF: '00000000000',
  EMAIL: 'nao-informado@sistema.com',
  BIRTH_DATE: '01/01/1970'
} as const;

/**
 * Agent messages
 */
export const AGENT_MESSAGES = {
  GREETING: 'Olá! Bem-vindo ao nosso sistema de atendimento. Vou coletar algumas informações suas.',
  PATIENT_NAME: 'Por favor, informe seu nome completo:',
  PATIENT_CPF: 'Agora preciso do seu CPF (apenas números):',
  PATIENT_EMAIL: 'Por último, informe seu e-mail:',
  PATIENT_BIRTH_DATE: 'Qual sua data de nascimento? (formato: DD/MM/AAAA)',
  INVALID_INPUT: 'Por favor, forneça uma informação válida.',
  COMPLETION: 'Obrigado! Suas informações foram coletadas com sucesso.'
} as const;