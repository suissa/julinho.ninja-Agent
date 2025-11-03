import {
  Phone,
  CompanyId,
  AppointmentId,
  DentistId,
  PatientId,
  AppointmentDate,
  AppointmentTime,
  createAppointmentId,
  createDentistId
} from '../../AtomicBehaviorTypes';
import type { ExistingAppointment, AppointmentData, TimeSlot } from '../../AtomicBehaviorTypes/AppointmentTypes';
import axios from 'axios';

/**
 * Appointment Tools - Gerenciamento de agendamentos
 * Tools modulares e atômicas para operações com consultas
 */

export async function fetchAppointments(companyId: CompanyId): Promise<ExistingAppointment[]> {
  try {
    const response = await axios.get(`http://localhost:3001/appointments/company/${companyId}`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    if (Array.isArray(response.data)) {
      return response.data.map((appointment: any) => ({
        id: createAppointmentId(appointment.id),
        day: appointment.day,
        initDate: appointment.initDate,
        endDate: appointment.endDate,
        title: appointment.title,
        status: appointment.status,
        dentistName: appointment.responsibleName || 'Profissional',
        dentistId: createDentistId(appointment.responsibleId)
      }));
    }
    
    return [];
  } catch (error) {
    console.error('[APPOINTMENT_TOOLS] Error fetching appointments:', error);
    throw new Error('Erro ao buscar agendamentos');
  }
}

export async function fetchPatientAppointments(phone: Phone): Promise<ExistingAppointment[]> {
  try {
    console.log('[APPOINTMENT_TOOLS] Fetching appointments for patient phone:', phone);
    
    const response = await axios.get(`http://localhost:3001/patients/phone/${phone}/appointments`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    if (response.data && response.data.appointments && Array.isArray(response.data.appointments)) {
      const patientAppointments = response.data.appointments
        .filter((appointment: any) => 
          appointment.status === 'scheduled' || appointment.status === 'confirmed'
        )
        .map((appointment: any) => ({
          id: createAppointmentId(appointment.id),
          day: appointment.day,
          initDate: appointment.initDate,
          endDate: appointment.endDate,
          title: appointment.title,
          status: appointment.status,
          dentistName: appointment.responsibleName || 'Profissional',
          dentistId: createDentistId(appointment.responsibleId)
        }));
      
      console.log('[APPOINTMENT_TOOLS] Found', patientAppointments.length, 'appointments for patient');
      return patientAppointments;
    }
    
    console.log('[APPOINTMENT_TOOLS] No appointments found for patient');
    return [];
  } catch (error) {
    console.error('[APPOINTMENT_TOOLS] Error fetching patient appointments:', error);
    return [];
  }
}

export async function getAvailableSlots(dentistId: DentistId, date: AppointmentDate, phone?: Phone): Promise<string[]> {
  try {
    // Fetch occupied slots from the API
    const occupiedResponse = await axios.get(
      `http://localhost:3001/appointments/available-slots/${dentistId}/${date}`,
      {
        headers: {
          Authorization: JWT
        },
        timeout: 5000
      }
    );

    // Determine slot duration (default 30 minutes)
    let slotDuration = 30;
    
    if (phone) {
      // Could fetch patient appointments to determine consultation type duration
      const patientAppointments = await fetchPatientAppointments(phone);
      if (patientAppointments && patientAppointments.length > 0) {
        // Use default duration for now, could be enhanced later
        slotDuration = 30;
      }
    }

    // Extract occupied slots
    const occupiedSlots = occupiedResponse.data.availableSlots || [];

    // Generate all possible time slots from 08:00 to 18:00
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
      return !occupiedSlots.some((occupied: any) => {
        const occupiedStart = occupied.initDate;
        const occupiedEnd = occupied.endDate;
        
        const slotStartMinutes = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1]);
        const slotEndMinutes = slotStartMinutes + slotDuration;
        const occupiedStartMinutes = parseInt(occupiedStart.split(':')[0]) * 60 + parseInt(occupiedStart.split(':')[1]);
        const occupiedEndMinutes = parseInt(occupiedEnd.split(':')[0]) * 60 + parseInt(occupiedEnd.split(':')[1]);
        
        return slotStartMinutes < occupiedEndMinutes && slotEndMinutes > occupiedStartMinutes;
      });
    });

    return availableSlots;
  } catch (error) {
    console.error('[APPOINTMENT_TOOLS] Error getting available slots:', error);
    throw new Error('Erro ao buscar horários disponíveis');
  }
}

export function generateAvailableSlots(date: AppointmentDate, occupiedSlots: Array<{start: string, end: string}>): string[] {
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

export async function createAppointment(appointmentData: AppointmentData): Promise<ExistingAppointment> {
  try {
    console.log('[APPOINTMENT_TOOLS] Creating appointment:', appointmentData);
    
    const response = await axios.post('http://localhost:3001/appointments', {
      patientId: appointmentData.patientId,
      responsibleId: appointmentData.dentistId,
      day: appointmentData.date,
      initDate: appointmentData.startTime,
      endDate: appointmentData.endTime,
      title: appointmentData.title,
      status: appointmentData.status,
      consultationType: appointmentData.consultationType,
      price: appointmentData.price,
      notes: appointmentData.notes
    }, {
      headers: {
        Authorization: JWT,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    const createdAppointment = response.data;
    console.log('[APPOINTMENT_TOOLS] Appointment created successfully:', createdAppointment.id);
    
    return {
      id: createAppointmentId(createdAppointment.id),
      day: createdAppointment.day,
      initDate: createdAppointment.initDate,
      endDate: createdAppointment.endDate,
      title: createdAppointment.title,
      status: createdAppointment.status,
      dentistName: createdAppointment.responsibleName || 'Profissional',
      dentistId: createDentistId(createdAppointment.responsibleId)
    };
  } catch (error) {
    console.error('[APPOINTMENT_TOOLS] Error creating appointment:', error);
    throw new Error('Erro ao criar agendamento');
  }
}

export async function updateAppointment(phone: Phone, day: AppointmentDate, initDate: AppointmentTime, endDate: AppointmentTime): Promise<void> {
  try {
    // Buscar o appointment ID pelo phone
    const appointments = await fetchPatientAppointments(phone);
    const appointmentToUpdate = appointments[0]; // Assume o primeiro agendamento
    
    if (!appointmentToUpdate) {
      throw new Error('Agendamento não encontrado para atualização');
    }
    
    console.log('[APPOINTMENT_TOOLS] Updating appointment with PATCH:', {
      appointmentId: appointmentToUpdate.id, 
      day, 
      initDate, 
      endDate
    });
    
    const updateData = {
      day: new Date(day).toISOString(),
      initDate: initDate,
      endDate: addMinutesToTime(initDate, 30) // Calcula endDate baseado em 30min
    };
    
    await axios.patch(`http://localhost:3001/appointments/${appointmentToUpdate.id}/day-time`, updateData, {
      headers: {
        Authorization: JWT,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('[APPOINTMENT_TOOLS] Appointment updated successfully');
  } catch (error) {
    console.error('[APPOINTMENT_TOOLS] Error updating appointment:', error);
    throw new Error('Erro ao atualizar agendamento');
  }
}

export async function cancelAppointment(appointmentId: AppointmentId): Promise<void> {
  try {
    console.log('[APPOINTMENT_TOOLS] Canceling appointment:', appointmentId);
    
    await axios.delete(`http://localhost:3001/appointments/${appointmentId}`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    console.log('[APPOINTMENT_TOOLS] Appointment canceled successfully');
  } catch (error) {
    console.error('[APPOINTMENT_TOOLS] Error canceling appointment:', error);
    throw new Error('Erro ao cancelar agendamento');
  }
}

// Helper functions
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

export function isValidTime(time: string): boolean {
  const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return pattern.test(time);
}

export function isWorkingDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
}

export function isWorkingHour(time: string): boolean {
  const [hours] = time.split(':').map(Number);
  return hours >= 8 && hours < 18; // 8:00 to 18:00
}
