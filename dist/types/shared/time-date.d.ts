declare const __brand: unique symbol;
type Brand<T, Name extends string> = T & {
    readonly [__brand]: Name;
};
export type TimeDate = Brand<Date, "time.date">;
export declare const TimeDate: {
    of: (v: unknown) => TimeDate;
    un: (v: TimeDate) => Date;
    toISOString: (date: TimeDate) => string;
    toLocaleString: (date: TimeDate, locale?: string) => string;
    toDDMMYYYY: (date: TimeDate) => string;
    toYYYYMMDD: (date: TimeDate) => string;
    diffInDays: (date1: TimeDate, date2: TimeDate) => number;
    diffInHours: (date1: TimeDate, date2: TimeDate) => number;
    diffInMinutes: (date1: TimeDate, date2: TimeDate) => number;
    diffInSeconds: (date1: TimeDate, date2: TimeDate) => number;
    diffInMilliseconds: (date1: TimeDate, date2: TimeDate) => number;
    getAge: (birthDate: TimeDate) => number;
    isBefore: (date1: TimeDate, date2: TimeDate) => boolean;
    isAfter: (date1: TimeDate, date2: TimeDate) => boolean;
    isEqual: (date1: TimeDate, date2: TimeDate) => boolean;
    addDays: (date: TimeDate, days: number) => TimeDate;
    addMonths: (date: TimeDate, months: number) => TimeDate;
    addYears: (date: TimeDate, years: number) => TimeDate;
    now: () => TimeDate;
    today: () => TimeDate;
    make: (value: string | Date) => TimeDate;
};
export {};
//# sourceMappingURL=time-date.d.ts.map