"use strict";
// src/types/shared/time-timestamp-unix.ts
// Tipo compartilhado TimeTimestampUnix - usado em messages.ts, session.ts, specifications.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeTimestampUnix = void 0;
function STAMP() {
    return {
        of: (v) => v,
        un: (v) => v,
    };
}
// Implementação do tipo semântico
const TimeTimestampUnixStamp = STAMP();
exports.TimeTimestampUnix = (() => ({
    of: (v) => {
        const n = Number(v);
        if (!Number.isInteger(n))
            throw new TypeError("timestamp deve ser um número inteiro");
        if (n < 0)
            throw new TypeError("timestamp deve ser >= 0");
        if (n > 4102444800)
            throw new TypeError("timestamp muito no futuro");
        return TimeTimestampUnixStamp.of(n);
    },
    un: (v) => TimeTimestampUnixStamp.un(v),
    now: () => TimeTimestampUnixStamp.of(Math.floor(Date.now() / 1000)),
    fromDate: (date) => TimeTimestampUnixStamp.of(Math.floor(date.getTime() / 1000)),
    toDate: (timestamp) => new Date(TimeTimestampUnixStamp.un(timestamp) * 1000),
    make: (value) => exports.TimeTimestampUnix.of(value),
}))();
// Export adicional para garantir que seja reconhecido como módulo
exports.default = exports.TimeTimestampUnix;
//# sourceMappingURL=time-timestamp-unix.js.map