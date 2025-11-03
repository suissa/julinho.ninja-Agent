import type {
  Phone,
  BehaviorResponse,
  createBehaviorResponse
} from '../../AtomicBehaviorTypes';
import type { ExistingAppointment } from '../../AtomicBehaviorTypes/AppointmentTypes';
import type { ExistingPatient } from '../../AtomicBehaviorTypes/PatientTypes';
import type { Dentist } from '../../AtomicBehaviorTypes/BehaviorTypes';

/**
 * Messaging Tools - Envio de mensagens formatadas
 * Tools modulares e atômicas para envio de mensagens específicas
 */

export async function sendWelcomeMessage(phone: Phone, patientName: string): Promise<void> {
  // Esta função seria implementada para enviar via WhatsApp
  console.log(`[MESSAGING] Enviando mensagem de boas-vindas para ${phone}: ${patientName}`);
}

export async function sendAppointmentOptions(phone: Phone, appointment: ExistingAppointment): Promise<void> {
  const date = new Date(appointment.day).toLocaleDateString('pt-BR');
  const message = `Sua consulta: ${date} às ${appointment.initDate} com ${appointment.dentistName}

1️⃣ Reagendar
2️⃣ Cancelar
3️⃣ Confirmar

Digite o número da opção desejada.`;
  
  console.log(`[MESSAGING] Enviando opções de consulta para ${phone}: ${message}`);
}

export async function sendRescheduleMessage(phone: Phone): Promise<void> {
  const message = `Para reagendar sua consulta, informe a nova data desejada.

Exemplos:
• "segunda-feira"
• "25/01/2024" 
• "amanhã"

Qual data você prefere?`;
  
  console.log(`[MESSAGING] Enviando mensagem de reagendamento para ${phone}: ${message}`);
}

export async function sendCancelConfirmation(phone: Phone, appointment: ExistingAppointment): Promise<void> {
  const date = new Date(appointment.day).toLocaleDateString('pt-BR');
  const message = `✅ Consulta cancelada com sucesso!

A consulta do dia ${date} às ${appointment.initDate} com ${appointment.dentistName} foi cancelada.

Obrigado por nos comunicar com antecedência! 😊`;
  
  console.log(`[MESSAGING] Enviando confirmação de cancelamento para ${phone}: ${message}`);
}

export async function sendDentistList(phone: Phone, dentists: Dentist[]): Promise<void> {
  const dentistsList = dentists.map((dentist, index) => 
    `${index + 1}. Dr(a). ${dentist.name}`
  ).join('\n');
  
  const message = `Escolha o profissional de sua preferência:

${dentistsList}

Digite o número do profissional desejado.`;
  
  console.log(`[MESSAGING] Enviando lista de dentistas para ${phone}: ${message}`);
}

export async function sendConsultationTypes(phone: Phone, types: Array<{name: string, price: number}>): Promise<void> {
  const typesList = types.map((type, index) => 
    `${index + 1}. ${type.name} - R$ ${type.price.toFixed(2)}`
  ).join('\n');
  
  const message = `Tipos de consulta disponíveis:

${typesList}

Digite o número do tipo desejado.`;
  
  console.log(`[MESSAGING] Enviando tipos de consulta para ${phone}: ${message}`);
}

export async function sendPaymentLink(phone: Phone, link: string): Promise<void> {
  const message = `💳 Link de pagamento gerado!

${link}

Após o pagamento, você receberá a confirmação da consulta.

Qualquer dúvida, estamos aqui para ajudar! 😊`;
  
  console.log(`[MESSAGING] Enviando link de pagamento para ${phone}: ${message}`);
}

export async function sendAppointmentConfirmation(
  phone: Phone, 
  patientName: string, 
  dentistName: string, 
  date: string, 
  time: string
): Promise<void> {
  const message = `🎉 Consulta confirmada!

👤 Paciente: ${patientName}
👨‍⚕️ Profissional: Dr(a). ${dentistName}
📅 Data: ${date}
🕐 Horário: ${time}

📍 Local: Rua das Flores, 123 - Centro
📞 Contato: (11) 1234-5678

Nos vemos em breve! 😊`;
  
  console.log(`[MESSAGING] Enviando confirmação de consulta para ${phone}: ${message}`);
}

export async function sendEmergencyInfo(phone: Phone): Promise<void> {
  const message = `🚨 Atendimento de Emergência

Para urgências odontológicas:
📞 Ligue: (11) 1234-5678
📱 WhatsApp: (11) 99999-8888

🕐 Plantão:
• Seg-Sex: até 20:00
• Sáb: até 16:00
• Dom/Feriados: apenas emergências

Estamos aqui para ajudar! 🚑`;
  
  console.log(`[MESSAGING] Enviando informações de emergência para ${phone}: ${message}`);
}

export async function sendClinicInfo(phone: Phone): Promise<void> {
  const message = `🏢 Informações da Clínica

📍 Endereço:
Rua das Flores, 123 - Centro
São Paulo - SP, CEP: 01234-567

📞 Contatos:
Tel: (11) 1234-5678
WhatsApp: (11) 99999-8888
Email: contato@clinica.com.br

🕐 Horários:
Seg-Sex: 08:00-18:00
Sáb: 08:00-12:00

Como posso ajudar? 😊`;
  
  console.log(`[MESSAGING] Enviando informações da clínica para ${phone}: ${message}`);
}
