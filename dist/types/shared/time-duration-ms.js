"use strict";
// src/types/shared/time-duration-ms.ts
// Tipo compartilhado TimeDurationMS - usado em config.ts, session.ts, constants.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeDurationMS = void 0;
function STAMP() {
    return {
        of: (v) => v,
        un: (v) => v,
    };
}
// Implementação do tipo semântico
const TimeDurationMSStamp = STAMP();
exports.TimeDurationMS = (() => ({
    of: (v) => {
        const n = Number(v);
        if (!Number.isInteger(n))
            throw new TypeError("duração deve ser um número inteiro");
        if (n < 0)
            throw new TypeError("duração deve ser >= 0");
        if (n > 86400000)
            throw new TypeError("duração máxima é 86400000ms (24 horas)");
        return TimeDurationMSStamp.of(n);
    },
    un: (v) => TimeDurationMSStamp.un(v),
    add: (a, b) => TimeDurationMSStamp.of(TimeDurationMSStamp.un(a) + TimeDurationMSStamp.un(b)),
    fromSeconds: (seconds) => TimeDurationMSStamp.of(seconds * 1000),
    fromMinutes: (minutes) => TimeDurationMSStamp.of(minutes * 60000),
    toSeconds: (duration) => TimeDurationMSStamp.un(duration) / 1000,
    toMinutes: (duration) => TimeDurationMSStamp.un(duration) / 60000,
    make: (value) => exports.TimeDurationMS.of(value),
}))();
//# sourceMappingURL=time-duration-ms.js.map