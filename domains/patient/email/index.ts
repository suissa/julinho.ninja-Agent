// domains/patient/email/index.ts
import { Brand, STAMP } from "../../../src/semantic/shim";

export type PatientEmail = Brand<string, "patient.email">;

export const PatientEmail = (() => {
  const f = STAMP<"patient.email">();
  // Email regex mais robusto
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    of: (v: unknown): PatientEmail => {
      const s = String(v).trim();
      if (!emailRx.test(s)) throw new TypeError("email inválido");
      if (s.length > 254) throw new TypeError("email muito longo");
      return f.of(s);
    },
    un: (v: PatientEmail): string => f.un(v),
    make: (value: string): PatientEmail => PatientEmail.of(value),
  };
})();
