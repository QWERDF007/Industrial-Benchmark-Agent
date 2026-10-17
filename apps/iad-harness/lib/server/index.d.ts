/**
 * Industrial Benchmark Agent - DeepSeek Harness Server Plugin
 * Implements Cordis plugin lifecycle, policy injection via systemPrompt.section(),
 * and tool restriction via tools.restrict().
 */
export interface IADHarnessConfig {
    domainServerUrl?: string;
}
export declare const name = "iad-harness";
export declare const inject: string[];
export declare const SYSTEM_POLICIES: string;
export declare const ALLOWED_TOOL_SURFACE: string[];
export declare function apply(ctx: any, config?: IADHarnessConfig): void;
//# sourceMappingURL=index.d.ts.map