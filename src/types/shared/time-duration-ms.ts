// src/types/shared/time-duration-ms.ts
// Tipo compartilhado TimeDurationMS - usado em config.ts, session.ts, constants.ts

// Tipagem Semântica Atômica - Shared Implementation
declare const __brand: unique symbol;
type Brand<T, Name extends string> = T & { readonly [__brand]: Name };

function STAMP<Name extends string>() {
  return {
    of: <T>(v: T) => v as Brand<T, Name>,
    un: <T>(v: Brand<T, Name>) => v as unknown as T,
  };
}

// Tipo Semântico para Time Domain
export type TimeDurationMS = Brand<number, "time.duration.ms">;

// Implementação do tipo semântico
const TimeDurationMSStamp = STAMP<"time.duration.ms">();

export const TimeDurationMS = (() => ({
  of: (v: unknown): TimeDurationMS => TimeDurationMSStamp.of(Number(v)),
  un: (v: TimeDurationMS): number => TimeDurationMSStamp.un(v),
  make: (value: number): TimeDurationMS => TimeDurationMS.of(value),
}))();
