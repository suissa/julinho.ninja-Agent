// domains/patient/birth-date/index.ts
import { Brand, STAMP } from "../../../src/semantic/shim";

export type PatientBirthDate = Brand<Date, "patient.birthDate">;

export const PatientBirthDate = (() => {
  const f = STAMP<"patient.birthDate">();
  return {
    of: (v: unknown): PatientBirthDate => {
      const trimmed = String(v).trim();

      // Check format DD/MM/YYYY
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = trimmed.match(dateRegex);

      if (!match) {
        throw new TypeError("formato de data deve ser DD/MM/YYYY");
      }

      const day = parseInt(match[1]!, 10);
      const month = parseInt(match[2]!, 10);
      const year = parseInt(match[3]!, 10);

      // Basic range checks
      if (month < 1 || month > 12) {
        throw new TypeError("mês deve estar entre 1 e 12");
      }

      if (day < 1 || day > 31) {
        throw new TypeError("dia deve estar entre 1 e 31");
      }

      // Create date object to validate
      const date = new Date(year, month - 1, day);

      // Check if date is valid (handles leap years, month lengths)
      if (date.getFullYear() !== year ||
          date.getMonth() !== month - 1 ||
          date.getDate() !== day) {
        throw new TypeError("data inválida");
      }

      // Check age range (0-120 years)
      const today = new Date();
      const age = today.getFullYear() - year;

      if (age < 0 || age > 120) {
        throw new TypeError("idade deve estar entre 0 e 120 anos");
      }

      // Check if birth date is not in the future
      if (date > today) {
        throw new TypeError("data de nascimento não pode ser no futuro");
      }

      return f.of(date);
    },
    un: (v: PatientBirthDate): Date => f.un(v),
    make: (value: string | Date): PatientBirthDate => PatientBirthDate.of(value),
  };
})();
