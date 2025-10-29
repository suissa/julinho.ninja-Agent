// domains/time/duration-ms/index.ts
import { Brand, STAMP } from "../../../src/semantic/shim";

export type TimeDurationMS = Brand<number, "time.duration.ms">;

export const TimeDurationMS = (() => {
  const f = STAMP<"time.duration.ms">();
  return {
    of: (v: unknown): TimeDurationMS => {
      const n = Number(v);
      if (!Number.isInteger(n)) throw new TypeError("duração deve ser um número inteiro");
      if (n < 0) throw new TypeError("duração deve ser >= 0");
      if (n > 86400000) throw new TypeError("duração máxima é 86400000ms (24 horas)");
      return f.of(n);
    },
    un: (v: TimeDurationMS): number => f.un(v),
    add: (a: TimeDurationMS, b: TimeDurationMS): TimeDurationMS =>
      f.of(f.un(a) + f.un(b)),
    // Conversões comuns
    fromSeconds: (seconds: number): TimeDurationMS => f.of(seconds * 1000),
    fromMinutes: (minutes: number): TimeDurationMS => f.of(minutes * 60000),
    toSeconds: (duration: TimeDurationMS): number => f.un(duration) / 1000,
    toMinutes: (duration: TimeDurationMS): number => f.un(duration) / 60000,
    make: (value: number): TimeDurationMS => TimeDurationMS.of(value),
  };
})();
