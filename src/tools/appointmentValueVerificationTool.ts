import axios from 'axios';
import { getPatientIdByPhone, fetchPatientAppointments, addMinutesToTime } from './index';
import { COMPANY_ID } from '../index';
import { JWT } from '../config/jwt';  
import { AppointmentTime, createDuration, Phone } from '../AtomicBehaviorTypes';
import { toPhone } from '../AtomicBehaviorTypes/TypeConverters';
export async function createAppointment(updatedState: any): Promise<any> { 
// Now create appointment with patient ID
          const appointmentData = {
            title: updatedState.title,
            day: new Date(updatedState.date).getTime().toString(),
            companyId: COMPANY_ID,
            status: "scheduled",
            initDate: updatedState.selectedTime,
            endDate: addMinutesToTime(updatedState.selectedTime!, createDuration(30)),
            patientId: updatedState.patientId,
            responsibleId: updatedState.dentistId,
            description: "Agendamento via chatbot",
            price: 0
          };
          
          console.log('[schedule_new] Creating appointment:', appointmentData);
          

          try {
            
          } catch (error) {
            
          }
          const appointmentResponse = await axios.post(`http://localhost:3001/appointments`, appointmentData, {
            headers: {
              Authorization: JWT,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          });
          
          console.log('[schedule_new] Appointment created:', appointmentResponse.data);
          
}

export async function verifyAppointmentValues(phone: string): Promise<any[]> {
  try {
    console.log(`[AppointmentValueVerification] Verificando valores dos agendamentos para: ${phone}`);
    
    // Obter agendamentos do paciente
    const response = await axios.get(`http://localhost:3001/patients/phone/${phone}/appointments`, {
      headers: {
        'Authorization': JWT
      },
      timeout: 5000
    });

    if (response.data && response.data.appointments) {
      const appointments = response.data.appointments;
      console.log(`[AppointmentValueVerification] Agendamentos encontrados: ${appointments.length}`);
      
      // Verificar valores de cada agendamento
      const verifiedAppointments = appointments.map((apt: any) => {
        // Verificar se o agendamento tem valor
        if (apt.value === undefined || apt.value === null) {
          console.log(`[AppointmentValueVerification] Agendamento ${apt.id} sem valor definido`);
          return { ...apt, valueStatus: 'missing' };
        }
        
        // Verificar se o valor é válido (positivo)
        if (typeof apt.value === 'number' && apt.value <= 0) {
          console.log(`[AppointmentValueVerification] Agendamento ${apt.id} com valor inválido: ${apt.value}`);
          return { ...apt, valueStatus: 'invalid' };
        }
        
        console.log(`[AppointmentValueVerification] Agendamento ${apt.id} com valor válido: ${apt.value}`);
        return { ...apt, valueStatus: 'valid' };
      });
      
      return verifiedAppointments;
    }
    
    console.log(`[AppointmentValueVerification] Nenhum agendamento encontrado`);
    return [];
  } catch (error: any) {
    console.error(`[AppointmentValueVerification] Erro ao verificar valores dos agendamentos:`, error.message);
    throw error;
  }
}

export async function fetchAppointments(companyId: string): Promise<any[]> {
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
  } catch (error) {
    console.error('[Tool:fetchAppointments] Error:', error);
    throw new Error('Erro ao buscar agendamentos');
  }
}

export async function getAvailableSlots(responsibleId: string, date: string, phone?: string) {
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
    const consultationTypesResponse = await axios.get(
      'http://localhost:3001/consultation_types',
      {
        headers: {
          Authorization: JWT
        },
        timeout: 5000
      }
    );

    // Determine slot duration based on patient's appointment type
    let slotDuration = 30; // default duration in minutes
    
    if (phone) {
      // Fetch patient appointments to determine consultation type
      const patientAppointments = await fetchPatientAppointments(toPhone(phone));
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
    const allSlots: string[] = [];
    const startHour = 8;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        // Skip if we would go past the end time
        if (hour === endHour - 1 && minute + slotDuration > 60) break;
        
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
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
  } catch (error) {
    console.error('[Tool:getAvailableSlots] Error:', error);
    throw new Error('Erro ao buscar horários disponíveis');
  }
}

export async function updateAppointment(phone: Phone, day: string, initDate: AppointmentTime, endDate: AppointmentTime): Promise<void> {
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
  } catch (error) {
    console.error('[Tool:updateAppointment] Error:', error);
    throw new Error('Erro ao atualizar agendamento');
  }
}

// Função para gerar horários disponíveis
export function generateAvailableSlots(date: string, occupiedSlots: Array<{start: string, end: string}>): string[] {
  const availableSlots: string[] = [];
  
  // Horários de funcionamento: 08:00 às 18:00, intervalos de 30 minutos
  const startHour = 8;
  const endHour = 18;
  const intervalMinutes = 30;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endTime = minute + intervalMinutes >= 60 
        ? `${(hour + 1).toString().padStart(2, '0')}:${((minute + intervalMinutes) % 60).toString().padStart(2, '0')}`
        : `${hour.toString().padStart(2, '0')}:${(minute + intervalMinutes).toString().padStart(2, '0')}`;
      
      // Verificar se este horário está ocupado
      const isOccupied = occupiedSlots.some(slot => {
        const slotStart = new Date(`${date}T${slot.start}`);
        const slotEnd = new Date(`${date}T${slot.end}`);
        const currentStart = new Date(`${date}T${timeSlot}:00`);
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
