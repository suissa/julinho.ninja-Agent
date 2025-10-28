declare const __brand: unique symbol;
export type Brand<T, Name extends string> = T & {
    readonly [__brand]: Name;
};
export declare function STAMP<Name extends string>(): {
    of: <T>(v: T) => Brand<T, Name>;
    un: <T>(v: Brand<T, Name>) => T;
};
export {};
//# sourceMappingURL=shim.d.ts.map