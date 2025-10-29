/**
 * Client data structures for patient information and session management
 */

import { PatientCpf, PatientEmail } from './shared';

// Tipagem Semântica Atômica - Inline Implementation (Tipos únicos)
// Sistema de branding sem runtime overhead
declare const __brand: unique symbol;
type Brand<T, Name extends string> = T & { readonly [__brand]: Name };

function STAMP<Name extends string>() {
  return {
    of: <T>(v: T) => v as Brand<T, Name>,
    un: <T>(v: Brand<T, Name>) => v as unknown as T,
  };
}

// Tipos Semânticos únicos para Patient Domain (não compartilhados)
export type PatientPhone = Brand<string, "patient.phone">;
export type PatientBirthDate = Brand<Date, "patient.birthDate">;
export type PatientName = Brand<string, "patient.name">;

// Tipos Semânticos únicos para Service Domain (não compartilhados)
export type ServicePriceBRL = Brand<number, "service.price.brl">;
export type ServiceDurationMinutes = Brand<number, "service.duration.minutes">;

// Implementações dos tipos únicos
const PatientPhoneStamp = STAMP<"patient.phone">();
const PatientBirthDateStamp = STAMP<"patient.birthDate">();
const ServicePriceBRLStamp = STAMP<"service.price.brl">();
const ServiceDurationMinutesStamp = STAMP<"service.duration.minutes">();
const PatientNameStamp = STAMP<"patient.name">();

export const PatientName = (() => ({
  of: (v: unknown): PatientName => {
    const s = String(v).replace(/\D/g, '');
    if (s.length < 3) throw new TypeError("nome deve ter pelo menos 3 caracteres");
    if (s.length > 100) throw new TypeError("nome deve ter no máximo 100 caracteres");
    return PatientNameStamp.of(s);
  },
  un: (v: PatientName): string => PatientNameStamp.un(v),
  make: (value: string): PatientName => PatientName.of(value),
}))();


export const PatientPhone = (() => ({
  of: (v: unknown): PatientPhone => PatientPhoneStamp.of(String(v)),
  un: (v: PatientPhone): string => PatientPhoneStamp.un(v),
  make: (value: string): PatientPhone => PatientPhone.of(value),
}))();

export const PatientBirthDate = (() => ({
  of: (v: unknown): PatientBirthDate => PatientBirthDateStamp.of(v instanceof Date ? v : new Date(String(v))),
  un: (v: PatientBirthDate): Date => PatientBirthDateStamp.un(v),
  make: (value: string | Date): PatientBirthDate => PatientBirthDate.of(value),
}))();

export const ServicePriceBRL = (() => ({
  of: (v: unknown): ServicePriceBRL => ServicePriceBRLStamp.of(Number(v)),
  un: (v: ServicePriceBRL): number => ServicePriceBRLStamp.un(v),
  make: (value: number): ServicePriceBRL => ServicePriceBRL.of(value),
}))();

export const ServiceDurationMinutes = (() => ({
  of: (v: unknown): ServiceDurationMinutes => ServiceDurationMinutesStamp.of(Number(v)),
  un: (v: ServiceDurationMinutes): number => ServiceDurationMinutesStamp.un(v),
  make: (value: number): ServiceDurationMinutes => ServiceDurationMinutes.of(value),
}))();

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
  
  // Control flags - MESSAGE_SENT por agente
  messageSentByAgent?: Map<string, boolean> | undefined; // Flag MESSAGE_SENT por agente conforme especificação
  
  // Scheduling fields
  schedulingChoice?: string | undefined;
  schedulingFlowType?: string | undefined;
  dynamicAgentsFlow?: string[] | undefined;
  
  // Selected appointment data
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
  stageErrors: Map<string, number>; // stage -> error count
  lastActivity: Date;
}
