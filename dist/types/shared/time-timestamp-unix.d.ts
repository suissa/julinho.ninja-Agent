declare const __brand: unique symbol;
type Brand<T, Name extends string> = T & {
    readonly [__brand]: Name;
};
export type TimeTimestampUnix = Brand<number, "time.timestamp.unix">;
export declare const TimeTimestampUnix: {
    of: (v: unknown) => TimeTimestampUnix;
    un: (v: TimeTimestampUnix) => number;
    now: () => TimeTimestampUnix;
    fromDate: (date: Date) => TimeTimestampUnix;
    toDate: (timestamp: TimeTimestampUnix) => Date;
    make: (value: number) => TimeTimestampUnix;
};
export default TimeTimestampUnix;
//# sourceMappingURL=time-timestamp-unix.d.ts.map