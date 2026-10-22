import { workbenchJsonOutput } from "../tool-output.js";
export const knowledgeOutput = {
    ...workbenchJsonOutput,
    render(_args, value) {
        const query = value;
        const knowledge = query.knowledge, freshness = query.freshness;
        const conflicts = knowledge?.conflicts.filter(item => item.resolution?.status !== "resolved") || [];
        const findings = knowledge?.findings.filter(item => item.judgment.status !== "refuted") || [];
        const priorities = [
            ...conflicts.map(item => ({ conflict_id: item.conflict_id, sample_id: item.sample_id,
                description: item.description, affected_check_count: item.check_ids.length })),
            ...findings.map(item => ({ finding_id: item.finding_id, sample_id: item.sample_id, description: item.judgment.description })),
        ].slice(0, 3);
        return [{ type: "text", text: JSON.stringify({
                    knowledge: knowledge ? { version_id: knowledge.version_id, dataset_id: knowledge.dataset_id, kind: knowledge.kind,
                        parent_version_id: knowledge.parent_version_id, normal_version_id: knowledge.normal_version_id,
                        model_name: knowledge.model_name, summary: knowledge.summary, limitations: knowledge.limitations,
                        source_count: knowledge.sources.length, observed_source_count: knowledge.observed_source_ids?.length ?? null,
                        check_count: knowledge.checks.length, supported_check_count: knowledge.checks.filter(item => item.status === "supported").length,
                        provisional_check_count: knowledge.checks.filter(item => item.status === "provisional").length,
                        conflicted_check_count: knowledge.checks.filter(item => item.status === "conflicted").length,
                        pending_recheck_source_count: new Set(knowledge.checks.flatMap(check => check.recheck_sample_ids)).size, pending_conflict_count: conflicts.length, pending_finding_count: findings.length,
                        priority_items: priorities, created_at: knowledge.created_at } : null,
                    eligible_source_count: query.eligible_source_count, unavailable_source_count: query.unavailable_source_count,
                    version_count: query.versions.length, versions: query.versions.slice(0, 5),
                    freshness: freshness ? { status: freshness.status, checked_at: freshness.checked_at,
                        current_version_id: freshness.current_version_id, current_normal_version_id: freshness.current_normal_version_id,
                        generation_changed: freshness.generation_changed, normal_version_changed: freshness.normal_version_changed,
                        normal_sources_changed: freshness.normal_sources_changed, changed_source_count: freshness.source_changes.length,
                        additional_source_count: freshness.additional_source_ids.length } : null,
                }) }];
    },
};
export const knowledgeScopeOutput = {
    ...workbenchJsonOutput,
    render(_args, value) {
        const { run_ids, version_ids, ...scope } = value;
        return [{ type: "text", text: JSON.stringify({ ...scope, run_count: run_ids.length,
                    version_count: version_ids.length, recent_run_ids: run_ids.slice(-3), recent_version_ids: version_ids.slice(-3) }) }];
    },
};
export const knowledgeJobOutput = {
    ...workbenchJsonOutput,
    render(_args, value) {
        const job = value;
        return [{ type: "text", text: JSON.stringify({ run_id: job.run_id, root_run_id: job.root_run_id,
                    parent_run_id: job.parent_run_id, scope_run_id: job.scope_run_id, dataset_id: job.dataset_id,
                    kind: job.kind, job_type: job.job_type, model_name: job.model_name, origin_session_id: job.origin_session_id,
                    status: job.status, cancel_requested: job.cancel_requested, phase: job.phase,
                    requires_user_decision: ["FAILED", "PARTIAL", "INTERRUPTED"].includes(job.status),
                    completed: job.completed, failed: job.failed, unprocessed: job.unprocessed, total_samples: job.total_samples,
                    observation_progress: job.observation_progress, knowledge_version_id: job.knowledge_version_id,
                    normal_version_id: job.normal_version_id, started_at: job.started_at, finished_at: job.finished_at,
                    error_count: job.errors.length, priority_errors: job.errors.slice(0, 3),
                }) }];
    },
};
