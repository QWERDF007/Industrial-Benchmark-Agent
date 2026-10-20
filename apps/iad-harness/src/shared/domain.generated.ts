/* Generated from Python Pydantic models by scripts/generate-contracts.js. */

export type NormalVersionId = string | null;
export type DefectVersionId = string | null;
export type LegacyProfileId = string | null;
export type KnowledgeLimitations = string[];
export type Description = string;
export type PositionAnalysis = string;
export type IlluminationAnalysis = string;
export type CheckId = string;
/**
 * normal：符合正常判据或未命中异常判据；anomaly：偏离正常判据或命中异常判据；不可观察/缺证为insufficient；不适用为not_applicable，须解释原因
 */
export type Status = "normal" | "anomaly" | "insufficient" | "not_applicable";
/**
 * @minItems 1
 */
export type EvidenceIds = [string, ...string[]];
export type Limitations = string[];
/**
 * 图像归一化坐标 [x1,y1,x2,y2]，范围 0..1000
 *
 * @minItems 4
 * @maxItems 4
 */
export type Bbox1000 = [number, number, number, number];
export type Reason = string;
export type CheckIds = string[];
/**
 * 该判据尚需补充细看的区域；仅填尚无足够原分辨率证据的区域，坐标相对整图
 */
export type InspectionRegions = RegionProposal[];
export type CheckAssessments = CheckAssessment[];
export type ReferenceSampleIds = string[];
export type EvidenceId = string;
export type Role = "normal" | "overview" | "roi";
export type Source = "reference" | "global" | "annotation" | "model" | "coverage";
export type OriginalSize = number[];
export type CropBbox = number[];
export type SentSize = number[];
export type Sha256 = string;
export type SourceSha256 = string;
export type Representation = "raw" | "annotation_mask" | "annotation_overlay";
export type AnnotationIds = string[];
export type AnnotationSha256 = string | null;
export type MediaType = "image/png";
export type PlannedRegions = number;
export type InspectedRegions = number;
export type Complete = boolean;
export type Missing = string[];
export type Description1 = string;
export type PositionAnalysis1 = string;
export type IlluminationAnalysis1 = string;
export type SuspectRegions = RegionProposal[];
export type Source1 = "annotation" | "model" | "coverage";
export type AnnotationId = string | null;
export type Label = string;
export type Bbox = number[];
export type CheckIds1 = string[];
export type Source2 = "annotation" | "model" | "coverage";
export type AnnotationId1 = string | null;
export type Label1 = string;
export type Bbox1 = number[];
export type CheckIds2 = string[];
export type Origins = RegionOrigin[];
export type CropBbox1 = number[];
export type Description2 = string;
export type PositionAnalysis2 = string;
export type IlluminationAnalysis2 = string;
export type Regions = RegionEvidence[];
export type AuxiliaryEvidence = VisualEvidence[];
export type Description3 = string;
export type PositionAnalysis3 = string;
export type IlluminationAnalysis3 = string;
export type SuggestedLabel = "PASS" | "FAIL" | "UNCERTAIN";
export type ReasonCategory = string;
export type Confidence = number;
export type DefectLocation = string;
/**
 * @minItems 1
 */
export type EvidenceIds1 = [string, ...string[]];
export type Conflicts = string[];
export type MissingEvidence = string[];
export type StepId = string;
export type InputEvidenceIds = string[];
export type ChildStepIds = string[];
export type Result = VlmResult | JointAnalysis;
export type Description4 = string;
export type PositionAnalysis4 = string;
export type IlluminationAnalysis4 = string;
export type SuggestedLabel1 = "PASS" | "FAIL" | "UNCERTAIN";
export type ReasonCategory1 = string;
export type Confidence1 = number;
export type DefectLocation1 = string;
/**
 * @minItems 1
 */
export type EvidenceIds2 = [string, ...string[]];
export type Conflicts1 = string[];
export type MissingEvidence1 = string[];
export type Description5 = string;
export type PositionAnalysis5 = string;
export type IlluminationAnalysis5 = string;
/**
 * 本次请求的 ROI 序号，从1开始，与输入区域顺序对应
 */
export type RegionIndex = number;
export type RegionObservations = RegionObservation[];
export type CheckAssessments1 = CheckAssessment[];
export type JointSteps = SynthesisStep[];
export type VersionId = string;
export type DatasetId = string;
export type Kind = "normal" | "defect";
export type ParentVersionId = string | null;
export type NormalVersionId1 = string | null;
export type ModelName = string;
export type GenerationVersion = string;
export type Signature = string;
export type Summary = string;
export type Title = string;
export type Subject = string;
export type Location = string;
export type Criterion = string;
export type AllowedVariations = string[];
export type SupportEvidenceIds = string[];
export type CounterEvidenceIds = string[];
export type Limitations1 = string[];
/**
 * supported：本轮实际证据支持该可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status1 = "supported" | "provisional" | "conflicted";
export type CheckId1 = string;
export type PredecessorCheckIds = string[];
export type FindingIds = string[];
export type NormalCheckIds = string[];
export type Checks = KnowledgeCheck[];
export type PreviousCheckId = string;
/**
 * 同一判据对应的当前检查项；拆分可多项，退役为空。仅改措辞或允许变化保持一对一
 */
export type CurrentCheckTitles = string[];
export type Reason1 = string;
export type Revisions = CheckRevision[];
export type RemovedSourceIds = string[];
export type EvidenceId1 = string;
/**
 * 相对evidence_id对应图像的归一化坐标0..1000
 *
 * @minItems 4
 * @maxItems 4
 */
export type Bbox10001 = [number, number, number, number];
export type Description6 = string;
export type NormalExplanation = string;
export type Suspects = KnowledgeSuspect[];
export type Limitations2 = string[];
export type SampleId = string;
export type Sha2561 = string;
export type AnnotationsSha256 = string;
export type ReviewSha256 = string;
export type Qualification =
  | "human_pass"
  | "human_hard_normal"
  | "manual_selection"
  | "raw_pass"
  | "initial_unannotated"
  | "human_fail"
  | "annotated_candidate"
  | "normal_suspect";
export type Sources = KnowledgeSource[];
export type SampleId1 = string;
export type Evidence = KnowledgeEvidence[];
export type StepId1 = string;
export type ImageEvidenceIds = string[];
export type ChildStepIds1 = string[];
export type Summary1 = string;
export type Title1 = string;
export type Subject1 = string;
export type Location1 = string;
export type Criterion1 = string;
export type AllowedVariations1 = string[];
export type SupportEvidenceIds1 = string[];
export type CounterEvidenceIds1 = string[];
export type Limitations3 = string[];
/**
 * supported：本轮实际证据支持该可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status2 = "supported" | "provisional" | "conflicted";
export type Checks1 = LearnedCheck[];
export type Suspects1 = KnowledgeSuspect[];
export type Limitations4 = string[];
export type Revisions1 = CheckRevision[];
export type MiningSteps = KnowledgeStep[];
export type FindingId = string;
export type SampleId2 = string;
export type Bbox2 = number[];
export type Origins1 = RegionOrigin[];
export type OriginFindingId = string | null;
export type Source3 = "annotation" | "model" | "coverage";
export type AnnotationId2 = string | null;
export type Label2 = string;
export type Bbox3 = number[];
export type CheckIds3 = string[];
export type Origins2 = RegionOrigin[];
export type CropBbox2 = number[];
export type Regions1 = RegionImage[];
export type FindingId1 = string;
export type Status3 = "supported" | "refuted" | "insufficient";
export type AffectedCheckTitles = string[];
export type Description7 = string;
export type NormalExplanation1 = string;
export type Limitations5 = string[];
/**
 * @minItems 1
 */
export type EvidenceIds3 = [string, ...string[]];
/**
 * 仅填写尚未消解的证据判断矛盾；目标偏离正常规则本身不是判断矛盾
 */
export type Conflicts2 = string[];
export type AffectedCheckIds = string[];
export type Findings = KnowledgeFinding[];
export type StepId2 = string;
export type InputEvidenceIds1 = string[];
export type ChildStepIds2 = string[];
export type Findings1 = KnowledgeJudgment[];
export type VerificationSteps = VerificationStep[];
export type CreatedAt = string;
export type DatasetId1 = string;
export type ModelName1 = string;
export type NormalVersionId2 = string | null;
export type DefectVersionId1 = string | null;
export type SampleIds = string[] | null;

export interface WorkbenchDomain {
  AuditAnalysis?: AuditAnalysis;
  KnowledgeSnapshot?: KnowledgeSnapshot;
  AuditStart?: AuditStart;
}
export interface AuditAnalysis {
  normal_version_id: NormalVersionId;
  defect_version_id: DefectVersionId;
  legacy_profile_id: LegacyProfileId;
  knowledge_limitations: KnowledgeLimitations;
  check_assessments: CheckAssessments;
  reference_sample_ids: ReferenceSampleIds;
  overview: VisualEvidence;
  coverage: Coverage;
  global_view: GlobalAnalysis;
  regions: Regions;
  auxiliary_evidence: AuxiliaryEvidence;
  conclusion: VlmResult;
  joint_steps: JointSteps;
}
export interface CheckAssessment {
  description: Description;
  position_analysis: PositionAnalysis;
  illumination_analysis: IlluminationAnalysis;
  check_id: CheckId;
  status: Status;
  evidence_ids: EvidenceIds;
  limitations: Limitations;
  inspection_regions: InspectionRegions;
}
export interface RegionProposal {
  bbox_1000: Bbox1000;
  reason: Reason;
  check_ids: CheckIds;
}
export interface VisualEvidence {
  evidence_id: EvidenceId;
  role: Role;
  source: Source;
  original_size: OriginalSize;
  crop_bbox: CropBbox;
  sent_size: SentSize;
  sha256: Sha256;
  source_sha256: SourceSha256;
  representation: Representation;
  annotation_ids: AnnotationIds;
  annotation_sha256: AnnotationSha256;
  media_type: MediaType;
}
export interface Coverage {
  planned_regions: PlannedRegions;
  inspected_regions: InspectedRegions;
  complete: Complete;
  missing: Missing;
}
export interface GlobalAnalysis {
  description: Description1;
  position_analysis: PositionAnalysis1;
  illumination_analysis: IlluminationAnalysis1;
  suspect_regions: SuspectRegions;
}
export interface RegionEvidence {
  source: Source1;
  annotation_id: AnnotationId;
  label: Label;
  bbox: Bbox;
  check_ids: CheckIds1;
  origins: Origins;
  image: VisualEvidence;
  crop_bbox: CropBbox1;
  observation: ViewAnalysis;
}
export interface RegionOrigin {
  source: Source2;
  annotation_id: AnnotationId1;
  label: Label1;
  bbox: Bbox1;
  check_ids: CheckIds2;
}
export interface ViewAnalysis {
  description: Description2;
  position_analysis: PositionAnalysis2;
  illumination_analysis: IlluminationAnalysis2;
}
export interface VlmResult {
  description: Description3;
  position_analysis: PositionAnalysis3;
  illumination_analysis: IlluminationAnalysis3;
  suggested_label: SuggestedLabel;
  reason_category: ReasonCategory;
  confidence: Confidence;
  defect_location: DefectLocation;
  evidence_ids: EvidenceIds1;
  conflicts: Conflicts;
  missing_evidence: MissingEvidence;
}
export interface SynthesisStep {
  step_id: StepId;
  input_evidence_ids: InputEvidenceIds;
  child_step_ids: ChildStepIds;
  result: Result;
}
export interface JointAnalysis {
  description: Description4;
  position_analysis: PositionAnalysis4;
  illumination_analysis: IlluminationAnalysis4;
  suggested_label: SuggestedLabel1;
  reason_category: ReasonCategory1;
  confidence: Confidence1;
  defect_location: DefectLocation1;
  evidence_ids: EvidenceIds2;
  conflicts: Conflicts1;
  missing_evidence: MissingEvidence1;
  global_view: GlobalAnalysis;
  region_observations: RegionObservations;
  check_assessments: CheckAssessments1;
}
export interface RegionObservation {
  description: Description5;
  position_analysis: PositionAnalysis5;
  illumination_analysis: IlluminationAnalysis5;
  region_index: RegionIndex;
}
export interface KnowledgeSnapshot {
  version_id: VersionId;
  dataset_id: DatasetId;
  kind: Kind;
  parent_version_id: ParentVersionId;
  normal_version_id: NormalVersionId1;
  model_name: ModelName;
  generation_version: GenerationVersion;
  signature: Signature;
  summary: Summary;
  checks: Checks;
  revisions: Revisions;
  removed_source_ids: RemovedSourceIds;
  suspects: Suspects;
  limitations: Limitations2;
  sources: Sources;
  evidence: Evidence;
  mining_steps: MiningSteps;
  findings: Findings;
  verification_steps: VerificationSteps;
  created_at: CreatedAt;
}
export interface KnowledgeCheck {
  title: Title;
  subject: Subject;
  location: Location;
  criterion: Criterion;
  allowed_variations: AllowedVariations;
  support_evidence_ids: SupportEvidenceIds;
  counter_evidence_ids: CounterEvidenceIds;
  limitations: Limitations1;
  status: Status1;
  check_id: CheckId1;
  predecessor_check_ids: PredecessorCheckIds;
  finding_ids: FindingIds;
  normal_check_ids: NormalCheckIds;
}
export interface CheckRevision {
  previous_check_id: PreviousCheckId;
  current_check_titles: CurrentCheckTitles;
  reason: Reason1;
}
export interface KnowledgeSuspect {
  evidence_id: EvidenceId1;
  bbox_1000: Bbox10001;
  description: Description6;
  normal_explanation: NormalExplanation;
}
export interface KnowledgeSource {
  sample_id: SampleId;
  sha256: Sha2561;
  annotations_sha256: AnnotationsSha256;
  review_sha256: ReviewSha256;
  qualification: Qualification;
}
export interface KnowledgeEvidence {
  sample_id: SampleId1;
  image: VisualEvidence;
}
export interface KnowledgeStep {
  step_id: StepId1;
  image_evidence_ids: ImageEvidenceIds;
  child_step_ids: ChildStepIds1;
  result: KnowledgeDraft;
}
export interface KnowledgeDraft {
  summary: Summary1;
  checks: Checks1;
  suspects: Suspects1;
  limitations: Limitations4;
  revisions: Revisions1;
}
export interface LearnedCheck {
  title: Title1;
  subject: Subject1;
  location: Location1;
  criterion: Criterion1;
  allowed_variations: AllowedVariations1;
  support_evidence_ids: SupportEvidenceIds1;
  counter_evidence_ids: CounterEvidenceIds1;
  limitations: Limitations3;
  status: Status2;
}
export interface KnowledgeFinding {
  finding_id: FindingId;
  sample_id: SampleId2;
  bbox: Bbox2;
  proposal: KnowledgeSuspect | null;
  origins: Origins1;
  origin_finding_id: OriginFindingId;
  regions: Regions1;
  judgment: KnowledgeJudgment;
  affected_check_ids: AffectedCheckIds;
}
export interface RegionImage {
  source: Source3;
  annotation_id: AnnotationId2;
  label: Label2;
  bbox: Bbox3;
  check_ids: CheckIds3;
  origins: Origins2;
  image: VisualEvidence;
  crop_bbox: CropBbox2;
}
export interface KnowledgeJudgment {
  finding_id: FindingId1;
  status: Status3;
  affected_check_titles: AffectedCheckTitles;
  description: Description7;
  normal_explanation: NormalExplanation1;
  limitations: Limitations5;
  evidence_ids: EvidenceIds3;
  conflicts: Conflicts2;
}
export interface VerificationStep {
  step_id: StepId2;
  input_evidence_ids: InputEvidenceIds1;
  child_step_ids: ChildStepIds2;
  result: KnowledgeVerification;
}
export interface KnowledgeVerification {
  findings: Findings1;
}
export interface AuditStart {
  dataset_id: DatasetId1;
  model_name?: ModelName1;
  normal_version_id?: NormalVersionId2;
  defect_version_id?: DefectVersionId1;
  sample_ids?: SampleIds;
  filters?: Filters;
}
export interface Filters {
  [k: string]: unknown;
}
