# SDK Directory

This directory contains the SdkRabbitmq singleton implementation for RabbitMQ operations.

The SDK functionality is imported from:

```typescript
import { SdkRabbitmq } from "./sdk/SdkRabbitmq";
```

## Features

- Singleton pattern for connection management
- Automatic reconnection with exponential backoff
- Exchange and queue auto-creation
- Message publishing and subscription
- Queue binding and unbinding
- Queue purging capabilities
