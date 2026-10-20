import type { Annotation, AuditAnalysis, KnowledgeSnapshot, AuditStart, ModelCallDetail, DatasetReport as Report, ReviewDecisionRecord, ReviewSubmission } from "./domain.generated.js";
export type { Annotation, ReviewDecisionRecord, ReviewSubmission } from "./domain.generated.js";
export type { ReviewHistoryQuery, ReviewHistoryPage } from "./domain.generated.js";
export type { AuditAnalysis, AuditFinding, VisualEvidence, VlmResult, GlobalAnalysis, JointAnalysis, SynthesisStep, ViewAnalysis, KnowledgeSnapshot, JobRetry, DatasetImport as DatasetImportRequest, ArchiveInspection, DatasetReport as Report } from "./domain.generated.js";
export type KnowledgeSummary = Omit<KnowledgeSnapshot, "mining_steps" | "verification_steps">;
export type ModelCallSummary = Omit<ModelCallDetail, "request_body" | "response_body">;
export type { KnowledgeVersion, MiningStart as KnowledgeStartRequest } from "./domain.generated.js";

export type Decision = ReviewSubmission["decision"];
export interface Suggestion {
  suggestion_id: string;
  suggested_label: "PASS" | "FAIL" | "UNCERTAIN";
  reason_category: string;
  model_name: string | null;
  confidence: number | null;
  notes: string;
  reference_sample_ids: string[];
  created_at: string;
}
export interface DetailedSuggestion extends Suggestion { analysis: AuditAnalysis | null }
export interface Dataset extends Report {
  dataset_id: string;
  task_id: string;
  name: string;
  image_dir: string;
  annotation_dir: string | null;
  annotation_categories: string[];
  reference_sample_ids: string[];
  reference_mode: "automatic" | "selected";
  unannotated_is_normal: boolean;
}
export interface Filters {
  annotation_filters: string[];
  model_status: string;
  review_status: string;
  technical: string;
  search: string;
  sort_by: string;
}
export interface SampleIdentity {
  sample_id: string;
  sample_uuid: string;
  image_path: string;
  task_id: string;
  dataset_id: string;
  relative_path: string;
  quality_status: string;
  width: number;
  height: number;
}
export interface Sample extends SampleIdentity {
  annotation_count: number;
  annotation_categories: string[];
  reviewed: boolean;
  review_decision: Decision | null;
  has_vlm_observation: boolean;
  technical_quality_score: number;
  visual_suspicion_score: number | null;
  suggestion: Suggestion | null;
}
export interface SampleDetail {
  normal_knowledge: KnowledgeSummary | null;
  defect_knowledge: KnowledgeSummary | null;
  sample: SampleIdentity;
  annotations: Annotation[];
  technical_issues: Array<{ issue_type: string; severity: string; message: string }>;
  technical_quality_score: number;
  visual_suspicion_score: number | null;
  suggestion: DetailedSuggestion | null;
  review_decision: ReviewDecisionRecord | null;
  review_history: ReviewDecisionRecord[];
}
export interface AuditJob {
  parent_run_id?: string | null;
  root_run_id?: string;
  unprocessed: number;
  completed_sample_ids: string[];
  failed_sample_ids: string[];
  model_calls: ModelCallSummary[];
  run_id: string;
  sample_ids: string[];
  inspected_regions?: number;
  planned_regions?: number;
  completed_batches?: number;
  total_batches?: number;
  dataset_id: string;
  status: "RUNNING" | "PENDING" | "COMPLETED" | "FAILED" | "PARTIAL" | "CANCELLED" | "INTERRUPTED";
  completed: number;
  failed: number;
  total_samples: number;
  progress: number;
  message: string;
  model_name: string;
  phase?: string;
  normal_version_id?: string;
  defect_version_id?: string | null;
  errors: Array<{ sample_id: string; message: string }>;
}
export interface DirectoryListing { path: string; parent: string; directories: Array<{ name: string; path: string }>; file_counts: Record<string, number> }
export type AuditStartRequest = Omit<AuditStart, "filters"> & { filters?: Partial<Filters> };

export interface KnowledgeJob extends AuditJob { kind: "normal" | "defect"; knowledge_version_id?: string; phase?: string }
