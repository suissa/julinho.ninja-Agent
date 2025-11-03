import axios from 'axios';
import { JWT } from '../config/jwt';
/**
 * Atualiza os dados de um paciente existente
 * @param patientId - ID do paciente
 * @param updatedData - Dados atualizados do paciente
 * @returns Dados do paciente atualizado
 */
export async function updatePatientData(patientId: string, updatedData: any): Promise<any> {
  try {
    console.log(`[PatientUpdateTool] Atualizando dados do paciente ${patientId}`);
    console.log(`[PatientUpdateTool] Dados para atualização:`, updatedData);
    
    const response = await axios.patch(
      `http://localhost:3001/patients/${patientId}`,
      updatedData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JWT
        },
        timeout: 5000
      }
    );

    console.log('[PatientUpdateTool] Paciente atualizado com sucesso:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[PatientUpdateTool] Erro ao atualizar paciente:', error.message);
    if (error.response) {
      console.error('[PatientUpdateTool] Dados da resposta de erro:', error.response.data);
      console.error('[PatientUpdateTool] Status da resposta de erro:', error.response.status);
    }
    throw error;
  }
}