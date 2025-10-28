/**
 * SchedulePaymentAgent - Handles payment method selection and generates final appointment summary
 * Validates payment method and creates complete appointment confirmation
 */

import { BaseAgent } from './BaseAgent';
import { SdkRabbitmq } from '../sdk/SdkRabbitmq';
import { IGlobalMemory } from '../memory/interfaces';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  available: boolean;
  hasDiscount?: boolean;
  discountPercentage?: number;
}

export class SchedulePaymentAgent extends BaseAgent {
  // Available payment methods (in a real system, this would come from a database)
  private readonly paymentMethods: PaymentMethod[] = [
    { 
      id: '1', 
      name: 'Dinheiro', 
      description: 'Pagamento em dinheiro na consulta', 
      available: true,
      hasDiscount: true,
      discountPercentage: 10
    },
    { 
      id: '2', 
      name: 'PIX', 
      description: 'Pagamento via PIX', 
      available: true,
      hasDiscount: true,
      discountPercentage: 5
    },
    { 
      id: '3', 
      name: 'Cartão de Débito', 
      description: 'Pagamento com cartão de débito', 
      available: true,
      hasDiscount: false
    },
    { 
      id: '4', 
      name: 'Cartão de Crédito', 
      description: 'Pagamento com cartão de crédito (à vista)', 
      available: true,
      hasDiscount: false
    },
    { 
      id: '5', 
      name: 'Cartão Parcelado', 
      description: 'Pagamento com cartão de crédito parcelado', 
      available: true,
      hasDiscount: false
    },
    { 
      id: '6', 
      name: 'Convênio', 
      description: 'Pagamento via convênio médico', 
      available: false
    }
  ];

  constructor(sdkRabbitmq: SdkRabbitmq, globalMemory: IGlobalMemory) {
    super('schedule.payment', 'SchedulePaymentAgent', sdkRabbitmq, globalMemory);
  }

  /**
   * Get the message this agent should send to the user
   * @returns The message string asking user to select a payment method
   */
  getAgentMessage(): string {
    const availablePaymentsList = this.getAvailablePaymentMethods()
      .map(payment => {
        let methodText = `${payment.id} - ${payment.name}`;
        if (payment.hasDiscount && payment.discountPercentage) {
          methodText += ` (${payment.discountPercentage}% de desconto)`;
        }
        methodText += `\n   ${payment.description}`;
        return methodText;
      })
      .join('\n\n');

    return `Selecione a forma de pagamento:\n\n${availablePaymentsList}\n\nDigite o número da forma de pagamento desejada:`;
  }

  /**
   * Validate user input for payment method selection
   * @param input - User input to validate (should be a valid payment method ID)
   * @returns true if input is valid and available payment method, false otherwise
   */
  validateInput(input: string): boolean {
    if (!input || input.trim() === '') {
      return false;
    }

    const trimmedInput = input.trim();
    
    // Check if input is a valid payment method ID
    const paymentId = trimmedInput;
    const paymentMethod = this.paymentMethods.find(p => p.id === paymentId);
    
    if (!paymentMethod) {
      return false;
    }

    // Check if payment method is available
    return paymentMethod.available;
  }

  /**
   * Get available payment methods (only those that are available)
   * @returns Array of available payment methods
   */
  public getAvailablePaymentMethods(): PaymentMethod[] {
    return this.paymentMethods.filter(method => method.available);
  }

  /**
   * Get payment method by ID
   * @param id - Payment method ID
   * @returns Payment method object or null if not found
   */
  public getPaymentMethodById(id: string): PaymentMethod | null {
    return this.paymentMethods.find(method => method.id === id) || null;
  }

  /**
   * Calculate final price with discount if applicable
   * @param originalPrice - Original service price
   * @param paymentMethod - Selected payment method
   * @returns Final price after discount
   */
  private calculateFinalPrice(originalPrice: number, paymentMethod: PaymentMethod): number {
    if (paymentMethod.hasDiscount && paymentMethod.discountPercentage) {
      const discount = originalPrice * (paymentMethod.discountPercentage / 100);
      return originalPrice - discount;
    }
    return originalPrice;
  }

  /**
   * Format price for display
   * @param price - Price value
   * @returns Formatted price string
   */
  private formatPrice(price: number): string {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  }

  /**
   * Generate appointment summary
   * @param number - User's phone number
   * @returns Formatted appointment summary string
   */
  private generateAppointmentSummary(number: string): string {
    try {
      const clientData = this.globalMemory.getClientData(number);
      
      const summary = `
🦷 RESUMO DO AGENDAMENTO 🦷

👤 Paciente: ${clientData.name || 'Nome não informado'}
📱 Telefone: ${number}
📧 Email: ${clientData.email || 'Email não informado'}
🎂 Data de Nascimento: ${clientData.birthDate || 'Data não informada'}

📅 Data: ${clientData.selectedDateFormatted || clientData.selectedDate || 'Data não selecionada'}
👨‍⚕️ Dentista: ${clientData.selectedDentistName || 'Dentista não selecionado'}
🏥 Especialidade: ${clientData.selectedDentistSpecialty || 'N/A'}

🔧 Serviço: ${clientData.selectedServiceName || 'Serviço não selecionado'}
📝 Descrição: ${clientData.selectedServiceDescription || 'N/A'}
⏱️ Duração: ${clientData.selectedServiceDuration || 'N/A'} minutos

💰 Valor Original: ${clientData.selectedServicePriceFormatted || 'N/A'}
💳 Forma de Pagamento: ${clientData.selectedPaymentName || 'N/A'}
${clientData.discountApplied ? `🎉 Desconto: ${clientData.discountPercentage}%` : ''}
💵 Valor Final: ${clientData.finalPriceFormatted || 'N/A'}

✅ Agendamento confirmado!
Em breve entraremos em contato para confirmar os detalhes.

Obrigado por escolher nossa clínica! 😊
      `.trim();

      return summary;
    } catch (error) {
      console.error(`[${this.agentName}] Error generating summary for ${number}:`, error);
      return 'Erro ao gerar resumo do agendamento. Por favor, entre em contato conosco.';
    }
  }

  /**
   * Process and store valid payment method selection
   * @param number - User's phone number
   * @param input - Validated payment method ID input
   */
  processInput(number: string, input: string): void {
    const selectedPaymentId = input.trim();
    const selectedPayment = this.getPaymentMethodById(selectedPaymentId);
    
    if (!selectedPayment) {
      console.error(`[${this.agentName}] Payment method not found for ID: ${selectedPaymentId}`);
      return;
    }

    try {
      const clientData = this.globalMemory.getClientData(number);
      const originalPrice = clientData.selectedServicePrice as number || 0;
      
      // Calculate final price with discount
      const finalPrice = this.calculateFinalPrice(originalPrice, selectedPayment);
      const discountApplied = selectedPayment.hasDiscount && selectedPayment.discountPercentage;
      
      // Store payment information
      this.globalMemory.setClientData(number, 'selectedPaymentId', selectedPaymentId);
      this.globalMemory.setClientData(number, 'selectedPaymentName', selectedPayment.name);
      this.globalMemory.setClientData(number, 'selectedPaymentDescription', selectedPayment.description);
      this.globalMemory.setClientData(number, 'finalPrice', finalPrice);
      this.globalMemory.setClientData(number, 'finalPriceFormatted', this.formatPrice(finalPrice));
      this.globalMemory.setClientData(number, 'discountApplied', discountApplied);
      
      if (discountApplied) {
        this.globalMemory.setClientData(number, 'discountPercentage', selectedPayment.discountPercentage);
        this.globalMemory.setClientData(number, 'discountAmount', originalPrice - finalPrice);
      }

      console.log(`[${this.agentName}] User ${number} selected payment: ${selectedPayment.name} - Final price: ${this.formatPrice(finalPrice)}`);
      
    } catch (error) {
      console.error(`[${this.agentName}] Error processing payment for ${number}:`, error);
    }
  }

  /**
   * Get default value to use when user fails validation 3 times
   * @returns Default payment method ID (PIX - good discount and convenience)
   */
  getDefaultValueForErrors(): string {
    // Default to PIX (ID 2) as it has discount and is convenient
    const pixMethod = this.getPaymentMethodById('2');
    if (pixMethod && pixMethod.available) {
      return '2';
    }
    
    // Fallback to first available method
    const availableMethods = this.getAvailablePaymentMethods();
    return availableMethods.length > 0 ? (availableMethods[0]?.id || '1') : '1';
  }

  /**
   * Override moveToNextAgent to send final summary instead of moving to next agent
   * @param number - User's phone number
   */
  public async moveToNextAgent(number: string): Promise<void> {
    console.log(`🏁 [${this.agentName}] Payment completed for ${number} - generating final summary`);

    try {
      // Generate and send appointment summary
      const appointmentSummary = this.generateAppointmentSummary(number);
      await this.sendToWhatsApp(number, appointmentSummary);

      // Log final appointment data
      const clientData = this.globalMemory.getClientData(number);
      console.log(`🎉 [${this.agentName}] Appointment completed for ${number}:`, {
        patient: clientData.name,
        date: clientData.selectedDate,
        dentist: clientData.selectedDentistName,
        service: clientData.selectedServiceName,
        payment: clientData.selectedPaymentName,
        finalPrice: clientData.finalPriceFormatted
      });

      // Mark appointment as completed
      this.globalMemory.setClientData(number, 'appointmentStatus', 'completed');
      this.globalMemory.setClientData(number, 'completedAt', new Date().toISOString());

      console.log(`✅ [${this.agentName}] Scheduling flow completed successfully for ${number}`);

    } catch (error) {
      console.error(`❌ [${this.agentName}] Error completing appointment for ${number}:`, error);
      
      // Send error message to user
      try {
        await this.sendToWhatsApp(number, 'Ocorreu um erro ao finalizar seu agendamento. Por favor, entre em contato conosco para confirmar os detalhes.');
      } catch (sendError) {
        console.error(`❌ [${this.agentName}] Failed to send error message to ${number}:`, sendError);
      }
    }
  }

  /**
   * Get next agent - always returns null as this is the final agent
   * @returns null (no next agent)
   */
  public getNextAgent(): string | null {
    return null; // This is the final agent in the scheduling flow
  }

  /**
   * Get next agent for specific user - always returns null as this is the final agent
   * @param number - User's phone number
   * @returns null (no next agent)
   */
  public getNextAgentForUser(number: string): string | null {
    return null; // This is the final agent in the scheduling flow
  }
}