/**
 * Industrial Benchmark Agent - Benchmark & Split Tools Plugin (S02, S10, S11, RP-05, RP-20, RP-21, RP-22, V2-S01).
 */
import { defineTool } from "@deepseek-ai/dsh-tools";
function getClient(ctx) {
    if (!ctx.iadCoreClient) {
        throw new Error("iadCoreClient is not initialized in Cordis context. Plugin initialization failed.");
    }
    return ctx.iadCoreClient;
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
export function createBenchmarkTools(ctx) {
    const client = getClient(ctx);
    const reviewStatusTool = defineTool({
        name: "review_status",
        description: "Read-only inspection of human review queue progress, required decisions, and pending review counts (S10, RP-05, V2-S01).",
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
            return await client.call("review_status", args, exec.signal);
        },
    });
    const benchmarkPreviewTool = defineTool({
        name: "benchmark_preview",
        description: "Dry-run preview of dataset splits (Train/Val/Test), class balances, and atomic group assignments without database side-effects (S11, RP-21, V2-S01).",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            config_path: { type: "string", description: "Optional configuration file path" },
            seed: { type: "integer", description: "Random seed for reproducible split (default 42)" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                return [{ type: "text", text: formatToolResultText(val) }];
            },
        },
        async execute(args, exec) {
            return await client.call("benchmark_preview", args, exec.signal);
        },
    });
    const benchmarkBuildTool = defineTool({
        name: "benchmark_build",
        description: "Execute authoritative benchmark build pipeline: resolves Gold, enforces review completion, group splits, and leakage checks (S11, RP-21, V2-S01).",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            build_id: { type: "string", description: "Explicit build identifier (defaults to deterministic auto-generated ID)" },
            config_path: { type: "string", description: "Optional configuration file path" },
            seed: { type: "integer", description: "Random seed for split reproducibility" },
            output_dir: { type: "string", description: "Optional custom output directory" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                return [{ type: "text", text: formatToolResultText(val) }];
            },
        },
        async execute(args, exec) {
            return await client.call("benchmark_build", args, exec.signal);
        },
    });
    const benchmarkStatusTool = defineTool({
        name: "benchmark_status",
        description: "Inspect active benchmark build status, readiness flags, split distributions, and build artifact paths (S11, RP-05, V2-S01).",
        parameters: {
            build_id: { type: "string", required: true, description: "Target benchmark build identifier (build_id)" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                return [{ type: "text", text: formatToolResultText(val) }];
            },
        },
        async execute(args, exec) {
            return await client.call("benchmark_status", args, exec.signal);
        },
    });
    const leakageCheckTool = defineTool({
        name: "leakage_check",
        description: "Validate strict isolation between Train, Val, and Test splits. Verifies no duplicate or part-overlap leakage (S11, RP-22, V2-S01).",
        parameters: {
            build_id: { type: "string", required: true, description: "Target benchmark build identifier (build_id)" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                return [{ type: "text", text: formatToolResultText(val) }];
            },
        },
        async execute(args, exec) {
            return await client.call("leakage_check", args, exec.signal);
        },
    });
    return [
        reviewStatusTool,
        benchmarkPreviewTool,
        benchmarkBuildTool,
        benchmarkStatusTool,
        leakageCheckTool,
    ];
}
export const name = "iad-benchmark";
export const inject = ["tools"];
export function apply(ctx) {
    const tools = createBenchmarkTools(ctx);
    if (ctx.tools && typeof ctx.tools.register === "function") {
        for (const tool of tools) {
            ctx.tools.register(tool);
        }
    }
}
