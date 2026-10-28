import type { ContentBlock } from "@deepseek-ai/dsh-llm";
import type { InferValue } from "@deepseek-ai/dsh-tools";
import type { KnowledgeScopeSnapshot } from "../../shared/domain.generated.js";
import type { MiningPrompt } from "../../shared/domain.generated.js";
import type { JobSnapshot, KnowledgeQuery } from "../../shared/contracts.js";
import { workbenchJsonOutput } from "../tool-output.js";

export const knowledgePromptOutput = {
  ...workbenchJsonOutput,
  render(_args: unknown, value: InferValue<{ type: "json" }>): ContentBlock[] {
    const prompt = value as unknown as MiningPrompt;
    return [{ type: "text", text: JSON.stringify({ dataset_id: prompt.dataset_id, kind: prompt.kind,
      revision: prompt.revision, customized: prompt.customized, instruction: prompt.instruction,
      selected_directions: prompt.configuration.directions.filter(item => item.enabled).map(({ direction_id, title, origin }) => ({ direction_id, title, origin })),
      disabled_direction_count: prompt.configuration.directions.filter(item => !item.enabled).length }) }];
  },
};

export const knowledgeOutput = {
  ...workbenchJsonOutput,
  render(_args: unknown, value: InferValue<{ type: "json" }>): ContentBlock[] {
    const query = value as unknown as KnowledgeQuery;
    const knowledge = query.knowledge, freshness = query.freshness;
    const discovery = knowledge?.mining_steps.at(-1)?.result.discovery;
    const coveredDirections = new Set(discovery?.areas.map(item => item.direction_id).filter(Boolean));
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
        discovery: { recorded: !!discovery, area_count: discovery?.areas.length ?? 0,
          unrecorded_selected_count: knowledge.mining_prompt?.configuration.directions.filter(item => item.enabled && !coveredDirections.has(item.direction_id)).length ?? null,
          prompt_signature: knowledge.mining_prompt?.signature ?? null },
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
  render(_args: unknown, value: InferValue<{ type: "json" }>): ContentBlock[] {
    const { run_ids, version_ids, ...scope } = value as unknown as KnowledgeScopeSnapshot;
    return [{ type: "text", text: JSON.stringify({ ...scope, run_count: run_ids.length,
      version_count: version_ids.length, recent_run_ids: run_ids.slice(-3), recent_version_ids: version_ids.slice(-3) }) }];
  },
};

export const knowledgeJobOutput = {
  ...workbenchJsonOutput,
  render(_args: unknown, value: InferValue<{ type: "json" }>): ContentBlock[] {
    const job = value as unknown as JobSnapshot & { scope_run_id?: string };
    return [{ type: "text", text: JSON.stringify({ run_id: job.run_id, root_run_id: job.root_run_id,
      parent_run_id: job.parent_run_id, scope_run_id: job.scope_run_id, dataset_id: job.dataset_id,
      kind: job.kind, job_type: job.job_type, model_name: job.model_name, origin_session_id: job.origin_session_id,
      status: job.status, cancel_requested: job.cancel_requested, phase: job.phase,
      phase_started_at: job.phase_started_at, prepared_sources: job.prepared_sources, queue_position: job.queue_position,
      submitted_at: job.submitted_at, exploration_prompt: job.exploration_prompt,
      requires_user_decision: ["FAILED", "PARTIAL", "INTERRUPTED"].includes(job.status),
      completed: job.completed, failed: job.failed, unprocessed: job.unprocessed, total_samples: job.total_samples,
      observation_progress: job.observation_progress, knowledge_version_id: job.knowledge_version_id,
      exploration_version_id: job.exploration_version_id,
      normal_version_id: job.normal_version_id, started_at: job.started_at, finished_at: job.finished_at,
      error_count: job.errors.length, priority_errors: job.errors.slice(0, 3),
    }) }];
  },
};
