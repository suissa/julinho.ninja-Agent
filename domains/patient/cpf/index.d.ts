import { Brand } from "../../../src/semantic/shim";
export type PatientCpf = Brand<string, "patient.cpf">;
export declare const PatientCpf: {
    of: (v: unknown) => PatientCpf;
    un: (v: PatientCpf) => string;
    make: (value: string) => PatientCpf;
};
//# sourceMappingURL=index.d.ts.map