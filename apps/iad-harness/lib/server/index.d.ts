/**
 * Industrial Benchmark Agent - Root Harness Extension Bundle (DS-S00, DS-S01, DS-S03, DS-S04).
 * Single Web Entrypoint: Assembles Native Cordis plugins for PythonBridge, IAD Remote RPC,
 * native HTTP media & upload routes on port 5173, invariant policies, and the 22 domain tools.
 */
export { SYSTEM_POLICIES, ALLOWED_TOOL_SURFACE } from "./policy/index.js";
export { CoreClient } from "./core-client/index.js";
export { PythonBridge } from "./python-bridge/index.js";
export { IadRemoteService } from "./remote/index.js";
export { createIadHttpHandler } from "./routes/index.js";
export { createAuditTools } from "./audit/index.js";
export { createVisionTools } from "./vision/index.js";
export { createBenchmarkTools } from "./benchmark/index.js";
export { createEvaluationTools } from "./evaluation/index.js";
export interface IADHarnessConfig {
    domainServerUrl?: string;
    pythonPath?: string;
    cwd?: string;
    timeoutMs?: number;
    authorizedMcpTools?: string[];
}
export declare const name = "iad-harness";
export declare const inject: string[];
export declare function apply(ctx: any, config?: IADHarnessConfig): void;
//# sourceMappingURL=index.d.ts.map