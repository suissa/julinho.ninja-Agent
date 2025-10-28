declare const __brand: unique symbol;
type Brand<T, Name extends string> = T & {
    readonly [__brand]: Name;
};
export type TimeDurationMS = Brand<number, "time.duration.ms">;
export declare const TimeDurationMS: {
    of: (v: unknown) => TimeDurationMS;
    un: (v: TimeDurationMS) => number;
    add: (a: TimeDurationMS, b: TimeDurationMS) => TimeDurationMS;
    fromSeconds: (seconds: number) => TimeDurationMS;
    fromMinutes: (minutes: number) => TimeDurationMS;
    toSeconds: (duration: TimeDurationMS) => number;
    toMinutes: (duration: TimeDurationMS) => number;
    make: (value: number) => TimeDurationMS;
};
export {};
//# sourceMappingURL=time-duration-ms.d.ts.map