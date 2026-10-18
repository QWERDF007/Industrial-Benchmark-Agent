/**
 * Industrial Benchmark Agent - DeepSeek Harness Server Plugin
 * Implements Cordis plugin lifecycle, policy injection via systemPrompt.section(),
 * and tool restriction via tools.restrict().
 */

export interface IADHarnessConfig {
  domainServerUrl?: string;
}

export const name = "iad-harness";
export const inject = ["tools", "systemPrompt"];

export const SYSTEM_POLICIES = [
  "INDUSTRIAL BENCHMARK SYSTEM POLICY RULES (MANDATORY):",
  "1. Annotation != Quality: Bounding box or polygon annotations are geometric regions of interest, NEVER quality truth.",
  "2. Visual Difference != Defect: Samples with high appearance difference or novel domain shift are candidates, NOT defects.",
  "3. Never Write Review: Human Review is strictly human-only. Agent tools cannot author or overwrite review decisions.",
  "4. Never Overwrite Raw Quality: samples.quality_status must remain unaltered.",
  "5. Never Bypass Leakage Gate: Any leakage violation strictly halts benchmark build.",
  "6. Val/Test Isolation: Validation split selects/fits decision threshold; Test split only evaluates metrics.",
  "7. PARTIAL and NOT_READY are valid engineering outcomes: Never force false READY when data is insufficient."
].join("\n");

export const ALLOWED_TOOL_SURFACE = [
  "mcp__iad__task_inspect",
  "mcp__iad__dataset_audit",
  "mcp__iad__feature_prepare",
  "mcp__iad__visual_search",
  "mcp__iad__duplicate_audit",
  "mcp__iad__candidate_mine",
  "mcp__iad__evidence_get",
  "mcp__iad__review_status",
  "mcp__iad__benchmark_preview",
  "mcp__iad__benchmark_build",
  "mcp__iad__benchmark_status",
  "mcp__iad__leakage_check",
  "mcp__iad__evaluation_plan",
  "mcp__iad__baseline_run",
  "mcp__iad__evaluation_compare"
];

let policyInjected = false;

export function apply(ctx: any, config: IADHarnessConfig = {}) {
  // Invariant Policy Injection via official systemPrompt.section (Ticket B003, NV-03)
  if (!policyInjected && ctx.systemPrompt && typeof ctx.systemPrompt.section === "function") {
    ctx.systemPrompt.section({
      name: "industrial_benchmark_policies",
      order: 500,
      text: SYSTEM_POLICIES,
    });
    policyInjected = true;
  }

  // Tool Surface Restriction via official tools.restrict (Ticket B004, NV-03)
  // Must fail-fast on restriction errors rather than swallowing them
  const applyRestriction = (toolsCtx: any) => {
    if (toolsCtx && typeof toolsCtx.restrict === "function") {
      toolsCtx.restrict({ allow: ALLOWED_TOOL_SURFACE });
    }
  };

  applyRestriction(ctx.tools);

  if (typeof ctx.on === "function") {
    ctx.on("agent/created", ({ agent }: any) => {
      applyRestriction(agent?.ctx?.tools);
    });
  }

  ctx.logger?.info("Industrial Benchmark Harness Plugin initialized.");
}
