import axios from 'axios';
import { JWT } from '../config/jwt';
/**
 * Verifica se um paciente existe na API
 * @param phone - Número de telefone do paciente
 * @returns Dados do paciente se existir, null caso contrário
 */
export async function checkIfPatientExists(phone: string): Promise<any | null> {
  try {
    console.log(`[PatientVerification] Verificando se paciente com telefone ${phone} existe`);
    
    const response = await axios.get(`http://localhost:3001/patients/phone/${phone}`, {
      headers: {
        'Authorization': JWT
      },
      timeout: 5000
    });

    if (response.data && response.data.id) {
      console.log(`[PatientVerification] Paciente encontrado: ${response.data.name}`);
      return response.data;
    }
    
    console.log(`[PatientVerification] Paciente não encontrado`);
    return null;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      console.log(`[PatientVerification] Paciente não encontrado (404)`);
      return null;
    }
    
    console.error(`[PatientVerification] Erro ao verificar paciente:`, error.message);
    throw error;
  }
}

/**
 * Verifica se o paciente tem agendamentos ativos
 * @param phone - Número de telefone do paciente
 * @returns Lista de agendamentos se existirem, array vazio caso contrário
 */
export async function checkPatientAppointments(phone: string): Promise<any[]> {
  try {
    console.log(`[AppointmentVerification] Verificando agendamentos para paciente com telefone ${phone}`);
    
    const response = await axios.get(`http://localhost:3001/patients/phone/${phone}/appointments`, {
      headers: {
        'Authorization': JWT
      },
      timeout: 5000
    });

    if (response.data && response.data.appointments) {
      // Filtra apenas agendamentos ativos
      const activeAppointments = response.data.appointments.filter((apt: any) => 
        apt.status === 'scheduled' || apt.status === 'confirmed'
      );
      
      console.log(`[AppointmentVerification] Agendamentos encontrados: ${activeAppointments.length}`);
      return activeAppointments;
    }
    
    console.log(`[AppointmentVerification] Nenhum agendamento encontrado`);
    return [];
  } catch (error: any) {
    console.error(`[AppointmentVerification] Erro ao verificar agendamentos:`, error.message);
    return [];
  }
}

/**
 * Verifica se os valores dos agendamentos estão corretos
 * @param appointments - Lista de agendamentos
 * @returns true se todos os valores estiverem corretos, false caso contrário
 */
export function validateAppointmentValues(appointments: any[]): boolean {
  console.log(`[ValueValidation] Validando valores de ${appointments.length} agendamentos`);
  
  // Nesta implementação, estamos apenas registrando os valores para verificação
  // Em um caso real, você pode comparar com valores esperados do sistema
  for (const appointment of appointments) {
    console.log(`[ValueValidation] Agendamento ${appointment.id} - Valor: ${appointment.value || 'não especificado'}`);
    
    // Exemplo de validação: verificar se o valor existe e é positivo
    if (appointment.value === undefined || appointment.value <= 0) {
      console.log(`[ValueValidation] Agendamento ${appointment.id} tem valor inválido: ${appointment.value}`);
      return false;
    }
  }
  
  console.log(`[ValueValidation] Todos os valores dos agendamentos são válidos`);
  return true;
}