/**
 * Industrial Benchmark Agent - Policy Plugin (S00, S02, RP-07)
 * Enforces mandatory system policies and restricts model-visible tool surface.
 */
export declare const SYSTEM_POLICIES: string;
export declare const ALLOWED_TOOL_SURFACE: string[];
export interface PolicyConfig {
    authorizedMcpTools?: string[];
}
export declare const name = "iad-policy";
export declare const inject: string[];
export declare function apply(ctx: any, config?: PolicyConfig): void;
//# sourceMappingURL=index.d.ts.map