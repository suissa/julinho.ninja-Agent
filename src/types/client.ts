/**
 * Client data structures for patient information and session management
 */

export interface ClientData {
  number: string;
  name?: string | undefined;
  cpf?: string | undefined;
  email?: string | undefined;
  birthDate?: string | undefined;
  currentAgent?: string | undefined;
  startTime: Date;
  lastActivity: Date;
  
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
  selectedServicePrice?: number | undefined;
  selectedServiceDuration?: number | undefined;
  selectedServicePriceFormatted?: string | undefined;
  selectedDentistId?: string | undefined;
  selectedDentistName?: string | undefined;
  selectedDentistSpecialty?: string | undefined;
  selectedPaymentId?: string | undefined;
  selectedPaymentName?: string | undefined;
  selectedPaymentDescription?: string | undefined;
  finalPrice?: number | undefined;
  finalPriceFormatted?: string | undefined;
  discountApplied?: boolean | undefined;
  discountPercentage?: number | undefined;
  discountAmount?: number | undefined;
  appointmentStatus?: string | undefined;
  completedAt?: string | undefined;
}

export interface ClientStage {
  number: string;
  currentStage: string;
  visitedStages: Set<string>;
  stageErrors: Map<string, number>; // stage -> error count
  lastActivity: Date;
}