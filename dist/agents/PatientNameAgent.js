"use strict";
/**
 * PatientNameAgent - Collects patient name information
 * Implementation will be added in task 5.1
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientNameAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const constants_1 = require("../types/constants");
class PatientNameAgent extends BaseAgent_1.BaseAgent {
    constructor(sdkRabbitmq, globalMemory) {
        super('patient.name', 'PatientNameAgent', sdkRabbitmq, globalMemory);
    }
    getAgentMessage() {
        return constants_1.AGENT_MESSAGES.PATIENT_NAME;
    }
    validateInput(input) {
        if (!input || input.trim() === '') {
            return false;
        }
        const trimmedInput = input.trim();
        // Check minimum length
        if (trimmedInput.length < 2) {
            return false;
        }
        // Check for at least 2 words (first name and last name)
        const words = trimmedInput.split(/\s+/).filter(word => word.length > 0);
        if (words.length < 2) {
            return false;
        }
        // Check for valid name characters (letters, spaces, hyphens, apostrophes)
        const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
        if (!nameRegex.test(trimmedInput)) {
            return false;
        }
        return true;
    }
    processInput(number, input) {
        const trimmedInput = input.trim();
        // Store the name in global memory
        this.globalMemory.setClientData(number, 'name', trimmedInput);
        console.log(`PatientNameAgent: Stored name for ${number}: ${trimmedInput}`);
    }
    getDefaultValueForErrors() {
        return constants_1.DEFAULT_VALUES.NAME;
    }
}
exports.PatientNameAgent = PatientNameAgent;
//# sourceMappingURL=PatientNameAgent.js.map