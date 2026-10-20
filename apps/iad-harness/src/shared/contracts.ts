export type Decision = "PASS" | "HARD_NORMAL" | "FAIL" | "UNCERTAIN" | "SKIP";
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
export interface Report {
  total_samples: number;
  vlm_audited_count: number;
  vlm_coverage_pct: number;
  vlm_anomalies_count: number;
  technical_quality_issues: number;
  human_reviewed_count: number;
  human_pass_count: number;
  human_fail_count: number;
  human_uncertain_count: number;
  pending_risk_count: number;
  categories: Record<string, number>;
  generated_at: string;
}
export interface Dataset extends Report {
  dataset_id: string;
  task_id: string;
  name: string;
  image_dir: string;
  annotation_dir: string | null;
  annotation_categories: string[];
  reference_sample_ids: string[];
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
  normal_profile: NormalProfile | null;
  sample: SampleIdentity;
  annotations: Array<{ annotation_id: string; raw_label: string; phenomenon: string; geometry_status: string; bbox: number[] | null; polygon: number[][] | null }>;
  technical_issues: Array<{ issue_type: string; severity: string; message: string }>;
  technical_quality_score: number;
  visual_suspicion_score: number | null;
  suggestion: DetailedSuggestion | null;
  review_decision: { decision: Decision; comment: string | null; reviewer: string; submitted_at: string } | null;
}
export interface AuditJob {
  run_id: string;
  sample_ids: string[];
  inspected_regions?: number;
  planned_regions?: number;
  dataset_id: string;
  status: "RUNNING" | "PENDING" | "COMPLETED" | "FAILED" | "PARTIAL" | "CANCELLED" | "INTERRUPTED";
  completed: number;
  failed: number;
  total_samples: number;
  progress: number;
  message: string;
  model_name: string;
  reference_sample_ids: string[];
  phase?: string;
  profile_id?: string;
  errors: Array<{ sample_id: string; message: string }>;
}
export interface DirectoryListing { path: string; parent: string; directories: Array<{ name: string; path: string }> }
export interface DatasetImportRequest { name: string; image_dir: string; annotation_dir: string; unannotated_is_normal?: boolean }
export interface AuditStartRequest { dataset_id: string; model_name?: string; max_regions?: number; sample_ids?: string[]; limit?: number; filters?: Partial<Filters> }
export interface ReviewSubmission { session_id: string; sample_id: string; decision: Decision; comment?: string; reason_code?: string; duration_ms?: number }

export interface ViewAnalysis { description: string; position_analysis: string; illumination_analysis: string }
export interface VisualEvidence {
  evidence_id: string;
  role: "normal" | "overview" | "roi";
  source: "reference" | "global" | "annotation" | "model" | "coverage";
  original_size: number[];
  crop_bbox: number[];
  sent_size: number[];
  sha256: string;
  source_sha256: string;
  media_type: "image/png";
}
export interface AuditAnalysis {
  profile_id: string;
  overview: VisualEvidence;
  coverage: { planned_regions: number; inspected_regions: number; complete: boolean; missing: string[] };
  global_view: ViewAnalysis;
  regions: Array<{ origins: Array<{ source: string; annotation_id: string | null; label: string; bbox: number[] }>; source: string; image: VisualEvidence; label: string; bbox: number[]; crop_bbox: number[]; observation: ViewAnalysis }>;
  conclusion: ViewAnalysis & { evidence_ids: string[]; conflicts: string[]; missing_evidence: string[] };
}
export interface NormalProfile {
  knowledge_kind: "mllm_semantic";
  generation_version: string;
  sources: Array<{ sample_id: string; sha256: string; qualification: string }>;
  profile_id: string;
  created_at: string;
  patterns: { structure: string; texture: string; position_variation: string; illumination_variation: string; normal_allowances: string[]; cautions: string[] };
}
