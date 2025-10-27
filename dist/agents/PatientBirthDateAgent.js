"use strict";
/**
 * PatientBirthDateAgent - Collects patient birth date information
 * Implementation will be added in task 5.3
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientBirthDateAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const constants_1 = require("../types/constants");
const validation_1 = require("../utils/validation");
class PatientBirthDateAgent extends BaseAgent_1.BaseAgent {
    constructor(sdkRabbitmq, globalMemory) {
        super('patient.birthDate', 'PatientBirthDateAgent', sdkRabbitmq, globalMemory);
    }
    getAgentMessage() {
        return constants_1.AGENT_MESSAGES.PATIENT_BIRTH_DATE;
    }
    validateInput(input) {
        if (!input || input.trim() === '') {
            return false;
        }
        // Use the validation utility to validate birth date
        return (0, validation_1.validateBirthDate)(input.trim());
    }
    processInput(number, input) {
        const trimmedInput = input.trim();
        // Store the birth date in global memory
        this.globalMemory.setClientData(number, 'birthDate', trimmedInput);
        console.log(`PatientBirthDateAgent: Stored birth date for ${number}: ${trimmedInput}`);
    }
    getDefaultValueForErrors() {
        return constants_1.DEFAULT_VALUES.BIRTH_DATE;
    }
}
exports.PatientBirthDateAgent = PatientBirthDateAgent;
//# sourceMappingURL=PatientBirthDateAgent.js.map