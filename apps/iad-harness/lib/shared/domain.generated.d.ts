export type DatasetId = string;
export type Kind = "normal" | "defect";
export type Instruction = string;
export type Objective = string;
export type DirectionId = string;
export type Title = string;
export type Instruction1 = string;
export type Enabled = boolean;
export type Origin = "preset" | "dataset";
export type Directions = MiningDirection[];
export type Revision = string;
export type Customized = boolean;
export type DatasetId1 = string;
export type Kind1 = "normal" | "defect";
export type ExpectedRevision = string;
export type VersionId = string;
export type DatasetId2 = string;
export type Kind2 = "normal" | "defect";
export type Recorded = boolean;
export type Name = string;
export type Location = string;
/**
 * @minItems 1
 */
export type EvidenceIds = [string, ...string[]];
export type Parts = ObservedPart[];
export type Total = number;
export type Page = number;
export type PageSize = number;
/**
 * 用户选中的方向编号；模型自主发现的新方向填null，不能冒用未选择的方向
 */
export type DirectionId1 = string | null;
/**
 * 本轮观察标题；所选方向身份以direction_id为准，自主发现方向填写新标题
 */
export type Direction = string;
/**
 * 引用parts内实际可见部件名称；不适用时可为空
 */
export type Subjects = string[];
export type Status = "已形成知识" | "证据不足" | "不可观察" | "不适用";
export type Reason = string;
/**
 * 引用本次checks实际标题；不是预设旧条目的完整性证明
 */
export type CheckTitles = string[];
export type EvidenceIds1 = string[];
export type Items = DiscoveryArea[];
export type RunId = string;
export type Status1 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type KnowledgeVersionId = string | null;
export type PlannedSources = number;
export type ObservedSources = number;
export type CompleteSources = number;
export type PlannedVisuals = number;
export type ObservedVisuals = number;
export type PublishedSources = number;
export type Page1 = number;
export type PageSize1 = number;
export type Total1 = number;
export type SampleId = string;
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
export type Observed = boolean;
export type Items1 = KnowledgeTraceItem[];
export type DatasetId3 = string;
export type Kind3 = "normal" | "defect";
export type Objective1 = string;
export type Search = string;
export type Seed = number | null;
export type StartingVersionId = string | null;
export type NormalVersionId = string | null;
export type Search1 = string;
export type Seed1 = number | null;
export type ScopeRunId = string;
export type DatasetId4 = string;
export type Kind4 = "normal" | "defect";
export type Objective2 = string;
export type Status2 = "ACTIVE" | "STOPPED";
export type CurrentVersionId = string | null;
export type NormalVersionId1 = string | null;
export type Total2 = number;
export type Observed1 = number;
export type ValidObserved = number;
export type Stale = number;
export type Excluded = number;
export type Recheck = number;
export type Unprocessed = number;
export type Remaining = number;
export type PendingReview = number;
export type RunIds = string[];
export type VersionIds = string[];
export type ActiveRunIds = string[];
export type VersionId1 = string;
export type CheckId = string | null;
export type Section = "checks" | "discovery";
export type Page2 = number;
export type PageSize2 = number;
export type VersionId2 = string;
export type DatasetId5 = string;
export type Kind5 = "normal" | "defect";
export type Total3 = number;
export type Page3 = number;
export type PageSize3 = number;
export type Title1 = string;
export type Subject = string;
export type Location1 = string;
export type Criterion = string;
export type AllowedVariations = string[];
export type Limitations = string[];
/**
 * supported：本轮实际证据支持该可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status3 = "supported" | "provisional" | "conflicted";
export type PendingRecheckSourceCount = number;
export type CheckId1 = string;
export type SupportCount = number;
export type CounterCount = number;
export type ConflictIds = string[];
export type SupportLimitations = string[];
export type Items2 = KnowledgeCheckSummary[];
export type VersionId3 = string;
export type DatasetId6 = string;
export type Kind6 = "normal" | "defect";
export type Total4 = number;
export type Page4 = number;
export type PageSize4 = number;
export type SampleId1 = string;
export type Items3 = KnowledgeEvidence[];
export type ScopeRunId1 = string | null;
export type VersionId4 = string;
export type ConflictId = string;
export type DatasetId7 = string;
export type ConflictId1 = string;
export type Category = "observation" | "retirement_proposal";
export type OriginVersionId = string;
export type SubmissionId = string;
export type Status4 = "resolved" | "unresolved" | "insufficient";
export type Description = string;
/**
 * @minItems 1
 */
export type EvidenceIds2 = [string, ...string[]];
export type Limitations1 = string[];
export type CheckIds = string[];
export type SampleId2 = string;
export type SourceSha2561 = string;
export type Bbox = number[] | null;
export type ObservationStepIds = string[];
export type NewEvidenceIds = string[];
export type ComparisonEvidenceIds = string[];
export type Description1 = string;
export type NormalExplanation = string;
export type Limitations2 = string[];
export type Title2 = string;
export type Subject1 = string;
export type Location2 = string;
export type Criterion1 = string;
export type AllowedVariations1 = string[];
export type Limitations3 = string[];
/**
 * supported：本轮实际证据支持该可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status5 = "supported" | "provisional" | "conflicted";
export type SupportEvidenceIds = string[];
export type CounterEvidenceIds = string[];
export type RecheckSampleIds = string[];
export type SupportLimitations1 = string[];
export type ConflictIds1 = string[];
export type CheckId2 = string;
export type PredecessorCheckIds = string[];
export type FindingIds = string[];
export type NormalCheckIds = string[];
export type Checks = KnowledgeCheck[];
export type Evidence = KnowledgeEvidence[];
export type VersionId5 = string;
export type ConflictId2 = string;
export type SubmissionId1 = string;
export type ContextSignature = string;
export type Reviewer = string;
export type Action = "retain" | "revise" | "retire" | "need_evidence";
export type Instruction2 = string;
export type Reason1 = string;
export type CreatedAt = string;
export type Events = KnowledgeReviewEvent[];
export type DecisionId = string;
export type SampleId3 = string;
export type Decision = string;
export type Reviewer1 = string;
export type ReasonCode = string | null;
export type Comment = string | null;
export type EvidenceVersion = string;
export type ReviewSessionId = string | null;
export type StartedAt = string | null;
export type SubmittedAt = string | null;
export type ReviewDurationMs = number;
export type IsLatest = boolean;
export type SourceCurrent = boolean;
export type State = "pending_review" | "pending_recheck" | "resolved";
export type ContextSignature1 = string;
export type VersionId6 = string;
export type ConflictId3 = string;
export type SubmissionId2 = string;
export type ContextSignature2 = string;
export type Reviewer2 = string;
export type Action1 = "retain" | "revise" | "retire" | "need_evidence";
export type Instruction3 = string;
export type Reason2 = string;
export type VersionId7 = string;
export type ConflictId4 = string;
export type DatasetId8 = string;
export type Kind7 = "normal" | "defect";
export type SampleId4 = string;
export type Description2 = string;
export type State1 = "pending_review" | "pending_recheck" | "resolved";
export type NormalVersionId2 = string | null;
export type DefectVersionId = string | null;
export type LegacyProfileId = string | null;
export type KnowledgeLimitations = string[];
export type Description3 = string;
export type PositionAnalysis = string;
export type IlluminationAnalysis = string;
export type CheckId3 = string;
/**
 * normal：符合正常判据或未命中异常判据；anomaly：偏离正常判据或命中异常判据；不可观察/缺证为insufficient；不适用为not_applicable，须解释原因
 */
export type Status6 = "normal" | "anomaly" | "insufficient" | "not_applicable";
/**
 * @minItems 1
 */
export type EvidenceIds3 = [string, ...string[]];
export type Limitations4 = string[];
/**
 * 图像归一化坐标 [x1,y1,x2,y2]，范围 0..1000
 *
 * @minItems 4
 * @maxItems 4
 */
export type Bbox1000 = [number, number, number, number];
export type Reason3 = string;
export type CheckIds1 = string[];
/**
 * 该判据尚需补充细看的区域；仅填尚无足够原分辨率证据的区域，坐标相对整图
 */
export type InspectionRegions = RegionProposal[];
export type CheckAssessments = CheckAssessment[];
/**
 * 关联此现象影响的全部冻结检查项。一个现象可同时影响正常和异常判据，应合并为一个finding并在此列全相关check_id；所有status=anomaly的检查项必须至少被一个finding引用，不得只填异常知识中的check_id。新现象尚无判据时可为空，不得伪造检查项
 */
export type CheckIds2 = string[];
export type Location3 = LocalFindingLocation | GlobalFindingLocation;
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
export type Bbox1 = [number, number, number, number];
export type Description4 = string;
/**
 * 仅用于整体结构关系，不用于规避局部现象的定位
 */
export type Scope1 = "global";
export type Bbox2 = null;
export type Description5 = string;
/**
 * 一句可见现象
 */
export type Description6 = string;
export type Hypothesis = string;
/**
 * 需排除的合理正常解释，不能直接把疑点视为缺陷事实
 */
export type NormalExplanation1 = string;
export type Limitations5 = string[];
export type ReviewAction = string;
/**
 * 人工复核顺序，不代表缺陷概率
 */
export type Priority = "high" | "medium" | "low";
/**
 * @minItems 1
 */
export type EvidenceIds4 = [string, ...string[]];
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
export type PlannedRegions = number;
export type InspectedRegions = number;
export type Complete = boolean;
export type Missing = string[];
export type Description7 = string;
export type PositionAnalysis1 = string;
export type IlluminationAnalysis1 = string;
export type SuspectRegions = RegionProposal[];
export type Source1 = "annotation" | "model" | "coverage";
export type AnnotationId = string | null;
export type Label = string;
export type Bbox3 = number[];
export type CheckIds3 = string[];
export type Source2 = "annotation" | "model" | "coverage";
export type AnnotationId1 = string | null;
export type Label1 = string;
export type Bbox4 = number[];
export type CheckIds4 = string[];
export type Origins = RegionOrigin[];
export type CropBbox1 = number[];
export type Description8 = string;
export type PositionAnalysis2 = string;
export type IlluminationAnalysis2 = string;
export type Regions = RegionEvidence[];
export type AuxiliaryEvidence = VisualEvidence[];
/**
 * 一句话综合建议，指出优先复核位置与问题；整体和局部观察放在对应字段，不重复长篇视觉描述
 */
export type Description9 = string;
export type PositionAnalysis3 = string;
export type IlluminationAnalysis3 = string;
export type SuggestedLabel = "PASS" | "FAIL" | "UNCERTAIN";
export type ReasonCategory = string;
export type Confidence = number;
export type DefectLocation = string;
/**
 * @minItems 1
 */
export type EvidenceIds5 = [string, ...string[]];
export type Conflicts = string[];
export type MissingEvidence = string[];
export type StepId1 = string;
export type InputEvidenceIds = string[];
export type ChildStepIds = string[];
export type Result = VlmResult | JointAnalysis;
/**
 * 一句话综合建议，指出优先复核位置与问题；整体和局部观察放在对应字段，不重复长篇视觉描述
 */
export type Description10 = string;
export type PositionAnalysis4 = string;
export type IlluminationAnalysis4 = string;
export type SuggestedLabel1 = "PASS" | "FAIL" | "UNCERTAIN";
export type ReasonCategory1 = string;
export type Confidence1 = number;
export type DefectLocation1 = string;
/**
 * @minItems 1
 */
export type EvidenceIds6 = [string, ...string[]];
export type Conflicts1 = string[];
export type MissingEvidence1 = string[];
export type Description11 = string;
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
export type CheckIds5 = string[];
export type Location4 = LocalFindingLocation | GlobalFindingLocation;
/**
 * 一句可见现象
 */
export type Description12 = string;
export type Hypothesis1 = string;
/**
 * 需排除的合理正常解释，不能直接把疑点视为缺陷事实
 */
export type NormalExplanation2 = string;
export type Limitations6 = string[];
export type ReviewAction1 = string;
/**
 * 人工复核顺序，不代表缺陷概率
 */
export type Priority1 = "high" | "medium" | "low";
/**
 * @minItems 1
 */
export type EvidenceIds7 = [string, ...string[]];
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
export type Description13 = string;
export type NormalExplanation3 = string;
/**
 * @minItems 1
 */
export type EvidenceIds8 = [string, ...string[]];
export type ResolvedFindings = FindingResolution[];
export type JointSteps = SynthesisStep[];
export type VersionId8 = string;
export type DatasetId9 = string;
export type Kind8 = "normal" | "defect";
export type ParentVersionId = string | null;
export type NormalVersionId3 = string | null;
export type ModelName = string;
export type GenerationVersion = string;
export type Signature = string;
export type Summary = string;
export type Checks1 = KnowledgeCheck[];
/**
 * 仅引用冻结父版本候选checks内的同类型旧条目ID；正常比较基准不是异常知识的父条目，无同类型预设时revisions为空
 */
export type PreviousCheckId = string;
/**
 * 同一判据对应的当前检查项；拆分可多项，退役为空。仅改措辞或允许变化保持一对一
 */
export type CurrentCheckTitles = string[];
export type Reason4 = string;
export type Revisions = CheckRevision[];
/**
 * 冻结基准版本中的检查项ID
 */
export type CheckId4 = string;
/**
 * 待视觉核验的人工修订建议，不是已证实事实
 */
export type Instruction4 = string;
export type Corrections = KnowledgeCorrection[];
export type SampleId5 = string;
export type Sha2561 = string;
export type AnnotationsSha256 = string;
export type QualityStatus = string | null;
export type QualitySource = string | null;
export type ReviewSha256 = string;
export type AuditSuggestionIds = string[];
export type Qualification = "human_pass" | "human_hard_normal" | "manual_selection" | "raw_pass" | "initial_unannotated" | "human_fail" | "human_uncertain" | "human_skip" | "raw_fail" | "annotated_candidate" | "normal_suspect" | "audit_suspect";
export type PixelSha256 = string | null;
export type ComparisonSources = KnowledgeSource[];
export type EvidenceId1 = string;
/**
 * 相对evidence_id对应图像的归一化坐标0..1000
 *
 * @minItems 4
 * @maxItems 4
 */
export type Bbox10001 = [number, number, number, number];
export type Description14 = string;
export type NormalExplanation4 = string;
export type Suspects = KnowledgeSuspect[];
export type Limitations7 = string[];
export type Sources = KnowledgeSource[];
export type Evidence1 = KnowledgeEvidence[];
export type StepId2 = string;
export type ImageEvidenceIds = string[];
export type ChildStepIds1 = string[];
export type Summary1 = string;
export type Title3 = string;
export type Subject2 = string;
export type Location5 = string;
export type Criterion2 = string;
export type AllowedVariations2 = string[];
export type Limitations8 = string[];
/**
 * supported：本轮实际证据支持该可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status7 = "supported" | "provisional" | "conflicted";
export type SupportEvidenceIds1 = string[];
export type CounterEvidenceIds1 = string[];
export type Checks2 = LearnedCheck[];
export type Suspects1 = KnowledgeSuspect[];
export type Limitations9 = string[];
export type Revisions1 = CheckRevision[];
export type Parts1 = ObservedPart[];
export type Areas = DiscoveryArea[];
export type MiningSteps = KnowledgeStep[];
export type StepId3 = string;
export type VersionId9 = string;
export type Purpose = "current" | "comparison" | "revision";
export type Checks3 = KnowledgeCheck[];
export type InputEvidenceIds1 = string[];
export type CheckId5 = string;
export type SampleId6 = string;
export type Status8 = "supports" | "contradicts" | "unobservable";
export type Description15 = string;
export type PositionAnalysis6 = string;
export type IlluminationAnalysis6 = string;
export type NormalExplanation5 = string;
/**
 * @minItems 1
 */
export type EvidenceIds9 = [string, ...string[]];
export type Suspects2 = KnowledgeSuspect[];
export type Observations = KnowledgeObservation[];
export type ObservationSteps = KnowledgeObservationStep[];
export type Conflicts2 = KnowledgeConflict[];
export type ReviewApplications = KnowledgeRecheckDecision[];
export type FindingId1 = string;
export type SampleId7 = string;
export type Bbox5 = number[];
export type Origins1 = RegionOrigin[];
export type OriginFindingId = string | null;
export type OriginSuggestionId = string | null;
export type Source3 = "annotation" | "model" | "coverage";
export type AnnotationId2 = string | null;
export type Label2 = string;
export type Bbox6 = number[];
export type CheckIds6 = string[];
export type Origins2 = RegionOrigin[];
export type CropBbox2 = number[];
export type Regions1 = RegionImage[];
export type FindingId2 = string;
export type Status9 = "supported" | "refuted" | "insufficient";
export type AffectedCheckTitles = string[];
export type Description16 = string;
export type NormalExplanation6 = string;
export type Limitations10 = string[];
/**
 * @minItems 1
 */
export type EvidenceIds10 = [string, ...string[]];
/**
 * 仅填写尚未消解的证据判断矛盾；目标偏离正常规则本身不是判断矛盾
 */
export type Conflicts3 = string[];
export type AffectedCheckIds = string[];
export type Findings2 = KnowledgeFinding[];
export type StepId4 = string;
export type InputEvidenceIds2 = string[];
export type ChildStepIds2 = string[];
export type Findings3 = KnowledgeJudgment[];
export type VerificationSteps = VerificationStep[];
export type MinSourceGroups = number | null;
export type SupportGroups = {
    [k: string]: string;
} | null;
export type ScopeRunId2 = string | null;
export type ObservedSourceIds = string[] | null;
export type KnowledgePreset = string[] | null;
export type SubmissionId3 = string;
export type CheckId6 = string;
export type Instruction5 = string;
export type Signature1 = string;
export type CreatedAt1 = string;
export type VersionId10 = string;
export type DatasetId10 = string;
export type Kind9 = "normal" | "defect";
export type ParentVersionId1 = string | null;
export type NormalVersionId4 = string | null;
export type ModelName1 = string;
export type CreatedAt2 = string;
export type SourceCount = number;
export type CheckCount = number;
export type Versions = KnowledgeVersion[];
export type Status10 = "current" | "changed" | "unverified";
export type CheckedAt = string;
export type CurrentVersionId1 = string | null;
export type CurrentNormalVersionId = string | null;
export type SampleId8 = string;
export type Reasons = ("image" | "annotations" | "review" | "audit_candidates" | "qualification" | "unavailable")[];
export type SourceChanges = KnowledgeSourceChange[];
export type AdditionalSourceIds = string[];
export type GenerationChanged = boolean | null;
export type NormalVersionChanged = boolean;
export type NormalSourcesChanged = boolean;
export type EligibleSourceCount = number;
export type UnavailableSourceCount = number;
/**
 * 仅查询所选版本中判据修订后尚待视觉重核验的历史合格来源
 */
export type RecheckFromVersion = string | null;
/**
 * 明确重核验选图时包含已观察的合格来源；不扩大冻结范围，不启动作业
 */
export type IncludeObserved = boolean;
export type ScopeRunId3 = string | null;
export type DatasetId11 = string;
export type Kind10 = "normal" | "defect";
export type NormalVersionId5 = string | null;
/**
 * 仅查询指定版本语义链尚未观察的新来源；已变更旧来源单列待重核验
 */
export type UncoveredFromVersion = string | null;
export type Page5 = number;
/**
 * 每页1..200，默认10；仅取本次已确认图组所需引用，不预先枚举全库
 */
export type PageSize5 = number;
export type Search2 = string;
export type DatasetId12 = string;
export type Kind11 = "normal" | "defect";
export type NormalVersionId6 = string | null;
export type Total5 = number;
export type UnavailableSourceCount1 = number;
export type Page6 = number;
export type PageSize6 = number;
export type SampleId9 = string;
export type RelativePath = string;
export type Qualification1 = string;
export type Items4 = KnowledgeSourceItem[];
export type Recheck1 = number;
export type VersionId11 = string | null;
export type Total6 = number;
export type Observed2 = number;
export type PendingReview1 = number;
export type Stale1 = number;
export type Remaining1 = number;
export type DatasetId13 = string;
export type OriginSessionId = string | null;
export type ModelName2 = string | null;
export type NormalVersionId7 = string | null;
export type DefectVersionId1 = string | null;
export type SampleIds = string[] | null;
export type CallId = string;
export type RunId1 = string;
export type Operation = "tokenize" | "generate";
export type SchemaName = string;
export type Phase = string | null;
export type SampleId10 = string | null;
export type StartedAt1 = string;
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
export type RunId2 = string;
export type SampleIds1 = string[] | null;
export type RunId3 = string;
export type TaskId = string;
export type DatasetId14 = string;
export type JobType = "MODEL_AUDIT" | "NORMAL_KNOWLEDGE" | "DEFECT_KNOWLEDGE";
export type OriginSessionId1 = string | null;
export type RootRunId = string;
export type ParentRunId = string | null;
export type Status11 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type CancelRequested = boolean;
export type SampleIds2 = string[];
export type CompletedSampleIds = string[];
export type FailedSampleIds = string[];
export type Completed = number;
export type Failed = number;
export type TotalSamples = number;
export type Unprocessed1 = number;
export type Progress = number;
export type Message1 = string;
export type StartedAt2 = string | null;
export type FinishedAt1 = string | null;
export type DeletedAt = string | null;
export type ModelName3 = string;
export type SampleId11 = string;
export type RelativePath1 = string | null;
export type SampleUuid = string;
export type Phase1 = string | null;
export type NormalVersionId8 = string | null;
export type DefectVersionId2 = string | null;
export type Kind12 = ("normal" | "defect") | null;
export type KnowledgeVersionId1 = string | null;
export type InspectedRegions1 = number | null;
export type PlannedRegions1 = number | null;
export type CompletedBatches = number | null;
export type TotalBatches = number | null;
export type SampleId12 = string;
export type RelativePath2 = string | null;
export type Message2 = string;
export type SampleUuid1 = string;
export type Errors = JobFailure[];
export type CallId1 = string;
export type RunId4 = string;
export type Operation1 = "tokenize" | "generate";
export type SchemaName1 = string;
export type Phase2 = string | null;
export type SampleId13 = string | null;
export type StartedAt3 = string;
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
export type RunId5 = string;
export type RootRunId1 = string;
export type SelectionMode = "subset" | "all_sources";
export type ActiveRunId = string | null;
export type SampleId14 = string;
export type RelativePath3 = string | null;
export type State2 = "failed" | "unprocessed";
export type SampleUuid2 = string;
export type Samples = RetrySample[];
export type DatasetId15 = string;
export type SampleId15 = string;
export type SuggestionId = string;
export type FindingId3 = string | null;
export type EvidenceId2 = string | null;
export type DatasetId16 = string;
export type SampleId16 = string;
export type SuggestionId1 = string;
export type FindingId4 = string | null;
export type EvidenceId3 = string | null;
export type SampleId17 = string;
export type TaskId1 = string;
export type DatasetId17 = string;
export type ImagePath = string;
export type RelativePath4 = string;
export type QualityStatus1 = "PASS" | "FAIL" | "UNCERTAIN";
export type QualitySource1 = string | null;
export type IsExcluded = boolean;
export type DataOrigin = "LEGACY_TRAIN" | "LEGACY_TEST" | "AUGMENTED" | "MISSED_CASE" | "PRODUCTION" | "UNKNOWN";
export type BatchId = string | null;
export type PhysicalSampleId = string | null;
export type CaptureSequenceId = string | null;
export type Station = string | null;
export type Camera = string | null;
export type Width = number;
export type Height = number;
export type SampleUuid3 = string;
export type Evidence2 = VisualEvidence[];
export type AuditRunId = string | null;
export type OriginSessionId2 = string | null;
export type IsLatest1 = boolean;
export type DatasetImport = LabelmeImport | FolderClassificationImport;
export type Format = "labelme";
export type Name1 = string;
export type ImageDir = string;
export type AnnotationDir = string;
export type ArchivePath = string | null;
export type UnannotatedIsNormal = boolean;
export type Format1 = "folder_classification";
export type Name2 = string;
export type RootDir = string;
/**
 * Relative directory path under dataset root, or '.' for root images
 */
export type Path = string;
/**
 * Role assigned to this directory
 */
export type Role1 = "normal" | "anomaly" | "unlabeled" | "excluded";
export type Rules = FolderRule[];
export type PreviewFingerprint = string;
export type Format2 = "folder_classification";
export type RootDir1 = string;
export type SuggestedName = string;
export type TotalImages = number;
export type Path1 = string;
export type ImageCount = number;
export type SuggestedRole = "normal" | "anomaly" | "unlabeled" | "excluded";
export type Role2 = "normal" | "anomaly" | "unlabeled" | "excluded";
export type Items5 = FolderPreviewItem[];
export type Conflicts4 = string[];
export type PreviewFingerprint1 = string;
export type ArchivePath1 = string;
export type Sha2562 = string;
export type FileCount = number;
export type UncompressedBytes = number;
export type Path2 = string;
export type ImageCount1 = number;
export type AnnotationCount = number;
export type Directories = ArchiveDirectory[];
export type DatasetId18 = string;
export type TaskId2 = string;
export type ImageCount2 = number;
export type AnnotationCount1 = number;
export type IssueCount = number;
export type DbPath = string;
export type DatasetId19 = string | null;
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
export type Limitations11 = string[];
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
export type RawOk = number;
export type RawNg = number;
export type RawUnlabeled = number;
export type ModelPass = number;
export type ModelFail = number;
export type ModelUncertain = number;
export type Unaudited = number;
export type InconsistentCount = number;
export type SourceChangedCount = number;
export type SourceUnverifiedCount = number;
export type NormalVersionId9 = string | null;
export type DefectVersionId3 = string | null;
export type LegacyProfileId1 = string | null;
export type SampleCount = number;
export type KnowledgeVersions = KnowledgeUsage[];
export type AuditRunIds = string[];
/**
 * 可选知识版本引用；省略或空列表表示不使用预设，不隐式读取当前版本
 */
export type KnowledgePreset1 = string[] | null;
/**
 * 本次原始图像数量，必须严格等于images长度
 */
export type ImageCount3 = number;
/**
 * 从knowledge_sources查询复制的已导入sample_id引用，不接受相对路径或图像编码
 *
 * @minItems 1
 */
export type Images = [string, ...string[]];
/**
 * 可选知识版本引用；省略或空列表表示不使用预设，不隐式读取当前版本
 */
export type KnowledgePreset2 = string[] | null;
/**
 * 本次原始图像数量，必须严格等于images长度
 */
export type ImageCount4 = number;
/**
 * 从knowledge_sources查询复制的已导入sample_id引用，不接受相对路径或图像编码
 *
 * @minItems 1
 */
export type Images1 = [string, ...string[]];
export type Kind13 = "normal" | "defect";
export type AnnotationId3 = string;
export type SampleId18 = string;
export type AnnotationType = "bbox" | "polygon" | "mask" | "image";
export type RawLabel = string;
export type Phenomenon = string | null;
export type Bbox7 = number[] | null;
export type Polygon = number[][] | null;
export type MaskPath = string | null;
export type MaskSha256 = string | null;
export type GeometryStatus = "VALID" | "CLIPPED" | "SCALED" | "INVALID";
export type AnnotationSource = "manual" | "existing_detector" | "production_system" | "imported" | "unknown";
export type SourceWidth = number | null;
export type SourceHeight = number | null;
export type SubmissionId4 = string;
export type DatasetId20 = string;
export type SampleId19 = string;
export type Reviewer3 = string;
export type ReviewDecisionEnum = "PASS" | "HARD_NORMAL" | "FAIL" | "UNCERTAIN" | "SKIP";
export type ReasonCode1 = string | null;
export type Comment1 = string | null;
export type DurationMs = number;
export type StartedAt4 = string | null;
export type DatasetId21 = string;
export type Page7 = number;
export type PageSize7 = number;
export type Search3 = string;
export type DecisionId1 = string;
export type SampleId20 = string;
export type Decision1 = string;
export type Reviewer4 = string;
export type ReasonCode2 = string | null;
export type Comment2 = string | null;
export type EvidenceVersion1 = string;
export type ReviewSessionId1 = string | null;
export type StartedAt5 = string | null;
export type SubmittedAt1 = string | null;
export type ReviewDurationMs1 = number;
export type RelativePath5 = string;
export type Items6 = ReviewHistoryRecord[];
export type Total7 = number;
export type Page8 = number;
export type PageSize8 = number;
export type DatasetId22 = string | null;
export type TaskId4 = string | null;
export type Page9 = number;
export type PageSize9 = number;
export type RawLabelFilters = ("PASS" | "FAIL" | "UNCERTAIN")[];
export type AnnotationFilters = string[];
export type ModelStatus = "all" | "pending" | "audited" | "risk" | "PASS" | "FAIL" | "UNCERTAIN";
export type ReviewStatus = "all" | "pending" | "reviewed" | "PASS" | "HARD_NORMAL" | "FAIL" | "UNCERTAIN" | "SKIP";
export type Technical = "all" | "issues";
export type ReferenceStatus = "all" | "candidate" | "excluded";
export type Search4 = string;
export type SortBy = "default" | "risk" | "tech";
export interface WorkbenchDomain {
    MiningPrompt?: MiningPrompt;
    MiningPromptEdit?: MiningPromptEdit;
    KnowledgeDiscoveryPage?: KnowledgeDiscoveryPage;
    KnowledgeTracePage?: KnowledgeTracePage;
    KnowledgeScopeOpen?: KnowledgeScopeOpen;
    KnowledgeScopeSnapshot?: KnowledgeScopeSnapshot;
    KnowledgeDetailQuery?: KnowledgeDetailQuery;
    KnowledgeCheckPage?: KnowledgeCheckPage;
    KnowledgeCheckEvidencePage?: KnowledgeCheckEvidencePage;
    KnowledgeReviewContext?: KnowledgeReviewContext;
    KnowledgeReviewSubmission?: KnowledgeReviewSubmission;
    KnowledgeReviewEvent?: KnowledgeReviewEvent;
    KnowledgeReviewItem?: KnowledgeReviewItem;
    AuditAnalysis?: AuditAnalysis;
    KnowledgeSnapshot?: KnowledgeSnapshot;
    KnowledgeVersion?: KnowledgeVersion;
    KnowledgeQuery?: KnowledgeQuery;
    KnowledgeSourceQuery?: KnowledgeSourceQuery;
    KnowledgeSourcePage?: KnowledgeSourcePage;
    AuditStart?: AuditStart;
    ModelCallDetail?: ModelCallDetail;
    JobRetry?: JobRetry;
    JobSnapshot?: JobSnapshot;
    JobRetryOptions?: JobRetryOptions;
    InspectionReference?: InspectionReference;
    InspectionSnapshot?: InspectionSnapshot;
    DatasetImport?: DatasetImport;
    FolderPreview?: FolderPreview;
    ArchiveInspection?: ArchiveInspection;
    ScanResult?: ScanResult;
    DatasetReport?: DatasetReport;
    MiningStart?: MiningStart;
    MiningRequest?: MiningRequest;
    Annotation?: Annotation;
    ReviewDecisionRecord?: ReviewDecisionRecord;
    ReviewSubmission?: ReviewSubmission;
    ReviewHistoryQuery?: ReviewHistoryQuery;
    ReviewHistoryPage?: ReviewHistoryPage;
    SampleQuery?: SampleQuery;
}
export interface MiningPrompt {
    dataset_id: DatasetId;
    kind: Kind;
    instruction: Instruction;
    configuration: MiningPromptConfiguration;
    revision: Revision;
    customized: Customized;
}
export interface MiningPromptConfiguration {
    objective: Objective;
    directions: Directions;
}
export interface MiningDirection {
    direction_id: DirectionId;
    title: Title;
    instruction: Instruction1;
    enabled: Enabled;
    origin: Origin;
}
export interface MiningPromptEdit {
    dataset_id: DatasetId1;
    kind: Kind1;
    expected_revision: ExpectedRevision;
    /**
     * 完整替换挖掘目标和方向；null恢复默认
     */
    configuration: MiningPromptConfiguration | null;
}
export interface KnowledgeDiscoveryPage {
    version_id: VersionId;
    dataset_id: DatasetId2;
    kind: Kind2;
    recorded: Recorded;
    parts: Parts;
    total: Total;
    page: Page;
    page_size: PageSize;
    items: Items;
}
export interface ObservedPart {
    name: Name;
    location: Location;
    evidence_ids: EvidenceIds;
}
export interface DiscoveryArea {
    direction_id: DirectionId1;
    direction: Direction;
    subjects: Subjects;
    status: Status;
    reason: Reason;
    check_titles: CheckTitles;
    evidence_ids: EvidenceIds1;
}
export interface KnowledgeTracePage {
    run_id: RunId;
    status: Status1;
    knowledge_version_id: KnowledgeVersionId;
    progress: JobObservationProgress;
    page: Page1;
    page_size: PageSize1;
    total: Total1;
    items: Items1;
}
export interface JobObservationProgress {
    planned_sources: PlannedSources;
    observed_sources: ObservedSources;
    complete_sources: CompleteSources;
    planned_visuals: PlannedVisuals;
    observed_visuals: ObservedVisuals;
    published_sources: PublishedSources;
}
export interface KnowledgeTraceItem {
    sample_id: SampleId;
    image: VisualEvidence;
    observed: Observed;
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
export interface KnowledgeScopeOpen {
    dataset_id: DatasetId3;
    kind: Kind3;
    objective: Objective1;
    search?: Search;
    seed?: Seed;
    starting_version_id?: StartingVersionId;
    normal_version_id?: NormalVersionId;
}
export interface KnowledgeScopeSnapshot {
    search: Search1;
    seed: Seed1;
    scope_run_id: ScopeRunId;
    dataset_id: DatasetId4;
    kind: Kind4;
    objective: Objective2;
    status: Status2;
    current_version_id: CurrentVersionId;
    normal_version_id: NormalVersionId1;
    total: Total2;
    observed: Observed1;
    valid_observed: ValidObserved;
    stale: Stale;
    excluded: Excluded;
    recheck: Recheck;
    unprocessed: Unprocessed;
    remaining: Remaining;
    pending_review: PendingReview;
    run_ids: RunIds;
    version_ids: VersionIds;
    active_run_ids: ActiveRunIds;
}
export interface KnowledgeDetailQuery {
    version_id: VersionId1;
    check_id?: CheckId;
    section?: Section;
    page?: Page2;
    page_size?: PageSize2;
}
export interface KnowledgeCheckPage {
    version_id: VersionId2;
    dataset_id: DatasetId5;
    kind: Kind5;
    total: Total3;
    page: Page3;
    page_size: PageSize3;
    items: Items2;
}
export interface KnowledgeCheckSummary {
    title: Title1;
    subject: Subject;
    location: Location1;
    criterion: Criterion;
    allowed_variations: AllowedVariations;
    limitations: Limitations;
    status: Status3;
    pending_recheck_source_count: PendingRecheckSourceCount;
    check_id: CheckId1;
    support_count: SupportCount;
    counter_count: CounterCount;
    conflict_ids: ConflictIds;
    support_limitations: SupportLimitations;
}
export interface KnowledgeCheckEvidencePage {
    version_id: VersionId3;
    dataset_id: DatasetId6;
    kind: Kind6;
    check: KnowledgeCheckSummary;
    total: Total4;
    page: Page4;
    page_size: PageSize4;
    items: Items3;
}
export interface KnowledgeEvidence {
    sample_id: SampleId1;
    image: VisualEvidence;
}
export interface KnowledgeReviewContext {
    scope_run_id: ScopeRunId1;
    reference: KnowledgeReviewReference;
    dataset_id: DatasetId7;
    conflict: KnowledgeConflict;
    checks: Checks;
    evidence: Evidence;
    events: Events;
    sample_review: ReviewDecisionRecord | null;
    is_latest: IsLatest;
    source_current: SourceCurrent;
    state: State;
    context_signature: ContextSignature1;
}
export interface KnowledgeReviewReference {
    version_id: VersionId4;
    conflict_id: ConflictId;
}
export interface KnowledgeConflict {
    conflict_id: ConflictId1;
    category: Category;
    origin_version_id: OriginVersionId;
    resolution: KnowledgeRecheckDecision | null;
    check_ids: CheckIds;
    sample_id: SampleId2;
    source_sha256: SourceSha2561;
    bbox: Bbox;
    observation_step_ids: ObservationStepIds;
    new_evidence_ids: NewEvidenceIds;
    comparison_evidence_ids: ComparisonEvidenceIds;
    description: Description1;
    normal_explanation: NormalExplanation;
    limitations: Limitations2;
}
export interface KnowledgeRecheckDecision {
    submission_id: SubmissionId;
    status: Status4;
    description: Description;
    evidence_ids: EvidenceIds2;
    limitations: Limitations1;
}
export interface KnowledgeCheck {
    title: Title2;
    subject: Subject1;
    location: Location2;
    criterion: Criterion1;
    allowed_variations: AllowedVariations1;
    limitations: Limitations3;
    status: Status5;
    support_evidence_ids: SupportEvidenceIds;
    counter_evidence_ids: CounterEvidenceIds;
    recheck_sample_ids: RecheckSampleIds;
    support_limitations: SupportLimitations1;
    conflict_ids: ConflictIds1;
    check_id: CheckId2;
    predecessor_check_ids: PredecessorCheckIds;
    finding_ids: FindingIds;
    normal_check_ids: NormalCheckIds;
}
export interface KnowledgeReviewEvent {
    version_id: VersionId5;
    conflict_id: ConflictId2;
    submission_id: SubmissionId1;
    context_signature: ContextSignature;
    reviewer: Reviewer;
    action: Action;
    instruction: Instruction2;
    reason: Reason1;
    created_at: CreatedAt;
}
export interface ReviewDecisionRecord {
    decision_id: DecisionId;
    sample_id: SampleId3;
    decision: Decision;
    reviewer: Reviewer1;
    reason_code: ReasonCode;
    comment: Comment;
    evidence_version: EvidenceVersion;
    review_session_id: ReviewSessionId;
    started_at: StartedAt;
    submitted_at: SubmittedAt;
    review_duration_ms: ReviewDurationMs;
}
export interface KnowledgeReviewSubmission {
    version_id: VersionId6;
    conflict_id: ConflictId3;
    submission_id: SubmissionId2;
    context_signature: ContextSignature2;
    reviewer: Reviewer2;
    action: Action1;
    instruction?: Instruction3;
    reason: Reason2;
}
export interface KnowledgeReviewItem {
    version_id: VersionId7;
    conflict_id: ConflictId4;
    dataset_id: DatasetId8;
    kind: Kind7;
    sample_id: SampleId4;
    description: Description2;
    state: State1;
}
export interface AuditAnalysis {
    normal_version_id: NormalVersionId2;
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
    description: Description3;
    position_analysis: PositionAnalysis;
    illumination_analysis: IlluminationAnalysis;
    check_id: CheckId3;
    status: Status6;
    evidence_ids: EvidenceIds3;
    limitations: Limitations4;
    inspection_regions: InspectionRegions;
}
export interface RegionProposal {
    bbox_1000: Bbox1000;
    reason: Reason3;
    check_ids: CheckIds1;
}
export interface AuditFinding {
    check_ids: CheckIds2;
    location: Location3;
    description: Description6;
    hypothesis: Hypothesis;
    normal_explanation: NormalExplanation1;
    limitations: Limitations5;
    review_action: ReviewAction;
    priority: Priority;
    evidence_ids: EvidenceIds4;
    related_findings: RelatedFindings;
    finding_id: FindingId;
    source_step_ids: SourceStepIds;
}
export interface LocalFindingLocation {
    scope: Scope;
    bbox: Bbox1;
    description: Description4;
}
export interface GlobalFindingLocation {
    scope: Scope1;
    bbox: Bbox2;
    description: Description5;
}
export interface FindingReference {
    step_id: StepId;
    finding_index: FindingIndex;
}
export interface Coverage {
    planned_regions: PlannedRegions;
    inspected_regions: InspectedRegions;
    complete: Complete;
    missing: Missing;
}
export interface GlobalAnalysis {
    description: Description7;
    position_analysis: PositionAnalysis1;
    illumination_analysis: IlluminationAnalysis1;
    suspect_regions: SuspectRegions;
}
export interface RegionEvidence {
    source: Source1;
    annotation_id: AnnotationId;
    label: Label;
    bbox: Bbox3;
    check_ids: CheckIds3;
    origins: Origins;
    image: VisualEvidence;
    crop_bbox: CropBbox1;
    observation: ViewAnalysis;
}
export interface RegionOrigin {
    source: Source2;
    annotation_id: AnnotationId1;
    label: Label1;
    bbox: Bbox4;
    check_ids: CheckIds4;
}
export interface ViewAnalysis {
    description: Description8;
    position_analysis: PositionAnalysis2;
    illumination_analysis: IlluminationAnalysis2;
}
export interface VlmResult {
    description: Description9;
    position_analysis: PositionAnalysis3;
    illumination_analysis: IlluminationAnalysis3;
    suggested_label: SuggestedLabel;
    reason_category: ReasonCategory;
    confidence: Confidence;
    defect_location: DefectLocation;
    evidence_ids: EvidenceIds5;
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
    description: Description10;
    position_analysis: PositionAnalysis4;
    illumination_analysis: IlluminationAnalysis4;
    suggested_label: SuggestedLabel1;
    reason_category: ReasonCategory1;
    confidence: Confidence1;
    defect_location: DefectLocation1;
    evidence_ids: EvidenceIds6;
    conflicts: Conflicts1;
    missing_evidence: MissingEvidence1;
    global_view: GlobalAnalysis;
    region_observations: RegionObservations;
    check_assessments: CheckAssessments1;
    findings: Findings1;
    resolved_findings: ResolvedFindings;
}
export interface RegionObservation {
    description: Description11;
    position_analysis: PositionAnalysis5;
    illumination_analysis: IlluminationAnalysis5;
    region_index: RegionIndex;
}
export interface FindingObservation {
    check_ids: CheckIds5;
    location: Location4;
    description: Description12;
    hypothesis: Hypothesis1;
    normal_explanation: NormalExplanation2;
    limitations: Limitations6;
    review_action: ReviewAction1;
    priority: Priority1;
    evidence_ids: EvidenceIds7;
    related_findings: RelatedFindings1;
}
export interface FindingResolution {
    related_findings: RelatedFindings2;
    description: Description13;
    normal_explanation: NormalExplanation3;
    evidence_ids: EvidenceIds8;
}
export interface KnowledgeSnapshot {
    version_id: VersionId8;
    dataset_id: DatasetId9;
    kind: Kind8;
    parent_version_id: ParentVersionId;
    normal_version_id: NormalVersionId3;
    model_name: ModelName;
    generation_version: GenerationVersion;
    signature: Signature;
    summary: Summary;
    checks: Checks1;
    revisions: Revisions;
    corrections: Corrections;
    comparison_sources: ComparisonSources;
    suspects: Suspects;
    limitations: Limitations7;
    sources: Sources;
    evidence: Evidence1;
    mining_steps: MiningSteps;
    observation_steps: ObservationSteps;
    conflicts: Conflicts2;
    review_applications: ReviewApplications;
    findings: Findings2;
    verification_steps: VerificationSteps;
    support_policy: KnowledgeSupportPolicy | null;
    support_groups: SupportGroups;
    scope_run_id: ScopeRunId2;
    observed_source_ids: ObservedSourceIds;
    knowledge_preset: KnowledgePreset;
    manual_edit: KnowledgeCheckRemoval | null;
    mining_prompt: FrozenMiningPrompt | null;
    created_at: CreatedAt1;
}
export interface CheckRevision {
    previous_check_id: PreviousCheckId;
    current_check_titles: CurrentCheckTitles;
    reason: Reason4;
}
export interface KnowledgeCorrection {
    check_id: CheckId4;
    instruction: Instruction4;
}
export interface KnowledgeSource {
    sample_id: SampleId5;
    sha256: Sha2561;
    annotations_sha256: AnnotationsSha256;
    quality_status: QualityStatus;
    quality_source: QualitySource;
    review_sha256: ReviewSha256;
    audit_suggestion_ids: AuditSuggestionIds;
    qualification: Qualification;
    pixel_sha256: PixelSha256;
}
export interface KnowledgeSuspect {
    evidence_id: EvidenceId1;
    bbox_1000: Bbox10001;
    description: Description14;
    normal_explanation: NormalExplanation4;
}
export interface KnowledgeStep {
    step_id: StepId2;
    image_evidence_ids: ImageEvidenceIds;
    child_step_ids: ChildStepIds1;
    result: KnowledgeDraft;
}
export interface KnowledgeDraft {
    summary: Summary1;
    checks: Checks2;
    suspects: Suspects1;
    limitations: Limitations9;
    revisions: Revisions1;
    /**
     * 逐部件观察与各挖掘方向的实际结果；未返回时明确未记录，不能据此宣称观察完整
     */
    discovery: KnowledgeDiscovery | null;
}
export interface LearnedCheck {
    title: Title3;
    subject: Subject2;
    location: Location5;
    criterion: Criterion2;
    allowed_variations: AllowedVariations2;
    limitations: Limitations8;
    status: Status7;
    support_evidence_ids: SupportEvidenceIds1;
    counter_evidence_ids: CounterEvidenceIds1;
}
export interface KnowledgeDiscovery {
    parts: Parts1;
    areas: Areas;
}
export interface KnowledgeObservationStep {
    step_id: StepId3;
    version_id: VersionId9;
    purpose: Purpose;
    checks: Checks3;
    input_evidence_ids: InputEvidenceIds1;
    result: KnowledgeObservations;
}
export interface KnowledgeObservations {
    observations: Observations;
}
export interface KnowledgeObservation {
    check_id: CheckId5;
    sample_id: SampleId6;
    status: Status8;
    description: Description15;
    position_analysis: PositionAnalysis6;
    illumination_analysis: IlluminationAnalysis6;
    normal_explanation: NormalExplanation5;
    evidence_ids: EvidenceIds9;
    suspects: Suspects2;
}
export interface KnowledgeFinding {
    finding_id: FindingId1;
    sample_id: SampleId7;
    bbox: Bbox5;
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
    bbox: Bbox6;
    check_ids: CheckIds6;
    origins: Origins2;
    image: VisualEvidence;
    crop_bbox: CropBbox2;
}
export interface KnowledgeJudgment {
    finding_id: FindingId2;
    status: Status9;
    affected_check_titles: AffectedCheckTitles;
    description: Description16;
    normal_explanation: NormalExplanation6;
    limitations: Limitations10;
    evidence_ids: EvidenceIds10;
    conflicts: Conflicts3;
}
export interface VerificationStep {
    step_id: StepId4;
    input_evidence_ids: InputEvidenceIds2;
    child_step_ids: ChildStepIds2;
    result: KnowledgeVerification;
}
export interface KnowledgeVerification {
    findings: Findings3;
}
export interface KnowledgeSupportPolicy {
    min_source_groups: MinSourceGroups;
}
export interface KnowledgeCheckRemoval {
    submission_id: SubmissionId3;
    check_id: CheckId6;
}
export interface FrozenMiningPrompt {
    configuration: MiningPromptConfiguration;
    instruction: Instruction5;
    signature: Signature1;
}
export interface KnowledgeVersion {
    version_id: VersionId10;
    dataset_id: DatasetId10;
    kind: Kind9;
    parent_version_id: ParentVersionId1;
    normal_version_id: NormalVersionId4;
    model_name: ModelName1;
    created_at: CreatedAt2;
    source_count: SourceCount;
    check_count: CheckCount;
}
export interface KnowledgeQuery {
    knowledge: KnowledgeSnapshot | null;
    versions: Versions;
    freshness: KnowledgeFreshness | null;
    eligible_source_count: EligibleSourceCount;
    unavailable_source_count: UnavailableSourceCount;
}
export interface KnowledgeFreshness {
    status: Status10;
    checked_at: CheckedAt;
    current_version_id: CurrentVersionId1;
    current_normal_version_id: CurrentNormalVersionId;
    source_changes: SourceChanges;
    additional_source_ids: AdditionalSourceIds;
    generation_changed: GenerationChanged;
    normal_version_changed: NormalVersionChanged;
    normal_sources_changed: NormalSourcesChanged;
}
export interface KnowledgeSourceChange {
    sample_id: SampleId8;
    reasons: Reasons;
}
export interface KnowledgeSourceQuery {
    recheck_from_version?: RecheckFromVersion;
    include_observed?: IncludeObserved;
    scope_run_id?: ScopeRunId3;
    dataset_id: DatasetId11;
    kind: Kind10;
    normal_version_id?: NormalVersionId5;
    uncovered_from_version?: UncoveredFromVersion;
    page?: Page5;
    page_size?: PageSize5;
    search?: Search2;
}
export interface KnowledgeSourcePage {
    dataset_id: DatasetId12;
    kind: Kind11;
    normal_version_id: NormalVersionId6;
    total: Total5;
    unavailable_source_count: UnavailableSourceCount1;
    page: Page6;
    page_size: PageSize6;
    items: Items4;
    coverage: KnowledgeCoverage | null;
}
export interface KnowledgeSourceItem {
    sample_id: SampleId9;
    relative_path: RelativePath;
    qualification: Qualification1;
}
export interface KnowledgeCoverage {
    recheck: Recheck1;
    version_id: VersionId11;
    total: Total6;
    observed: Observed2;
    pending_review: PendingReview1;
    stale: Stale1;
    remaining: Remaining1;
}
export interface AuditStart {
    dataset_id: DatasetId13;
    origin_session_id?: OriginSessionId;
    model_name?: ModelName2;
    normal_version_id?: NormalVersionId7;
    defect_version_id?: DefectVersionId1;
    sample_ids?: SampleIds;
    filters?: Filters;
}
export interface Filters {
    [k: string]: unknown;
}
export interface ModelCallDetail {
    call_id: CallId;
    run_id: RunId1;
    operation: Operation;
    schema_name: SchemaName;
    phase: Phase;
    sample_id: SampleId10;
    started_at: StartedAt1;
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
    run_id: RunId2;
    sample_ids?: SampleIds1;
}
export interface JobSnapshot {
    run_id: RunId3;
    task_id: TaskId;
    dataset_id: DatasetId14;
    job_type: JobType;
    origin_session_id: OriginSessionId1;
    root_run_id: RootRunId;
    parent_run_id: ParentRunId;
    status: Status11;
    observation_progress: JobObservationProgress | null;
    cancel_requested: CancelRequested;
    sample_ids: SampleIds2;
    completed_sample_ids: CompletedSampleIds;
    failed_sample_ids: FailedSampleIds;
    completed: Completed;
    failed: Failed;
    total_samples: TotalSamples;
    unprocessed: Unprocessed1;
    progress: Progress;
    message: Message1;
    started_at: StartedAt2;
    finished_at: FinishedAt1;
    deleted_at: DeletedAt;
    model_name: ModelName3;
    current_sample: JobSample | null;
    phase: Phase1;
    normal_version_id: NormalVersionId8;
    defect_version_id: DefectVersionId2;
    kind: Kind12;
    knowledge_version_id: KnowledgeVersionId1;
    mining_prompt: FrozenMiningPrompt | null;
    inspected_regions: InspectedRegions1;
    planned_regions: PlannedRegions1;
    completed_batches: CompletedBatches;
    total_batches: TotalBatches;
    errors: Errors;
    model_calls: ModelCalls;
    [k: string]: unknown;
}
export interface JobSample {
    sample_id: SampleId11;
    relative_path: RelativePath1;
    sample_uuid: SampleUuid;
}
export interface JobFailure {
    sample_id: SampleId12;
    relative_path: RelativePath2;
    message: Message2;
    sample_uuid: SampleUuid1;
}
export interface ModelCallSummary {
    call_id: CallId1;
    run_id: RunId4;
    operation: Operation1;
    schema_name: SchemaName1;
    phase: Phase2;
    sample_id: SampleId13;
    started_at: StartedAt3;
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
    run_id: RunId5;
    root_run_id: RootRunId1;
    selection_mode: SelectionMode;
    active_run_id: ActiveRunId;
    samples: Samples;
}
export interface RetrySample {
    sample_id: SampleId14;
    relative_path: RelativePath3;
    state: State2;
    sample_uuid: SampleUuid2;
}
export interface InspectionReference {
    dataset_id: DatasetId15;
    sample_id: SampleId15;
    suggestion_id: SuggestionId;
    finding_id?: FindingId3;
    evidence_id?: EvidenceId2;
}
export interface InspectionSnapshot {
    reference: InspectionReference1;
    sample: Sample;
    analysis: AuditAnalysis;
    evidence: Evidence2;
    audit_run_id: AuditRunId;
    origin_session_id: OriginSessionId2;
    is_latest: IsLatest1;
}
export interface InspectionReference1 {
    dataset_id: DatasetId16;
    sample_id: SampleId16;
    suggestion_id: SuggestionId1;
    finding_id: FindingId4;
    evidence_id: EvidenceId3;
}
export interface Sample {
    sample_id: SampleId17;
    task_id: TaskId1;
    dataset_id?: DatasetId17;
    image_path: ImagePath;
    relative_path: RelativePath4;
    quality_status: QualityStatus1;
    quality_source?: QualitySource1;
    is_excluded?: IsExcluded;
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
export interface LabelmeImport {
    format?: Format;
    name: Name1;
    image_dir: ImageDir;
    annotation_dir: AnnotationDir;
    archive_path?: ArchivePath;
    unannotated_is_normal?: UnannotatedIsNormal;
}
export interface FolderClassificationImport {
    format?: Format1;
    name: Name2;
    root_dir: RootDir;
    rules: Rules;
    preview_fingerprint: PreviewFingerprint;
}
export interface FolderRule {
    path: Path;
    role: Role1;
}
export interface FolderPreview {
    format: Format2;
    root_dir: RootDir1;
    suggested_name: SuggestedName;
    total_images: TotalImages;
    items: Items5;
    conflicts: Conflicts4;
    preview_fingerprint: PreviewFingerprint1;
}
export interface FolderPreviewItem {
    path: Path1;
    image_count: ImageCount;
    suggested_role: SuggestedRole;
    role: Role2;
}
export interface ArchiveInspection {
    archive_path: ArchivePath1;
    sha256: Sha2562;
    file_count: FileCount;
    uncompressed_bytes: UncompressedBytes;
    directories: Directories;
}
export interface ArchiveDirectory {
    path: Path2;
    image_count: ImageCount1;
    annotation_count: AnnotationCount;
}
export interface ScanResult {
    dataset_id: DatasetId18;
    task_id: TaskId2;
    image_count: ImageCount2;
    annotation_count: AnnotationCount1;
    issue_count: IssueCount;
    db_path: DbPath;
}
export interface DatasetReport {
    dataset_id: DatasetId19;
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
    label_comparison: LabelComparison | null;
    knowledge_versions: KnowledgeVersions;
    audit_run_ids: AuditRunIds;
}
export interface QualityScope {
    observed_inputs: ObservedInputs;
    registered_samples: RegisteredSamples;
    unregistered_inputs: UnregisteredInputs;
    basis: Basis;
    selection: Selection;
    limitations: Limitations11;
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
export interface LabelComparison {
    raw_ok: RawOk;
    raw_ng: RawNg;
    raw_unlabeled: RawUnlabeled;
    model_pass: ModelPass;
    model_fail: ModelFail;
    model_uncertain: ModelUncertain;
    unaudited: Unaudited;
    inconsistent_count: InconsistentCount;
    source_changed_count: SourceChangedCount;
    source_unverified_count: SourceUnverifiedCount;
    inconsistency_ratio: QualityRatio;
}
export interface KnowledgeUsage {
    normal_version_id: NormalVersionId9;
    defect_version_id: DefectVersionId3;
    legacy_profile_id: LegacyProfileId1;
    sample_count: SampleCount;
}
export interface MiningStart {
    knowledge_preset?: KnowledgePreset1;
    image_count: ImageCount3;
    images: Images;
}
export interface MiningRequest {
    knowledge_preset?: KnowledgePreset2;
    image_count: ImageCount4;
    images: Images1;
    kind: Kind13;
}
export interface Annotation {
    annotation_id: AnnotationId3;
    sample_id: SampleId18;
    annotation_type: AnnotationType;
    raw_label: RawLabel;
    phenomenon?: Phenomenon;
    bbox?: Bbox7;
    polygon?: Polygon;
    mask_path?: MaskPath;
    mask_sha256?: MaskSha256;
    geometry_status?: GeometryStatus;
    source?: AnnotationSource;
    source_width?: SourceWidth;
    source_height?: SourceHeight;
}
export interface ReviewSubmission {
    submission_id: SubmissionId4;
    dataset_id: DatasetId20;
    sample_id: SampleId19;
    reviewer: Reviewer3;
    decision: ReviewDecisionEnum;
    reason_code?: ReasonCode1;
    comment?: Comment1;
    duration_ms?: DurationMs;
    started_at?: StartedAt4;
}
export interface ReviewHistoryQuery {
    dataset_id: DatasetId21;
    page?: Page7;
    page_size?: PageSize7;
    search?: Search3;
}
export interface ReviewHistoryPage {
    items: Items6;
    total: Total7;
    page: Page8;
    page_size: PageSize8;
}
export interface ReviewHistoryRecord {
    decision_id: DecisionId1;
    sample_id: SampleId20;
    decision: Decision1;
    reviewer: Reviewer4;
    reason_code: ReasonCode2;
    comment: Comment2;
    evidence_version: EvidenceVersion1;
    review_session_id: ReviewSessionId1;
    started_at: StartedAt5;
    submitted_at: SubmittedAt1;
    review_duration_ms: ReviewDurationMs1;
    relative_path: RelativePath5;
}
export interface SampleQuery {
    dataset_id?: DatasetId22;
    task_id?: TaskId4;
    page?: Page9;
    page_size?: PageSize9;
    raw_label_filters?: RawLabelFilters;
    annotation_filters?: AnnotationFilters;
    model_status?: ModelStatus;
    review_status?: ReviewStatus;
    technical?: Technical;
    reference_status?: ReferenceStatus;
    search?: Search4;
    sort_by?: SortBy;
}
//# sourceMappingURL=domain.generated.d.ts.map