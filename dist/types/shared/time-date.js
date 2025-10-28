"use strict";
// src/types/shared/time-date.ts
// Tipo compartilhado TimeDate - com funcionalidades avançadas de data
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeDate = void 0;
function STAMP() {
    return {
        of: (v) => v,
        un: (v) => v,
    };
}
// Implementação do tipo semântico
const TimeDateStamp = STAMP();
exports.TimeDate = (() => ({
    of: (v) => {
        if (v instanceof Date) {
            if (Number.isNaN(v.getTime()))
                throw new TypeError("data inválida");
            return TimeDateStamp.of(new Date(v));
        }
        const date = new Date(String(v));
        if (Number.isNaN(date.getTime()))
            throw new TypeError("data inválida");
        return TimeDateStamp.of(date);
    },
    un: (v) => TimeDateStamp.un(v),
    // Conversões para diferentes formatos
    toISOString: (date) => TimeDateStamp.un(date).toISOString(),
    toLocaleString: (date, locale = 'pt-BR') => TimeDateStamp.un(date).toLocaleString(locale),
    toDDMMYYYY: (date) => {
        const d = TimeDateStamp.un(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    },
    toYYYYMMDD: (date) => {
        const d = TimeDateStamp.un(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${year}-${month}-${day}`;
    },
    // Cálculos de diferença entre datas
    diffInDays: (date1, date2) => {
        const d1 = TimeDateStamp.un(date1);
        const d2 = TimeDateStamp.un(date2);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    diffInHours: (date1, date2) => {
        const d1 = TimeDateStamp.un(date1);
        const d2 = TimeDateStamp.un(date2);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60));
    },
    diffInMinutes: (date1, date2) => {
        const d1 = TimeDateStamp.un(date1);
        const d2 = TimeDateStamp.un(date2);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        return Math.ceil(diffTime / (1000 * 60));
    },
    diffInSeconds: (date1, date2) => {
        const d1 = TimeDateStamp.un(date1);
        const d2 = TimeDateStamp.un(date2);
        return Math.abs(Math.floor((d2.getTime() - d1.getTime()) / 1000));
    },
    diffInMilliseconds: (date1, date2) => {
        const d1 = TimeDateStamp.un(date1);
        const d2 = TimeDateStamp.un(date2);
        return Math.abs(d2.getTime() - d1.getTime());
    },
    // Cálculos de idade
    getAge: (birthDate) => {
        const today = new Date();
        const birth = TimeDateStamp.un(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    },
    // Verificações
    isBefore: (date1, date2) => TimeDateStamp.un(date1) < TimeDateStamp.un(date2),
    isAfter: (date1, date2) => TimeDateStamp.un(date1) > TimeDateStamp.un(date2),
    isEqual: (date1, date2) => TimeDateStamp.un(date1).getTime() === TimeDateStamp.un(date2).getTime(),
    // Operações de data
    addDays: (date, days) => {
        const result = new Date(TimeDateStamp.un(date));
        result.setDate(result.getDate() + days);
        return TimeDateStamp.of(result);
    },
    addMonths: (date, months) => {
        const result = new Date(TimeDateStamp.un(date));
        result.setMonth(result.getMonth() + months);
        return TimeDateStamp.of(result);
    },
    addYears: (date, years) => {
        const result = new Date(TimeDateStamp.un(date));
        result.setFullYear(result.getFullYear() + years);
        return TimeDateStamp.of(result);
    },
    // Utilitários
    now: () => TimeDateStamp.of(new Date()),
    today: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return TimeDateStamp.of(today);
    },
    make: (value) => exports.TimeDate.of(value),
}))();
//# sourceMappingURL=time-date.js.map