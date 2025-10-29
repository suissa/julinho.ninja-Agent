"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientCpf = void 0;
// domains/patient/cpf/index.ts
const shim_1 = require("../../../src/semantic/shim");
/**
 * Valida CPF usando algoritmo de checksum brasileiro
 */
function validateCpfChecksum(cpf) {
    // Remove non-numeric characters
    const cleanCPF = cpf.replace(/\D/g, '');
    // Check length
    if (cleanCPF.length !== 11) {
        return false;
    }
    // Check for known invalid patterns
    const invalidPatterns = [
        '00000000000', '11111111111', '22222222222', '33333333333',
        '44444444444', '55555555555', '66666666666', '77777777777',
        '88888888888', '99999999999'
    ];
    if (invalidPatterns.includes(cleanCPF)) {
        return false;
    }
    // First digit verification
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCPF[i], 10) * (10 - i);
    }
    let remainder = sum % 11;
    const firstDigit = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(cleanCPF[9], 10) !== firstDigit) {
        return false;
    }
    // Second digit verification
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCPF[i], 10) * (11 - i);
    }
    remainder = sum % 11;
    const secondDigit = remainder < 2 ? 0 : 11 - remainder;
    return parseInt(cleanCPF[10], 10) === secondDigit;
}
exports.PatientCpf = (() => {
    const f = (0, shim_1.STAMP)();
    return {
        of: (v) => {
            const s = String(v).replace(/\D/g, '');
            if (s.length !== 11)
                throw new TypeError("CPF deve ter 11 dígitos");
            if (!validateCpfChecksum(s))
                throw new TypeError("CPF inválido");
            return f.of(s);
        },
        un: (v) => f.un(v),
        make: (value) => exports.PatientCpf.of(value),
    };
})();
//# sourceMappingURL=index.js.map