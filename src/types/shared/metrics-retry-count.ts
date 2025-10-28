// src/types/shared/metrics-retry-count.ts
// Tipo compartilhado MetricsRetryCount - usado em config.ts, constants.ts

// Tipagem Semântica Atômica - Shared Implementation
declare const __brand: unique symbol;
type Brand<T, Name extends string> = T & { readonly [__brand]: Name };

function STAMP<Name extends string>() {
  return {
    of: <T>(v: T) => v as Brand<T, Name>,
    un: <T>(v: Brand<T, Name>) => v as unknown as T,
  };
}

// Tipo Semântico para Metrics Domain
export type MetricsRetryCount = Brand<number, "metrics.retry.count">;

// Implementação do tipo semântico
const MetricsRetryCountStamp = STAMP<"metrics.retry.count">();

export const MetricsRetryCount = (() => ({
  of: (v: unknown): MetricsRetryCount => {
    const n = Number(v);
    if (!Number.isInteger(n)) throw new TypeError("contagem deve ser um número inteiro");
    if (n < 0) throw new TypeError("contagem deve ser >= 0");
    if (n > 100) throw new TypeError("contagem máxima de tentativas é 100");
    return MetricsRetryCountStamp.of(n);
  },
  un: (v: MetricsRetryCount): number => MetricsRetryCountStamp.un(v),
  increment: (count: MetricsRetryCount): MetricsRetryCount =>
    MetricsRetryCountStamp.of(MetricsRetryCountStamp.un(count) + 1),
  make: (value: number): MetricsRetryCount => MetricsRetryCount.of(value),
}))();
