"use strict";
/**
 * PatientCPFAgent - Collects patient CPF information
 * Implementation will be added in task 5.2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientCPFAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const constants_1 = require("@types/constants");
const validation_1 = require("@src/utils/validation");
class PatientCPFAgent extends BaseAgent_1.BaseAgent {
    constructor(sdkRabbitmq, globalMemory) {
        super('patient.cpf', 'PatientCPFAgent', sdkRabbitmq, globalMemory);
    }
    getAgentMessage() {
        return constants_1.AGENT_MESSAGES.PATIENT_CPF;
    }
    validateInput(input) {
        if (!input || input.trim() === '') {
            return false;
        }
        // Use the validation utility to validate CPF
        return (0, validation_1.validateCPF)(input.trim());
    }
    processInput(number, input) {
        // Clean CPF (remove any non-numeric characters)
        const cleanedCPF = input.replace(/\D/g, '');
        // Store the CPF in global memory
        this.globalMemory.setClientData(number, 'cpf', cleanedCPF);
        console.log(`PatientCPFAgent: Stored CPF for ${number}: ${cleanedCPF}`);
    }
    getDefaultValueForErrors() {
        return constants_1.DEFAULT_VALUES.CPF;
    }
}
exports.PatientCPFAgent = PatientCPFAgent;
//# sourceMappingURL=PatientCPFAgent.js.map