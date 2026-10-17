/**
 * Industrial Benchmark Agent - DeepSeek Harness Server Plugin
 * Implements Cordis plugin lifecycle, MCP connection, system policy injection,
 * and REVIEW_REQUIRED session gating.
 */

export interface IADHarnessConfig {
  domainServerUrl?: string;
  enforceReviewGate?: boolean;
  enforceValTestIsolation?: boolean;
}

export const name = "iad-harness";

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
  "task_inspect",
  "dataset_audit",
  "feature_prepare",
  "visual_search",
  "duplicate_audit",
  "candidate_mine",
  "evidence_get",
  "review_status",
  "benchmark_preview",
  "benchmark_build",
  "benchmark_status",
  "leakage_check",
  "evaluation_plan",
  "baseline_run",
  "evaluation_compare"
];

export function apply(ctx: any, config: IADHarnessConfig = {}) {
  const domainUrl = config.domainServerUrl || "http://127.0.0.1:8000";

  // Invariant Policy Injection (R404)
  if (ctx.systemPrompt) {
    ctx.systemPrompt.addHook((prompt: string) => {
      return `${prompt}\n\n${SYSTEM_POLICIES}`;
    });
  }

  // Tool Surface Restriction (R409)
  if (ctx.tools) {
    ctx.tools.filter((tool: any) => {
      return ALLOWED_TOOL_SURFACE.includes(tool.name);
    });
  }

  // REVIEW_REQUIRED Gate Listener (R407, R408)
  if (ctx.on) {
    ctx.on("tool-call-finish", (event: any) => {
      const result = event.result?.structuredContent;
      if (result && result.status === "REVIEW_REQUIRED") {
        ctx.logger?.warn("REVIEW_REQUIRED encountered. Halting autonomous agent execution for human review.");
        event.session?.pause({
          reason: "REVIEW_REQUIRED",
          sessionId: event.session?.id,
          summary: result.summary,
        });
      }
    });
  }

  ctx.logger?.info(`Industrial Benchmark Harness Plugin initialized. Domain Server at ${domainUrl}`);
}
