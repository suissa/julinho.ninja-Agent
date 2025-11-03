import type {
  CompanyId,
  DentistId,
  createDentistId
} from '../../AtomicBehaviorTypes';
import type { Dentist } from '../../AtomicBehaviorTypes/BehaviorTypes';
import axios from 'axios';

/**
 * Dentist Tools - Gerenciamento de dentistas/profissionais
 * Tools modulares e atômicas para operações com profissionais
 */

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
  } catch (error) {
    console.error('[DENTIST_TOOLS] Error fetching dentists:', error);
    throw new Error('Erro ao buscar profissionais da clínica');
  }
}

export async function fetchDentistById(dentistId: DentistId): Promise<Dentist> {
  try {
    const response = await axios.get(`http://localhost:3001/users/details/${dentistId}`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    if (response.data) {  
      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role
      };
    }
    
    throw new Error('Dentista não encontrado');
  } catch (error) {
    console.error('[DENTIST_TOOLS] Error fetching dentist by ID:', error);
    throw new Error('Erro ao buscar o dentista pelo ID');
  }
}

export async function getDentistAvailability(dentistId: DentistId, date: string): Promise<Array<{start: string, end: string}>> {
  try {
    const response = await axios.get(`http://localhost:3001/dentists/${dentistId}/availability/${date}`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    return response.data.availability || [];
  } catch (error) {
    console.error('[DENTIST_TOOLS] Error fetching dentist availability:', error);
    // Return default working hours if API fails
    return [
      { start: '08:00', end: '12:00' },
      { start: '14:00', end: '18:00' }
    ];
  }
}

export async function getDentistSpecialties(dentistId: DentistId): Promise<string[]> {
  try {
    const response = await axios.get(`http://localhost:3001/dentists/${dentistId}/specialties`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    return response.data.specialties || ['Clínica Geral'];
  } catch (error) {
    console.error('[DENTIST_TOOLS] Error fetching dentist specialties:', error);
    return ['Clínica Geral']; // Default specialty
  }
}

export function extractDentistChoice(text: string): number | null {
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1]!) : null;
}

export function validateDentistChoice(choice: number, totalDentists: number): boolean {
  return choice >= 1 && choice <= totalDentists;
}

export function formatDentistList(dentists: Dentist[]): string {
  return dentists.map((dentist, index) => 
    `${index + 1}. Dr(a). ${dentist.name}`
  ).join('\n');
}

export function formatDentistWithSpecialties(dentist: Dentist, specialties: string[]): string {
  const specialtiesText = specialties.join(', ');
  return `Dr(a). ${dentist.name}\nEspecialidades: ${specialtiesText}`;
}

export async function getDentistWorkingHours(dentistId: DentistId): Promise<{start: string, end: string}> {
  try {
    const response = await axios.get(`http://localhost:3001/dentists/${dentistId}/working-hours`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    return response.data.workingHours || { start: '08:00', end: '18:00' };
  } catch (error) {
    console.error('[DENTIST_TOOLS] Error fetching working hours:', error);
    return { start: '08:00', end: '18:00' }; // Default working hours
  }
}

export function isDentistAvailableAtTime(
  availability: Array<{start: string, end: string}>, 
  requestedTime: string
): boolean {
  const [reqHours, reqMinutes] = requestedTime.split(':').map(Number);
  const requestedMinutes = reqHours * 60 + reqMinutes;
  
  return availability.some(slot => {
    const [startHours, startMinutes] = slot.start.split(':').map(Number);
    const [endHours, endMinutes] = slot.end.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    return requestedMinutes >= startTotalMinutes && requestedMinutes < endTotalMinutes;
  });
}

export async function getDentistRating(dentistId: DentistId): Promise<number> {
  try {
    const response = await axios.get(`http://localhost:3001/dentists/${dentistId}/rating`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    return response.data.rating || 5.0;
  } catch (error) {
    console.error('[DENTIST_TOOLS] Error fetching dentist rating:', error);
    return 5.0; // Default rating
  }
}

export function sortDentistsByRating(dentists: Dentist[], ratings: Map<string, number>): Dentist[] {
  return dentists.sort((a, b) => {
    const ratingA = ratings.get(a.id) || 0;
    const ratingB = ratings.get(b.id) || 0;
    return ratingB - ratingA; // Sort by highest rating first
  });
}

export function filterDentistsBySpecialty(dentists: Dentist[], requiredSpecialty: string): Dentist[] {
  // This would need additional API call to get specialties for each dentist
  // For now, return all dentists
  return dentists;
}

export async function getDentistConsultationTypes(dentistId: DentistId): Promise<Array<{name: string, duration: number, price: number}>> {
  try {
    const response = await axios.get(`http://localhost:3001/dentists/${dentistId}/consultation-types`, {
      headers: {
        Authorization: JWT
      },
      timeout: 5000
    });
    
    return response.data.consultationTypes || [
      { name: 'Consulta Geral', duration: 30, price: 150.00 },
      { name: 'Limpeza', duration: 45, price: 120.00 },
      { name: 'Avaliação', duration: 20, price: 80.00 }
    ];
  } catch (error) {
    console.error('[DENTIST_TOOLS] Error fetching consultation types:', error);
    return [
      { name: 'Consulta Geral', duration: 30, price: 150.00 },
      { name: 'Limpeza', duration: 45, price: 120.00 },
      { name: 'Avaliação', duration: 20, price: 80.00 }
    ];
  }
}
