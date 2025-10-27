"use strict";
/**
 * PatientEmailAgent - Collects patient email information
 * Implementation will be added in task 5.4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientEmailAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const constants_1 = require("../types/constants");
const validation_1 = require("../utils/validation");
class PatientEmailAgent extends BaseAgent_1.BaseAgent {
    constructor(sdkRabbitmq, globalMemory) {
        super('patient.email', 'PatientEmailAgent', sdkRabbitmq, globalMemory);
    }
    getAgentMessage() {
        return constants_1.AGENT_MESSAGES.PATIENT_EMAIL;
    }
    validateInput(input) {
        if (!input || input.trim() === '') {
            return false;
        }
        // Use the validation utility to validate email
        return (0, validation_1.validateEmail)(input.trim());
    }
    processInput(number, input) {
        const trimmedInput = input.trim().toLowerCase(); // Store email in lowercase
        // Store the email in global memory
        this.globalMemory.setClientData(number, 'email', trimmedInput);
        console.log(`PatientEmailAgent: Stored email for ${number}: ${trimmedInput}`);
    }
    getDefaultValueForErrors() {
        return constants_1.DEFAULT_VALUES.EMAIL;
    }
}
exports.PatientEmailAgent = PatientEmailAgent;
//# sourceMappingURL=PatientEmailAgent.js.map