/**
 * Industrial Benchmark Agent - Evaluation & Baseline Tools Plugin (S02, S12, RP-05, RP-23)
 */

import { defineTool, type ToolDefinition } from "@deepseek-ai/dsh-tools";
import type { ContentBlock } from "@deepseek-ai/dsh-llm";
import { CoreClient } from "../core-client/index.js";

function getClient(ctx: any): CoreClient {
  return ctx.iadCoreClient || new CoreClient();
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

export function createEvaluationTools(ctx: any): ToolDefinition[] {
  const client = getClient(ctx);

  const evaluationPlanTool = defineTool({
    name: "evaluation_plan",
    description: "Generate evaluation matrix and execution plan across baseline models and training protocols (S12, RP-23).",
    parameters: {
      task_id: { type: "string", required: true, description: "Inspection task identifier" },
      protocol: { type: "string", description: "Protocol name (e.g. UNSUPERVISED_NORMAL, FEW_SHOT)" },
      model_ids: {
        type: "array",
        items: { type: "string" },
        description: "List of model IDs to include in evaluation plan",
      },
    },
    output: {
      schema: { type: "json" },
      render(args, val: any): ContentBlock[] {
        return [{ type: "text", text: formatToolResultText(val) }];
      },
    },
    async execute(args, exec) {
      return await client.call("evaluation_plan", args, exec.signal);
    },
  });

  const baselineRunTool = defineTool({
    name: "baseline_run",
    description: "Train and evaluate an anomaly detection baseline model under strict validation threshold calibration (S12, RP-23).",
    parameters: {
      task_id: { type: "string", required: true, description: "Inspection task identifier" },
      model_id: { type: "string", required: true, description: "Baseline model ID (e.g. patchcore, padim)" },
      protocol: { type: "string", description: "Protocol name (default UNSUPERVISED_NORMAL)" },
    },
    output: {
      schema: { type: "json" },
      render(args, val: any): ContentBlock[] {
        return [{ type: "text", text: formatToolResultText(val) }];
      },
    },
    async execute(args, exec) {
      return await client.call("baseline_run", args, exec.signal);
    },
  });

  const evaluationCompareTool = defineTool({
    name: "evaluation_compare",
    description: "Compare benchmark evaluation results across executed baseline runs, metrics, and protocols (S12, RP-23).",
    parameters: {
      task_id: { type: "string", required: true, description: "Inspection task identifier" },
      protocol: { type: "string", description: "Optional filter by protocol" },
    },
    output: {
      schema: { type: "json" },
      render(args, val: any): ContentBlock[] {
        return [{ type: "text", text: formatToolResultText(val) }];
      },
    },
    async execute(args, exec) {
      return await client.call("evaluation_compare", args, exec.signal);
    },
  });

  return [
    evaluationPlanTool,
    baselineRunTool,
    evaluationCompareTool,
  ];
}

export const name = "iad-evaluation";
export const inject = ["tools"];

export function apply(ctx: any) {
  const tools = createEvaluationTools(ctx);
  if (ctx.tools && typeof ctx.tools.register === "function") {
    for (const tool of tools) {
      ctx.tools.register(tool);
    }
  }
}
