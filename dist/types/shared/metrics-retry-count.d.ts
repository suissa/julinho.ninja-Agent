declare const __brand: unique symbol;
type Brand<T, Name extends string> = T & {
    readonly [__brand]: Name;
};
export type MetricsRetryCount = Brand<number, "metrics.retry.count">;
export declare const MetricsRetryCount: {
    of: (v: unknown) => MetricsRetryCount;
    un: (v: MetricsRetryCount) => number;
    increment: (count: MetricsRetryCount) => MetricsRetryCount;
    make: (value: number) => MetricsRetryCount;
};
export {};
//# sourceMappingURL=metrics-retry-count.d.ts.map