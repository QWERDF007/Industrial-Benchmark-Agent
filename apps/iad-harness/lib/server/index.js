/**
 * Industrial Benchmark Agent - DeepSeek Harness Server Plugin
 * Implements Cordis plugin lifecycle, policy injection via systemPrompt.section(),
 * and tool restriction via tools.restrict().
 */
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
export function apply(ctx, config = {}) {
    // Invariant Policy Injection via official systemPrompt.section (Ticket B003)
    if (ctx.systemPrompt && typeof ctx.systemPrompt.section === "function") {
        ctx.systemPrompt.section({
            name: "industrial_benchmark_policies",
            order: 500,
            text: SYSTEM_POLICIES,
        });
    }
    // Tool Surface Restriction via official tools.restrict (Ticket B004)
    const applyRestriction = (toolsCtx) => {
        if (toolsCtx && typeof toolsCtx.restrict === "function") {
            try {
                toolsCtx.restrict({ allow: ALLOWED_TOOL_SURFACE });
            }
            catch (err) {
                // If toolsCtx is not a scoped context, restrict must be applied on agent.ctx instead
            }
        }
    };
    applyRestriction(ctx.tools);
    if (typeof ctx.on === "function") {
        ctx.on("agent/created", ({ agent }) => {
            applyRestriction(agent?.ctx?.tools);
        });
    }
    ctx.logger?.info("Industrial Benchmark Harness Plugin initialized.");
}
