/**
 * Scheduling data interface for appointment management
 */

import { ServicePriceBRL } from './client';

export interface SchedulingData {
  // Flow configuration
  schedulingChoice?: string;
  schedulingFlowType?: string;
  dynamicAgentsFlow?: string[];

  // Selected appointment data
  selectedDate?: string;
  selectedDateFormatted?: string;
  selectedServiceId?: string;
  selectedServiceName?: string;
  selectedServicePrice?: ServicePriceBRL;
  selectedServicePriceFormatted?: string;
  selectedDentistId?: string;
  selectedDentistName?: string;
  selectedDentistSpecialty?: string;
  selectedPaymentId?: string;
  selectedPaymentName?: string;
  finalPrice?: ServicePriceBRL;
  finalPriceFormatted?: string;
  appointmentStatus?: string;
}
