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
  of: (v: unknown): TimeDurationMS => {
    const n = Number(v);
    if (!Number.isInteger(n)) throw new TypeError("duração deve ser um número inteiro");
    if (n < 0) throw new TypeError("duração deve ser >= 0");
    if (n > 86400000) throw new TypeError("duração máxima é 86400000ms (24 horas)");
    return TimeDurationMSStamp.of(n);
  },
  un: (v: TimeDurationMS): number => TimeDurationMSStamp.un(v),
  add: (a: TimeDurationMS, b: TimeDurationMS): TimeDurationMS =>
    TimeDurationMSStamp.of(TimeDurationMSStamp.un(a) + TimeDurationMSStamp.un(b)),
  fromSeconds: (seconds: number): TimeDurationMS => TimeDurationMSStamp.of(seconds * 1000),
  fromMinutes: (minutes: number): TimeDurationMS => TimeDurationMSStamp.of(minutes * 60000),
  toSeconds: (duration: TimeDurationMS): number => TimeDurationMSStamp.un(duration) / 1000,
  toMinutes: (duration: TimeDurationMS): number => TimeDurationMSStamp.un(duration) / 60000,
  make: (value: number): TimeDurationMS => TimeDurationMS.of(value),
}))();
