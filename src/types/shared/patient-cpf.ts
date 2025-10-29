// src/types/shared/patient-cpf.ts
// Tipo compartilhado PatientCpf - usado em client.ts, constants.ts

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
export type PatientCpf = Brand<string, "patient.cpf">;

// Implementação do tipo semântico (sem validação)
const PatientCpfStamp = STAMP<"patient.cpf">();

export const PatientCpf = (() => ({
  of: (v: unknown): PatientCpf => PatientCpfStamp.of(String(v)),
  un: (v: PatientCpf): string => PatientCpfStamp.un(v),
  make: (value: string): PatientCpf => PatientCpf.of(value),
}))();
