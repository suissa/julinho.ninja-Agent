// domains/system/port-tcp/index.ts
import { Brand, STAMP } from "../../../src/semantic/shim";

export type SystemPortTcp = Brand<number, "system.port.tcp">;

export const SystemPortTcp = (() => {
  const f = STAMP<"system.port.tcp">();
  return {
    of: (v: unknown): SystemPortTcp => {
      const n = Number(v);
      if (!Number.isInteger(n)) throw new TypeError("porta deve ser um número inteiro");
      if (n < 1 || n > 65535) throw new TypeError("porta deve estar entre 1 e 65535");
      return f.of(n);
    },
    un: (v: SystemPortTcp): number => f.un(v),
    make: (value: number): SystemPortTcp => SystemPortTcp.of(value),
  };
})();
