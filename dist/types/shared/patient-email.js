"use strict";
// src/types/shared/patient-email.ts
// Tipo compartilhado PatientEmail - usado em client.ts, constants.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientEmail = void 0;
function STAMP() {
    return {
        of: (v) => v,
        un: (v) => v,
    };
}
// Implementação do tipo semântico
const PatientEmailStamp = STAMP();
exports.PatientEmail = (() => {
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
        of: (v) => {
            const s = String(v).trim();
            if (!emailRx.test(s))
                throw new TypeError("email inválido");
            if (s.length > 254)
                throw new TypeError("email muito longo");
            return PatientEmailStamp.of(s);
        },
        un: (v) => PatientEmailStamp.un(v),
        make: (value) => exports.PatientEmail.of(value),
    };
})();
//# sourceMappingURL=patient-email.js.map