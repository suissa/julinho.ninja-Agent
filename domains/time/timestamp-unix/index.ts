// domains/time/timestamp-unix/index.ts
import { Brand, STAMP } from "../../../src/semantic/shim";

export type TimeTimestampUnix = Brand<number, "time.timestamp.unix">;

export const TimeTimestampUnix = (() => {
  const f = STAMP<"time.timestamp.unix">();
  return {
    of: (v: unknown): TimeTimestampUnix => {
      const n = Number(v);
      if (!Number.isInteger(n)) throw new TypeError("timestamp deve ser um número inteiro");
      if (n < 0) throw new TypeError("timestamp deve ser >= 0");
      // Timestamp máximo: ano 2100 (aproximadamente)
      if (n > 4102444800) throw new TypeError("timestamp muito no futuro");
      return f.of(n);
    },
    un: (v: TimeTimestampUnix): number => f.un(v),
    now: (): TimeTimestampUnix => f.of(Math.floor(Date.now() / 1000)),
    fromDate: (date: Date): TimeTimestampUnix => f.of(Math.floor(date.getTime() / 1000)),
    toDate: (timestamp: TimeTimestampUnix): Date => new Date(f.un(timestamp) * 1000),
    make: (value: number): TimeTimestampUnix => TimeTimestampUnix.of(value),
  };
})();
