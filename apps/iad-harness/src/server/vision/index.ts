/**
 * Industrial Benchmark Agent - Vision & Mining Tools Plugin (S02, S09, RP-05, RP-17, V2-S01).
 */

import { defineTool, type ToolDefinition } from "@deepseek-ai/dsh-tools";
import type { ContentBlock } from "@deepseek-ai/dsh-llm";
import { CoreClient } from "../core-client/index.js";

function getClient(ctx: any): CoreClient {
  if (!ctx.iadCoreClient) {
    throw new Error(
      "iadCoreClient is not initialized in Cordis context. Plugin initialization failed."
    );
  }
  return ctx.iadCoreClient;
}

function formatToolResultText(val: any): string {
  const parts: string[] = [];
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

export function createVisionTools(ctx: any): ToolDefinition[] {
  const client = getClient(ctx);

  const taskInspectTool = defineTool({
    name: "task_inspect",
    description:
      "Inspect target inspection task configuration, station settings, and sample counts (S02, RP-05, V2-S01).",
    parameters: {
      task_id: { type: "string", required: true, description: "Inspection task identifier" },
    },
    output: {
      schema: { type: "json" },
      render(args, val: any): ContentBlock[] {
        return [{ type: "text", text: formatToolResultText(val) }];
      },
    },
    async execute(args, exec) {
      return await client.call("task_inspect", args, exec.signal);
    },
  });

  const featurePrepareTool = defineTool({
    name: "feature_prepare",
    description:
      "Extract and cache visual foundation model embeddings (e.g. DINOv2) for inspection samples (S02, RP-05, V2-S01).",
    parameters: {
      task_id: { type: "string", required: true, description: "Inspection task identifier" },
      model_id: { type: "string", description: "Vision backbone model identifier (default dinov2_vits14)" },
      preprocess_key: { type: "string", description: "Preprocessing recipe key (default standard_224)" },
      batch_size: { type: "integer", description: "Inference batch size (default 32)" },
      device: { type: "string", description: "Target compute device: 'cuda', 'cpu', or 'auto'" },
    },
    output: {
      schema: { type: "json" },
      render(args, val: any): ContentBlock[] {
        return [{ type: "text", text: formatToolResultText(val) }];
      },
    },
    async execute(args, exec) {
      return await client.call("feature_prepare", args, exec.signal);
    },
  });

  const visualSearchTool = defineTool({
    name: "visual_search",
    description:
      "Perform visual similarity search using FAISS index across sample feature embeddings (S02, RP-05, V2-S01).",
    parameters: {
      task_id: { type: "string", required: true, description: "Inspection task identifier" },
      sample_id: { type: "string", required: true, description: "Query sample identifier" },
      top_k: { type: "integer", description: "Number of nearest neighbors to retrieve (default 10)" },
      exclude_self: { type: "boolean", description: "Whether to exclude query sample itself from results" },
      filter_data_origin: { type: "string", description: "Filter results by data origin (e.g. REAL, SYNTHETIC)" },
      filter_quality_status: { type: "string", description: "Filter results by quality status (e.g. PASS, FAIL, UNCERTAIN)" },
    },
    output: {
      schema: { type: "json" },
      render(args, val: any): ContentBlock[] {
        return [{ type: "text", text: formatToolResultText(val) }];
      },
    },
    async execute(args, exec) {
      return await client.call("visual_search", args, exec.signal);
    },
  });

  const duplicateAuditTool = defineTool({
    name: "duplicate_audit",
    description:
      "Audit pairwise visual duplicates and connected components to prevent leakage (S02, RP-05, V2-S01).",
    parameters: {
      task_id: { type: "string", required: true, description: "Inspection task identifier" },
      similarity_threshold: {
        type: "number",
        description: "Cosine similarity threshold for near-duplicate detection (default 0.98)",
      },
      verify_duplicates: {
        type: "boolean",
        description: "Whether to run multi-metric deterministic geometric verification (default true)",
      },
    },
    output: {
      schema: { type: "json" },
      render(args, val: any): ContentBlock[] {
        return [{ type: "text", text: formatToolResultText(val) }];
      },
    },
    async execute(args, exec) {
      return await client.call("duplicate_audit", args, exec.signal);
    },
  });

  const candidateMineTool = defineTool({
    name: "candidate_mine",
    description:
      "Mine high-uncertainty review candidates using 4 signals: density, boundary distance, domain shift, and annotation complexity (S02, RP-05, V2-S01).",
    parameters: {
      task_id: { type: "string", required: true, description: "Inspection task identifier" },
      top_k: { type: "integer", description: "Number of candidates to mine (default 50)" },
      config_path: { type: "string", description: "Optional configuration file path for custom weights" },
      output_dir: { type: "string", description: "Optional output directory" },
    },
    output: {
      schema: { type: "json" },
      render(args, val: any): ContentBlock[] {
        return [{ type: "text", text: formatToolResultText(val) }];
      },
    },
    async execute(args, exec) {
      return await client.call("candidate_mine", args, exec.signal);
    },
  });

  const candidateMergeTool = defineTool({
    name: "candidate_merge",
    description:
      "Merge multiple candidate pools (DINO, LLM Direct, Audit) with deduplication and source attribution (S09, RP-17, V2-S01, V2-S07).",
    parameters: {
      task_id: { type: "string", required: true, description: "Inspection task identifier" },
      include_dino: { type: "boolean", description: "Whether to include existing DINO mined candidates (default true)" },
      include_llm: { type: "boolean", description: "Whether to include multimodal LLM audit suggestions (default true)" },
      include_audit: { type: "boolean", description: "Whether to include deterministic dataset audit issues (default true)" },
      output_dir: { type: "string", description: "Optional output directory for merged_candidates.json" },
    },
    output: {
      schema: { type: "json" },
      render(args, val: any): ContentBlock[] {
        return [{ type: "text", text: formatToolResultText(val) }];
      },
    },
    async execute(args, exec) {
      return await client.call("candidate_merge", args, exec.signal);
    },
  });

  const evidenceGetTool = defineTool({
    name: "evidence_get",
    description:
      "Retrieve comprehensive evidence package for a specific review candidate (S02, RP-05, V2-S01).",
    parameters: {
      task_id: { type: "string", required: true, description: "Inspection task identifier" },
      sample_id: { type: "string", required: true, description: "Target sample identifier (sample_id)" },
    },
    output: {
      schema: { type: "json" },
      render(args, val: any): ContentBlock[] {
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

export function apply(ctx: any) {
  const tools = createVisionTools(ctx);
  if (ctx.tools && typeof ctx.tools.register === "function") {
    for (const tool of tools) {
      ctx.tools.register(tool);
    }
  }
}
