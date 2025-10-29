// domains/patient/phone/index.ts
import { Brand, STAMP } from "../../../src/semantic/shim";

export type PatientPhone = Brand<string, "patient.phone">;

export const PatientPhone = (() => {
  const f = STAMP<"patient.phone">();
  // Regex básico para telefone brasileiro (com ou sem DDD)
  const phoneRx = /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/;
  return {
    of: (v: unknown): PatientPhone => {
      const s = String(v).trim();
      // Remove todos os caracteres não numéricos exceto +
      const clean = s.replace(/[^\d+]/g, '');
      if (clean.length < 10 || clean.length > 13) {
        throw new TypeError("telefone deve ter entre 10 e 13 dígitos");
      }
      // Validação básica de formato brasileiro
      if (!phoneRx.test(s)) {
        throw new TypeError("formato de telefone brasileiro inválido");
      }
      return f.of(clean);
    },
    un: (v: PatientPhone): string => f.un(v),
    make: (value: string): PatientPhone => PatientPhone.of(value),
  };
})();
