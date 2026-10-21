/**
 * Industrial Benchmark Agent - Root Harness Extension Bundle (DS-S00, DS-S01, DS-S03, DS-S04).
 * Single Web Entrypoint: Assembles Native Cordis plugins for PythonBridge, IAD Remote RPC,
 * native HTTP workbench routes, invariant policies, and domain tools.
 */
import { PythonBridge } from "./python-bridge/index.js";
import { IadRemoteService } from "./remote/index.js";
import { createIadHttpHandler } from "./routes/index.js";
import * as coreClient from "./core-client/index.js";
import * as policy from "./policy/index.js";
import * as audit from "./audit/index.js";
import * as vision from "./vision/index.js";
import * as benchmark from "./benchmark/index.js";
import * as evaluation from "./evaluation/index.js";
import { DATASET_ANALYSIS_SKILL } from "./workbench-tools/skill.js";
import { createKnowledgeTools } from "./knowledge/index.js";
import { createWorkbenchTools } from "./workbench-tools/index.js";
export { SYSTEM_POLICIES, ALLOWED_TOOL_SURFACE } from "./policy/index.js";
export { CoreClient } from "./core-client/index.js";
export { PythonBridge } from "./python-bridge/index.js";
export { IadRemoteService } from "./remote/index.js";
export { createIadHttpHandler } from "./routes/index.js";
export { createAuditTools } from "./audit/index.js";
export { createVisionTools } from "./vision/index.js";
export { createBenchmarkTools } from "./benchmark/index.js";
export { createEvaluationTools } from "./evaluation/index.js";
export { createKnowledgeTools } from "./knowledge/index.js";
export { createWorkbenchTools } from "./workbench-tools/index.js";
export const name = "iad-harness";
export const inject = ["tools", "systemPrompt", "skills", "attachments"];
export function apply(ctx, config = {}) {
    // 1. Initialize PythonBridge singleton
    const bridge = new PythonBridge(config);
    ctx.effect(() => () => bridge.destroy());
    ctx.provide?.("iadPythonBridge", bridge);
    ctx.iadPythonBridge = bridge;
    // 2. Initialize shared CoreClient backed by PythonBridge
    coreClient.apply(ctx, { ...config, bridge });
    // 3. Register Typert Remote service for `ctx.remote.iad`
    try {
        const remoteService = new IadRemoteService(ctx, bridge);
        ctx.provide?.("iadRemoteService", remoteService);
        ctx.iadRemoteService = remoteService;
    }
    catch (err) {
        ctx.logger?.warn?.(`IadRemoteService registration skipped: ${err.message}`);
    }
    // 4. Hook DSH WebServer if present: mount /api/iad routes
    if (typeof ctx.inject === "function") {
        ctx.inject(["webServer"], (serverCtx) => {
            try {
                const handler = createIadHttpHandler(bridge);
                serverCtx.webServer.register({
                    kind: "prefix",
                    path: "/api/iad",
                    handler,
                });
                ctx.logger?.info?.("IAD HTTP routes mounted on DSH WebServer (/api/iad/*)");
            }
            catch (err) {
                ctx.logger?.warn?.(`Failed to register IAD web routes: ${err.message}`);
            }
        });
    }
    // 5. Invariant policies and tool restriction with MCP authorization
    policy.apply(ctx, config);
    // 6. Register native domain tools and bundled skills.
    audit.apply(ctx);
    vision.apply(ctx);
    benchmark.apply(ctx);
    evaluation.apply(ctx);
    for (const tool of createKnowledgeTools(bridge, ctx))
        ctx.tools.register(tool);
    for (const tool of createWorkbenchTools(bridge, ctx))
        ctx.tools.register(tool);
    ctx.skills.register(DATASET_ANALYSIS_SKILL);
    ctx.logger?.info?.("Industrial Benchmark Agent Root Harness Bundle initialized successfully.");
}
