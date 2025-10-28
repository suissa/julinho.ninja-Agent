declare const __brand: unique symbol;
type Brand<T, Name extends string> = T & {
    readonly [__brand]: Name;
};
export type PatientCpf = Brand<string, "patient.cpf">;
export declare const PatientCpf: {
    of: (v: unknown) => PatientCpf;
    un: (v: PatientCpf) => string;
    make: (value: string) => PatientCpf;
};
export {};
//# sourceMappingURL=patient-cpf.d.ts.map