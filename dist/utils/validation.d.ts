/**
 * Validation utilities for agent input processing
 */
/**
 * Validate patient name (minimum 2 words with valid characters)
 */
export declare function validateName(name: string): boolean;
/**
 * Validate CPF format and checksum
 */
export declare function validateCPF(cpf: string): boolean;
/**
 * Validate email format using regex
 */
export declare function validateEmail(email: string): boolean;
/**
 * Validate birth date format (DD/MM/YYYY) and logical range
 */
export declare function validateBirthDate(dateString: string): boolean;
//# sourceMappingURL=validation.d.ts.map