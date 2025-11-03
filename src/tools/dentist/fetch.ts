import axios from 'axios';
import { JWT } from '../../config/jwt';
import { Dentist } from '../../types';
import { COMPANY_ID } from '../../index'; 
/**
 * Fetches list of dentists from the API
 * @param companyId - The company ID
 * @returns Array of dentists
 */
export async function fetchDentists(companyId: string): Promise<Dentist[]> {
  try {
    console.log(`[DentistFetchTool] Buscando dentistas para company ID: ${companyId}`);
    
    const response = await axios.get(
      `http://localhost:3001/users/company`,
      {
        headers: {
          'Authorization': JWT
        },
        timeout: 5000
      }
    );
    const dentists = response.data.data.filter((user: any) => user.companyId === companyId);
    console.log('[DentistFetchTool] Dentistas encontrados:', dentists);
    return dentists;
  } catch (error: any) {
    console.error('[DentistFetchTool] Erro ao buscar dentistas:', error.message);
    if (error.response) {
      console.error('[DentistFetchTool] Dados da resposta de erro:', error.response.data);
      console.error('[DentistFetchTool] Status da resposta de erro:', error.response.status);
    }
    throw error;
  }
}