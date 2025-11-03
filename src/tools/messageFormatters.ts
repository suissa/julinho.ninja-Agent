export function formatAppointmentInquiryMessage(): string {
  return `Olá! 😊 Não encontrei seu cadastro em nosso sistema.
  
Para agendar uma consulta conosco eu preciso fazer seu cadastro primeiro

Posso fazer seu cadastro cadastro❓`;
}


export function formatAskForNameMessage(): string {
  return `Por favor, me informe seu *nome completo* para darmos início ao seu cadastro. ✍`;
}


export function formatAskForBirthDateMessage(): string {
  return `Agora preciso da sua *data de nascimento* no formato dd/mm/aaaa (ex: 15/03/1990). ✍`;
}


export function formatAskForCPFMessage(): string {
  return `Agora preciso do seu *CPF* (somente números). ✍`;
}

/**
 * Format a friendly message asking for patient's email
 */
export function formatAskForEmailMessage(): string {
  return `Por último, me informe seu *e-mail* para contato. ✍`;
}

/**
 * Format a friendly confirmation message after registration
 */
export function formatRegistrationConfirmationMessage(): string {
  return `✅ *Cadastro realizado com sucesso!*
  
Agora que você está cadastrado, gostaria de agendar sua primeira consulta? ✍`;
}

/**
 * Format a friendly message showing dentist list
 */
export function formatDentistListMessage(dentists: Array<{id: string, name: string}>): string {
  let message = `Por favor, escolha um dos nossos dentistas:\n\n`;
  
  dentists.forEach((dentist, index) => {
    message += `${index + 1}. ${dentist.name}\n`;
  });
  
  message += `0. Sem preferência\n\n`;
  message += `Por favor, responda com o *número* da opção desejada. ✍`;
  
  return message;
}

/**
 * Format a friendly message showing service list with prices
 */
export function formatServiceListMessage(services: Array<{id: string, name: string, price: string}>): string {
  let message = `Escolha o tipo de consulta:\n\n`;
  
  services.forEach((service, index) => {
    message += `${index + 1}. ${service.name} - ${service.price}\n`;
  });
  
  message += `0. Nenhuma\n\n`;
  message += `Por favor, responda com o *número* da opção desejada. ✍`;
  
  return message;
}

/**
 * Format a friendly message with payment link
 */
export function formatPaymentLinkMessage(): string {
  return `🔗 *Link para pagamento*: https://pagamento.clinicaodontologica.com.br/xyz123
  
Após realizar o pagamento, por favor, *confirme nesta conversa*.
  
Se tiver alguma dúvida ou precisar de ajuda, estou à disposição!`;
}

/**
 * Format a friendly message asking if patient needs help after payment
 */
export function formatPostPaymentAssistanceMessage(): string {
  return `✅ Obrigado por confirmar seu pagamento!
  
Sua consulta foi agendada com sucesso. Você receberá um lembrete um dia antes da data marcada.
  
Tem mais alguma dúvida ou precisa de alguma ajuda? `;
}

/**
 * Format a friendly message for closing the conversation
 */
export function formatClosingMessage(): string {
  return `Obrigado pelo seu contato! 😊
  
Se precisar de qualquer outra assistência no futuro, estarei aqui para ajudar. 
  
Tenha um ótimo dia!`;
}