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
/**
 * 关联此现象影响的全部冻结检查项。一个现象可同时影响正常和异常判据，应合并为一个finding并在此列全相关check_id；所有status=anomaly的检查项必须至少被一个finding引用，不得只填异常知识中的check_id。新现象尚无判据时可为空，不得伪造检查项
 */
export type CheckIds1 = string[];
export type Location = LocalFindingLocation | GlobalFindingLocation;
/**
 * 可定位部位的现象，例如孔内异物或局部色差
 */
export type Scope = "local";
/**
 * 必须给出原图像素坐标[x1,y1,x2,y2]，不能省略或填null
 *
 * @minItems 4
 * @maxItems 4
 */
export type Bbox = [number, number, number, number];
export type Description1 = string;
/**
 * 仅用于整体结构关系，不用于规避局部现象的定位
 */
export type Scope1 = "global";
export type Bbox1 = null;
export type Description2 = string;
/**
 * 一句可见现象
 */
export type Description3 = string;
export type Hypothesis = string;
/**
 * 需排除的合理正常解释，不能直接把疑点视为缺陷事实
 */
export type NormalExplanation = string;
export type Limitations1 = string[];
export type ReviewAction = string;
/**
 * 人工复核顺序，不代表缺陷概率
 */
export type Priority = "high" | "medium" | "low";
/**
 * @minItems 1
 */
export type EvidenceIds1 = [string, ...string[]];
export type StepId = string;
/**
 * 该步骤findings中的序号，从1开始
 */
export type FindingIndex = number;
/**
 * 更新/合并的此前待处理疑点；引用给定reference，不按重叠框自行推断身份
 */
export type RelatedFindings = FindingReference[];
export type FindingId = string;
export type SourceStepIds = string[];
export type Findings = AuditFinding[];
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
export type Description4 = string;
export type PositionAnalysis1 = string;
export type IlluminationAnalysis1 = string;
export type SuspectRegions = RegionProposal[];
export type Source1 = "annotation" | "model" | "coverage";
export type AnnotationId = string | null;
export type Label = string;
export type Bbox2 = number[];
export type CheckIds2 = string[];
export type Source2 = "annotation" | "model" | "coverage";
export type AnnotationId1 = string | null;
export type Label1 = string;
export type Bbox3 = number[];
export type CheckIds3 = string[];
export type Origins = RegionOrigin[];
export type CropBbox1 = number[];
export type Description5 = string;
export type PositionAnalysis2 = string;
export type IlluminationAnalysis2 = string;
export type Regions = RegionEvidence[];
export type AuxiliaryEvidence = VisualEvidence[];
/**
 * 一句话综合建议，指出优先复核位置与问题；整体和局部观察放在对应字段，不重复长篇视觉描述
 */
export type Description6 = string;
export type PositionAnalysis3 = string;
export type IlluminationAnalysis3 = string;
export type SuggestedLabel = "PASS" | "FAIL" | "UNCERTAIN";
export type ReasonCategory = string;
export type Confidence = number;
export type DefectLocation = string;
/**
 * @minItems 1
 */
export type EvidenceIds2 = [string, ...string[]];
export type Conflicts = string[];
export type MissingEvidence = string[];
export type StepId1 = string;
export type InputEvidenceIds = string[];
export type ChildStepIds = string[];
export type Result = VlmResult | JointAnalysis;
/**
 * 一句话综合建议，指出优先复核位置与问题；整体和局部观察放在对应字段，不重复长篇视觉描述
 */
export type Description7 = string;
export type PositionAnalysis4 = string;
export type IlluminationAnalysis4 = string;
export type SuggestedLabel1 = "PASS" | "FAIL" | "UNCERTAIN";
export type ReasonCategory1 = string;
export type Confidence1 = number;
export type DefectLocation1 = string;
/**
 * @minItems 1
 */
export type EvidenceIds3 = [string, ...string[]];
export type Conflicts1 = string[];
export type MissingEvidence1 = string[];
export type Description8 = string;
export type PositionAnalysis5 = string;
export type IlluminationAnalysis5 = string;
/**
 * 本次请求的 ROI 序号，从1开始，与输入区域顺序对应
 */
export type RegionIndex = number;
export type RegionObservations = RegionObservation[];
export type CheckAssessments1 = CheckAssessment[];
/**
 * 关联此现象影响的全部冻结检查项。一个现象可同时影响正常和异常判据，应合并为一个finding并在此列全相关check_id；所有status=anomaly的检查项必须至少被一个finding引用，不得只填异常知识中的check_id。新现象尚无判据时可为空，不得伪造检查项
 */
export type CheckIds4 = string[];
export type Location1 = LocalFindingLocation | GlobalFindingLocation;
/**
 * 一句可见现象
 */
export type Description9 = string;
export type Hypothesis1 = string;
/**
 * 需排除的合理正常解释，不能直接把疑点视为缺陷事实
 */
export type NormalExplanation1 = string;
export type Limitations2 = string[];
export type ReviewAction1 = string;
/**
 * 人工复核顺序，不代表缺陷概率
 */
export type Priority1 = "high" | "medium" | "low";
/**
 * @minItems 1
 */
export type EvidenceIds4 = [string, ...string[]];
/**
 * 更新/合并的此前待处理疑点；引用给定reference，不按重叠框自行推断身份
 */
export type RelatedFindings1 = FindingReference[];
export type Findings1 = FindingObservation[];
/**
 * @minItems 1
 */
export type RelatedFindings2 = [FindingReference, ...FindingReference[]];
/**
 * 实际证据为何已排除该疑点
 */
export type Description10 = string;
export type NormalExplanation2 = string;
/**
 * @minItems 1
 */
export type EvidenceIds5 = [string, ...string[]];
export type ResolvedFindings = FindingResolution[];
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
export type Location2 = string;
export type Criterion = string;
export type AllowedVariations = string[];
export type SupportEvidenceIds = string[];
export type CounterEvidenceIds = string[];
export type Limitations3 = string[];
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
/**
 * 冻结基准版本中的检查项ID
 */
export type CheckId2 = string;
/**
 * 待视觉核验的人工修订建议，不是已证实事实
 */
export type Instruction = string;
export type Corrections = KnowledgeCorrection[];
export type RemovedSourceIds = string[];
export type EvidenceId1 = string;
/**
 * 相对evidence_id对应图像的归一化坐标0..1000
 *
 * @minItems 4
 * @maxItems 4
 */
export type Bbox10001 = [number, number, number, number];
export type Description11 = string;
export type NormalExplanation3 = string;
export type Suspects = KnowledgeSuspect[];
export type Limitations4 = string[];
export type SampleId = string;
export type Sha2561 = string;
export type AnnotationsSha256 = string;
export type ReviewSha256 = string;
export type AuditSuggestionIds = string[];
export type Qualification = "human_pass" | "human_hard_normal" | "manual_selection" | "raw_pass" | "initial_unannotated" | "human_fail" | "annotated_candidate" | "normal_suspect" | "audit_suspect";
export type Sources = KnowledgeSource[];
export type SampleId1 = string;
export type Evidence = KnowledgeEvidence[];
export type StepId2 = string;
export type ImageEvidenceIds = string[];
export type ChildStepIds1 = string[];
export type Summary1 = string;
export type Title1 = string;
export type Subject1 = string;
export type Location3 = string;
export type Criterion1 = string;
export type AllowedVariations1 = string[];
export type SupportEvidenceIds1 = string[];
export type CounterEvidenceIds1 = string[];
export type Limitations5 = string[];
/**
 * supported：本轮实际证据支持该可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status2 = "supported" | "provisional" | "conflicted";
export type Checks1 = LearnedCheck[];
export type Suspects1 = KnowledgeSuspect[];
export type Limitations6 = string[];
export type Revisions1 = CheckRevision[];
export type MiningSteps = KnowledgeStep[];
export type FindingId1 = string;
export type SampleId2 = string;
export type Bbox4 = number[];
export type Origins1 = RegionOrigin[];
export type OriginFindingId = string | null;
export type OriginSuggestionId = string | null;
export type Source3 = "annotation" | "model" | "coverage";
export type AnnotationId2 = string | null;
export type Label2 = string;
export type Bbox5 = number[];
export type CheckIds5 = string[];
export type Origins2 = RegionOrigin[];
export type CropBbox2 = number[];
export type Regions1 = RegionImage[];
export type FindingId2 = string;
export type Status3 = "supported" | "refuted" | "insufficient";
export type AffectedCheckTitles = string[];
export type Description12 = string;
export type NormalExplanation4 = string;
export type Limitations7 = string[];
/**
 * @minItems 1
 */
export type EvidenceIds6 = [string, ...string[]];
/**
 * 仅填写尚未消解的证据判断矛盾；目标偏离正常规则本身不是判断矛盾
 */
export type Conflicts2 = string[];
export type AffectedCheckIds = string[];
export type Findings2 = KnowledgeFinding[];
export type StepId3 = string;
export type InputEvidenceIds1 = string[];
export type ChildStepIds2 = string[];
export type Findings3 = KnowledgeJudgment[];
export type VerificationSteps = VerificationStep[];
export type CreatedAt = string;
export type VersionId1 = string;
export type DatasetId1 = string;
export type Kind1 = "normal" | "defect";
export type ParentVersionId1 = string | null;
export type NormalVersionId2 = string | null;
export type ModelName1 = string;
export type CreatedAt1 = string;
export type SourceCount = number;
export type CheckCount = number;
export type Versions = KnowledgeVersion[];
export type Status4 = "current" | "changed" | "unverified";
export type CheckedAt = string;
export type CurrentVersionId = string | null;
export type CurrentNormalVersionId = string | null;
export type SampleId3 = string;
export type Reasons = ("image" | "annotations" | "review" | "audit_candidates" | "qualification" | "unavailable")[];
export type SourceChanges = KnowledgeSourceChange[];
export type AdditionalSourceIds = string[];
export type GenerationChanged = boolean | null;
export type NormalVersionChanged = boolean;
export type NormalSourcesChanged = boolean;
export type DatasetId2 = string;
export type OriginSessionId = string | null;
export type ModelName2 = string;
export type NormalVersionId3 = string | null;
export type DefectVersionId1 = string | null;
export type SampleIds = string[] | null;
export type CallId = string;
export type RunId = string;
export type Operation = "tokenize" | "generate";
export type SchemaName = string;
export type Phase = string | null;
export type SampleId4 = string | null;
export type StartedAt = string;
export type FinishedAt = string | null;
export type ElapsedMs = number | null;
export type HttpStatus = number | null;
export type ResponseId = string | null;
export type ResponseModel = string | null;
export type FinishReason = string | null;
export type Usage = {
    [k: string]: unknown;
} | null;
export type Type = string;
export type Message = string;
export type RequestBody = string;
export type ResponseBody = string | null;
export type RunId1 = string;
export type SampleIds1 = string[] | null;
export type RunId2 = string;
export type TaskId = string;
export type DatasetId3 = string;
export type JobType = "MODEL_AUDIT" | "NORMAL_KNOWLEDGE" | "DEFECT_KNOWLEDGE";
export type OriginSessionId1 = string | null;
export type RootRunId = string;
export type ParentRunId = string | null;
export type Status5 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type CancelRequested = boolean;
export type SampleIds2 = string[];
export type CompletedSampleIds = string[];
export type FailedSampleIds = string[];
export type Completed = number;
export type Failed = number;
export type TotalSamples = number;
export type Unprocessed = number;
export type Progress = number;
export type Message1 = string;
export type StartedAt1 = string | null;
export type FinishedAt1 = string | null;
export type ModelName3 = string;
export type SampleId5 = string;
export type RelativePath = string | null;
export type SampleUuid = string;
export type Phase1 = string | null;
export type NormalVersionId4 = string | null;
export type DefectVersionId2 = string | null;
export type Kind2 = ("normal" | "defect") | null;
export type KnowledgeVersionId = string | null;
export type InspectedRegions1 = number | null;
export type PlannedRegions1 = number | null;
export type CompletedBatches = number | null;
export type TotalBatches = number | null;
export type SampleId6 = string;
export type RelativePath1 = string | null;
export type Message2 = string;
export type SampleUuid1 = string;
export type Errors = JobFailure[];
export type CallId1 = string;
export type RunId3 = string;
export type Operation1 = "tokenize" | "generate";
export type SchemaName1 = string;
export type Phase2 = string | null;
export type SampleId7 = string | null;
export type StartedAt2 = string;
export type FinishedAt2 = string | null;
export type ElapsedMs1 = number | null;
export type HttpStatus1 = number | null;
export type ResponseId1 = string | null;
export type ResponseModel1 = string | null;
export type FinishReason1 = string | null;
export type Usage1 = {
    [k: string]: unknown;
} | null;
export type ModelCalls = ModelCallSummary[];
export type RunId4 = string;
export type RootRunId1 = string;
export type SelectionMode = "subset" | "all_sources";
export type ActiveRunId = string | null;
export type SampleId8 = string;
export type RelativePath2 = string | null;
export type State = "failed" | "unprocessed";
export type SampleUuid2 = string;
export type Samples = RetrySample[];
export type DatasetId4 = string;
export type SampleId9 = string;
export type SuggestionId = string;
export type FindingId3 = string | null;
export type EvidenceId2 = string | null;
export type DatasetId5 = string;
export type SampleId10 = string;
export type SuggestionId1 = string;
export type FindingId4 = string | null;
export type EvidenceId3 = string | null;
export type SampleId11 = string;
export type TaskId1 = string;
export type DatasetId6 = string;
export type ImagePath = string;
export type RelativePath3 = string;
export type QualityStatus = "PASS" | "FAIL" | "UNCERTAIN";
export type QualitySource = string | null;
export type DataOrigin = "LEGACY_TRAIN" | "LEGACY_TEST" | "AUGMENTED" | "MISSED_CASE" | "PRODUCTION" | "UNKNOWN";
export type BatchId = string | null;
export type PhysicalSampleId = string | null;
export type CaptureSequenceId = string | null;
export type Station = string | null;
export type Camera = string | null;
export type Width = number;
export type Height = number;
export type SampleUuid3 = string;
export type Evidence1 = VisualEvidence[];
export type AuditRunId = string | null;
export type OriginSessionId2 = string | null;
export type IsLatest = boolean;
export type Name = string;
export type ImageDir = string;
export type AnnotationDir = string;
export type ArchivePath = string | null;
export type UnannotatedIsNormal = boolean;
export type ArchivePath1 = string;
export type Sha2562 = string;
export type FileCount = number;
export type UncompressedBytes = number;
export type Path = string;
export type ImageCount = number;
export type AnnotationCount = number;
export type Directories = ArchiveDirectory[];
export type DatasetId7 = string;
export type TaskId2 = string;
export type ImageCount1 = number;
export type AnnotationCount1 = number;
export type IssueCount = number;
export type DbPath = string;
export type DatasetId8 = string | null;
export type TaskId3 = string | null;
export type TotalSamples1 = number;
export type VlmAuditedCount = number;
export type VlmCoveragePct = number | null;
export type VlmAnomaliesCount = number;
export type TechnicalQualityIssues = number;
export type HumanReviewedCount = number;
export type HumanPassCount = number;
export type HumanFailCount = number;
export type HumanUncertainCount = number;
export type HumanSkippedCount = number;
export type PendingRiskCount = number;
export type GeneratedAt = string;
export type Version = "quality-dimensions-v1";
export type ObservedInputs = number;
export type RegisteredSamples = number;
export type UnregisteredInputs = number;
export type Basis = "persisted_samples_and_import_issues";
export type Selection = "latest_per_sample";
export type Limitations8 = string[];
export type Numerator = number;
export type Denominator = number;
export type Basis1 = string;
export type Percent = number | null;
/**
 * 最新建议为 FAIL 或仍有待核验 finding 的图像数，不代表已确认缺陷
 */
export type SuspectSamples = number;
export type FindingCount = number;
export type UncertainSamples = number;
/**
 * 综合结论标记缺证或检查项为 insufficient 的图像数
 */
export type MissingEvidenceSamples = number;
export type ConflictSamples = number;
/**
 * 已有建议但未保存结构化证据分析，不能据此断言没有缺证
 */
export type UnstructuredSamples = number;
export type NormalVersionId5 = string | null;
export type DefectVersionId3 = string | null;
export type LegacyProfileId1 = string | null;
export type SampleCount = number;
export type KnowledgeVersions = KnowledgeUsage[];
export type AuditRunIds = string[];
export type DatasetId9 = string;
export type OriginSessionId3 = string | null;
export type Kind3 = "normal" | "defect";
export type NormalVersionId6 = string | null;
export type ModelName4 = string;
/**
 * 新增来源范围，与父版本仍合格来源合并核验；省略覆盖全部合格来源
 */
export type SampleIds3 = string[] | null;
/**
 * 人工修订所依据的当前同类型知识版本
 */
export type BaseVersionId = string | null;
/**
 * 待核验的人工修订，需同时指定base_version_id；不得直接作为事实
 */
export type Corrections1 = KnowledgeCorrection[];
export type AnnotationId3 = string;
export type SampleId12 = string;
export type AnnotationType = "bbox" | "polygon" | "mask" | "image";
export type RawLabel = string;
export type Phenomenon = string | null;
export type Bbox6 = number[] | null;
export type Polygon = number[][] | null;
export type MaskPath = string | null;
export type MaskSha256 = string | null;
export type GeometryStatus = "VALID" | "CLIPPED" | "SCALED" | "INVALID";
export type AnnotationSource = "manual" | "existing_detector" | "production_system" | "imported" | "unknown";
export type SourceWidth = number | null;
export type SourceHeight = number | null;
export type DecisionId = string;
export type SampleId13 = string;
export type Decision = string;
export type Reviewer = string;
export type ReasonCode = string | null;
export type Comment = string | null;
export type EvidenceVersion = string;
export type ReviewSessionId = string | null;
export type StartedAt3 = string | null;
export type SubmittedAt = string | null;
export type ReviewDurationMs = number;
export type SubmissionId = string;
export type DatasetId10 = string;
export type SampleId14 = string;
export type Reviewer1 = string;
export type ReviewDecisionEnum = "PASS" | "HARD_NORMAL" | "FAIL" | "UNCERTAIN" | "SKIP";
export type ReasonCode1 = string | null;
export type Comment1 = string | null;
export type DurationMs = number;
export type StartedAt4 = string | null;
export type DatasetId11 = string;
export type Page = number;
export type PageSize = number;
export type Search = string;
export type DecisionId1 = string;
export type SampleId15 = string;
export type Decision1 = string;
export type Reviewer2 = string;
export type ReasonCode2 = string | null;
export type Comment2 = string | null;
export type EvidenceVersion1 = string;
export type ReviewSessionId1 = string | null;
export type StartedAt5 = string | null;
export type SubmittedAt1 = string | null;
export type ReviewDurationMs1 = number;
export type RelativePath4 = string;
export type Items = ReviewHistoryRecord[];
export type Total = number;
export type Page1 = number;
export type PageSize1 = number;
export type DatasetId12 = string | null;
export type TaskId4 = string | null;
export type Page2 = number;
export type PageSize2 = number;
export type AnnotationFilters = string[];
export type ModelStatus = "all" | "pending" | "audited" | "risk" | "PASS" | "FAIL" | "UNCERTAIN";
export type ReviewStatus = "all" | "pending" | "reviewed" | "PASS" | "HARD_NORMAL" | "FAIL" | "UNCERTAIN" | "SKIP";
export type Technical = "all" | "issues";
export type ReferenceStatus = "all" | "candidate" | "excluded";
export type Search1 = string;
export type SortBy = "default" | "risk" | "tech";
export interface WorkbenchDomain {
    AuditAnalysis?: AuditAnalysis;
    KnowledgeSnapshot?: KnowledgeSnapshot;
    KnowledgeVersion?: KnowledgeVersion;
    KnowledgeQuery?: KnowledgeQuery;
    AuditStart?: AuditStart;
    ModelCallDetail?: ModelCallDetail;
    JobRetry?: JobRetry;
    JobSnapshot?: JobSnapshot;
    JobRetryOptions?: JobRetryOptions;
    InspectionReference?: InspectionReference;
    InspectionSnapshot?: InspectionSnapshot;
    DatasetImport?: DatasetImport;
    ArchiveInspection?: ArchiveInspection;
    ScanResult?: ScanResult;
    DatasetReport?: DatasetReport;
    MiningStart?: MiningStart;
    Annotation?: Annotation;
    ReviewDecisionRecord?: ReviewDecisionRecord;
    ReviewSubmission?: ReviewSubmission;
    ReviewHistoryQuery?: ReviewHistoryQuery;
    ReviewHistoryPage?: ReviewHistoryPage;
    SampleQuery?: SampleQuery;
}
export interface AuditAnalysis {
    normal_version_id: NormalVersionId;
    defect_version_id: DefectVersionId;
    legacy_profile_id: LegacyProfileId;
    knowledge_limitations: KnowledgeLimitations;
    check_assessments: CheckAssessments;
    findings: Findings;
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
export interface AuditFinding {
    check_ids: CheckIds1;
    location: Location;
    description: Description3;
    hypothesis: Hypothesis;
    normal_explanation: NormalExplanation;
    limitations: Limitations1;
    review_action: ReviewAction;
    priority: Priority;
    evidence_ids: EvidenceIds1;
    related_findings: RelatedFindings;
    finding_id: FindingId;
    source_step_ids: SourceStepIds;
}
export interface LocalFindingLocation {
    scope: Scope;
    bbox: Bbox;
    description: Description1;
}
export interface GlobalFindingLocation {
    scope: Scope1;
    bbox: Bbox1;
    description: Description2;
}
export interface FindingReference {
    step_id: StepId;
    finding_index: FindingIndex;
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
    description: Description4;
    position_analysis: PositionAnalysis1;
    illumination_analysis: IlluminationAnalysis1;
    suspect_regions: SuspectRegions;
}
export interface RegionEvidence {
    source: Source1;
    annotation_id: AnnotationId;
    label: Label;
    bbox: Bbox2;
    check_ids: CheckIds2;
    origins: Origins;
    image: VisualEvidence;
    crop_bbox: CropBbox1;
    observation: ViewAnalysis;
}
export interface RegionOrigin {
    source: Source2;
    annotation_id: AnnotationId1;
    label: Label1;
    bbox: Bbox3;
    check_ids: CheckIds3;
}
export interface ViewAnalysis {
    description: Description5;
    position_analysis: PositionAnalysis2;
    illumination_analysis: IlluminationAnalysis2;
}
export interface VlmResult {
    description: Description6;
    position_analysis: PositionAnalysis3;
    illumination_analysis: IlluminationAnalysis3;
    suggested_label: SuggestedLabel;
    reason_category: ReasonCategory;
    confidence: Confidence;
    defect_location: DefectLocation;
    evidence_ids: EvidenceIds2;
    conflicts: Conflicts;
    missing_evidence: MissingEvidence;
}
export interface SynthesisStep {
    step_id: StepId1;
    input_evidence_ids: InputEvidenceIds;
    child_step_ids: ChildStepIds;
    result: Result;
}
export interface JointAnalysis {
    description: Description7;
    position_analysis: PositionAnalysis4;
    illumination_analysis: IlluminationAnalysis4;
    suggested_label: SuggestedLabel1;
    reason_category: ReasonCategory1;
    confidence: Confidence1;
    defect_location: DefectLocation1;
    evidence_ids: EvidenceIds3;
    conflicts: Conflicts1;
    missing_evidence: MissingEvidence1;
    global_view: GlobalAnalysis;
    region_observations: RegionObservations;
    check_assessments: CheckAssessments1;
    findings: Findings1;
    resolved_findings: ResolvedFindings;
}
export interface RegionObservation {
    description: Description8;
    position_analysis: PositionAnalysis5;
    illumination_analysis: IlluminationAnalysis5;
    region_index: RegionIndex;
}
export interface FindingObservation {
    check_ids: CheckIds4;
    location: Location1;
    description: Description9;
    hypothesis: Hypothesis1;
    normal_explanation: NormalExplanation1;
    limitations: Limitations2;
    review_action: ReviewAction1;
    priority: Priority1;
    evidence_ids: EvidenceIds4;
    related_findings: RelatedFindings1;
}
export interface FindingResolution {
    related_findings: RelatedFindings2;
    description: Description10;
    normal_explanation: NormalExplanation2;
    evidence_ids: EvidenceIds5;
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
    corrections: Corrections;
    removed_source_ids: RemovedSourceIds;
    suspects: Suspects;
    limitations: Limitations4;
    sources: Sources;
    evidence: Evidence;
    mining_steps: MiningSteps;
    findings: Findings2;
    verification_steps: VerificationSteps;
    created_at: CreatedAt;
}
export interface KnowledgeCheck {
    title: Title;
    subject: Subject;
    location: Location2;
    criterion: Criterion;
    allowed_variations: AllowedVariations;
    support_evidence_ids: SupportEvidenceIds;
    counter_evidence_ids: CounterEvidenceIds;
    limitations: Limitations3;
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
export interface KnowledgeCorrection {
    check_id: CheckId2;
    instruction: Instruction;
}
export interface KnowledgeSuspect {
    evidence_id: EvidenceId1;
    bbox_1000: Bbox10001;
    description: Description11;
    normal_explanation: NormalExplanation3;
}
export interface KnowledgeSource {
    sample_id: SampleId;
    sha256: Sha2561;
    annotations_sha256: AnnotationsSha256;
    review_sha256: ReviewSha256;
    audit_suggestion_ids: AuditSuggestionIds;
    qualification: Qualification;
}
export interface KnowledgeEvidence {
    sample_id: SampleId1;
    image: VisualEvidence;
}
export interface KnowledgeStep {
    step_id: StepId2;
    image_evidence_ids: ImageEvidenceIds;
    child_step_ids: ChildStepIds1;
    result: KnowledgeDraft;
}
export interface KnowledgeDraft {
    summary: Summary1;
    checks: Checks1;
    suspects: Suspects1;
    limitations: Limitations6;
    revisions: Revisions1;
}
export interface LearnedCheck {
    title: Title1;
    subject: Subject1;
    location: Location3;
    criterion: Criterion1;
    allowed_variations: AllowedVariations1;
    support_evidence_ids: SupportEvidenceIds1;
    counter_evidence_ids: CounterEvidenceIds1;
    limitations: Limitations5;
    status: Status2;
}
export interface KnowledgeFinding {
    finding_id: FindingId1;
    sample_id: SampleId2;
    bbox: Bbox4;
    proposal: KnowledgeSuspect | null;
    origins: Origins1;
    origin_finding_id: OriginFindingId;
    origin_suggestion_id: OriginSuggestionId;
    audit_finding: AuditFinding | null;
    regions: Regions1;
    judgment: KnowledgeJudgment;
    affected_check_ids: AffectedCheckIds;
}
export interface RegionImage {
    source: Source3;
    annotation_id: AnnotationId2;
    label: Label2;
    bbox: Bbox5;
    check_ids: CheckIds5;
    origins: Origins2;
    image: VisualEvidence;
    crop_bbox: CropBbox2;
}
export interface KnowledgeJudgment {
    finding_id: FindingId2;
    status: Status3;
    affected_check_titles: AffectedCheckTitles;
    description: Description12;
    normal_explanation: NormalExplanation4;
    limitations: Limitations7;
    evidence_ids: EvidenceIds6;
    conflicts: Conflicts2;
}
export interface VerificationStep {
    step_id: StepId3;
    input_evidence_ids: InputEvidenceIds1;
    child_step_ids: ChildStepIds2;
    result: KnowledgeVerification;
}
export interface KnowledgeVerification {
    findings: Findings3;
}
export interface KnowledgeVersion {
    version_id: VersionId1;
    dataset_id: DatasetId1;
    kind: Kind1;
    parent_version_id: ParentVersionId1;
    normal_version_id: NormalVersionId2;
    model_name: ModelName1;
    created_at: CreatedAt1;
    source_count: SourceCount;
    check_count: CheckCount;
}
export interface KnowledgeQuery {
    knowledge: KnowledgeSnapshot | null;
    versions: Versions;
    freshness: KnowledgeFreshness | null;
}
export interface KnowledgeFreshness {
    status: Status4;
    checked_at: CheckedAt;
    current_version_id: CurrentVersionId;
    current_normal_version_id: CurrentNormalVersionId;
    source_changes: SourceChanges;
    additional_source_ids: AdditionalSourceIds;
    generation_changed: GenerationChanged;
    normal_version_changed: NormalVersionChanged;
    normal_sources_changed: NormalSourcesChanged;
}
export interface KnowledgeSourceChange {
    sample_id: SampleId3;
    reasons: Reasons;
}
export interface AuditStart {
    dataset_id: DatasetId2;
    origin_session_id?: OriginSessionId;
    model_name?: ModelName2;
    normal_version_id?: NormalVersionId3;
    defect_version_id?: DefectVersionId1;
    sample_ids?: SampleIds;
    filters?: Filters;
}
export interface Filters {
    [k: string]: unknown;
}
export interface ModelCallDetail {
    call_id: CallId;
    run_id: RunId;
    operation: Operation;
    schema_name: SchemaName;
    phase: Phase;
    sample_id: SampleId4;
    started_at: StartedAt;
    finished_at: FinishedAt;
    elapsed_ms: ElapsedMs;
    http_status: HttpStatus;
    response_id: ResponseId;
    response_model: ResponseModel;
    finish_reason: FinishReason;
    usage: Usage;
    error: ModelCallError | null;
    request_body: RequestBody;
    response_body: ResponseBody;
}
export interface ModelCallError {
    type: Type;
    message: Message;
}
export interface JobRetry {
    run_id: RunId1;
    sample_ids?: SampleIds1;
}
export interface JobSnapshot {
    run_id: RunId2;
    task_id: TaskId;
    dataset_id: DatasetId3;
    job_type: JobType;
    origin_session_id: OriginSessionId1;
    root_run_id: RootRunId;
    parent_run_id: ParentRunId;
    status: Status5;
    cancel_requested: CancelRequested;
    sample_ids: SampleIds2;
    completed_sample_ids: CompletedSampleIds;
    failed_sample_ids: FailedSampleIds;
    completed: Completed;
    failed: Failed;
    total_samples: TotalSamples;
    unprocessed: Unprocessed;
    progress: Progress;
    message: Message1;
    started_at: StartedAt1;
    finished_at: FinishedAt1;
    model_name: ModelName3;
    current_sample: JobSample | null;
    phase: Phase1;
    normal_version_id: NormalVersionId4;
    defect_version_id: DefectVersionId2;
    kind: Kind2;
    knowledge_version_id: KnowledgeVersionId;
    inspected_regions: InspectedRegions1;
    planned_regions: PlannedRegions1;
    completed_batches: CompletedBatches;
    total_batches: TotalBatches;
    errors: Errors;
    model_calls: ModelCalls;
    [k: string]: unknown;
}
export interface JobSample {
    sample_id: SampleId5;
    relative_path: RelativePath;
    sample_uuid: SampleUuid;
}
export interface JobFailure {
    sample_id: SampleId6;
    relative_path: RelativePath1;
    message: Message2;
    sample_uuid: SampleUuid1;
}
export interface ModelCallSummary {
    call_id: CallId1;
    run_id: RunId3;
    operation: Operation1;
    schema_name: SchemaName1;
    phase: Phase2;
    sample_id: SampleId7;
    started_at: StartedAt2;
    finished_at: FinishedAt2;
    elapsed_ms: ElapsedMs1;
    http_status: HttpStatus1;
    response_id: ResponseId1;
    response_model: ResponseModel1;
    finish_reason: FinishReason1;
    usage: Usage1;
    error: ModelCallError | null;
}
export interface JobRetryOptions {
    run_id: RunId4;
    root_run_id: RootRunId1;
    selection_mode: SelectionMode;
    active_run_id: ActiveRunId;
    samples: Samples;
}
export interface RetrySample {
    sample_id: SampleId8;
    relative_path: RelativePath2;
    state: State;
    sample_uuid: SampleUuid2;
}
export interface InspectionReference {
    dataset_id: DatasetId4;
    sample_id: SampleId9;
    suggestion_id: SuggestionId;
    finding_id?: FindingId3;
    evidence_id?: EvidenceId2;
}
export interface InspectionSnapshot {
    reference: InspectionReference1;
    sample: Sample;
    analysis: AuditAnalysis;
    evidence: Evidence1;
    audit_run_id: AuditRunId;
    origin_session_id: OriginSessionId2;
    is_latest: IsLatest;
}
export interface InspectionReference1 {
    dataset_id: DatasetId5;
    sample_id: SampleId10;
    suggestion_id: SuggestionId1;
    finding_id: FindingId4;
    evidence_id: EvidenceId3;
}
export interface Sample {
    sample_id: SampleId11;
    task_id: TaskId1;
    dataset_id?: DatasetId6;
    image_path: ImagePath;
    relative_path: RelativePath3;
    quality_status: QualityStatus;
    quality_source?: QualitySource;
    data_origin?: DataOrigin;
    batch_id?: BatchId;
    physical_sample_id?: PhysicalSampleId;
    capture_sequence_id?: CaptureSequenceId;
    station?: Station;
    camera?: Camera;
    width: Width;
    height: Height;
    sample_uuid: SampleUuid3;
}
export interface DatasetImport {
    name: Name;
    image_dir: ImageDir;
    annotation_dir: AnnotationDir;
    archive_path?: ArchivePath;
    unannotated_is_normal?: UnannotatedIsNormal;
}
export interface ArchiveInspection {
    archive_path: ArchivePath1;
    sha256: Sha2562;
    file_count: FileCount;
    uncompressed_bytes: UncompressedBytes;
    directories: Directories;
}
export interface ArchiveDirectory {
    path: Path;
    image_count: ImageCount;
    annotation_count: AnnotationCount;
}
export interface ScanResult {
    dataset_id: DatasetId7;
    task_id: TaskId2;
    image_count: ImageCount1;
    annotation_count: AnnotationCount1;
    issue_count: IssueCount;
    db_path: DbPath;
}
export interface DatasetReport {
    dataset_id: DatasetId8;
    task_id: TaskId3;
    total_samples: TotalSamples1;
    vlm_audited_count: VlmAuditedCount;
    vlm_coverage_pct: VlmCoveragePct;
    vlm_anomalies_count: VlmAnomaliesCount;
    technical_quality_issues: TechnicalQualityIssues;
    human_reviewed_count: HumanReviewedCount;
    human_pass_count: HumanPassCount;
    human_fail_count: HumanFailCount;
    human_uncertain_count: HumanUncertainCount;
    human_skipped_count: HumanSkippedCount;
    pending_risk_count: PendingRiskCount;
    categories: Categories;
    generated_at: GeneratedAt;
    quality: QualityAssessment;
}
export interface Categories {
    [k: string]: number;
}
export interface QualityAssessment {
    version: Version;
    scope: QualityScope;
    technical_usability: QualityRatio;
    audit_coverage: QualityRatio;
    human_verification_coverage: QualityRatio;
    model: ModelIndicators;
    knowledge_versions: KnowledgeVersions;
    audit_run_ids: AuditRunIds;
}
export interface QualityScope {
    observed_inputs: ObservedInputs;
    registered_samples: RegisteredSamples;
    unregistered_inputs: UnregisteredInputs;
    basis: Basis;
    selection: Selection;
    limitations: Limitations8;
}
export interface QualityRatio {
    numerator: Numerator;
    denominator: Denominator;
    basis: Basis1;
    percent: Percent;
}
export interface ModelIndicators {
    suspect_samples: SuspectSamples;
    finding_count: FindingCount;
    uncertain_samples: UncertainSamples;
    missing_evidence_samples: MissingEvidenceSamples;
    conflict_samples: ConflictSamples;
    unstructured_samples: UnstructuredSamples;
}
export interface KnowledgeUsage {
    normal_version_id: NormalVersionId5;
    defect_version_id: DefectVersionId3;
    legacy_profile_id: LegacyProfileId1;
    sample_count: SampleCount;
}
export interface MiningStart {
    dataset_id: DatasetId9;
    origin_session_id?: OriginSessionId3;
    kind: Kind3;
    normal_version_id?: NormalVersionId6;
    model_name?: ModelName4;
    sample_ids?: SampleIds3;
    base_version_id?: BaseVersionId;
    corrections?: Corrections1;
}
export interface Annotation {
    annotation_id: AnnotationId3;
    sample_id: SampleId12;
    annotation_type: AnnotationType;
    raw_label: RawLabel;
    phenomenon?: Phenomenon;
    bbox?: Bbox6;
    polygon?: Polygon;
    mask_path?: MaskPath;
    mask_sha256?: MaskSha256;
    geometry_status?: GeometryStatus;
    source?: AnnotationSource;
    source_width?: SourceWidth;
    source_height?: SourceHeight;
}
export interface ReviewDecisionRecord {
    decision_id: DecisionId;
    sample_id: SampleId13;
    decision: Decision;
    reviewer: Reviewer;
    reason_code: ReasonCode;
    comment: Comment;
    evidence_version: EvidenceVersion;
    review_session_id: ReviewSessionId;
    started_at: StartedAt3;
    submitted_at: SubmittedAt;
    review_duration_ms: ReviewDurationMs;
}
export interface ReviewSubmission {
    submission_id: SubmissionId;
    dataset_id: DatasetId10;
    sample_id: SampleId14;
    reviewer: Reviewer1;
    decision: ReviewDecisionEnum;
    reason_code?: ReasonCode1;
    comment?: Comment1;
    duration_ms?: DurationMs;
    started_at?: StartedAt4;
}
export interface ReviewHistoryQuery {
    dataset_id: DatasetId11;
    page?: Page;
    page_size?: PageSize;
    search?: Search;
}
export interface ReviewHistoryPage {
    items: Items;
    total: Total;
    page: Page1;
    page_size: PageSize1;
}
export interface ReviewHistoryRecord {
    decision_id: DecisionId1;
    sample_id: SampleId15;
    decision: Decision1;
    reviewer: Reviewer2;
    reason_code: ReasonCode2;
    comment: Comment2;
    evidence_version: EvidenceVersion1;
    review_session_id: ReviewSessionId1;
    started_at: StartedAt5;
    submitted_at: SubmittedAt1;
    review_duration_ms: ReviewDurationMs1;
    relative_path: RelativePath4;
}
export interface SampleQuery {
    dataset_id?: DatasetId12;
    task_id?: TaskId4;
    page?: Page2;
    page_size?: PageSize2;
    annotation_filters?: AnnotationFilters;
    model_status?: ModelStatus;
    review_status?: ReviewStatus;
    technical?: Technical;
    reference_status?: ReferenceStatus;
    search?: Search1;
    sort_by?: SortBy;
}
//# sourceMappingURL=domain.generated.d.ts.map