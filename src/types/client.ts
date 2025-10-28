/**
 * Client data structures for patient information and session management
 */

import { PatientCpf, PatientEmail } from '@tys/shared';

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

export const PatientPhone = (() => ({
  of: (v: unknown): PatientPhone => {
    const s = String(v).trim().replace(/[^\d+]/g, '');
    if (s.length < 10 || s.length > 13) throw new TypeError("telefone deve ter entre 10 e 13 dígitos");
    const phoneRx = /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/;
    if (!phoneRx.test(String(v).trim())) throw new TypeError("formato de telefone brasileiro inválido");
    return PatientPhoneStamp.of(s);
  },
  un: (v: PatientPhone): string => PatientPhoneStamp.un(v),
  make: (value: string): PatientPhone => PatientPhone.of(value),
}))();

export const PatientBirthDate = (() => ({
  of: (v: unknown): PatientBirthDate => {
    const trimmed = String(v).trim();
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = trimmed.match(dateRegex);
    if (!match) throw new TypeError("formato de data deve ser DD/MM/YYYY");

    const day = parseInt(match[1]!, 10);
    const month = parseInt(match[2]!, 10);
    const year = parseInt(match[3]!, 10);

    if (month < 1 || month > 12) throw new TypeError("mês deve estar entre 1 e 12");
    if (day < 1 || day > 31) throw new TypeError("dia deve estar entre 1 e 31");

    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      throw new TypeError("data inválida");
    }

    const today = new Date();
    const age = today.getFullYear() - year;
    if (age < 0 || age > 120) throw new TypeError("idade deve estar entre 0 e 120 anos");
    if (date > today) throw new TypeError("data de nascimento não pode ser no futuro");

    return PatientBirthDateStamp.of(date);
  },
  un: (v: PatientBirthDate): Date => PatientBirthDateStamp.un(v),
  make: (value: string | Date): PatientBirthDate => PatientBirthDate.of(value),
}))();

export const ServicePriceBRL = (() => ({
  of: (v: unknown): ServicePriceBRL => {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new TypeError("preço deve ser um número finito");
    if (n < 0) throw new TypeError("preço deve ser >= 0");
    const rounded = Math.round(n * 100) / 100;
    return ServicePriceBRLStamp.of(rounded);
  },
  un: (v: ServicePriceBRL): number => ServicePriceBRLStamp.un(v),
  add: (a: ServicePriceBRL, b: ServicePriceBRL): ServicePriceBRL =>
    ServicePriceBRLStamp.of(ServicePriceBRLStamp.un(a) + ServicePriceBRLStamp.un(b)),
  multiply: (price: ServicePriceBRL, quantity: number): ServicePriceBRL =>
    ServicePriceBRLStamp.of(ServicePriceBRLStamp.un(price) * quantity),
  make: (value: number): ServicePriceBRL => ServicePriceBRL.of(value),
}))();

export const ServiceDurationMinutes = (() => ({
  of: (v: unknown): ServiceDurationMinutes => {
    const n = Number(v);
    if (!Number.isInteger(n)) throw new TypeError("duração deve ser um número inteiro");
    if (n <= 0) throw new TypeError("duração deve ser > 0");
    if (n > 1440) throw new TypeError("duração máxima é 1440 minutos (24 horas)");
    return ServiceDurationMinutesStamp.of(n);
  },
  un: (v: ServiceDurationMinutes): number => ServiceDurationMinutesStamp.un(v),
  add: (a: ServiceDurationMinutes, b: ServiceDurationMinutes): ServiceDurationMinutes =>
    ServiceDurationMinutesStamp.of(ServiceDurationMinutesStamp.un(a) + ServiceDurationMinutesStamp.un(b)),
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