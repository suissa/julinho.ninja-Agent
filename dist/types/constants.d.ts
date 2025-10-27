/**
 * System constants for exchanges, routing keys, and configuration
 */
/**
 * RabbitMQ Exchange names
 */
export declare const EXCHANGES: {
    readonly AGENTS: "chatbot.agents";
    readonly MESSAGES: "chatbot.messages";
    readonly WHATSAPP: "whatsapp.message.text";
};
/**
 * Agent routing keys
 */
export declare const AGENT_ROUTING_KEYS: {
    readonly PATIENT_NAME: "patient.name";
    readonly PATIENT_CPF: "patient.cpf";
    readonly PATIENT_EMAIL: "patient.email";
    readonly PATIENT_BIRTH_DATE: "patient.birthDate";
};
/**
 * WhatsApp routing keys
 */
export declare const WHATSAPP_ROUTING_KEYS: {
    readonly SEND: "send";
    readonly PHONE_PREFIX: "phone.";
};
/**
 * Default agent flow sequence
 */
export declare const DEFAULT_AGENTS_FLOW: readonly ["patient.name", "patient.cpf", "patient.birthDate", "patient.email"];
/**
 * System timeouts and intervals
 */
export declare const TIMEOUTS: {
    readonly USER_RESPONSE: 30000;
    readonly REMINDER_TIMEOUT: 60000;
    readonly AGENT_ACTIVATION_DELAY: 5000;
    readonly MIN_MESSAGE_INTERVAL: 2000;
    readonly MAX_RETRIES: 3;
};
/**
 * Default values for error cases
 */
export declare const DEFAULT_VALUES: {
    readonly NAME: "Nome Não Informado";
    readonly CPF: "00000000000";
    readonly EMAIL: "nao-informado@sistema.com";
    readonly BIRTH_DATE: "01/01/1970";
};
/**
 * Agent messages
 */
export declare const AGENT_MESSAGES: {
    readonly GREETING: "Olá! Bem-vindo ao nosso sistema de atendimento. Vou coletar algumas informações suas.";
    readonly PATIENT_NAME: "Por favor, informe seu nome completo:";
    readonly PATIENT_CPF: "Agora preciso do seu CPF (apenas números):";
    readonly PATIENT_EMAIL: "Por último, informe seu e-mail:";
    readonly PATIENT_BIRTH_DATE: "Qual sua data de nascimento? (formato: DD/MM/AAAA)";
    readonly INVALID_INPUT: "Por favor, forneça uma informação válida.";
    readonly COMPLETION: "Obrigado! Suas informações foram coletadas com sucesso.";
};
//# sourceMappingURL=constants.d.ts.map