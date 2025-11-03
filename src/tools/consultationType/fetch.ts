import axios from 'axios';
import { ConsultationType } from '../../types';
import { CompanyId, createCompanyId } from '../../AtomicBehaviorTypes';
import { JWT } from '../../config/jwt';

/**
 * Fetches list of services from the API
 * @param companyId - The company ID
 * @returns Array of services
 */
export async function fetchConsultationTypes(companyId: CompanyId): Promise<ConsultationType[]> {
  try {
    console.log(`[ServiceFetchTool] Buscando serviços para company ID: ${companyId}`);
    
    const response = await axios.get(
      `http://localhost:3001/consultation-types`,
      {
        headers: {
                'Authorization': JWT
              },
        timeout: 5000
      }
    );

    console.log('[ServiceFetchTool] Serviços encontrados:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[ServiceFetchTool] Erro ao buscar serviços:', error.message);
    if (error.response) {
      console.error('[ServiceFetchTool] Dados da resposta de erro:', error.response.data);
      console.error('[ServiceFetchTool] Status da resposta de erro:', error.response.status);
    }
    throw error;
  }
}