/**
 * Industrial Benchmark Agent - Root Harness Extension Bundle (S02, RP-02)
 * Assembles Native Cordis plugins for core client, invariant policy, audit, vision, benchmark, and evaluation.
 */

import * as coreClient from "./core-client/index.js";
import * as policy from "./policy/index.js";
import * as audit from "./audit/index.js";
import * as vision from "./vision/index.js";
import * as benchmark from "./benchmark/index.js";
import * as evaluation from "./evaluation/index.js";

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

export const name = "iad-harness";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx: any, config: IADHarnessConfig = {}) {
  // 1. Initialize shared core HTTP client
  coreClient.apply(ctx, config);

  // 2. Invariant policies and tool restriction with MCP authorization (NXM-10, NXM-11)
  policy.apply(ctx, config);


  // 3. Register native domain tools
  audit.apply(ctx);
  vision.apply(ctx);
  benchmark.apply(ctx);
  evaluation.apply(ctx);

  ctx.logger?.info?.("Industrial Benchmark Agent Root Harness Bundle initialized.");
}
