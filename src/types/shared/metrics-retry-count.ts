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
  of: (v: unknown): MetricsRetryCount => MetricsRetryCountStamp.of(Number(v)),
  un: (v: MetricsRetryCount): number => MetricsRetryCountStamp.un(v),
  make: (value: number): MetricsRetryCount => MetricsRetryCount.of(value),
}))();
