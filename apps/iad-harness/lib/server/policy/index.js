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
    "direction_exploration_start", "direction_exploration_status", "direction_exploration_get",
    "direction_exploration_cancel", "direction_exploration_retry", "direction_exploration_evidence", "knowledge_directions_adopt",
    "skill",
    "dataset_list",
    "dataset_directory_inspect",
    "dataset_preview",
    "dataset_import",
    "dataset_rescan",
    "dataset_archive_inspect",
    "dataset_report",
    "model_audit_start",
    "model_audit_status",
    "model_audit_cancel",
    "model_audit_retry",
    "model_audit_sample",
    "model_audit_context",
    "model_audit_evidence",
    "knowledge_mine_normal",
    "knowledge_mine_defect",
    "knowledge_job_status",
    "knowledge_job_observations",
    "knowledge_job_cancel",
    "knowledge_job_retry",
    "knowledge_get",
    "knowledge_details",
    "knowledge_prompt_get",
    "knowledge_conflict_context",
    "knowledge_sources",
    "knowledge_scope_open",
    "knowledge_scope_get",
    "knowledge_scope_stop",
    "knowledge_scope_resume",
    "knowledge_evidence",
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
export function apply(ctx, config = {}) {
    // Invariant Policy Injection via official systemPrompt.section
    if (ctx.systemPrompt && typeof ctx.systemPrompt.section === "function") {
        ctx.systemPrompt.section({
            name: "industrial_benchmark_policies",
            order: 500,
            text: SYSTEM_POLICIES,
        });
    }
    const authorizedMcp = Array.isArray(config.authorizedMcpTools) ? config.authorizedMcpTools : [];
    const effectiveAllowed = [...ALLOWED_TOOL_SURFACE, ...authorizedMcp];
    // Tool Surface Restriction via official tools.restrict (Fail-fast)
    const applyRestriction = (toolsCtx) => {
        if (toolsCtx && typeof toolsCtx.restrict === "function") {
            try {
                toolsCtx.restrict({ allow: effectiveAllowed });
            }
            catch (err) {
                // Root context does not support tools.restrict() in dsh-tools (requires agent.ctx)
            }
        }
    };
    applyRestriction(ctx.tools);
    // Execution Guard (NXM-11): Prevent unauthorized tool execution and authority writes
    const policyGuard = (exec) => {
        const toolName = exec?.name || "";
        // 1. Strict invariant: Deny any tool attempting to author review decisions or mutate Gold/Quality
        if (toolName.includes("review_write") ||
            toolName.includes("gold_edit") ||
            toolName.includes("gold_write") ||
            toolName.includes("sample_quality_write") ||
            toolName.includes("decision_write") ||
            (toolName.startsWith("mcp__") && (toolName.endsWith("__delete") || toolName.includes("mutate_gold")))) {
            return `Execution denied by Industrial Benchmark Policy: Tool '${toolName}' attempts unauthorized mutation of authoritative domain quality, review decisions, or Gold records.`;
        }
        // 2. Deny any MCP tool not explicitly in authorized list
        if (toolName.startsWith("mcp__")) {
            if (!authorizedMcp.includes(toolName)) {
                return `Execution denied by Industrial Benchmark Policy: MCP tool '${toolName}' is not in the authorized tool surface for this deployment.`;
            }
        }
        return undefined; // Allowed
    };
    if (ctx.tools && typeof ctx.tools.guard === "function") {
        ctx.tools.guard(policyGuard);
    }
    if (typeof ctx.on === "function") {
        ctx.on("agent/created", ({ agent }) => {
            applyRestriction(agent?.ctx?.tools);
            if (agent?.ctx?.tools && typeof agent.ctx.tools.guard === "function") {
                agent.ctx.tools.guard(policyGuard);
            }
        });
    }
    ctx.logger?.info?.("Industrial Benchmark Policy Plugin initialized with guard.");
}
