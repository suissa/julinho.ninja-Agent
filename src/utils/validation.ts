/**
 * Validation utilities for agent input processing
 */

/**
 * Validate patient name (minimum 2 words with valid characters)
 */
export function validateName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmedName = name.trim();
  
  // Check minimum length
  if (trimmedName.length < 2) {
    return false;
  }

  // Check for at least 2 words
  const words = trimmedName.split(/\s+/).filter(word => word.length > 0);
  if (words.length < 2) {
    return false;
  }

  // Check for valid name characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
  return nameRegex.test(trimmedName);
}

/**
 * Validate CPF format and checksum
 */
export function validateCPF(cpf: string): boolean {
  if (!cpf || typeof cpf !== 'string') {
    return false;
  }

  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '');

  // Check length
  if (cleanCPF.length !== 11) {
    return false;
  }

  // Check for known invalid patterns
  const invalidPatterns = [
    '00000000000', '11111111111', '22222222222', '33333333333',
    '44444444444', '55555555555', '66666666666', '77777777777',
    '88888888888', '99999999999'
  ];

  if (invalidPatterns.includes(cleanCPF)) {
    return false;
  }

  // Validate checksum
  return validateCPFChecksum(cleanCPF);
}

/**
 * Validate CPF checksum algorithm
 */
function validateCPFChecksum(cpf: string): boolean {
  // First digit verification
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]!, 10) * (10 - i);
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(cpf[9]!, 10) !== firstDigit) {
    return false;
  }

  // Second digit verification
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]!, 10) * (11 - i);
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;

  return parseInt(cpf[10]!, 10) === secondDigit;
}

/**
 * Validate email format using regex
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmedEmail = email.trim();
  
  // Basic email regex pattern
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  return emailRegex.test(trimmedEmail) && trimmedEmail.length <= 254;
}

/**
 * Validate birth date format (DD/MM/YYYY) and logical range
 */
export function validateBirthDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  const trimmedDate = dateString.trim();
  
  // Check format DD/MM/YYYY
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = trimmedDate.match(dateRegex);
  
  if (!match) {
    return false;
  }

  const day = parseInt(match[1]!, 10);
  const month = parseInt(match[2]!, 10);
  const year = parseInt(match[3]!, 10);

  // Basic range checks
  if (month < 1 || month > 12) {
    return false;
  }

  if (day < 1 || day > 31) {
    return false;
  }

  // Create date object to validate
  const date = new Date(year, month - 1, day);
  
  // Check if date is valid (handles leap years, month lengths)
  if (date.getFullYear() !== year || 
      date.getMonth() !== month - 1 || 
      date.getDate() !== day) {
    return false;
  }

  // Check age range (0-120 years)
  const today = new Date();
  const age = today.getFullYear() - year;
  
  if (age < 0 || age > 120) {
    return false;
  }

  // Check if birth date is not in the future
  if (date > today) {
    return false;
  }

  return true;
}
