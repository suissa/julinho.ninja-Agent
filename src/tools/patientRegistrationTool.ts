import axios from 'axios';

import { JWT } from '../config/jwt';
export interface PatientData {
  name: string;
  phone: string;
  birthDate?: string;
  cpf?: string;
}

/**
 * Creates a new patient in the system
 * @param companyId - The company ID
 * @param patientData - The patient information to register
 * @returns The created patient data
 */
export async function createPatientInCompany(companyId: string, patientData: PatientData): Promise<any> {
  try {
    console.log(`[PatientRegistrationTool] Iniciando criação de paciente para company ID: ${companyId}`);
    console.log(`[PatientRegistrationTool] Dados do paciente:`, patientData);
    const patientDataWithBirthDate = {
      ...patientData,
      birthDate: patientData?.birthDate?.split('/').reverse().join('-')
    };
    const response = await axios.post(
      `http://localhost:3001/patients/company/${companyId}`,
      patientData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JWT
        },
        timeout: 5000
      }
    );

    console.log('[PatientRegistrationTool] Paciente criado com sucesso:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[PatientRegistrationTool] Erro ao criar paciente:', error.message);
    if (error.response) {
      console.error('[PatientRegistrationTool] Dados da resposta de erro:', error.response.data);
      console.error('[PatientRegistrationTool] Status da resposta de erro:', error.response.status);
    }
    throw error;
  }
}