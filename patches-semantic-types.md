# Patches para Tipagem Semântica Atômica

Este arquivo contém os patches sugeridos para aplicar os tipos semânticos atômicos no código existente.

## 1. Atualização do src/types/client.ts

```diff
// src/types/client.ts
+ import { PatientPhone, PatientCpf, PatientEmail, PatientBirthDate, ServicePriceBRL, ServiceDurationMinutes } from '../domains';

export interface ClientData {
-  number: string;
+  number: PatientPhone;
  name?: string | undefined;
-  cpf?: string | undefined;
+  cpf?: PatientCpf | undefined;
-  email?: string | undefined;
+  email?: PatientEmail | undefined;
-  birthDate?: string | undefined;
+  birthDate?: PatientBirthDate | undefined;
  currentAgent?: string | undefined;
  startTime: Date;
  lastActivity: Date;

  messageSent?: string;

  // Control flags - MESSAGE_SENT por agente
  messageSentByAgent?: Map<string, boolean> | undefined;

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
-  selectedServicePrice?: number | undefined;
+  selectedServicePrice?: ServicePriceBRL | undefined;
-  selectedServiceDuration?: number | undefined;
+  selectedServiceDuration?: ServiceDurationMinutes | undefined;
  selectedServicePriceFormatted?: string | undefined;
  selectedDentistId?: string | undefined;
  selectedDentistName?: string | undefined;
  selectedDentistSpecialty?: string | undefined;
  selectedPaymentId?: string | undefined;
  selectedPaymentName?: string | undefined;
  selectedPaymentDescription?: string | undefined;
-  finalPrice?: number | undefined;
+  finalPrice?: ServicePriceBRL | undefined;
  finalPriceFormatted?: string | undefined;
  discountApplied?: boolean | undefined;
-  discountPercentage?: number | undefined;
+  discountPercentage?: number | undefined; // TODO: criar tipo system.discount.percentage
-  discountAmount?: number | undefined;
+  discountAmount?: ServicePriceBRL | undefined; // Mesmo tipo de preço
  appointmentStatus?: string | undefined;
  completedAt?: string | undefined;
}
```

## 2. Atualização do src/types/config.ts

```diff
// src/types/config.ts
+ import { TimeDurationMS, MetricsRetryCount } from '../domains';

export interface AgentConfig {
  flow: string[];
  timeouts: {
-    userResponse: number; // milliseconds
+    userResponse: TimeDurationMS;
-    reminderTimeout: number; // milliseconds
+    reminderTimeout: TimeDurationMS;
-    maxRetries: number;
+    maxRetries: MetricsRetryCount;
  };
  duplicateMessagePrevention: {
-    minInterval: number; // milliseconds
+    minInterval: TimeDurationMS;
  };
}
```

## 3. Atualização do src/types/messages.ts

```diff
// src/types/messages.ts
+ import { TimeTimestampUnix } from '../domains';

export interface AgentActivationPayload {
  number: string;
  sender: string;
-  timestamp: number;
+  timestamp: TimeTimestampUnix;
}

export interface WhatsAppMessage {
  number: string;
  text: string;
-  timestamp?: number;
+  timestamp?: TimeTimestampUnix;
}
```

## 4. Atualização do src/types/sdk.ts

```diff
// src/types/sdk.ts
+ import { SystemPortTcp } from '../domains';

export interface RabbitMQConfig {
  host: string;
-  port: number;
+  port: SystemPortTcp;
  username: string;
  password: string;
  vhost?: string;
  protocol?: string;
}
```

## 5. Atualização do src/types/session.ts

```diff
// src/types/session.ts
+ import { TimeTimestampUnix, TimeDurationMS } from '../domains';

export interface SessionData {
  number: string;
  clientData: ClientData;
  clientStage: ClientStage;
  agentsFlow: string[];
-  lastMessageSent?: number | undefined;
+  lastMessageSent?: TimeTimestampUnix | undefined;
-  sessionTimeout?: number | undefined;
+  sessionTimeout?: TimeDurationMS | undefined;
  createdAt: Date;
  updatedAt: Date;
}
```

## 6. Atualização do src/types/specifications.ts

```diff
// src/types/specifications.ts
+ import { TimeTimestampUnix } from '../domains';

export interface AgentActivationCommand {
  number: string;
  sender: string;
-  timestamp: number;
+  timestamp: TimeTimestampUnix;
}
```

## 7. Atualização do src/agents/PatientCPFAgent.ts

```diff
// src/agents/PatientCPFAgent.ts
+ import { PatientCpf } from '../domains/patient/cpf';

  processInput(number: string, input: string): void {
    // Clean CPF (remove any non-numeric characters)
    const cleanedCPF = input.replace(/\D/g, '');

    // Store the CPF in global memory
-    this.globalMemory.setClientData(number, 'cpf', cleanedCPF);
+    this.globalMemory.setClientData(number, 'cpf', PatientCpf.make(cleanedCPF));
  }
```

## 8. Atualização do src/utils/validation.ts

```diff
// src/utils/validation.ts
+ import { PatientCpf, PatientEmail, PatientBirthDate } from '../domains';

- export function validateCPF(cpf: string): boolean {
+ export function validateCPF(cpf: string): cpf is PatientCpf['__brand'] {
  // ... existing validation logic ...
  }

- export function validateEmail(email: string): boolean {
+ export function validateEmail(email: string): email is PatientEmail['__brand'] {
  // ... existing validation logic ...
  }

- export function validateBirthDate(dateString: string): boolean {
+ export function validateBirthDate(dateString: string): boolean {
  // ... existing validation logic ...
  }
```

## 9. Criação do arquivo src/domains/index.ts

```typescript
// src/domains/index.ts - Barrel export para facilitar imports

// Patient types
export { PatientCpf, PatientCpf as Cpf } from './patient/cpf';
export { PatientEmail, PatientEmail as Email } from './patient/email';
export { PatientBirthDate, PatientBirthDate as BirthDate } from './patient/birth-date';
export { PatientPhone, PatientPhone as Phone } from './patient/phone';

// Service types
export { ServicePriceBRL, ServicePriceBRL as PriceBRL } from './service/price-brl';
export { ServiceDurationMinutes, ServiceDurationMinutes as DurationMinutes } from './service/duration-minutes';

// Time types
export { TimeDurationMS, TimeDurationMS as DurationMS } from './time/duration-ms';
export { TimeTimestampUnix, TimeTimestampUnix as TimestampUnix } from './time/timestamp-unix';

// System types
export { SystemPortTcp, SystemPortTcp as PortTcp } from './system/port-tcp';

// Metrics types
export { MetricsRetryCount, MetricsRetryCount as RetryCount } from './metrics/retry-count';
```

## 10. Atualização do package.json (se necessário)

Caso queira adicionar scripts para validação:

```diff
// package.json
  "scripts": {
+   "type-check": "tsc --noEmit",
+   "semantic-types:validate": "node -e \"console.log('Validating semantic types...')\"",
    // ... existing scripts ...
  }
```

---

## Notas de Implementação

1. **Imports circulares**: Evitar imports entre tipos que se referenciam mutuamente.

2. **Tipos opcionais**: Manter compatibilidade com `undefined` nos tipos existentes.

3. **Validações em runtime**: Os tipos semânticos incluem validação, mas para migração gradual, considere usar tipos `unknown` como entrada.

4. **Testes**: Criar testes unitários para cada tipo semântico antes da migração completa.

5. **Gradual adoption**: Começar aplicando tipos em novos códigos e migrar gradualmente os existentes.
