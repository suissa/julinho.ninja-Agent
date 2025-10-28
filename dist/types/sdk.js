"use strict";
/**
 * SdkRabbitmq interfaces for RabbitMQ operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemPortTcp = void 0;
function STAMP() {
    return {
        of: (v) => v,
        un: (v) => v,
    };
}
// Implementações dos tipos semânticos
const SystemPortTcpStamp = STAMP();
exports.SystemPortTcp = (() => ({
    of: (v) => {
        const n = Number(v);
        if (!Number.isInteger(n))
            throw new TypeError("porta deve ser um número inteiro");
        if (n < 1 || n > 65535)
            throw new TypeError("porta deve estar entre 1 e 65535");
        return SystemPortTcpStamp.of(n);
    },
    un: (v) => SystemPortTcpStamp.un(v),
    make: (value) => exports.SystemPortTcp.of(value),
}))();
//# sourceMappingURL=sdk.js.map