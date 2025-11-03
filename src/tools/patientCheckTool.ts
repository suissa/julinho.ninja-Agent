import axios from 'axios';
import { env } from '../config/env';
/**
 * Checks if a patient already exists in the system by phone number
 * @param companyId - The company ID
 * @param phone - The patient's phone number
 * @returns The patient data if found, null otherwise
 */
export async function checkPatientExists(companyId: string, phone: string): Promise<any | null> {
  try {
    console.log(`[PatientCheckTool] Verificando se paciente com telefone ${phone} existe para company ID: ${companyId}`);
    
    const response = await axios.get(
      `http://localhost:3001/patients/company/${companyId}/phone/${phone}`,
      {
        headers: {
            'Authorization': env.JWT
        },
        timeout: 5000
      }
    );

    console.log('[PatientCheckTool] Paciente encontrado:', response.data);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      console.log('[PatientCheckTool] Paciente não encontrado (404)');
      return null;
    }
    
    console.error('[PatientCheckTool] Erro ao verificar paciente:', error.message);
    if (error.response) {
      console.error('[PatientCheckTool] Dados da resposta de erro:', error.response.data);
      console.error('[PatientCheckTool] Status da resposta de erro:', error.response.status);
    }
    throw error;
  }
}