declare const __brand: unique symbol;
type Brand<T, Name extends string> = T & {
    readonly [__brand]: Name;
};
export type PatientEmail = Brand<string, "patient.email">;
export declare const PatientEmail: {
    of: (v: unknown) => PatientEmail;
    un: (v: PatientEmail) => string;
    make: (value: string) => PatientEmail;
};
export {};
//# sourceMappingURL=patient-email.d.ts.map