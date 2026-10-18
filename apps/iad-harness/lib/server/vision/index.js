/**
 * Industrial Benchmark Agent - Vision & Mining Tools Plugin (S02, S09, RP-05, RP-17)
 */
import { defineTool } from "@deepseek-ai/dsh-tools";
import { CoreClient } from "../core-client/index.js";
function getClient(ctx) {
    return ctx.iadCoreClient || new CoreClient();
}
function formatToolResultText(val) {
    const parts = [];
    if (val.status && val.status !== "OK") {
        parts.push(`[Status: ${val.status}]`);
    }
    parts.push(val.summary || "Tool execution completed.");
    if (val.metrics && Object.keys(val.metrics).length > 0) {
        parts.push("\nMetrics:\n" + JSON.stringify(val.metrics, null, 2));
    }
    if (Array.isArray(val.warnings) && val.warnings.length > 0) {
        parts.push("\nWarnings: " + val.warnings.join("; "));
    }
    if (Array.isArray(val.next_actions) && val.next_actions.length > 0) {
        parts.push("\nNext Actions: " + val.next_actions.join(", "));
    }
    return parts.join("\n");
}
export function createVisionTools(ctx) {
    const client = getClient(ctx);
    const taskInspectTool = defineTool({
        name: "task_inspect",
        description: "Inspect target inspection task configuration, station settings, and sample counts (S02, RP-05).",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                return [{ type: "text", text: formatToolResultText(val) }];
            },
        },
        async execute(args, exec) {
            return await client.call("task_inspect", args, exec.signal);
        },
    });
    const featurePrepareTool = defineTool({
        name: "feature_prepare",
        description: "Extract and cache visual foundation model embeddings (e.g. DINOv2) for inspection samples (S02, RP-05).",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            force_recompute: { type: "boolean", description: "Whether to invalidate existing cache and recompute" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                return [{ type: "text", text: formatToolResultText(val) }];
            },
        },
        async execute(args, exec) {
            return await client.call("feature_prepare", args, exec.signal);
        },
    });
    const visualSearchTool = defineTool({
        name: "visual_search",
        description: "Perform visual similarity search using FAISS index across sample feature embeddings (S02, RP-05).",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            sample_id: { type: "string", required: true, description: "Query sample identifier" },
            top_k: { type: "integer", description: "Number of nearest neighbors to retrieve (default 10)" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                return [{ type: "text", text: formatToolResultText(val) }];
            },
        },
        async execute(args, exec) {
            return await client.call("visual_search", args, exec.signal);
        },
    });
    const duplicateAuditTool = defineTool({
        name: "duplicate_audit",
        description: "Audit pairwise visual duplicates and connected components to prevent leakage (S02, RP-05).",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            threshold: { type: "number", description: "Cosine similarity threshold for near-duplicate detection" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                return [{ type: "text", text: formatToolResultText(val) }];
            },
        },
        async execute(args, exec) {
            return await client.call("duplicate_audit", args, exec.signal);
        },
    });
    const candidateMineTool = defineTool({
        name: "candidate_mine",
        description: "Mine high-uncertainty review candidates using 4 signals: density, boundary distance, domain shift, and annotation complexity (S02, RP-05).",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            top_k: { type: "integer", description: "Number of candidates to mine (default 50)" },
            policy: { type: "string", description: "Mining policy name" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                return [{ type: "text", text: formatToolResultText(val) }];
            },
        },
        async execute(args, exec) {
            return await client.call("candidate_mine", args, exec.signal);
        },
    });
    const candidateMergeTool = defineTool({
        name: "candidate_merge",
        description: "Merge multiple candidate pools (DINO, LLM Direct, Audit, Stratified) with deduplication and source attribution (S09, RP-17).",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            source_sets: { type: "json", description: "Optional explicit candidate lists by source" },
            policy: { type: "json", description: "Merging and deduplication policy" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                return [{ type: "text", text: formatToolResultText(val) }];
            },
        },
        async execute(args, exec) {
            return await client.call("candidate_merge", args, exec.signal);
        },
    });
    const evidenceGetTool = defineTool({
        name: "evidence_get",
        description: "Retrieve comprehensive evidence package for a specific review candidate (S02, RP-05).",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            candidate_id: { type: "string", required: true, description: "Sample ID of candidate" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                return [{ type: "text", text: formatToolResultText(val) }];
            },
        },
        async execute(args, exec) {
            return await client.call("evidence_get", args, exec.signal);
        },
    });
    return [
        taskInspectTool,
        featurePrepareTool,
        visualSearchTool,
        duplicateAuditTool,
        candidateMineTool,
        candidateMergeTool,
        evidenceGetTool,
    ];
}
export const name = "iad-vision";
export const inject = ["tools"];
export function apply(ctx) {
    const tools = createVisionTools(ctx);
    if (ctx.tools && typeof ctx.tools.register === "function") {
        for (const tool of tools) {
            ctx.tools.register(tool);
        }
    }
}
