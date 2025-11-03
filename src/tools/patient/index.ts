import {
  Phone,
  CompanyId,
  PatientId,
  createPhone,
  createPatientId
} from '../../AtomicBehaviorTypes';
import type { ExistingPatient, PatientData } from '../../AtomicBehaviorTypes/PatientTypes';
import axios from 'axios';
import { globalHistoryService } from '../../services/GlobalHistoryService';
import { COMPANY_ID } from '../../index';
import { JWT } from '../../index';
/**
 * Patient Tools - Gerenciamento de pacientes
 * Tools modulares e atômicas para operações com pacientes
 */

export async function isFirstMessage(phone: Phone): Promise<boolean> {
  try {
    const historyService = globalHistoryService.getHistoryService();
    const historyMessages = await historyService.getHistory(phone);
    const userMessages = historyMessages.filter((msg: any) => msg.role === 'user');

    console.log('[PATIENT_TOOLS] History check:', {
      totalMessages: historyMessages.length,
      userMessages: userMessages.length
    });

    return userMessages.length === 1;
  } catch (error) {
    console.error('[PATIENT_TOOLS] Error checking message history:', error);
    return true;
  }
}

export async function fetchExistingPatient(phone: Phone, companyId: CompanyId): Promise<ExistingPatient | null> {
  try {
    console.log('[PATIENT_TOOLS] Checking for existing patient with phone:', phone);
    
    const response = await axios.get(`http://localhost:3001/patients/phone/${phone}`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    if (response.data && response.data.id) {
      const patient = response.data;
      console.log('[PATIENT_TOOLS] Found existing patient:', patient.name);
      return {
        id: createPatientId(patient.id),
        name: patient.name,
        phone: createPhone(patient.phone),
        email: patient.email,
        cpf: patient.cpf,
        birthDate: patient.birthDate
      };
    }
    
    console.log('[PATIENT_TOOLS] No existing patient found');
    return null;
  } catch (error) {
    console.error('[PATIENT_TOOLS] Error fetching patient:', error);
    return null;
  }
}

export async function createNewPatient(patientData: PatientData, companyId: CompanyId): Promise<ExistingPatient> {
  try {
    console.log('[PATIENT_TOOLS] Creating new patient:', patientData.name);
    
    const response = await axios.post('http://localhost:3001/patients/company/77a85021-868b-4534-bad6-aee7198cc55a', {
      name: patientData.name,
      phone: patientData.phone,
      email: patientData.email,
      cpf: patientData.cpf,
      birthDate: patientData.birthDate,
    }, {
      headers: {
        Authorization: JWT,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    const createdPatient = response.data;
    console.log('[PATIENT_TOOLS] Patient created successfully:', createdPatient.id);
    
    return {
      id: createdPatient.id,
      name: createdPatient.name,
      phone: createdPatient.phone,
      email: createdPatient.email,
      cpf: createdPatient.cpf,
      birthDate: createdPatient.birthDate
    };
  } catch (error) {
    console.error('[PATIENT_TOOLS] Error creating patient:', error);
    throw new Error('Erro ao criar novo paciente');
  }
}

export async function updatePatientInfo(patientId: PatientId, updates: Partial<PatientData>): Promise<void> {
  try {
    console.log('[PATIENT_TOOLS] Updating patient:', patientId);
    
    await axios.patch(`http://localhost:3001/patients/${patientId}`, updates, {
      headers: {
        Authorization: JWT,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('[PATIENT_TOOLS] Patient updated successfully');
  } catch (error) {
    console.error('[PATIENT_TOOLS] Error updating patient:', error);
    throw new Error('Erro ao atualizar dados do paciente');
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
    
    console.log('[PATIENT_TOOLS] Found patient ID:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('[PATIENT_TOOLS] Error getting patient ID:', error);
    throw new Error('Erro ao buscar ID do paciente');
  }
}

export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se não são todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;
  
  if (parseInt(cleanCPF.charAt(9)) !== digit1) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;
  
  return parseInt(cleanCPF.charAt(10)) === digit2;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Verifica se tem 10 ou 11 dígitos (com ou sem 9 no celular)
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}
