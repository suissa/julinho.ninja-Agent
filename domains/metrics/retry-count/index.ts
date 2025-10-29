// domains/metrics/retry-count/index.ts
import { Brand, STAMP } from "../../../src/semantic/shim";

export type MetricsRetryCount = Brand<number, "metrics.retry.count">;

export const MetricsRetryCount = (() => {
  const f = STAMP<"metrics.retry.count">();
  return {
    of: (v: unknown): MetricsRetryCount => {
      const n = Number(v);
      if (!Number.isInteger(n)) throw new TypeError("contagem deve ser um número inteiro");
      if (n < 0) throw new TypeError("contagem deve ser >= 0");
      if (n > 100) throw new TypeError("contagem máxima de tentativas é 100");
      return f.of(n);
    },
    un: (v: MetricsRetryCount): number => f.un(v),
    increment: (count: MetricsRetryCount): MetricsRetryCount =>
      f.of(f.un(count) + 1),
    make: (value: number): MetricsRetryCount => MetricsRetryCount.of(value),
  };
})();
