"use strict";
/**
 * Client data structures for patient information and session management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceDurationMinutes = exports.ServicePriceBRL = exports.PatientBirthDate = exports.PatientPhone = void 0;
function STAMP() {
    return {
        of: (v) => v,
        un: (v) => v,
    };
}
// Implementações dos tipos únicos
const PatientPhoneStamp = STAMP();
const PatientBirthDateStamp = STAMP();
const ServicePriceBRLStamp = STAMP();
const ServiceDurationMinutesStamp = STAMP();
exports.PatientPhone = (() => ({
    of: (v) => {
        const s = String(v).trim().replace(/[^\d+]/g, '');
        if (s.length < 10 || s.length > 13)
            throw new TypeError("telefone deve ter entre 10 e 13 dígitos");
        const phoneRx = /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/;
        if (!phoneRx.test(String(v).trim()))
            throw new TypeError("formato de telefone brasileiro inválido");
        return PatientPhoneStamp.of(s);
    },
    un: (v) => PatientPhoneStamp.un(v),
    make: (value) => exports.PatientPhone.of(value),
}))();
exports.PatientBirthDate = (() => ({
    of: (v) => {
        const trimmed = String(v).trim();
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = trimmed.match(dateRegex);
        if (!match)
            throw new TypeError("formato de data deve ser DD/MM/YYYY");
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        if (month < 1 || month > 12)
            throw new TypeError("mês deve estar entre 1 e 12");
        if (day < 1 || day > 31)
            throw new TypeError("dia deve estar entre 1 e 31");
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
            throw new TypeError("data inválida");
        }
        const today = new Date();
        const age = today.getFullYear() - year;
        if (age < 0 || age > 120)
            throw new TypeError("idade deve estar entre 0 e 120 anos");
        if (date > today)
            throw new TypeError("data de nascimento não pode ser no futuro");
        return PatientBirthDateStamp.of(date);
    },
    un: (v) => PatientBirthDateStamp.un(v),
    make: (value) => exports.PatientBirthDate.of(value),
}))();
exports.ServicePriceBRL = (() => ({
    of: (v) => {
        const n = Number(v);
        if (!Number.isFinite(n))
            throw new TypeError("preço deve ser um número finito");
        if (n < 0)
            throw new TypeError("preço deve ser >= 0");
        const rounded = Math.round(n * 100) / 100;
        return ServicePriceBRLStamp.of(rounded);
    },
    un: (v) => ServicePriceBRLStamp.un(v),
    add: (a, b) => ServicePriceBRLStamp.of(ServicePriceBRLStamp.un(a) + ServicePriceBRLStamp.un(b)),
    multiply: (price, quantity) => ServicePriceBRLStamp.of(ServicePriceBRLStamp.un(price) * quantity),
    make: (value) => exports.ServicePriceBRL.of(value),
}))();
exports.ServiceDurationMinutes = (() => ({
    of: (v) => {
        const n = Number(v);
        if (!Number.isInteger(n))
            throw new TypeError("duração deve ser um número inteiro");
        if (n <= 0)
            throw new TypeError("duração deve ser > 0");
        if (n > 1440)
            throw new TypeError("duração máxima é 1440 minutos (24 horas)");
        return ServiceDurationMinutesStamp.of(n);
    },
    un: (v) => ServiceDurationMinutesStamp.un(v),
    add: (a, b) => ServiceDurationMinutesStamp.of(ServiceDurationMinutesStamp.un(a) + ServiceDurationMinutesStamp.un(b)),
    make: (value) => exports.ServiceDurationMinutes.of(value),
}))();
//# sourceMappingURL=client.js.map