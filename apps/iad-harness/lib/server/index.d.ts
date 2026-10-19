/**
 * Industrial Benchmark Agent - Root Harness Extension Bundle (S02, RP-02)
 * Assembles Native Cordis plugins for core client, invariant policy, audit, vision, benchmark, and evaluation.
 */
export { SYSTEM_POLICIES, ALLOWED_TOOL_SURFACE } from "./policy/index.js";
export { CoreClient } from "./core-client/index.js";
export { createAuditTools } from "./audit/index.js";
export { createVisionTools } from "./vision/index.js";
export { createBenchmarkTools } from "./benchmark/index.js";
export { createEvaluationTools } from "./evaluation/index.js";
export interface IADHarnessConfig {
    domainServerUrl?: string;
    timeoutMs?: number;
    authorizedMcpTools?: string[];
}
export declare const name = "iad-harness";
export declare const inject: string[];
export declare function apply(ctx: any, config?: IADHarnessConfig): void;
//# sourceMappingURL=index.d.ts.map