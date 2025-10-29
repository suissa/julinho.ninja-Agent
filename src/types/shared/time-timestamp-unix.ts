// src/types/shared/time-timestamp-unix.ts
// Tipo compartilhado TimeTimestampUnix - usado em messages.ts, session.ts, specifications.ts

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
export type TimeTimestampUnix = Brand<number, "time.timestamp.unix">;

// Implementação do tipo semântico
const TimeTimestampUnixStamp = STAMP<"time.timestamp.unix">();

export const TimeTimestampUnix = (() => ({
  of: (v: unknown): TimeTimestampUnix => {
    const n = Number(v);
    // if (!Number.isInteger(n)) throw new TypeError("timestamp deve ser um número inteiro");
    // if (n < 0) throw new TypeError("timestamp deve ser >= 0");
    // if (n > 4102444800) throw new TypeError("timestamp muito no futuro");
    return TimeTimestampUnixStamp.of(n);
  },
  un: (v: TimeTimestampUnix): number => TimeTimestampUnixStamp.un(v),
  now: (): TimeTimestampUnix => TimeTimestampUnixStamp.of(Math.floor(Date.now() / 1000)),
  fromDate: (date: Date): TimeTimestampUnix => TimeTimestampUnixStamp.of(Math.floor(date.getTime() / 1000)),
  toDate: (timestamp: TimeTimestampUnix): Date => new Date(TimeTimestampUnixStamp.un(timestamp) * 1000),
  make: (value: number): TimeTimestampUnix => TimeTimestampUnix.of(value),
}))();

// Export adicional para garantir que seja reconhecido como módulo
export default TimeTimestampUnix;
