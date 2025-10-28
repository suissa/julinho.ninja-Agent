"use strict";
// src/types/shared/metrics-retry-count.ts
// Tipo compartilhado MetricsRetryCount - usado em config.ts, constants.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsRetryCount = void 0;
function STAMP() {
    return {
        of: (v) => v,
        un: (v) => v,
    };
}
// Implementação do tipo semântico
const MetricsRetryCountStamp = STAMP();
exports.MetricsRetryCount = (() => ({
    of: (v) => {
        const n = Number(v);
        if (!Number.isInteger(n))
            throw new TypeError("contagem deve ser um número inteiro");
        if (n < 0)
            throw new TypeError("contagem deve ser >= 0");
        if (n > 100)
            throw new TypeError("contagem máxima de tentativas é 100");
        return MetricsRetryCountStamp.of(n);
    },
    un: (v) => MetricsRetryCountStamp.un(v),
    increment: (count) => MetricsRetryCountStamp.of(MetricsRetryCountStamp.un(count) + 1),
    make: (value) => exports.MetricsRetryCount.of(value),
}))();
//# sourceMappingURL=metrics-retry-count.js.map