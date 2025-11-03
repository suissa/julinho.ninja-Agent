
export function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

// Função para encontrar a próxima data de um dia da semana específico
export function getNextWeekday(dayName: string): { date: string; displayDate: string } | null {
  try {
    // Mapear nomes dos dias em português para números (0 = domingo, 1 = segunda, etc.)
    const dayMap: { [key: string]: number } = {
      'domingo': 0,
      'segunda': 1,
      'terca': 2,
      'quarta': 3,
      'quinta': 4,
      'sexta': 5,
      'sabado': 6
    };
    
    // Normalizar o nome do dia (remover -feira se presente)
    const normalizedDayName = dayName.toLowerCase()
      .replace(/[áàâã]/g, 'a')
      .replace(/[éêë]/g, 'e')
      .replace(/[íîï]/g, 'i')
      .replace(/[óôõö]/g, 'o')
      .replace(/[úûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/-feira$/, ''); // Remove -feira do final
    
    const targetDay = dayMap[normalizedDayName];
    
    if (targetDay === undefined) {
      return null;
    }
    
    // Não aceitar sábado ou domingo - retornar sinal especial
    if (targetDay === 0 || targetDay === 6) {
      return null; // This will be handled by the special WEEKEND return
    }
    
    const today = new Date();
    const currentDay = today.getDay();
    
    // Calcular quantos dias até o próximo dia desejado
    let daysUntilTarget = targetDay - currentDay;
    
    // Se o dia é hoje ou já passou esta semana, pegar da próxima semana
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    
    const isoDate = targetDate.toISOString().split('T')[0];
    const displayDate = `${targetDate.getDate().toString().padStart(2, '0')}/${(targetDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    return { date: isoDate, displayDate };
  } catch (error) {
    console.error('[Tool:getNextWeekday] Error:', error);
    return null;
  }
}

// Função para parsear data em português
export function parsePortugueseDate(dateText: string): string | null {
  try {
    // Remover acentos e converter para minúsculas
    const normalizedText = dateText.toLowerCase()
      .replace(/[áàâã]/g, 'a')
      .replace(/[éêë]/g, 'e')
      .replace(/[íîï]/g, 'i')
      .replace(/[óôõö]/g, 'o')
      .replace(/[úûü]/g, 'u')
      .replace(/[ç]/g, 'c');
    
    const currentDate = new Date();
    
    // Testar nomes de dias da semana primeiro
    const weekdayPattern = /(segunda|terca|quarta|quinta|sexta|sabado|domingo)(-feira)?/;
    const weekdayMatch = normalizedText.match(weekdayPattern);
    if (weekdayMatch) {
      const dayName = weekdayMatch[1];
      
      // Check if it's weekend
      if (dayName === 'sabado' || dayName === 'domingo') {
        return 'WEEKEND';
      }
      
      const weekdayResult = getNextWeekday(dayName);
      if (weekdayResult) {
        return `CONFIRM:${weekdayResult.date}:${weekdayResult.displayDate}`;
      }
      return null;
    }
    
    // Testar padrão dd/mm/yyyy
    const datePattern = /(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/;
    const dateMatch = normalizedText.match(datePattern);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]!);
      const month = parseInt(dateMatch[2]!);
      const year = dateMatch[3] ? parseInt(dateMatch[3]) : currentDate.getFullYear();
      
      // Validate basic date ranges
      if (day < 1 || day > 31 || month < 1 || month > 12 || year < currentDate.getFullYear()) {
        return null;
      }
      
      // Create date and validate it actually exists (handles cases like 31/02, 33/12, etc.)
      const date = new Date(year, month - 1, day);
      
      // Check if the date is valid by comparing what we set vs what JavaScript created
      if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        return null; // Invalid date (e.g., 31/02, 33/12)
      }
      
      // Check if the date is in the past (before today)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare only dates
      if (date < today) {
        return null; // Date is in the past
      }
      
      // Check if it's a weekend (Saturday = 6, Sunday = 0)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'WEEKEND'; // Weekend
      }
      
      const result = date.toISOString().split('T')[0];
      return result || null;
    }
    
    // Testar "hoje"
    if (normalizedText.includes('hoje')) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      // Check if today is weekend
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'WEEKEND'; // Today is weekend
      }
      const result = today.toISOString().split('T')[0];
      return result || null;
    }
    
    // Testar "amanhã"
    if (normalizedText.includes('amanha')) {
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayOfWeek = tomorrow.getDay();
      // Check if tomorrow is weekend
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'WEEKEND'; // Tomorrow is weekend
      }
      const result = tomorrow.toISOString().split('T')[0];
      return result || null;
    }
    
    return null;
  } catch (error) {
    console.error('[Tool:parsePortugueseDate] Error:', error);
    return null;
  }
}


export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

export function isTime(time: string): boolean {
  // retorne true seo formato for de HH:mm
  const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return pattern.test(time);
}

export function identifyDate(date: string): boolean {
  
  const normalizedText = date.toLowerCase()
  .replace(/[áàâã]/g, 'a')
  .replace(/[éêë]/g, 'e')
  .replace(/[íîï]/g, 'i')
  .replace(/[óôõö]/g, 'o')
  .replace(/[úûü]/g, 'u')
  .replace(/[ç]/g, 'c');

  const patterns = [
    /(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/,
    /(\d{1,2})\s+de\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/,
    /hoje|amanha/,
    /(segunda|terca|quarta|quinta|sexta|sabado|domingo)/
  ];

  
  console.log('[Tool:identifyDate] Patterns:', patterns);
  console.log('[Tool:identifyDate] Date:', normalizedText);
  console.log('[Tool:identifyDate] Result:', !!patterns.find(pattern => pattern.test(normalizedText)));
  return !!patterns.find(pattern => pattern.test(normalizedText))
}
