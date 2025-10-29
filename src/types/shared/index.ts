// src/types/shared/index.ts
// Exports diretos para tipos compartilhados

// Time Domain
// export { TimeTimestampUnix } from './time-timestamp-unix'; // Temporariamente comentado
export { TimeDurationMS } from './time-duration-ms';
export { TimeTimestampUnix } from './time-timestamp-unix';

// Patient Domain
export { PatientCpf } from './patient-cpf';
export { PatientEmail } from './patient-email';
  export { PatientBirthDate } from '../client';
export { PatientPhone } from '../client';
export { PatientName } from '../client';
export { ServicePriceBRL } from '../client';
export { ServiceDurationMinutes } from '../client';

// Metrics Domain
export { MetricsRetryCount } from  './metrics-retry-count';
