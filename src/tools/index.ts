import axios from 'axios';
import { Dentist, ExistingAppointment, ExistingPatient } from '../types';
import { Appointment } from '../types';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { JWT } from '../config/jwt';
import { globalHistoryService } from '../services/GlobalHistoryService';
import {
  Phone,
  MessageText,
  CompanyId,
  CorrelationId,
  PatientId,
  DentistId,
  AppointmentId,
  AppointmentDate,
  AppointmentTime,
  Duration,
  ValidationResult,
  Flag,
  createPhone,
  createMessageText,
  createCompanyId,
  createCorrelationId,
  createPatientId,
  createDentistId,
  createAppointmentId,
  createAppointmentDate,
  createAppointmentTime,
  createDuration,
  createValidationResult,
  createFlag
} from '../AtomicBehaviorTypes';
import {
  JWT as JWTType,
  TimeSlot,
  ISODate,
  DateText,
  WeekdayName,
  ParseResult,
  ChoiceNumber,
  SlotDuration,
  AppointmentCount,
  MessageRole,
  createJWT,
  createTimeSlot,
  createISODate,
  createDateText,
  createWeekdayName,
  createParseResult,
  createChoiceNumber,
  createSlotDuration,
  createAppointmentCount,
  createMessageRole
} from '../AtomicBehaviorTypes/ToolTypes';

export async function sendToClassification(
  messaging: any, 
  request: any,
  {
    messageText, number, companyId, historico, correlationId
  }: {
    messageText: MessageText;
    number: Phone;
    companyId: CompanyId;
    historico: MessageText[];
    correlationId: CorrelationId;
  }
): Promise<void> {

  await messaging.publishEvent('message.classification', 'classify', {
    text: messageText,
    phone: number,
    companyId: request?.companyId,
    historyWindow: historico.slice(-20),
    correlationId,
  });
}

export async function sendToWhatsapp(
  messaging: any, 
  history: any, 
  phone: Phone, 
  text: MessageText
): Promise<void> {
  await history.addToHistory(phone, text);
  await messaging.publishEvent('whatsapp.message.text', 'send', {
    number: phone,
    text,
  });
}

export async function sendToOrchestrator(
  messaging: any, 
  phone: Phone, 
  text: MessageText
): Promise<void> {
  await messaging.publishEvent('orchestrator.message', 'response', { phone, text });
}

export function getLastAssistantMessage(
  history: any, 
  phone: Phone
): MessageText {
  const historyMessages = history.getHistory(phone);
  const assistantMessages = historyMessages.filter((msg: any) => msg.role === 'assistant');
  return createMessageText(assistantMessages[assistantMessages.length - 1].content);
}

export async function isFirstMessage(phone: Phone): Promise<ValidationResult> {
  try {
    const historyService = globalHistoryService.getHistoryService();
    const historyMessages = await historyService.getHistory(phone);
    const userMessages = historyMessages.filter((msg: any) => msg.role === 'user');

    console.log('[PATIENT_LOOKUP] History check:', {
      totalMessages: historyMessages.length,
      userMessages: userMessages.length
    });

    return createValidationResult(userMessages.length === 1);
  } catch (error) {
    console.error('[PATIENT_LOOKUP] Error checking message history:', error);
    return createValidationResult(true);
  }
}

export async function fetchDentists(companyId: CompanyId): Promise<Dentist[]> {
  try {
    const response = await axios.get(`http://localhost:3001/users/company`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    if (response.data && response.data.data) {
      return response.data.data.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }));
    }
    
    return [];
  } catch (error: any) {
    return []; // NUNCA ESTOURA ERRO
  }
}


export async function fetchDentistById(userId: DentistId): Promise<Dentist | null> {
  try {
    const response = await axios.get(`http://localhost:3001/users/details/${userId}`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    if (response.data) {  
      return ({
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role
      });
    }
    
    return null;
  } catch (error: any) {
    return {
      id: userId,
      name: 'Profissional',
      email: 'profissional@clinica.com',
      role: 'dentist'
    }; // NUNCA ESTOURA ERRO
  }
}

export async function fetchExistingPatient(
  phone: Phone, 
  companyId: CompanyId
): Promise<ExistingPatient | null> {
  try {
    console.log('[schedule_new] Checking for existing patient with phone:', phone);
    
    const response = await axios.get(`http://localhost:3001/patients/phone/${phone}`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    // pegar o companyId também
    if (response.data && response.data.id) {
      const patient = response.data;
      console.log('[schedule_new] Found existing patient:', patient.name);
      return {
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        cpf: patient.cpf,
        birthDate: patient.birthDate
      };
    }
    
    console.log('[schedule_new] No existing patient found');
    return null;
  } catch (error: any) {
    // NUNCA ESTOURA ERRO - SEMPRE CONTINUA O FLUXO
    return null;
  }
}

// Function to fetch patient's existing appointments
export async function fetchPatientAppointments(phone: Phone): Promise<ExistingAppointment[]> {
  try {
    console.log('[schedule_new] Fetching appointments for patient phone:', phone);
    
    const response = await axios.get(`http://localhost:3001/patients/phone/${phone}/appointments`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    if (response.data && response.data.appointments && Array.isArray(response.data.appointments)) {
      // Filter appointments that are scheduled or confirmed
      const patientAppointments = response.data.appointments
        .filter((appointment: any) => 
          appointment.status === 'scheduled' || appointment.status === 'confirmed'
        )
        .map((appointment: any) => ({
          id: appointment.id,
          day: appointment.day,
          initDate: appointment.initDate,
          endDate: appointment.endDate,
          title: appointment.title,
          status: appointment.status,
          dentistName: appointment.responsibleName || 'Profissional',
          dentistId: appointment.responsibleId
        }));
      
      console.log('[schedule_new] Found', patientAppointments.length, 'appointments for patient');
      return patientAppointments;
    }
    
    console.log('[schedule_new] No appointments found for patient');
    return [];
  } catch (error: any) {
    // NUNCA ESTOURA ERRO - SEMPRE CONTINUA O FLUXO
    return [];
  }
}
export async function cancelAppointment(appointmentId: AppointmentId): Promise<void> {
  try {
    // Cancel the appointment via API
    await axios.delete(`http://localhost:3001/appointments/${appointmentId}`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    console.log('[Tool:cancelAppointment] ✅ CANCELAMENTO REALIZADO COM SUCESSO');
    
  } catch (error: any) {
    // NUNCA ESTOURA ERRO
  }
}

export async function getPatientIdByPhone(phone: Phone): Promise<PatientId> {
  try {

    const response = await axios.get(`http://localhost:3001/patients/phone/${phone}`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    console.log('[Tool:getPatientIdByPhone] Response:', response.data);
    return createPatientId(response.data.id);
  } catch (error: any) {
    return createPatientId('patient-not-found'); // NUNCA ESTOURA ERRO
  }
}

export async function fetchAppointments(companyId: CompanyId): Promise<Appointment[]> {
  try {
    const response = await axios.get(`http://localhost:3001/appointments/company/${companyId}`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    if (Array.isArray(response.data)) {
      return response.data.map((appointment: any) => ({
        id: appointment.id,
        day: appointment.day,
        initDate: appointment.initDate,
        endDate: appointment.endDate,
        createdBy: appointment.createdBy,
        patientName: appointment.patientName,
        title: appointment.title,
        status: appointment.status,
        companyId: appointment.companyId
      }));
    }
    
    return [];
  } catch (error: any) {
    return []; // NUNCA ESTOURA ERRO
  }
}

export async function getAvailableSlots(
  responsibleId: DentistId, 
  date: AppointmentDate, 
  phone?: Phone
): Promise<TimeSlot[]> {
  try {
    // Fetch occupied slots from the API
    const occupiedResponse = await axios.get(
      `http://localhost:3001/appointments/available-slots/${responsibleId}/${date}`,
      {
        headers: {
          Authorization: JWT
        },
        timeout: 5000
      }
    );

    // Fetch consultation types
    const consultationTypesResponse = await getConsultationTypes();

    // Determine slot duration based on patient's appointment type
    let slotDuration = 30; // default duration in minutes
    
    if (phone) {
      // Fetch patient appointments to determine consultation type
      const patientAppointments = await fetchPatientAppointments(phone);
      if (patientAppointments && patientAppointments.length > 0) {
        // Get the first appointment's consultation type
        const appointment = patientAppointments[0];
        // Find matching consultation type
        const consultationTypes = consultationTypesResponse.data;
        if (Array.isArray(consultationTypes)) {
          // In a real implementation, you would match based on the appointment's service type
          // For now, we'll use the first consultation type's duration
          if (consultationTypes.length > 0) {
            slotDuration = consultationTypes[0].durationMinutes || 30;
          }
        }
      }
    }

    // Extract occupied slots
    const occupiedSlots = occupiedResponse.data.availableSlots || [];

    // Generate all possible time slots from 08:00 to 18:00 with the specified duration
    const allSlots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        // Skip if we would go past the end time
        if (hour === endHour - 1 && minute + slotDuration > 60) break;
        
        const timeSlot = createTimeSlot(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        allSlots.push(timeSlot);
      }
    }

    // Filter out occupied slots
    const availableSlots = allSlots.filter(slot => {
      // Check if this slot overlaps with any occupied slot
      return !occupiedSlots.some((occupied: any) => {
        const occupiedStart = occupied.initDate;
        const occupiedEnd = occupied.endDate;
        
        // Convert to minutes for easier comparison
        const slotStartMinutes = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1]);
        const slotEndMinutes = slotStartMinutes + slotDuration;
        const occupiedStartMinutes = parseInt(occupiedStart.split(':')[0]) * 60 + parseInt(occupiedStart.split(':')[1]);
        const occupiedEndMinutes = parseInt(occupiedEnd.split(':')[0]) * 60 + parseInt(occupiedEnd.split(':')[1]);
        
        // Check for overlap
        return slotStartMinutes < occupiedEndMinutes && slotEndMinutes > occupiedStartMinutes;
      });
    });

    return availableSlots;
  } catch (error: any) {
    // Retorna horários padrão em caso de erro
    return [
      createTimeSlot('09:00'),
      createTimeSlot('10:00'),
      createTimeSlot('11:00'),
      createTimeSlot('14:00'),
      createTimeSlot('15:00'),
      createTimeSlot('16:00'),
      createTimeSlot('17:00')
    ]; // NUNCA ESTOURA ERRO
  }
}

export async function updateAppointment(
  phone: Phone, 
  day: AppointmentDate, 
  initDate: AppointmentTime, 
  endDate: AppointmentTime
): Promise<void> {
  try {
    // deve buscar o appointmentId pelo phone
    const appointmentId = await getPatientIdByPhone(phone);
    console.log('[reschedule_new:updateAppointment] Updating appointment with PATCH:', {appointmentId, day, initDate, endDate});
    // deve buscar o tipo de serviço para pegar o tempo de duração
    const updateData = {
      day: new Date(day).toISOString(), // Use full ISO format for day
      initDate: initDate,
      endDate: addMinutesToTime(initDate, createDuration(30))
    };
    
    console.log('[Tool:reschedule] Updating appointment with PATCH:', updateData);
    
    await axios.patch(`http://localhost:3001/appointments/${appointmentId}/day-time`, updateData, {
      headers: {
        Authorization: JWT,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
  } catch (error: any) {
    // NUNCA ESTOURA ERRO
    return;
  }
}

// Função para gerar horários disponíveis
export function generateAvailableSlots(
  date: AppointmentDate, 
  occupiedSlots: Array<{start: AppointmentTime, end: AppointmentTime}>
): TimeSlot[] {
  const availableSlots: TimeSlot[] = [];
  
  // Horários de funcionamento: 08:00 às 18:00, intervalos de 30 minutos
  const startHour = 8;
  const endHour = 18;
  const intervalMinutes = 30;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const timeSlotStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const timeSlot = createTimeSlot(timeSlotStr);
      const endTime = minute + intervalMinutes >= 60 
        ? `${(hour + 1).toString().padStart(2, '0')}:${((minute + intervalMinutes) % 60).toString().padStart(2, '0')}`
        : `${hour.toString().padStart(2, '0')}:${(minute + intervalMinutes).toString().padStart(2, '0')}`;
      
      // Verificar se este horário está ocupado
      const isOccupied = occupiedSlots.some(slot => {
        const slotStart = new Date(`${date}T${slot.start}`);
        const slotEnd = new Date(`${date}T${slot.end}`);
        const currentStart = new Date(`${date}T${timeSlotStr}:00`);
        const currentEnd = new Date(`${date}T${endTime}:00`);
        
        return (currentStart >= slotStart && currentStart < slotEnd) ||
               (currentEnd > slotStart && currentEnd <= slotEnd) ||
               (currentStart <= slotStart && currentEnd >= slotEnd);
      });
      
      if (!isOccupied) {
        availableSlots.push(timeSlot);
      }
    }
  }
  
  return availableSlots;
}

export function formatDate(date: AppointmentDate): MessageText {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}` as MessageText;
}

// Função para encontrar a próxima data de um dia da semana específico
export function getNextWeekday(dayName: WeekdayName): { date: ISODate; displayDate: MessageText } | null {
  try {
    // Mapear nomes dos dias em português para números (0 = domingo, 1 = segunda, etc.)
    const dayMap: { [key: string]: number } = {
      'domingo': 0,
      'segunda': 1,
      'terca': 2,
      'quarta': 3,
      'quinta': 4,
      'sexta': 5,
      'sabado': 6
    };
    
    // Normalizar o nome do dia (remover -feira se presente)
    const normalizedDayName = dayName.toLowerCase()
      .replace(/[áàâã]/g, 'a')
      .replace(/[éêë]/g, 'e')
      .replace(/[íîï]/g, 'i')
      .replace(/[óôõö]/g, 'o')
      .replace(/[úûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/-feira$/, ''); // Remove -feira do final
    
    const targetDay = dayMap[normalizedDayName];
    
    if (targetDay === undefined) {
      return null;
    }
    
    // Não aceitar sábado ou domingo - retornar sinal especial
    if (targetDay === 0 || targetDay === 6) {
      return null; // This will be handled by the special WEEKEND return
    }
    
    const today = new Date();
    const currentDay = today.getDay();
    
    // Calcular quantos dias até o próximo dia desejado
    let daysUntilTarget = targetDay - currentDay;
    
    // Se o dia é hoje ou já passou esta semana, pegar da próxima semana
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    
    const isoDate = targetDate.toISOString().split('T')[0] as ISODate;
    const displayDate = `${targetDate.getDate().toString().padStart(2, '0')}/${(targetDate.getMonth() + 1).toString().padStart(2, '0')}` as MessageText;
    
    return { date: isoDate, displayDate };
  } catch (error) {
    console.error('[Tool:getNextWeekday] Error:', error);
    return null;
  }
}

// Função para parsear data em português
export function parsePortugueseDate(dateText: DateText): ParseResult {
  try {
    // Remover acentos e converter para minúsculas
    const normalizedText = dateText.toLowerCase()
      .replace(/[áàâã]/g, 'a')
      .replace(/[éêë]/g, 'e')
      .replace(/[íîï]/g, 'i')
      .replace(/[óôõö]/g, 'o')
      .replace(/[úûü]/g, 'u')
      .replace(/[ç]/g, 'c');
    
    const currentDate = new Date();
    
    // Testar nomes de dias da semana primeiro
    const weekdayPattern = /(segunda|terca|quarta|quinta|sexta|sabado|domingo)(-feira)?/;
    const weekdayMatch = normalizedText.match(weekdayPattern);
    if (weekdayMatch) {
      const dayName = weekdayMatch[1];
      
      // Check if it's weekend
      if (dayName === 'sabado' || dayName === 'domingo') {
        return 'WEEKEND' as ParseResult;
      }
      
      const weekdayResult = getNextWeekday(dayName as WeekdayName);
      if (weekdayResult) {
        return `CONFIRM:${weekdayResult.date}:${weekdayResult.displayDate}` as ParseResult;
      }
      return null as ParseResult;
    }
    
    // Testar padrão dd/mm/yyyy
    const datePattern = /(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/;
    const dateMatch = normalizedText.match(datePattern);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]!);
      const month = parseInt(dateMatch[2]!);
      const year = dateMatch[3] ? parseInt(dateMatch[3]) : currentDate.getFullYear();
      
      // Validate basic date ranges
      if (day < 1 || day > 31 || month < 1 || month > 12 || year < currentDate.getFullYear()) {
        return null;
      }
      
      // Create date and validate it actually exists (handles cases like 31/02, 33/12, etc.)
      const date = new Date(year, month - 1, day);
      
      // Check if the date is valid by comparing what we set vs what JavaScript created
      if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        return null as ParseResult; // Invalid date (e.g., 31/02, 33/12)
      }
      
      // Check if the date is in the past (before today)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare only dates
      if (date < today) {
        return null as ParseResult; // Date is in the past
      }
      
      // Check if it's a weekend (Saturday = 6, Sunday = 0)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'WEEKEND' as ParseResult; // Weekend
      }
      
      const result = date.toISOString().split('T')[0];
      return (result || null) as ParseResult;
    }
    
    // Testar "hoje"
    if (normalizedText.includes('hoje')) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      // Check if today is weekend
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'WEEKEND' as ParseResult; // Today is weekend
      }
      const result = today.toISOString().split('T')[0];
      return (result || null) as ParseResult;
    }
    
    // Testar "amanhã"
    if (normalizedText.includes('amanha')) {
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayOfWeek = tomorrow.getDay();
      // Check if tomorrow is weekend
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'WEEKEND' as ParseResult; // Tomorrow is weekend
      }
      const result = tomorrow.toISOString().split('T')[0];
      return (result || null) as ParseResult;
    }
    
    return null as ParseResult;
  } catch (error) {
    console.error('[Tool:parsePortugueseDate] Error:', error);
    return null as ParseResult;
  }
}

// Função para extrair número da escolha do dentista
export function extractDentistChoice(text: MessageText): ChoiceNumber | null {
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1]!) as ChoiceNumber : null;
}

// Função para adicionar minutos a um horário (HH:mm)
export function addMinutesToTime(
  time: AppointmentTime, 
  minutes: Duration
): AppointmentTime {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}` as AppointmentTime;
}

export function isTime(time: MessageText): ValidationResult {
  // retorne true seo formato for de HH:mm
  const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return createValidationResult(pattern.test(time));
}

export function identifyDate(date: MessageText): ValidationResult {
  
  const normalizedText = date.toLowerCase()
  .replace(/[áàâã]/g, 'a')
  .replace(/[éêë]/g, 'e')
  .replace(/[íîï]/g, 'i')
  .replace(/[óôõö]/g, 'o')
  .replace(/[úûü]/g, 'u')
  .replace(/[ç]/g, 'c');

  const patterns = [
    /(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/,
    /(\d{1,2})\s+de\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/,
    /hoje|amanha/,
    /(segunda|terca|quarta|quinta|sexta|sabado|domingo)/
  ];

  
  console.log('[Tool:identifyDate] Patterns:', patterns);
  console.log('[Tool:identifyDate] Date:', normalizedText);
  console.log('[Tool:identifyDate] Result:', !!patterns.find(pattern => pattern.test(normalizedText)));
  return createValidationResult(!!patterns.find(pattern => pattern.test(normalizedText)))
}

async function createHistoryMessage(
  numero: Phone,
  type: MessageRole,
  text: MessageText,
  history: any
): Promise<ValidationResult> {
  const msg = {
    role: type,
    content: text,
    name: type,
  } satisfies ChatCompletionMessageParam;
  try {
    await history.addToHistory(numero, msg);
    return createValidationResult(true);
  } catch (error) {
    console.error('Erro ao adicionar mensagem ao histórico', error);
    return createValidationResult(false);
  }
}
export const Tools = {
  sendToClassification,
  sendToWhatsapp,
  fetchDentists,
  fetchExistingPatient,
  fetchPatientAppointments,
  fetchAppointments,
  parsePortugueseDate,
  extractDentistChoice,
  isTime
}

function getConsultationTypes() {
  return axios.get('http://localhost:3001/consultation_types', {
    headers: {
      Authorization: JWT
    },
    timeout: 5000
  });
}
