/**
 * Client data structures for patient information and session management
 */
import { PatientCpf, PatientEmail } from '@tys/shared';
declare const __brand: unique symbol;
type Brand<T, Name extends string> = T & {
    readonly [__brand]: Name;
};
export type PatientPhone = Brand<string, "patient.phone">;
export type PatientBirthDate = Brand<Date, "patient.birthDate">;
export type PatientName = Brand<string, "patient.name">;
export type ServicePriceBRL = Brand<number, "service.price.brl">;
export type ServiceDurationMinutes = Brand<number, "service.duration.minutes">;
export declare const PatientPhone: {
    of: (v: unknown) => PatientPhone;
    un: (v: PatientPhone) => string;
    make: (value: string) => PatientPhone;
};
export declare const PatientBirthDate: {
    of: (v: unknown) => PatientBirthDate;
    un: (v: PatientBirthDate) => Date;
    make: (value: string | Date) => PatientBirthDate;
};
export declare const ServicePriceBRL: {
    of: (v: unknown) => ServicePriceBRL;
    un: (v: ServicePriceBRL) => number;
    add: (a: ServicePriceBRL, b: ServicePriceBRL) => ServicePriceBRL;
    multiply: (price: ServicePriceBRL, quantity: number) => ServicePriceBRL;
    make: (value: number) => ServicePriceBRL;
};
export declare const ServiceDurationMinutes: {
    of: (v: unknown) => ServiceDurationMinutes;
    un: (v: ServiceDurationMinutes) => number;
    add: (a: ServiceDurationMinutes, b: ServiceDurationMinutes) => ServiceDurationMinutes;
    make: (value: number) => ServiceDurationMinutes;
};
export interface ClientData {
    number: PatientPhone;
    name?: PatientName | undefined;
    cpf?: PatientCpf | undefined;
    email?: PatientEmail | undefined;
    birthDate?: PatientBirthDate | undefined;
    currentAgent?: string | undefined;
    startTime: Date;
    lastActivity: Date;
    messageSent?: boolean;
    messageSentByAgent?: Map<string, boolean> | undefined;
    schedulingChoice?: string | undefined;
    schedulingFlowType?: string | undefined;
    dynamicAgentsFlow?: string[] | undefined;
    selectedDate?: string | undefined;
    selectedDateFormatted?: string | undefined;
    selectedServiceId?: string | undefined;
    selectedServiceName?: string | undefined;
    selectedServiceDescription?: string | undefined;
    selectedServicePrice?: ServicePriceBRL | undefined;
    selectedServiceDuration?: ServiceDurationMinutes | undefined;
    selectedServicePriceFormatted?: string | undefined;
    selectedDentistId?: string | undefined;
    selectedDentistName?: string | undefined;
    selectedDentistSpecialty?: string | undefined;
    selectedPaymentId?: string | undefined;
    selectedPaymentName?: string | undefined;
    selectedPaymentDescription?: string | undefined;
    finalPrice?: ServicePriceBRL | undefined;
    finalPriceFormatted?: string | undefined;
    discountApplied?: boolean | undefined;
    discountPercentage?: number | undefined;
    discountAmount?: ServicePriceBRL | undefined;
    appointmentStatus?: string | undefined;
    completedAt?: string | undefined;
}
export interface ClientStage {
    number: PatientPhone;
    currentStage: string;
    visitedStages: Set<string>;
    stageErrors: Map<string, number>;
    lastActivity: Date;
}
export {};
//# sourceMappingURL=client.d.ts.map