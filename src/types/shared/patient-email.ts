// src/types/shared/patient-email.ts
// Tipo compartilhado PatientEmail - usado em client.ts, constants.ts

// Tipagem Semântica Atômica - Shared Implementation
declare const __brand: unique symbol;
type Brand<T, Name extends string> = T & { readonly [__brand]: Name };

function STAMP<Name extends string>() {
  return {
    of: <T>(v: T) => v as Brand<T, Name>,
    un: <T>(v: Brand<T, Name>) => v as unknown as T,
  };
}

// Tipo Semântico para Patient Domain
export type PatientEmail = Brand<string, "patient.email">;

// Implementação do tipo semântico
const PatientEmailStamp = STAMP<"patient.email">();

export const PatientEmail = (() => {
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    of: (v: unknown): PatientEmail => {
      const s = String(v).trim();
      if (!emailRx.test(s)) throw new TypeError("email inválido");
      if (s.length > 254) throw new TypeError("email muito longo");
      return PatientEmailStamp.of(s);
    },
    un: (v: PatientEmail): string => PatientEmailStamp.un(v),
    make: (value: string): PatientEmail => PatientEmail.of(value),
  };
})();
