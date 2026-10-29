import type { Annotation, AuditAnalysis, KnowledgeSnapshot, AuditStart, DatasetReport as Report, FolderRule, ReviewDecisionRecord, ReviewSubmission } from "./domain.generated.js";
export type { Annotation, ReviewDecisionRecord, ReviewSubmission } from "./domain.generated.js";
export type { ReviewHistoryQuery, ReviewHistoryPage } from "./domain.generated.js";
export type { AuditAnalysis, AuditFinding, VisualEvidence, VlmResult, GlobalAnalysis, JointAnalysis, SynthesisStep, ViewAnalysis, KnowledgeSnapshot, JobRetry, DatasetImport as DatasetImportRequest, LabelmeImport, FolderClassificationImport, FolderRule, FolderPreview, FolderPreviewItem, ArchiveInspection, DatasetReport as Report } from "./domain.generated.js";
export type KnowledgeSummary = Omit<KnowledgeSnapshot, "mining_steps" | "verification_steps">;
export type { KnowledgeCheck, KnowledgeCorrection } from "./domain.generated.js";
export type { KnowledgeQuery, KnowledgeFreshness } from "./domain.generated.js";
export type { JobSnapshot, JobSample, JobRetryOptions, ModelCallSummary } from "./domain.generated.js";
export type { InspectionReference, InspectionSnapshot } from "./domain.generated.js";
export type { KnowledgeVersion, KnowledgeSourcePage, MiningStart as KnowledgeGroup, MiningRequest as KnowledgeStartRequest } from "./domain.generated.js";
export type { ScanResult } from "./domain.generated.js";
export type { ImageRetrieve, RetrievalPage, RetrievalGroup, RetrievalMember, RetrievalBranchPage, RetrievalOrigin, TemporaryImageRef } from "./domain.generated.js";
export type {ConsistencyCompare,ConsistencyResult,EvidenceBundle,ArtifactRef} from './domain.generated.js';
export type {ConsistencyBatch,ConsistencyBatchSummary,ConsistencyBatchList,StartResultResponse,ConsistencyQuery,ResultPage,ConsistencyReport} from './domain.generated.js';
export type {StrictGroupPage,GroupMemberPage} from './domain.generated.js';
export type {ConsistencyContextRequest,ConsistencyContext,ConsistencyReturnLocation} from './domain.generated.js';

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
  format: "labelme" | "folder_classification";
  image_dir: string;
  annotation_dir: string | null;
  annotation_categories: string[];
  annotation_count: number;
  labeled_sample_count?: number;
  folder_rules?: FolderRule[];
  reference_sample_ids: string[];
  reference_mode: "automatic" | "selected";
  unannotated_is_normal: boolean;
  annotation_policy: Required<import("./domain.generated.js").AnnotationPolicy>;
}
export type Filters = Required<import("./domain.generated.js").SampleFilters>;
export interface SampleIdentity {
  sample_id: string;
  sample_uuid: string;
  image_path: string;
  task_id: string;
  dataset_id: string;
  relative_path: string;
  quality_status: string;
  quality_source?: string;
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
export interface SamplePage { items: Sample[]; total: number }
export interface SampleDetail {
  consistency: import('./domain.generated.js').AuditConsistencyView | null;
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
export interface DirectoryListing { path: string; parent: string; directories: Array<{ name: string; path: string }>; file_counts: Record<string, number>; files: Array<{name: string; path: string}>; total_files: number; next_file_offset: number | null }
export type AuditStartRequest = Omit<AuditStart, "filters"> & { filters?: Partial<Filters> };
