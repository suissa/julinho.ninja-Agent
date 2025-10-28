# Implementation Plan

- [x] 1. Set up project structure and core interfaces

  - Create directory structure for agents, memory, and SDK components
  - Define TypeScript interfaces for all system components
  - Set up package.json with required dependencies (amqplib, typescript, etc.)
  - _Requirements: 1.4, 5.1, 5.2, 5.3, 5.4_

- [x] 2. Implement SdkRabbitmq singleton class

  - [x] 2.1 Create SdkRabbitmq class with singleton pattern

    - Implement getInstance() method with connection management
    - Add connection configuration and error handling
    - _Requirements: 1.4, 5.1_

  - [x] 2.2 Implement core RabbitMQ operations

    - Add publish() method for sending messages to exchanges
    - Add subscribe() method for listening to queues with callbacks
    - Add bind() and unbind() methods for queue management
    - Add purgeQueue() method for cleaning queues on startup
    - _Requirements: 1.1, 5.2, 5.3, 5.4, 12.1, 12.2, 12.3_

  - [x] 2.3 Add connection management and error handling

    - Implement automatic reconnection with exponential backoff
    - Add graceful shutdown and connection cleanup
    - _Requirements: 9.5, 12.5_

- [x] 3. Implement Global Memory Manager

  - [x] 3.1 Create GlobalMemory class with core data structures

    - Implement agentsFlow array management
    - Add clientesVisitantes Set for tracking active clients
    - Add clientData Map for storing patient information
    - _Requirements: 1.2, 6.1, 6.4_

  - [x] 3.2 Implement stage management system

    - Add clientStages Map for tracking current stages
    - Implement getCurrentStage() and setCurrentStage() methods
    - Add markStageAsVisited() and markStageAsError() methods
    - Add getStageErrorCount() for error tracking
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

  - [x] 3.3 Implement duplicate message prevention

    - Add lastMessageSent Map with timestamp tracking
    - Implement canSendMessage() with minimum interval check
    - Add markMessageSent() method for timestamp updates
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 3.4 Add flow management methods

    - Implement getNextAgent() with FIFO logic
    - Add resetAgentsFlow() for reinitializing flow
    - Implement clear() method for complete memory reset
    - _Requirements: 1.1, 6.1, 6.2, 6.3_

- [x] 4. Create Base Agent class

  - [x] 4.1 Implement BaseAgent abstract class

    - Define abstract methods: getAgentMessage(), validateInput(), processInput()
    - Add getDefaultValueForErrors() abstract method
    - Set up constructor with routing key and agent name
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1_

  - [x] 4.2 Implement core agent functionality

    - Add sendToWhatsApp() method with duplicate prevention
    - Implement subscribeToPhone() and unsubscribeFromPhone() methods
    - Add activateNextAgent() method with global memory integration
    - _Requirements: 2.2, 3.1, 4.4, 4.5, 5.5_

  - [x] 4.3 Implement message handling logic

    - Add onActivation() method with stage verification
    - Implement onWhatsAppMessage() with validation and error handling
    - Add stage verification before processing messages
    - _Requirements: 4.1, 4.2, 4.3, 8.2, 8.3, 8.4, 8.5_

- [x] 5. Implement specific agent classes

  - [x] 5.1 Create PatientNameAgent

    - Implement getAgentMessage() returning name request message
    - Add validateInput() for name validation (minimum 2 words)
    - Implement processInput() to store name in global memory
    - Add getDefaultValueForErrors() returning "Nome Não Informado"
    - _Requirements: 7.1, 8.1, 11.1_

  - [x] 5.2 Create PatientCPFAgent

    - Implement getAgentMessage() returning CPF request message
    - Add validateInput() for CPF format and checksum validation
    - Implement processInput() to store CPF in global memory
    - Add getDefaultValueForErrors() returning "00000000000"
    - _Requirements: 7.2, 8.2, 11.2_

  - [x] 5.3 Create PatientBirthDateAgent

    - Implement getAgentMessage() returning birth date request message
    - Add validateInput() for date format and age range validation
    - Implement processInput() to store birth date in global memory
    - Add getDefaultValueForErrors() returning "01/01/1970"
    - _Requirements: 7.4, 8.4, 11.3_

  - [x] 5.4 Create PatientEmailAgent

    - Implement getAgentMessage() returning email request message
    - Add validateInput() for email format validation using regex
    - Implement processInput() to store email in global memory
    - Add getDefaultValueForErrors() returning "nao-informado@sistema.com"
    - _Requirements: 7.3, 8.3, 11.4_

- [x] 6. Implement GreetingAgent

  - [x] 6.1 Create GreetingAgent class

    - Implement subscription to 'chatbot.messages' with 'phone.\*' routing key
    - Add logic to check if phone number exists in clientesVisitantes
    - Implement welcome message sending for new clients
    - _Requirements: 1.5, 2.1, 2.2, 2.3_

  - [x] 6.2 Implement existing client handling

    - Add logic to acknowledge messages from existing clients
    - Implement next agent activation for existing clients
    - Add 5-second wait and message forwarding logic
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7. Create ChatBot main class

  - [x] 7.1 Implement ChatBot initialization

    - Add system cleanup on startup (purge queues, clear memory, unbind queues)
    - Initialize SdkRabbitmq singleton instance
    - Set up agentsFlow in global memory
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 7.2 Initialize all agents

    - Create instances of all agent classes
    - Set up agent subscriptions to their respective queues
    - Initialize GreetingAgent with phone.\* subscription
    - _Requirements: 1.5, 1.6, 1.7_

  - [x] 7.3 Add system lifecycle management

    - Implement graceful shutdown with connection cleanup
    - Add error handling and logging throughout the system
    - _Requirements: 9.5, 10.1, 10.2, 10.3, 10.4, 10.5, 12.5_

- [x] 8. Implement session management and recovery

  - [x] 8.1 Add session persistence

    - Implement session state saving to file system or database
    - Add session restoration on system restart
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 8.2 Implement timeout handling

    - Add 30-second timeout for user responses
    - Implement reminder messages and extended timeout
    - Add graceful session ending after final timeout
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 8.3 Add concurrent session support

    - Ensure proper isolation between different phone number sessions
    - Implement thread-safe access to global memory
    - Add session cleanup for expired sessions
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 14.5_

- [x] 9. Add comprehensive logging system

  - Implement structured logging for all agent activations
  - Add sanitized logging for user input processing
  - Create error logging with stack traces
  - Add performance monitoring and metrics collection
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 10. Create configuration and environment setup






  - Add environment variables for RabbitMQ connection settings
  - Create configuration files for agent messages and validation rules
  - Add Docker configuration for easy deployment
  - Create startup scripts and process management
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 11. Implement scheduling flow system





  - [x] 11.1 Create ScheduleNewAgent class


    - Implement agent that sends message: "O que você deseja definir nesse momento? 1- data, 2- serviço ou 3- dentista"
    - Add validation for user choice (1, 2, or 3)
    - Implement dynamic flow selection based on user choice
    - _Requirements: 1.1, 2.1, 6.1, 6.2_

  - [x] 11.2 Create ScheduleDateAgent class


    - Implement date selection and validation
    - Add available dates checking logic
    - Store selected date in global memory
    - _Requirements: 7.4, 8.4, 11.3_

  - [x] 11.3 Create ScheduleDentistAgent class


    - Implement dentist selection interface
    - Add dentist availability validation
    - Store selected dentist in global memory
    - _Requirements: 7.1, 8.1, 11.1_



  - [ ] 11.4 Create ScheduleServiceAgent class
    - Implement service selection interface
    - Add service validation and pricing
    - Store selected service in global memory


    - _Requirements: 7.2, 8.2, 11.2_

  - [ ] 11.5 Create SchedulePaymentAgent class
    - Implement payment method selection


    - Add payment validation and confirmation
    - Generate final appointment summary
    - _Requirements: 7.3, 8.3, 11.4_



  - [ ] 11.6 Update GlobalMemory for scheduling flows
    - Add support for dynamic flow management based on user choice
    - Implement flow switching: date-first, dentist-first, service-first
    - Add scheduling data storage methods
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 11.7 Update ChatBot to initialize scheduling agents
    - Add scheduling agents to ChatBot initialization
    - Set up agent subscriptions for scheduling routing keys
    - Update agents flow configuration
    - _Requirements: 1.5, 1.6, 1.7_

<!-- - [ ] 11. Fix BaseAgent compilation errors


  - Fix getNextAgent() method call to not pass currentStage parameter
  - Fix setCurrentStageSafe() method to return void instead of boolean
  - Add missing unsubscribeFromPhone() method implementation
  - Add missing activateNextAgent() method implementation
  - _Requirements: 4.2, 4.3_ -->

- [ ] 12. System validation and testing

  - [ ] 12.1 Validate current patient data collection flow
    - Test complete flow from GreetingAgent through PatientEmailAgent
    - Verify data persistence and session management
    - Test error handling and timeout scenarios
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 12.2 Test concurrent session handling
    - Verify multiple users can interact simultaneously
    - Test session isolation and data integrity
    - Validate memory management under load
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ] 12.3 Validate RabbitMQ integration
    - Test connection recovery and reconnection
    - Verify message routing and delivery
    - Test queue management and cleanup
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 12.4 Write automated integration tests
    - Create tests for complete patient data collection flow
    - Add tests for concurrent user sessions
    - Implement error recovery and timeout scenario tests
    - Add RabbitMQ integration tests with mock WhatsApp service
    - _Requirements: All requirements validation_

- [ ] 13. Documentation and deployment verification

  - [ ] 13.1 Verify deployment configurations
    - Test Docker deployment with docker-compose
    - Validate PM2 configuration and process management
    - Test systemd service configuration (Linux)
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ] 13.2 Update system documentation
    - Document API endpoints and health checks
    - Create troubleshooting guide for common issues
    - Update configuration examples and environment variables
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 13.3 Performance optimization
    - Optimize memory usage and garbage collection
    - Implement connection pooling for RabbitMQ
    - Add performance monitoring and alerting
    - _Requirements: 9.5, 12.5, 13.1, 13.2, 13.3_