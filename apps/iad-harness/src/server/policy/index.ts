/**
 * Industrial Benchmark Agent - Policy Plugin (S00, S02, RP-07)
 * Enforces mandatory system policies and restricts model-visible tool surface.
 */

export const SYSTEM_POLICIES = [
  "INDUSTRIAL BENCHMARK SYSTEM POLICY RULES (MANDATORY):",
  "1. Annotation != Quality: Bounding box or polygon annotations are geometric regions of interest, NEVER quality truth.",
  "2. Visual Difference != Defect: Samples with high appearance difference or novel domain shift are candidates, NOT defects.",
  "3. Never Write Review: Human Review is strictly human-only. Agent tools cannot author or overwrite review decisions.",
  "4. Never Overwrite Raw Quality: samples.quality_status must remain unaltered.",
  "5. Never Bypass Leakage Gate: Any leakage violation strictly halts benchmark build.",
  "6. Val/Test Isolation: Validation split selects/fits decision threshold; Test split only evaluates metrics.",
  "7. PARTIAL and NOT_READY are valid engineering outcomes: Never force false READY when data is insufficient.",
  "8. Suggestions Are Non-Authoritative: Audit suggestions record observations and hypotheses only; they never alter ground truth or review decisions."
].join("\n");

export const ALLOWED_TOOL_SURFACE = [
  // Audit & Images (7 tools)
  "dataset_audit",
  "audit_issue_query",
  "audit_recheck",
  "audit_suggestion_save",
  "sample_view",
  "region_view",
  "samples_compare",
  // Vision & Mining (7 tools)
  "task_inspect",
  "feature_prepare",
  "visual_search",
  "duplicate_audit",
  "candidate_mine",
  "candidate_merge",
  "evidence_get",
  // Benchmark (5 tools)
  "review_status",
  "benchmark_preview",
  "benchmark_build",
  "benchmark_status",
  "leakage_check",
  // Evaluation (3 tools)
  "evaluation_plan",
  "baseline_run",
  "evaluation_compare"
];

export const name = "iad-policy";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx: any) {
  // Invariant Policy Injection via official systemPrompt.section
  if (ctx.systemPrompt && typeof ctx.systemPrompt.section === "function") {
    ctx.systemPrompt.section({
      name: "industrial_benchmark_policies",
      order: 500,
      text: SYSTEM_POLICIES,
    });
  }

  // Tool Surface Restriction via official tools.restrict (Fail-fast)
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

  ctx.logger?.info?.("Industrial Benchmark Policy Plugin initialized.");
}
