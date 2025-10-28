// domains/service/duration-minutes/index.ts
import { Brand, STAMP } from "../../../src/semantic/shim";

export type ServiceDurationMinutes = Brand<number, "service.duration.minutes">;

export const ServiceDurationMinutes = (() => {
  const f = STAMP<"service.duration.minutes">();
  return {
    of: (v: unknown): ServiceDurationMinutes => {
      const n = Number(v);
      if (!Number.isInteger(n)) throw new TypeError("duração deve ser um número inteiro");
      if (n <= 0) throw new TypeError("duração deve ser > 0");
      if (n > 1440) throw new TypeError("duração máxima é 1440 minutos (24 horas)");
      return f.of(n);
    },
    un: (v: ServiceDurationMinutes): number => f.un(v),
    add: (a: ServiceDurationMinutes, b: ServiceDurationMinutes): ServiceDurationMinutes =>
      f.of(f.un(a) + f.un(b)),
    make: (value: number): ServiceDurationMinutes => ServiceDurationMinutes.of(value),
  };
})();
