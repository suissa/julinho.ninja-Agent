# Requirements Document

## Introduction

Este documento especifica os requisitos para um chatbot WhatsApp multi-agent com roteamento dinâmico auto-gerenciado. O sistema utiliza RabbitMQ para comunicação entre agentes, onde cada agente ativo escolhe dinamicamente o próximo agente a ser ativado através de uma memória global compartilhada.

## Glossary

- **ChatBot**: Sistema principal que gerencia a comunicação multi-agent
- **Agent**: Componente individual responsável por coletar informações específicas do paciente
- **Dynamic Self-Routing**: Mecanismo onde o agente ativo escolhe qual próximo agente ativar
- **Global Memory**: Memória compartilhada que mantém o fluxo de agentes e dados dos clientes
- **SdkRabbitmq**: Biblioteca singleton para facilitar operações com RabbitMQ
- **RoutingKey**: Chave de roteamento para direcionamento de mensagens no RabbitMQ
- **Topic Exchange**: Tipo de exchange RabbitMQ usado para roteamento baseado em padrões

## Requirements

### Requirement 1

**User Story:** Como um desenvolvedor do sistema, eu quero que o ChatBot inicialize corretamente com todos os agentes configurados, para que o sistema esteja pronto para processar mensagens do WhatsApp.

#### Acceptance Criteria

1. WHEN THE ChatBot starts, THE ChatBot SHALL purge all existing messages from all RabbitMQ queues
2. WHEN THE ChatBot starts, THE ChatBot SHALL clear the global memory completely including all client data and session states
3. WHEN THE ChatBot starts, THE ChatBot SHALL unbind all existing queue bindings to ensure clean state
4. WHEN THE ChatBot starts, THE ChatBot SHALL define the agents flow as ['patient.name', 'patient.cpf', 'patient.birthDate', 'patient.email'] in global memory
5. WHEN THE ChatBot starts, THE ChatBot SHALL create and subscribe each agent to their respective queues using topic exchange "chatbot.agents"
6. WHEN THE ChatBot starts, THE ChatBot SHALL initialize SdkRabbitmq singleton instance
7. WHEN THE ChatBot starts, THE GreetingAgent SHALL subscribe to 'chatbot.messages' with routing key 'phone.*' to listen to all phone messages

### Requirement 2

**User Story:** Como um usuário do WhatsApp, eu quero receber uma mensagem de boas-vindas quando envio minha primeira mensagem, para que eu saiba que o chatbot está ativo e pronto para me atender.

#### Acceptance Criteria

1. WHEN THE GreetingAgent receives a message from a new phone number, THE GreetingAgent SHALL check if the phone number exists in global memory clients list
2. IF the phone number does not exist in global memory, THEN THE GreetingAgent SHALL send welcome message to WhatsApp using sendToWhatsApp function
3. WHEN THE GreetingAgent sends welcome message, THE GreetingAgent SHALL add the phone number to global memory clients list
4. WHEN THE GreetingAgent processes a new client, THE GreetingAgent SHALL activate the first agent in the flow sequence

### Requirement 3

**User Story:** Como um sistema de chatbot, eu quero que mensagens de clientes existentes sejam redirecionadas para o próximo agente apropriado, para que o fluxo de coleta de dados continue corretamente.

#### Acceptance Criteria

1. WHEN THE GreetingAgent receives a message from an existing phone number, THE GreetingAgent SHALL not process the message text
2. WHEN THE GreetingAgent receives a message from an existing phone number, THE GreetingAgent SHALL acknowledge the message
3. WHEN THE GreetingAgent identifies an existing client, THE GreetingAgent SHALL get the next agent name from global memory flow
4. WHEN THE GreetingAgent identifies the next agent, THE GreetingAgent SHALL publish payload to next agent queue with phone number, sender name, and timestamp
5. WHEN THE GreetingAgent publishes to next agent, THE GreetingAgent SHALL wait 5 seconds before forwarding the original user message

### Requirement 4

**User Story:** Como um agente especializado, eu quero receber ativação dinâmica e coletar informações específicas do paciente, para que eu possa processar minha parte do fluxo de dados.

#### Acceptance Criteria

1. WHEN AN Agent receives activation payload, THE Agent SHALL subscribe to the specific phone routing key 'phone.{number}'
2. WHEN AN Agent subscribes to phone messages, THE Agent SHALL send its specific question message to WhatsApp user
3. WHEN AN Agent receives user response, THE Agent SHALL process and store the collected information
4. WHEN AN Agent completes processing, THE Agent SHALL get next agent name from global memory flow
5. WHEN AN Agent identifies next agent, THE Agent SHALL publish activation payload to next agent queue

### Requirement 5

**User Story:** Como um sistema de mensageria, eu quero que todas as comunicações entre agentes e WhatsApp sejam gerenciadas através do RabbitMQ, para que o sistema seja escalável e confiável.

#### Acceptance Criteria

1. THE SdkRabbitmq SHALL provide getInstance method for singleton pattern implementation
2. THE SdkRabbitmq SHALL provide publish method for sending messages to exchanges
3. THE SdkRabbitmq SHALL provide subscribe method for listening to queue messages
4. THE SdkRabbitmq SHALL provide bind and unbind methods for queue management
5. WHEN sending messages to WhatsApp, THE ChatBot SHALL use 'whatsapp.message.text' exchange with 'send' routing key

### Requirement 6

**User Story:** Como um administrador do sistema, eu quero que o fluxo de agentes seja gerenciado dinamicamente através da memória global, para que o sistema possa adaptar a sequência de coleta de dados conforme necessário.

#### Acceptance Criteria

1. THE Global Memory SHALL maintain agentsFlow array with agent routing keys in execution order
2. WHEN AN Agent needs next agent, THE ChatBot SHALL get first item from agentsFlow array
3. WHEN AN Agent gets next agent name, THE ChatBot SHALL remove that item from agentsFlow array
4. THE Global Memory SHALL maintain clients_visitantes list with active phone numbers
5. THE Global Memory SHALL be accessible by all agents for flow management

### Requirement 7

**User Story:** Como um desenvolvedor, eu quero que cada agente tenha uma routing key específica e bem definida, para que o roteamento dinâmico funcione corretamente.

#### Acceptance Criteria

1. THE PatientNameAgent SHALL use routing key 'patient.name'
2. THE PatientCPFAgent SHALL use routing key 'patient.cpf'
3. THE PatientEmailAgent SHALL use routing key 'patient.email'
4. THE PatientBirthDateAgent SHALL use routing key 'patient.birthDate'
5. THE Topic Exchange SHALL be named "chatbot.agents" for all agent communications

### Requirement 8

**User Story:** Como um agente do sistema, eu quero validar e processar as informações coletadas do usuário, para que os dados sejam armazenados corretamente antes de passar para o próximo agente.

#### Acceptance Criteria

1. WHEN THE PatientNameAgent receives user input, THE PatientNameAgent SHALL validate that the input contains valid name characters
2. WHEN THE PatientCPFAgent receives user input, THE PatientCPFAgent SHALL validate CPF format and checksum
3. WHEN THE PatientEmailAgent receives user input, THE PatientEmailAgent SHALL validate email format using regex pattern
4. WHEN THE PatientBirthDateAgent receives user input, THE PatientBirthDateAgent SHALL validate date format and logical date range
5. IF validation fails, THEN THE Agent SHALL request user to provide valid information again

### Requirement 9

**User Story:** Como um sistema de chatbot, eu quero gerenciar timeouts e reconexões automaticamente, para que o sistema seja robusto contra falhas de rede e processamento.

#### Acceptance Criteria

1. WHEN AN Agent waits for user response, THE Agent SHALL implement 30-second timeout for user input
2. IF user does not respond within timeout, THEN THE Agent SHALL send reminder message
3. WHEN THE Agent sends reminder message, THE Agent SHALL wait additional 60 seconds before timeout
4. IF user still does not respond, THEN THE Agent SHALL save partial data and end session gracefully
5. WHEN THE SdkRabbitmq connection fails, THE ChatBot SHALL attempt automatic reconnection with exponential backoff

### Requirement 10

**User Story:** Como um administrador do sistema, eu quero que todas as interações sejam logadas adequadamente, para que eu possa monitorar o desempenho e debugar problemas.

#### Acceptance Criteria

1. WHEN AN Agent is activated, THE Agent SHALL log activation event with timestamp and phone number
2. WHEN AN Agent processes user input, THE Agent SHALL log processing event with sanitized data
3. WHEN AN Agent forwards to next agent, THE Agent SHALL log routing decision and next agent name
4. WHEN THE ChatBot encounters errors, THE ChatBot SHALL log error details with stack trace
5. THE Logging system SHALL not log sensitive user data in plain text

### Requirement 11

**User Story:** Como um usuário do WhatsApp, eu quero receber mensagens claras e específicas de cada agente, para que eu entenda exatamente que informação preciso fornecer.

#### Acceptance Criteria

1. THE PatientNameAgent SHALL send message "Por favor, informe seu nome completo:"
2. THE PatientCPFAgent SHALL send message "Agora preciso do seu CPF (apenas números):"
3. THE PatientBirthDateAgent SHALL send message "Qual sua data de nascimento? (formato: DD/MM/AAAA)"
4. THE PatientEmailAgent SHALL send message "Por último, informe seu e-mail:"
5. WHEN THE flow is completed, THE ChatBot SHALL send confirmation message with collected data summary

### Requirement 12

**User Story:** Como um sistema distribuído, eu quero que as filas e exchanges sejam criadas automaticamente, para que o sistema seja auto-suficiente na configuração inicial.

#### Acceptance Criteria

1. WHEN THE ChatBot starts, THE ChatBot SHALL create topic exchange "chatbot.agents" if it does not exist
2. WHEN THE ChatBot starts, THE ChatBot SHALL create topic exchange "chatbot.messages" if it does not exist  
3. WHEN THE ChatBot starts, THE ChatBot SHALL create topic exchange "whatsapp.message.text" if it does not exist
4. WHEN AN Agent subscribes to a queue, THE SdkRabbitmq SHALL create the queue automatically if it does not exist
5. WHEN THE ChatBot shuts down, THE ChatBot SHALL gracefully close all connections and unbind from queues

### Requirement 13

**User Story:** Como um desenvolvedor, eu quero que o sistema suporte múltiplas sessões simultâneas, para que vários usuários possam interagir com o chatbot ao mesmo tempo.

#### Acceptance Criteria

1. THE ChatBot SHALL support concurrent processing of multiple phone numbers simultaneously
2. WHEN multiple users send messages, THE ChatBot SHALL maintain separate agent flows for each phone number
3. THE Global Memory SHALL store client data indexed by phone number for isolation
4. WHEN AN Agent processes user input, THE Agent SHALL only access data for the specific phone number
5. THE ChatBot SHALL prevent data leakage between different user sessions
