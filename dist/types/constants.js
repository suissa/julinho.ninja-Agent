"use strict";
/**
 * System constants for exchanges, routing keys, and configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_MESSAGES = exports.DEFAULT_VALUES = exports.TIMEOUTS = exports.DEFAULT_AGENTS_FLOW = exports.WHATSAPP_ROUTING_KEYS = exports.AGENT_ROUTING_KEYS = exports.EXCHANGES = void 0;
/**
 * RabbitMQ Exchange names
 */
exports.EXCHANGES = {
    AGENTS: 'chatbot.agents',
    MESSAGES: 'chatbot.messages',
    WHATSAPP: 'whatsapp.message.text'
};
/**
 * Agent routing keys
 */
exports.AGENT_ROUTING_KEYS = {
    PATIENT_NAME: 'patient.name',
    PATIENT_CPF: 'patient.cpf',
    PATIENT_EMAIL: 'patient.email',
    PATIENT_BIRTH_DATE: 'patient.birthDate'
};
/**
 * WhatsApp routing keys
 */
exports.WHATSAPP_ROUTING_KEYS = {
    SEND: 'send',
    PHONE_PREFIX: 'phone.'
};
/**
 * Default agent flow sequence
 */
exports.DEFAULT_AGENTS_FLOW = [
    exports.AGENT_ROUTING_KEYS.PATIENT_NAME,
    exports.AGENT_ROUTING_KEYS.PATIENT_CPF,
    exports.AGENT_ROUTING_KEYS.PATIENT_BIRTH_DATE,
    exports.AGENT_ROUTING_KEYS.PATIENT_EMAIL
];
/**
 * System timeouts and intervals
 */
exports.TIMEOUTS = {
    USER_RESPONSE: 30000, // 30 seconds
    REMINDER_TIMEOUT: 60000, // 60 seconds
    AGENT_ACTIVATION_DELAY: 5000, // 5 seconds
    MIN_MESSAGE_INTERVAL: 2000, // 2 seconds
    MAX_RETRIES: 3
};
/**
 * Default values for error cases
 */
exports.DEFAULT_VALUES = {
    NAME: 'Nome Não Informado',
    CPF: '00000000000',
    EMAIL: 'nao-informado@sistema.com',
    BIRTH_DATE: '01/01/1970'
};
/**
 * Agent messages
 */
exports.AGENT_MESSAGES = {
    GREETING: 'Olá! Bem-vindo ao nosso sistema de atendimento. Vou coletar algumas informações suas.',
    PATIENT_NAME: 'Por favor, informe seu nome completo:',
    PATIENT_CPF: 'Agora preciso do seu CPF (apenas números):',
    PATIENT_EMAIL: 'Por último, informe seu e-mail:',
    PATIENT_BIRTH_DATE: 'Qual sua data de nascimento? (formato: DD/MM/AAAA)',
    INVALID_INPUT: 'Por favor, forneça uma informação válida.',
    COMPLETION: 'Obrigado! Suas informações foram coletadas com sucesso.'
};
//# sourceMappingURL=constants.js.map