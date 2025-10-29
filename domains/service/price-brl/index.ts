// domains/service/price-brl/index.ts
import { Brand, STAMP } from "../../../src/semantic/shim";

export type ServicePriceBRL = Brand<number, "service.price.brl">;

export const ServicePriceBRL = (() => {
  const f = STAMP<"service.price.brl">();
  return {
    of: (v: unknown): ServicePriceBRL => {
      const n = Number(v);
      if (!Number.isFinite(n)) throw new TypeError("preço deve ser um número finito");
      if (n < 0) throw new TypeError("preço deve ser >= 0");
      // Máximo de 6 casas decimais para centavos
      const rounded = Math.round(n * 100) / 100;
      return f.of(rounded);
    },
    un: (v: ServicePriceBRL): number => f.un(v),
    add: (a: ServicePriceBRL, b: ServicePriceBRL): ServicePriceBRL =>
      f.of(f.un(a) + f.un(b)),
    multiply: (price: ServicePriceBRL, quantity: number): ServicePriceBRL =>
      f.of(f.un(price) * quantity),
    make: (value: number): ServicePriceBRL => ServicePriceBRL.of(value),
  };
})();
