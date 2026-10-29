export type Name = string;
export type Text = string;
export type Id = string;
export type Builtin = boolean;
export type Name1 = string;
export type Text1 = string;
export type ExpectedRevision = number;
export type ProviderId = string;
export type Name2 = string;
export type Endpoint = string;
/**
 * @minItems 1
 */
export type Models = [ProviderModel, ...ProviderModel[]];
export type ModelId = string;
export type Name3 = string;
export type InputModalities = string[] | null;
export type ContextTokens = number | null;
export type MaxOutputTokens = number | null;
export type ApiKey = string | null;
export type ExpectedRevision1 = number;
export type ProviderId1 = string;
export type Endpoint1 = string;
export type ProviderId2 = string | null;
export type ApiKey1 = string | null;
export type ModelId1 = string;
export type CapacityMode = "vllm_tokenize";
export type ContextTokens1 = number;
export type ImageVerified = false;
export type CapacityMode1 = "vllm_tokenize" | null;
export type MaxVisualInputs = number | null;
export type MaxRequestBytes = number | null;
export type ContextTokens2 = number | null;
export type MaxOutputTokens1 = number | null;
export type GenerationTimeoutSeconds = number | null;
export type ConnectTimeoutSeconds = number | null;
export type WriteTimeoutSeconds = number | null;
export type PoolTimeoutSeconds = number | null;
export type CapacityMode2 = "vllm_tokenize" | null;
export type MaxVisualInputs1 = number | null;
export type MaxRequestBytes1 = number | null;
export type ContextTokens3 = number | null;
export type MaxOutputTokens2 = number | null;
export type GenerationTimeoutSeconds1 = number | null;
export type ConnectTimeoutSeconds1 = number | null;
export type WriteTimeoutSeconds1 = number | null;
export type PoolTimeoutSeconds1 = number | null;
export type Endpoint2 = string;
export type ProviderId3 = string | null;
export type ProviderName = string | null;
export type ModelId2 = string | null;
export type CredentialRef = string | null;
export type Api = "openai-completions";
export type CapacityMode3 = "vllm_tokenize" | null;
export type MaxVisualInputs2 = number | null;
export type MaxRequestBytes2 = number | null;
export type ContextTokens4 = number | null;
export type MaxOutputTokens3 = number | null;
export type GenerationTimeoutSeconds2 = number | null;
export type ConnectTimeoutSeconds2 = number | null;
export type WriteTimeoutSeconds2 = number | null;
export type PoolTimeoutSeconds2 = number | null;
export type Endpoint3 = string;
export type ProviderId4 = string | null;
export type ProviderName1 = string | null;
export type ModelId3 = string | null;
export type CredentialRef1 = string | null;
export type Api1 = "openai-completions";
export type ApiKey2 = string | null;
export type ProviderId5 = string;
export type ModelId4 = string;
export type CapacityMode4 = "vllm_tokenize" | null;
export type MaxVisualInputs3 = number | null;
export type MaxRequestBytes3 = number | null;
export type ContextTokens5 = number | null;
export type MaxOutputTokens4 = number | null;
export type GenerationTimeoutSeconds3 = number | null;
export type ConnectTimeoutSeconds3 = number | null;
export type WriteTimeoutSeconds3 = number | null;
export type PoolTimeoutSeconds3 = number | null;
export type Revision = number;
export type ProviderId6 = string;
export type ModelId5 = string;
export type ExpectedRevision2 = number;
export type ProviderId7 = string;
export type Name4 = string;
export type Endpoint4 = string | null;
export type Api2 = string | null;
export type ModelId6 = string;
export type Name5 = string;
export type InputModalities1 = string[] | null;
export type ContextTokens6 = number | null;
export type MaxOutputTokens5 = number | null;
export type Models1 = ProviderModel1[];
export type Error = string | null;
export type Editable = boolean;
export type Removable = boolean;
export type CredentialConfigured = boolean;
export type CredentialWritable = boolean;
export type Revision1 = number;
export type Providers = WorkbenchProvider[];
export type Ready = boolean;
export type Error1 = string | null;
export type ProviderRevision = number | null;
export type DatasetId = string;
export type Kind = "normal" | "defect";
export type ExpectedRevision3 = string;
/**
 * @minItems 1
 */
export type Directions = [DirectionChoice, ...DirectionChoice[]];
export type DirectionId = string;
export type Title = string | null;
export type Instruction = string | null;
export type Enabled = boolean;
export type DatasetId1 = string;
/**
 * @minItems 1
 */
export type NormalImages = [string, ...string[]];
/**
 * @minItems 1
 */
export type DefectImages = [string, ...string[]];
export type Objective = string;
export type PresetId = string | null;
export type PresetName = string | null;
export type Text2 = string;
export type Summary = string;
export type Title1 = string;
export type Instruction1 = string;
export type AppliesTo = "normal" | "defect" | "both";
export type Rationale = string;
/**
 * @minItems 1
 */
export type EvidenceIds = [string, ...string[]];
export type Limitations = string[];
export type DirectionId1 = string;
export type Directions1 = ExploredDirection[];
export type Limitations1 = string[];
export type VersionId = string;
export type DatasetId2 = string;
export type RunId = string;
export type CreatedAt = string;
export type ModelName = string;
export type Signature = string;
export type DatasetId3 = string;
/**
 * @minItems 1
 */
export type NormalImages1 = [string, ...string[]];
/**
 * @minItems 1
 */
export type DefectImages1 = [string, ...string[]];
export type Objective1 = string;
export type PresetId1 = string | null;
export type PresetName1 = string | null;
export type Text3 = string;
export type SampleId = string;
export type Sha256 = string;
export type AnnotationsSha256 = string;
export type QualityStatus = string | null;
export type QualitySource = string | null;
export type ReviewSha256 = string;
export type AuditSuggestionIds = string[];
export type Qualification = "human_pass" | "human_hard_normal" | "manual_selection" | "raw_pass" | "initial_unannotated" | "human_fail" | "human_uncertain" | "human_skip" | "raw_fail" | "annotated_candidate" | "normal_suspect" | "audit_suspect";
export type PixelSha256 = string | null;
export type NormalSources = KnowledgeSource[];
export type DefectSources = KnowledgeSource[];
export type SampleId1 = string;
export type EvidenceId = string;
export type Role = "normal" | "overview" | "roi";
export type Source = "reference" | "global" | "annotation" | "model" | "coverage";
export type OriginalSize = number[];
export type CropBbox = number[];
export type SentSize = number[];
export type Sha2561 = string;
export type SourceSha256 = string;
export type Representation = "raw" | "annotation_mask" | "annotation_overlay";
export type AnnotationIds = string[];
export type AnnotationSha256 = string | null;
export type MediaType = "image/png";
export type Evidence = KnowledgeEvidence[];
export type DatasetId4 = string;
export type VersionId1 = string;
export type DatasetId5 = string;
export type RunId1 = string;
export type CreatedAt1 = string;
export type DirectionCount = number;
export type Versions = ExplorationVersion[];
export type DatasetId6 = string;
export type Kind1 = "normal" | "defect";
export type Instruction2 = string;
export type Objective2 = string;
export type DirectionId2 = string;
export type Title2 = string;
export type Instruction3 = string;
export type Enabled1 = boolean;
export type Origin = "preset" | "dataset" | "explored";
export type Directions2 = MiningDirection[];
export type Revision2 = string;
export type Customized = boolean;
export type DatasetId7 = string;
export type Kind2 = "normal" | "defect";
export type ExpectedRevision4 = string;
export type VersionId2 = string;
export type DatasetId8 = string;
export type Kind3 = "normal" | "defect";
export type Recorded = boolean;
export type Name6 = string;
export type Location = string;
/**
 * @minItems 1
 */
export type EvidenceIds1 = [string, ...string[]];
export type Parts = ObservedPart[];
export type Total = number;
export type Page = number;
export type PageSize = number;
/**
 * 用户选中的方向编号；模型自主发现的新方向填null，不能冒用未选择的方向
 */
export type DirectionId3 = string | null;
/**
 * 本轮观察标题；所选方向身份以direction_id为准，自主发现方向填写新标题
 */
export type Direction = string;
/**
 * 仅本次checks包含对应判据且有实际图像证据时可填已形成知识；仅有观察、无可用判据时填证据不足或不可观察
 */
export type Status = "已形成知识" | "证据不足" | "不可观察" | "不适用";
export type Reason = string;
export type EvidenceIds2 = string[];
/**
 * 引用parts内实际可见部件名称；不适用时可为空
 */
export type Subjects = string[];
/**
 * 引用本次checks实际标题；不是预设旧条目的完整性证明
 */
export type CheckTitles = string[];
export type Items = DiscoveryArea[];
export type RunId2 = string;
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
export type SampleId2 = string;
export type Observed = boolean;
export type Items1 = KnowledgeTraceItem[];
export type DatasetId9 = string;
export type Kind4 = "normal" | "defect";
export type Objective3 = string;
export type Search = string;
export type Seed = number | null;
export type StartingVersionId = string | null;
export type NormalVersionId = string | null;
export type Search1 = string;
export type Seed1 = number | null;
export type ScopeRunId = string;
export type DatasetId10 = string;
export type Kind5 = "normal" | "defect";
export type Objective4 = string;
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
export type VersionId3 = string;
export type CheckId = string | null;
export type Section = "checks" | "discovery";
export type Page2 = number;
export type PageSize2 = number;
export type VersionId4 = string;
export type DatasetId11 = string;
export type Kind6 = "normal" | "defect";
export type Total3 = number;
export type Page3 = number;
export type PageSize3 = number;
export type Title3 = string;
export type Subject = string;
export type Location1 = string;
export type Criterion = string;
export type AllowedVariations = string[];
export type Limitations2 = string[];
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
export type VersionId5 = string;
export type DatasetId12 = string;
export type Kind7 = "normal" | "defect";
export type Total4 = number;
export type Page4 = number;
export type PageSize4 = number;
export type Items3 = KnowledgeEvidence[];
export type ScopeRunId1 = string | null;
export type VersionId6 = string;
export type ConflictId = string;
export type DatasetId13 = string;
export type ConflictId1 = string;
export type Category = "observation" | "retirement_proposal";
export type OriginVersionId = string;
export type SubmissionId = string;
export type Status4 = "resolved" | "unresolved" | "insufficient";
export type Description = string;
/**
 * @minItems 1
 */
export type EvidenceIds3 = [string, ...string[]];
export type Limitations3 = string[];
export type CheckIds = string[];
export type SampleId3 = string;
export type SourceSha2561 = string;
export type Bbox = number[] | null;
export type ObservationStepIds = string[];
export type NewEvidenceIds = string[];
export type ComparisonEvidenceIds = string[];
export type Description1 = string;
export type NormalExplanation = string;
export type Limitations4 = string[];
export type Title4 = string;
export type Subject1 = string;
export type Location2 = string;
export type Criterion1 = string;
export type AllowedVariations1 = string[];
export type Limitations5 = string[];
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
export type Evidence1 = KnowledgeEvidence[];
export type VersionId7 = string;
export type ConflictId2 = string;
export type SubmissionId1 = string;
export type ContextSignature = string;
export type Reviewer = string;
export type Action = "retain" | "revise" | "retire" | "need_evidence";
export type Instruction4 = string;
export type Reason1 = string;
export type CreatedAt2 = string;
export type Events = KnowledgeReviewEvent[];
export type DecisionId = string;
export type SampleId4 = string;
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
export type VersionId8 = string;
export type ConflictId3 = string;
export type SubmissionId2 = string;
export type ContextSignature2 = string;
export type Reviewer2 = string;
export type Action1 = "retain" | "revise" | "retire" | "need_evidence";
export type Instruction5 = string;
export type Reason2 = string;
export type VersionId9 = string;
export type ConflictId4 = string;
export type DatasetId14 = string;
export type Kind8 = "normal" | "defect";
export type SampleId5 = string;
export type Description2 = string;
export type State1 = "pending_review" | "pending_recheck" | "resolved";
export type CheckId3 = string;
export type ResultId = string;
export type EvidenceId1 = string;
export type Results = AuditConsistencyEvidenceReference[];
export type NormalVersionId2 = string | null;
export type DefectVersionId = string | null;
export type LegacyProfileId = string | null;
export type KnowledgeLimitations = string[];
export type Description3 = string;
export type PositionAnalysis = string;
export type IlluminationAnalysis = string;
export type CheckId4 = string;
/**
 * normal：符合正常判据或未命中异常判据；anomaly：偏离正常判据或命中异常判据；不可观察/缺证为insufficient；不适用为not_applicable，须解释原因
 */
export type Status6 = "normal" | "anomaly" | "insufficient" | "not_applicable";
/**
 * @minItems 1
 */
export type EvidenceIds4 = [string, ...string[]];
export type Limitations6 = string[];
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
export type Limitations7 = string[];
export type ReviewAction = string;
/**
 * 人工复核顺序，不代表缺陷概率
 */
export type Priority = "high" | "medium" | "low";
/**
 * @minItems 1
 */
export type EvidenceIds5 = [string, ...string[]];
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
export type EvidenceIds6 = [string, ...string[]];
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
export type EvidenceIds7 = [string, ...string[]];
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
export type Limitations8 = string[];
export type ReviewAction1 = string;
/**
 * 人工复核顺序，不代表缺陷概率
 */
export type Priority1 = "high" | "medium" | "low";
/**
 * @minItems 1
 */
export type EvidenceIds8 = [string, ...string[]];
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
export type EvidenceIds9 = [string, ...string[]];
export type ResolvedFindings = FindingResolution[];
export type JointSteps = SynthesisStep[];
export type VersionId10 = string;
export type DatasetId15 = string;
export type Kind9 = "normal" | "defect";
export type ParentVersionId = string | null;
export type NormalVersionId3 = string | null;
export type ModelName1 = string;
export type GenerationVersion = string;
export type Signature1 = string;
export type Summary1 = string;
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
export type CheckId5 = string;
/**
 * 待视觉核验的人工修订建议，不是已证实事实
 */
export type Instruction6 = string;
export type Corrections = KnowledgeCorrection[];
export type ComparisonSources = KnowledgeSource[];
export type EvidenceId2 = string;
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
export type Limitations9 = string[];
export type Sources = KnowledgeSource[];
export type Evidence2 = KnowledgeEvidence[];
export type StepId2 = string;
export type ImageEvidenceIds = string[];
export type ChildStepIds1 = string[];
export type Summary2 = string;
export type Title5 = string;
export type Subject2 = string;
export type Location5 = string;
export type Criterion2 = string;
export type AllowedVariations2 = string[];
export type Limitations10 = string[];
/**
 * supported：本轮实际证据支持该可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status7 = "supported" | "provisional" | "conflicted";
export type SupportEvidenceIds1 = string[];
export type CounterEvidenceIds1 = string[];
export type Checks2 = LearnedCheck[];
export type Suspects1 = KnowledgeSuspect[];
export type Limitations11 = string[];
export type Revisions1 = CheckRevision[];
export type Parts1 = ObservedPart[];
export type Areas = DiscoveryArea[];
export type MiningSteps = KnowledgeStep[];
export type StepId3 = string;
export type VersionId11 = string;
export type Purpose = "current" | "comparison" | "revision";
export type Checks3 = KnowledgeCheck[];
export type InputEvidenceIds1 = string[];
export type Status8 = "supports" | "contradicts" | "unobservable";
export type Description15 = string;
export type PositionAnalysis6 = string;
export type IlluminationAnalysis6 = string;
export type NormalExplanation5 = string;
/**
 * @minItems 1
 */
export type EvidenceIds10 = [string, ...string[]];
export type Suspects2 = KnowledgeSuspect[];
export type CheckId6 = string;
export type SampleId6 = string;
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
export type Limitations12 = string[];
/**
 * @minItems 1
 */
export type EvidenceIds11 = [string, ...string[]];
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
export type CheckId7 = string;
export type Instruction7 = string;
export type Signature2 = string;
export type CreatedAt3 = string;
export type VersionId12 = string;
export type DatasetId16 = string;
export type Kind10 = "normal" | "defect";
export type ParentVersionId1 = string | null;
export type NormalVersionId4 = string | null;
export type ModelName2 = string;
export type CreatedAt4 = string;
export type SourceCount = number;
export type CheckCount = number;
export type Versions1 = KnowledgeVersion[];
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
export type DatasetId17 = string;
export type Kind11 = "normal" | "defect";
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
export type DatasetId18 = string;
export type Kind12 = "normal" | "defect";
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
export type VersionId13 = string | null;
export type Total6 = number;
export type Observed2 = number;
export type PendingReview1 = number;
export type Stale1 = number;
export type Remaining1 = number;
export type DatasetId19 = string;
export type OriginSessionId = string | null;
export type ModelName3 = string | null;
export type NormalVersionId7 = string | null;
export type DefectVersionId1 = string | null;
export type SampleIds = string[] | null;
export type RawLabelFilters = ("PASS" | "FAIL" | "UNCERTAIN")[];
export type AnnotationFilters = string[];
export type ModelStatus = "all" | "pending" | "audited" | "risk" | "PASS" | "FAIL" | "UNCERTAIN";
export type ReviewStatus = "all" | "pending" | "reviewed" | "PASS" | "HARD_NORMAL" | "FAIL" | "UNCERTAIN" | "SKIP";
export type Technical = "all" | "issues";
export type ReferenceStatus = "all" | "candidate" | "excluded";
export type Search3 = string;
export type SortBy = "default" | "risk" | "tech";
export type ConsistencyMode = "exact" | "visual" | "combined";
export type ConsistencyProfileId = string | null;
export type CorpusScope = AllRegisteredScope | DatasetScope;
export type Kind13 = "all_registered";
export type Kind14 = "datasets";
/**
 * @minItems 1
 */
export type DatasetIds = [string, ...string[]];
export type CallId = string;
export type RunId3 = string;
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
export type RunId4 = string;
export type SampleIds1 = string[] | null;
export type RunId5 = string;
export type TaskId = string;
export type DatasetId20 = string;
export type JobType = "MODEL_AUDIT" | "NORMAL_KNOWLEDGE" | "DEFECT_KNOWLEDGE" | "DIRECTION_EXPLORATION" | "IMAGE_INDEX" | "DATA_CONSISTENCY" | "CONSISTENCY_ANALYSIS";
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
export type SubmittedAt1 = string;
export type StartedAt2 = string | null;
export type FinishedAt1 = string | null;
export type DeletedAt = string | null;
export type ModelName4 = string | null;
export type CapacityMode5 = "vllm_tokenize" | null;
export type MaxVisualInputs4 = number | null;
export type MaxRequestBytes4 = number | null;
export type ContextTokens7 = number | null;
export type MaxOutputTokens6 = number | null;
export type GenerationTimeoutSeconds4 = number | null;
export type ConnectTimeoutSeconds4 = number | null;
export type WriteTimeoutSeconds4 = number | null;
export type PoolTimeoutSeconds4 = number | null;
export type Endpoint5 = string;
export type ProviderId8 = string | null;
export type ProviderName2 = string | null;
export type ModelId7 = string | null;
export type CredentialRef2 = string | null;
export type Api3 = "openai-completions";
export type ProfileId = string;
export type Backend = "torch_hub" | "torchscript" | "transformers";
export type ModelId8 = "dinov2_vitb14_reg" | "dinov3_vitb16" | "sscd_disc_mixup";
export type WeightsRef = string;
export type WeightsSha256 = string;
export type SourceRef = string | null;
export type SourceSha2562 = string | null;
export type ArtifactsSha256 = string | null;
export type RuntimeVersion = string | null;
export type Processor = "dinov2_imagenet_eval" | "dinov3_lvd_eval" | "dinov3_hf_eval" | "sscd_skew320";
export type InputSize = number;
export type Pooling = "x_norm_clstoken" | "serialized_global" | "pooler_output";
export type Dim = number;
export type ResizeSize = number;
export type ResizeMode = "shorter_side" | "stretch";
export type Crop = "center" | "none";
export type Interpolation = "bicubic" | "bilinear";
/**
 * @minItems 3
 * @maxItems 3
 */
export type Mean = [unknown, unknown, unknown];
/**
 * @minItems 3
 * @maxItems 3
 */
export type Std = [unknown, unknown, unknown];
export type StorageDtype = "float32" | "float16";
export type ColorConversion = "rgb_alpha_white_uint16_div257";
export type Orientation = "raw";
export type SampleId11 = string;
export type RelativePath1 = string | null;
export type SampleUuid = string;
export type Phase1 = string | null;
export type PhaseStartedAt = string | null;
export type PreparedSources = number;
export type QueuePosition = number | null;
export type NormalVersionId8 = string | null;
export type DefectVersionId2 = string | null;
export type Kind15 = ("normal" | "defect") | null;
export type KnowledgeVersionId1 = string | null;
export type ExplorationVersionId = string | null;
export type InspectedRegions1 = number | null;
export type PlannedRegions1 = number | null;
export type CompletedBatches = number | null;
export type TotalBatches = number | null;
export type SampleId12 = string;
export type RelativePath2 = string | null;
export type Message2 = string;
export type Code = string | null;
export type SampleUuid1 = string;
export type Errors = JobFailure[];
export type CallId1 = string;
export type RunId6 = string;
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
export type RunId7 = string;
export type RootRunId1 = string;
export type SelectionMode = "subset" | "all_sources";
export type ActiveRunId = string | null;
export type SampleId14 = string;
export type RelativePath3 = string | null;
export type State2 = "failed" | "unprocessed";
export type SampleUuid2 = string;
export type Samples = RetrySample[];
export type DatasetId21 = string;
export type SampleId15 = string;
export type SuggestionId = string;
export type FindingId3 = string | null;
export type EvidenceId3 = string | null;
export type DatasetId22 = string;
export type SampleId16 = string;
export type SuggestionId1 = string;
export type FindingId4 = string | null;
export type EvidenceId4 = string | null;
export type SampleId17 = string;
export type TaskId1 = string;
export type DatasetId23 = string;
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
export type Evidence3 = VisualEvidence[];
export type AuditRunId = string | null;
export type OriginSessionId2 = string | null;
export type IsLatest1 = boolean;
export type DatasetImport = LabelmeImport | FolderClassificationImport;
export type Name7 = string;
export type PolicyId = string | null;
export type AnnotationRole = "REFERENCE" | "PREDICTION" | "UNKNOWN";
export type AnnotationCoverage = "EXHAUSTIVE" | "PARTIAL" | "UNKNOWN";
export type Format = "labelme";
export type ImageDir = string;
export type AnnotationDir = string;
export type ArchivePath = string | null;
export type UnannotatedIsNormal = boolean;
export type Name8 = string;
export type Format1 = "folder_classification";
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
export type DatasetId24 = string;
export type TaskId2 = string;
export type ImageCount2 = number;
export type AnnotationCount1 = number;
export type IssueCount = number;
export type DbPath = string;
export type ScanRef = string;
export type Total7 = number;
export type Completed1 = number;
export type Failed1 = number;
export type Unsupported = number;
export type Pending = number;
export type ReusedSamples = number;
export type DecodedImages = number;
export type ComparedPairs = number;
export type CachePeakBytes = number;
export type DatasetId25 = string | null;
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
export type Limitations13 = string[];
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
export type Kind16 = "normal" | "defect";
export type AnnotationId3 = string;
export type SampleId18 = string;
export type AnnotationType = "bbox" | "polygon" | "mask" | "image";
export type RawLabel = string;
export type IsIgnored = boolean;
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
export type DatasetId26 = string;
export type SampleId19 = string;
export type Reviewer3 = string;
export type ReviewDecisionEnum = "PASS" | "HARD_NORMAL" | "FAIL" | "UNCERTAIN" | "SKIP";
export type ReasonCode1 = string | null;
export type Comment1 = string | null;
export type DurationMs = number;
export type StartedAt4 = string | null;
export type DatasetId27 = string;
export type Page7 = number;
export type PageSize7 = number;
export type Search4 = string;
export type DecisionId1 = string;
export type SampleId20 = string;
export type Decision1 = string;
export type Reviewer4 = string;
export type ReasonCode2 = string | null;
export type Comment2 = string | null;
export type EvidenceVersion1 = string;
export type ReviewSessionId1 = string | null;
export type StartedAt5 = string | null;
export type SubmittedAt2 = string | null;
export type ReviewDurationMs1 = number;
export type RelativePath5 = string;
export type Items6 = ReviewHistoryRecord[];
export type Total8 = number;
export type Page8 = number;
export type PageSize8 = number;
export type RawLabelFilters1 = ("PASS" | "FAIL" | "UNCERTAIN")[];
export type AnnotationFilters1 = string[];
export type ModelStatus1 = "all" | "pending" | "audited" | "risk" | "PASS" | "FAIL" | "UNCERTAIN";
export type ReviewStatus1 = "all" | "pending" | "reviewed" | "PASS" | "HARD_NORMAL" | "FAIL" | "UNCERTAIN" | "SKIP";
export type Technical1 = "all" | "issues";
export type ReferenceStatus1 = "all" | "candidate" | "excluded";
export type Search5 = string;
export type SortBy1 = "default" | "risk" | "tech";
export type DatasetId28 = string | null;
export type TaskId4 = string | null;
export type Page9 = number;
export type PageSize9 = number;
export type Subjects1 = AllRegisteredScope | DatasetScope | SampleScope | FilteredScope;
export type Kind17 = "samples";
/**
 * @minItems 1
 */
export type SampleIds3 = [string, ...string[]];
export type Kind18 = "filtered";
export type DatasetId29 = string;
export type CorpusScope1 = AllRegisteredScope | DatasetScope;
export type Mode = "exact" | "visual" | "combined";
export type ProfileId1 = string | null;
export type RequestId = string;
export type Query = SampleImageQuery | TemporaryImageQuery;
export type Kind19 = "sample";
export type SampleId21 = string;
export type Kind20 = "temporary";
export type ImageRef = string;
export type CorpusScope2 = AllRegisteredScope | DatasetScope;
export type Mode1 = "exact" | "visual" | "combined";
export type ProfileId2 = string | null;
export type TopK = number;
export type Cursor = string | null;
export type CorpusScope3 = AllRegisteredScope | DatasetScope;
export type ProfileId3 = string | null;
export type RequestId1 = string;
export type ScopeId = string;
export type DatasetIds1 = string[];
export type FrozenAt = string;
export type SampleCount1 = number;
export type Selector = AllRegisteredScope1 | DatasetScope1 | SampleScope1 | FilteredScope1;
export type Kind21 = "all_registered";
export type Kind22 = "datasets";
/**
 * @minItems 1
 */
export type DatasetIds2 = [string, ...string[]];
export type Kind23 = "samples";
/**
 * @minItems 1
 */
export type SampleIds4 = [string, ...string[]];
export type Kind24 = "filtered";
export type DatasetId30 = string;
export type SampleId22 = string;
export type DatasetId31 = string;
export type TaskId5 = string;
export type SourceFingerprint = string | null;
export type QualitySource2 = string | null;
export type Samples1 = FrozenSample[];
export type DatasetId32 = string;
export type ScanRef1 = string;
export type Scans = ScanReference[];
export type CompareProfile = "raw-decoded-v1";
export type Width1 = number | null;
export type Height1 = number | null;
export type ChannelSemantics = ("L" | "LA" | "RGB" | "RGBA") | null;
export type Dtype = ("uint8" | "uint16") | null;
export type BitDepth = (8 | 16) | null;
export type PixelKey = string | null;
export type DecodeStatus = "COMPLETE" | "UNAVAILABLE" | "UNSUPPORTED";
export type Reason5 = string | null;
export type AnnotationCoordinates = "RAW" | "EXIF_AMBIGUOUS";
export type Status12 = "COMPLETE" | "INCOMPATIBLE" | "UNAVAILABLE" | "UNSUPPORTED" | "PENDING";
export type CompareProfile1 = "raw-decoded-v1";
export type ExactEqual = boolean | null;
export type ComparedPixels = number;
export type ChangedPixels = number | null;
export type MaxAbsDiff = number | null;
export type Reason6 = string | null;
export type SampleId23 = string;
export type ContentGroupId = string;
export type RetrievalBranch = "exact" | "visual";
export type Rank = number;
export type Score = number | null;
export type ProfileId4 = string | null;
export type Relation = "EXACT" | "NEAR_CANDIDATE" | "VISUAL_REFERENCE" | "DIFFERENT" | "UNCHECKED";
export type EvidenceId5 = string | null;
export type SampleId24 = string;
export type DatasetId33 = string;
export type Width2 = number;
export type Height2 = number;
export type QualitySource3 = string | null;
export type Annotations = Annotation[];
export type PolicyId1 = string | null;
export type AnnotationRole1 = "REFERENCE" | "PREDICTION" | "UNKNOWN";
export type AnnotationCoverage1 = "EXHAUSTIVE" | "PARTIAL" | "UNKNOWN";
export type Errors1 = string[];
export type AnnotationCoordinates1 = "RAW" | "EXIF_AMBIGUOUS" | "UNKNOWN";
export type Status13 = "COMPLETE" | "PARTIAL" | "UNAVAILABLE";
export type PolicyRelation = "SAME" | "DIFFERENT" | "UNKNOWN";
export type LeftId = string;
export type RightId = string;
export type BboxIou = number;
export type SegmentationIou = number | null;
export type GeometryEqual = boolean;
export type ComparisonKind = "LOCATION_ONLY" | "SEGMENTATION" | "IMAGE_LABEL";
export type Matches = InstanceMatch[];
export type DifferenceId = string;
export type Type1 = "QUALITY_LABEL" | "CATEGORY" | "ONE_SIDED_REGION" | "GEOMETRY" | "SPLIT_MERGE" | "AMBIGUOUS_MATCH" | "POLICY_UNCONFIRMED" | "ANNOTATION_UNREADABLE";
export type Left = Annotation[];
export type Right = Annotation[];
export type Region = [number, number, number, number] | null;
export type PolicyRelation1 = "SAME" | "DIFFERENT" | "UNKNOWN";
export type JsonValue = unknown;
export type Pending1 = string[];
/**
 * The side where this region is only a reference from the opposite annotation source
 */
export type ReferenceFromOther = ("left" | "right") | null;
export type SuspectedMissing = ("left" | "right") | null;
export type ConfirmedConflict = boolean;
export type Differences = AnnotationDifference[];
export type InvalidLeft = number;
export type InvalidRight = number;
export type ConfirmedConflict1 = boolean;
export type IgnoreRegions = Annotation[];
export type AnnotationId4 = string;
export type TotalPixels = number;
export type VisiblePixels = number;
export type IgnoreAnnotationIds = string[];
export type Masking = AnnotationMasking[];
/**
 * Minimum overlap for confident instance correspondence; lower positive overlap remains a geometry difference requiring correspondence review
 */
export type MinimumIou = number;
export type AmbiguityTolerance = number;
export type TinyArea = number;
export type SplitCoverage = number;
export type MaxInstances = number;
export type MaxRoiPixels = number;
export type MaxCachedPixels = number;
export type Query1 = SampleImageQuery1 | TemporaryImageQuery1;
export type Kind25 = "sample";
export type SampleId25 = string;
export type Kind26 = "temporary";
export type ImageRef1 = string;
export type ScopeId1 = string;
export type Mode2 = "exact" | "visual" | "combined";
export type ProfileId5 = string | null;
export type Status14 = "READY" | "PARTIAL" | "NOT_READY" | "UNSUPPORTED" | "NOT_REQUESTED";
export type ContentGroupId1 = string;
export type Branch = "exact" | "visual";
export type Rank1 = number;
export type Score1 = number | null;
export type ProfileId6 = string | null;
export type Origins3 = RetrievalOrigin[];
export type MemberCount = number;
export type ConflictCount = number;
export type SampleId26 = string;
export type DatasetId34 = string;
export type Relation1 = "EXACT" | "NEAR_CANDIDATE" | "VISUAL_REFERENCE" | "DIFFERENT" | "UNCHECKED";
/**
 * Configured pair acceptance; relation distinguishes original identity from a thumbnail-only near candidate
 */
export type Verified = boolean;
export type DinoCosine = number | null;
export type PixelCosine = number | null;
export type Ncc = number | null;
export type MeanAbsDiff = number | null;
export type HighDiffRatio = number | null;
export type BestShift = [unknown, unknown] | null;
export type Status15 = "COMPLETE" | "INCOMPATIBLE" | "UNAVAILABLE" | "UNSUPPORTED" | "NOT_OBSERVABLE";
export type Regions2 = [unknown, unknown, unknown, unknown][];
export type ComparedPixels1 = number;
export type ChangedPixels1 = number | null;
export type MaxAbsDiff1 = number | null;
export type Reason7 = string | null;
export type Status16 = "UNSUPPORTED";
export type Reason8 = string;
export type ErrorCode = ("INVALID_SCOPE" | "SOURCE_UNAVAILABLE" | "UNSUPPORTED_IMAGE" | "INDEX_NOT_READY" | "PROFILE_NOT_CONFIGURED" | "ENCODER_UNAVAILABLE" | "ANNOTATION_UNREADABLE" | "RESOURCE_LIMIT" | "REFERENCE_NOT_FOUND") | null;
export type Reason9 = string | null;
export type Members = RetrievalMember[];
export type NextMemberCursor = string | null;
export type Groups = RetrievalGroup[];
export type GroupCount = number;
export type MemberCount1 = number;
export type NextCursor = string | null;
export type ErrorCode1 = ("INVALID_SCOPE" | "SOURCE_UNAVAILABLE" | "UNSUPPORTED_IMAGE" | "INDEX_NOT_READY" | "PROFILE_NOT_CONFIGURED" | "ENCODER_UNAVAILABLE" | "ANNOTATION_UNREADABLE" | "RESOURCE_LIMIT" | "REFERENCE_NOT_FOUND") | null;
export type Reason10 = string | null;
export type GroupCount1 = number;
export type MemberCount2 = number;
export type VisualK = number;
export type RetrievalCompleteness = "EXACT_SCOPE" | "TOP_K" | "PARTIAL";
export type ImageRef2 = string;
export type Sha2563 = string;
export type SourceBytes = number;
export type ExpiresInSeconds = number;
export type CheckId8 = string;
export type RunId8 = string;
export type SampleId27 = string;
export type ScopeId2 = string;
export type Mode3 = "exact" | "visual" | "combined";
export type ProfileId7 = string | null;
export type Status17 = "COMPLETE" | "PARTIAL" | "FAILED";
export type ResultId1 = string;
export type EvidenceId6 = string;
export type SampleId28 = string;
export type References = AuditResultReference[];
export type ErrorCode2 = ("INVALID_SCOPE" | "SOURCE_UNAVAILABLE" | "UNSUPPORTED_IMAGE" | "INDEX_NOT_READY" | "PROFILE_NOT_CONFIGURED" | "ENCODER_UNAVAILABLE" | "ANNOTATION_UNREADABLE" | "RESOURCE_LIMIT" | "REFERENCE_NOT_FOUND") | null;
export type Reason11 = string | null;
export type ResultId2 = string;
export type EvidenceId7 = string;
/**
 * Configured pair acceptance; relation distinguishes original identity from a thumbnail-only near candidate
 */
export type Verified1 = boolean;
export type DinoCosine1 = number | null;
export type PixelCosine1 = number | null;
export type Ncc1 = number | null;
export type MeanAbsDiff1 = number | null;
export type HighDiffRatio1 = number | null;
export type BestShift1 = [unknown, unknown] | null;
export type Relation2 = "EXACT" | "NEAR_CANDIDATE" | "VISUAL_REFERENCE" | "DIFFERENT" | "UNCHECKED";
export type Results1 = ConsistencyResult[];
export type ClientRequestId = string;
export type EvidenceId8 = string;
export type ResultId3 = string;
/**
 * @minItems 1
 * @maxItems 100
 */
export type DifferenceIds = [string, ...string[]];
export type Reviewer5 = string;
export type Comment3 = string;
export type Action2 = ConfirmDifference | ExpectedPolicyDifference | NeedsContext | SetEffectiveQuality | ProposeRegionChange;
export type Kind27 = "CONFIRM_DIFFERENCE";
export type Kind28 = "EXPECTED_POLICY_DIFFERENCE";
export type Kind29 = "NEEDS_CONTEXT";
export type Kind30 = "SET_EFFECTIVE_QUALITY";
/**
 * @minItems 1
 * @maxItems 2
 */
export type Targets = [QualityTarget] | [QualityTarget, QualityTarget];
export type SampleId29 = string;
export type Quality = "PASS" | "FAIL" | "HARD_NORMAL" | "UNCERTAIN";
export type Kind31 = "PROPOSE_REGION_CHANGE";
/**
 * @minItems 1
 * @maxItems 100
 */
export type Changes = [
    AddRegion | RemoveRegion | RelabelRegion | ReshapeRegion,
    ...(AddRegion | RemoveRegion | RelabelRegion | ReshapeRegion)[]
];
export type Operation2 = "add";
export type SampleId30 = string;
export type Category1 = string;
export type Geometry = BoxProposal | PolygonProposal;
export type Kind32 = "bbox";
/**
 * @minItems 4
 * @maxItems 4
 */
export type Coordinates = [unknown, unknown, unknown, unknown];
export type Kind33 = "polygon";
/**
 * @minItems 3
 * @maxItems 10000
 */
export type Points = [[unknown, unknown], [unknown, unknown], [unknown, unknown], ...[unknown, unknown][]];
export type Operation3 = "remove";
export type SampleId31 = string;
export type AnnotationId5 = string;
export type Operation4 = "relabel";
export type SampleId32 = string;
export type AnnotationId6 = string;
export type Category2 = string;
export type Operation5 = "reshape";
export type SampleId33 = string;
export type AnnotationId7 = string;
export type Geometry1 = BoxProposal | PolygonProposal;
export type EvidenceId9 = string;
export type ResultId4 = string;
export type Left1 = "CURRENT" | "CHANGED" | "MISSING" | "UNKNOWN";
export type Right1 = "CURRENT" | "CHANGED" | "MISSING" | "UNKNOWN";
export type DifferenceId1 = string;
export type ReviewState = "OPEN" | "NEEDS_CONTEXT" | "RESOLVED";
export type CorrectionState = "NOT_REQUIRED" | "PROPOSED" | "AWAITING_RESCAN" | "VERIFIED";
export type DecisionId2 = string | null;
export type CorrectionDecisionId = string | null;
export type Differences1 = DifferenceReview[];
export type DecisionId3 = string;
export type ReviewDecisionIds = string[];
export type SubmittedAt3 = string;
export type Decisions = ConsistencyDecision[];
export type ReviewEvents = ReviewDecisionRecord[];
export type CheckId9 = string;
export type ClientRequestId1 = string;
export type DecisionId4 = string;
export type EvidenceId10 = string;
export type Reviewer6 = string;
export type CorrectionState1 = "AWAITING_RESCAN" | "VERIFIED";
export type Reason12 = string;
export type CheckedAt1 = string;
export type Corrections1 = CorrectionCheck[];
export type SampleA = string;
export type SampleB = string;
/**
 * @minItems 2
 * @maxItems 2
 */
export type TargetSize = [unknown, unknown];
export type PixelCosineThreshold = number;
export type NccThreshold = number;
export type MaxMeanAbsDiff = number;
export type MaxHighDiffRatio = number;
export type DiffPixelThreshold = number;
export type EnableTranslationSearch = boolean;
export type SourceSha2563 = string;
export type ScanRef2 = string | null;
export type ContentGroupId2 = string | null;
export type Sha2564 = string;
export type ByteCount = number;
export type Issues = string[];
export type SampleA1 = string;
export type SampleB1 = string;
/**
 * Minimum overlap for confident instance correspondence; lower positive overlap remains a geometry difference requiring correspondence review
 */
export type MinimumIou1 = number;
export type AmbiguityTolerance1 = number;
export type TinyArea1 = number;
export type SplitCoverage1 = number;
export type MaxInstances1 = number;
export type MaxRoiPixels1 = number;
export type MaxCachedPixels1 = number;
/**
 * @minItems 2
 * @maxItems 2
 */
export type TargetSize1 = [unknown, unknown];
export type PixelCosineThreshold1 = number;
export type NccThreshold1 = number;
export type MaxMeanAbsDiff1 = number;
export type MaxHighDiffRatio1 = number;
export type DiffPixelThreshold1 = number;
export type EnableTranslationSearch1 = boolean;
export type AlgorithmFingerprint = string;
export type CheckedAt2 = string;
export type MediaId = string;
export type Side = "left" | "right";
export type Representation1 = "original" | "preview" | "annotation_overlay" | "annotation_mask" | "reference_overlay";
/**
 * @minItems 4
 * @maxItems 4
 */
export type Bbox8 = [unknown, unknown, unknown, unknown];
export type DifferenceId2 = string | null;
export type ReferenceFromOther1 = ("left" | "right") | null;
export type AnnotationId8 = string | null;
export type Normalization = "RAW" | "UINT8_DISPLAY" | "UINT16_FULL_RANGE_DISPLAY";
export type Available = boolean;
export type Reason13 = string | null;
export type Media = EvidenceMedia[];
export type EvidenceId11 = string;
export type EvidenceId12 = string;
export type MediaId1 = string;
export type MaxSide = number;
export type ArtifactId = string;
/**
 * e.g. 'audit_report', 'benchmark_bundle', 'metrics_report', 'evidence'
 */
export type ArtifactType = string;
/**
 * e.g. 'iad://task/kuangjiao/audit.json' or file path
 */
export type Uri = string;
/**
 * Absolute local filesystem path
 */
export type Path3 = string;
export type Summary3 = string | null;
export type EvidenceId13 = string;
export type ResultId5 = string;
/**
 * @maxItems 100
 */
export type DifferenceIds1 = string[];
export type Pageid = "industrial-consistency";
export type Tab = ("conflicts" | "search" | "groups" | "jobs") | null;
export type Scope2 = (AllRegisteredScope | DatasetScope) | null;
export type Batchid = string | null;
export type Resultid = string | null;
export type Evidenceid = string | null;
export type Facts1 = ("CURRENT" | "HISTORICAL" | "UNKNOWN") | null;
export type Groupid = string | null;
export type Memberid = string | null;
export type Differenceid = string | null;
export type Returnpage = string | null;
export type Sessionid = string | null;
export type Queryid = string | null;
export type Gallerysearch = string | null;
export type Galleryorder = ("recent" | "members") | null;
export type Differencefilter = ("all" | "category" | "geometry" | "presence" | "instances" | "multiple") | null;
export type Modelfilter = ("all" | "NOT_ANALYZED" | "RUNNING" | "FAILED" | "EQUIVALENT" | "MATERIAL" | "UNCERTAIN") | null;
export type Gallerypage = number | null;
export type Detailtab = ("summary" | "evidence" | "review") | null;
export type Subjectid = string | null;
export type Reviewfilter = ("OPEN" | "NEEDS_CONTEXT" | "RESOLVED") | null;
export type Grouppage = number | null;
export type Memberpage = number | null;
export type Cursor1 = string | null;
export type DifferencePageSize = number;
export type MaxImages = number;
export type MaxImageBytes = number;
export type MaxTextBytes = number;
export type EvidenceId14 = string;
export type ResultId6 = string;
export type AnnotationCount2 = number;
export type Issues1 = string[];
export type Differences2 = AnnotationDifference[];
export type TotalDifferences = number;
export type RequestedDifferences = number;
export type UnselectedDifferences = number;
export type RemainingDifferences = number;
export type NextCursor1 = string | null;
export type Sides = ("left" | "right")[];
export type ByteCount1 = number;
export type Sha2565 = string;
export type Media1 = ContextMedia[];
export type Pageid1 = "industrial-consistency";
export type Tab1 = ("conflicts" | "search" | "groups" | "jobs") | null;
export type Scope3 = (AllRegisteredScope1 | DatasetScope1) | null;
export type Batchid1 = string | null;
export type Resultid1 = string | null;
export type Evidenceid1 = string | null;
export type Facts2 = ("CURRENT" | "HISTORICAL" | "UNKNOWN") | null;
export type Groupid1 = string | null;
export type Memberid1 = string | null;
export type Differenceid1 = string | null;
export type Returnpage1 = string | null;
export type Sessionid1 = string | null;
export type Queryid1 = string | null;
export type Gallerysearch1 = string | null;
export type Galleryorder1 = ("recent" | "members") | null;
export type Differencefilter1 = ("all" | "category" | "geometry" | "presence" | "instances" | "multiple") | null;
export type Modelfilter1 = ("all" | "NOT_ANALYZED" | "RUNNING" | "FAILED" | "EQUIVALENT" | "MATERIAL" | "UNCERTAIN") | null;
export type Gallerypage1 = number | null;
export type Detailtab1 = ("summary" | "evidence" | "review") | null;
export type Subjectid1 = string | null;
export type Reviewfilter1 = ("OPEN" | "NEEDS_CONTEXT" | "RESOLVED") | null;
export type Grouppage1 = number | null;
export type Memberpage1 = number | null;
export type NormalizationNote = string;
export type BatchId1 = string;
export type RootBatchId = string;
export type ParentBatchId = string | null;
export type Kind34 = "index" | "consistency";
export type Status18 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type CancelRequested1 = boolean;
export type Code1 = "INVALID_SCOPE" | "SOURCE_UNAVAILABLE" | "UNSUPPORTED_IMAGE" | "INDEX_NOT_READY" | "PROFILE_NOT_CONFIGURED" | "ENCODER_UNAVAILABLE" | "ANNOTATION_UNREADABLE" | "RESOURCE_LIMIT" | "REFERENCE_NOT_FOUND";
export type Message3 = string;
export type Total9 = number;
export type Completed2 = number;
export type Failed2 = number;
export type Unprocessed2 = number;
export type PairCount = number;
export type CreatedAt5 = string;
export type Children = JobSnapshot[];
export type BatchId2 = string;
export type BatchId3 = string;
export type RequestId2 = string;
export type SampleIds5 = [string, ...string[]] | null;
export type BatchId4 = string;
export type RootBatchId1 = string;
export type ParentBatchId1 = string | null;
export type Kind35 = "index" | "consistency";
export type ScopeId3 = string;
export type DatasetIds3 = string[];
export type FrozenAt1 = string;
export type SampleCount2 = number;
export type Status19 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type CancelRequested2 = boolean;
export type Total10 = number;
export type Completed3 = number;
export type Failed3 = number;
export type Unprocessed3 = number;
export type PairCount1 = number;
export type CreatedAt6 = string;
export type RunId9 = string;
export type DatasetId35 = string;
export type JobType1 = "MODEL_AUDIT" | "NORMAL_KNOWLEDGE" | "DEFECT_KNOWLEDGE" | "DIRECTION_EXPLORATION" | "IMAGE_INDEX" | "DATA_CONSISTENCY" | "CONSISTENCY_ANALYSIS";
export type Status20 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type Phase3 = string | null;
export type Completed4 = number;
export type Failed4 = number;
export type Unprocessed4 = number;
export type Errors2 = JobFailure[];
export type Children1 = ConsistencyChildSummary[];
export type Items7 = ConsistencyBatchSummary[];
export type StartResultResponse = Started | NoWork;
export type Kind36 = "started";
export type BatchId5 = string;
export type Status21 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type Kind37 = "no_work";
export type Reason14 = string;
export type Selection1 = BatchSelection | ScopeSelection;
export type Kind38 = "batch";
export type BatchId6 = string;
export type Kind39 = "scope";
export type Subjects2 = AllRegisteredScope | DatasetScope | SampleScope | FilteredScope;
export type CorpusScope4 = AllRegisteredScope | DatasetScope;
export type Facts3 = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type Mode4 = "exact" | "visual" | "combined";
export type ProfileId8 = string | null;
export type AnnotationDifferencesOnly = boolean;
export type Relation3 = ("EXACT" | "NEAR_CANDIDATE" | "VISUAL_REFERENCE" | "DIFFERENT" | "UNCHECKED") | null;
export type ConfirmedConflict2 = boolean | null;
export type DifferenceType = ("QUALITY_LABEL" | "CATEGORY" | "ONE_SIDED_REGION" | "GEOMETRY" | "SPLIT_MERGE" | "AMBIGUOUS_MATCH" | "POLICY_UNCONFIRMED" | "ANNOTATION_UNREADABLE") | null;
export type ReviewState1 = ("OPEN" | "NEEDS_CONTEXT" | "RESOLVED") | null;
export type CorrectionState2 = ("NOT_REQUIRED" | "PROPOSED" | "AWAITING_RESCAN" | "VERIFIED") | null;
export type Cursor2 = string | null;
export type PageSize10 = number;
export type QueryId = string;
export type ObservedAt = string;
export type Current = number;
export type Historical = number;
export type Unknown = number;
export type SampleA2 = string;
export type SampleB2 = string;
export type CheckedAt3 = string;
export type FactsState = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type EvidenceAvailable = boolean;
export type Items8 = ResultSummary[];
export type Total11 = number;
export type NextCursor2 = string | null;
export type Mode5 = ("exact" | "visual" | "combined") | null;
export type ProfileId9 = string | null;
export type RetrievalCompleteness1 = "EXACT_SCOPE" | "TOP_K" | "PARTIAL" | "INDEX_ONLY";
export type Pairs = number;
export type StrictGroups = number;
export type StrictMembers = number;
export type ConfirmedQualityConflicts = number;
export type RegionalDifferences = number;
export type PolicyUnknown = number;
export type Differences3 = number;
export type InvalidAnnotationPairs = number;
export type UnavailableEvidencePairs = number;
export type PendingReview2 = number;
export type PendingCorrection = number;
export type PendingReview3 = number;
export type PendingCorrection1 = number;
export type Total12 = number;
export type Confirmed = number | null;
export type Conflicts5 = number | null;
export type Excluded1 = number | null;
export type PolicyNames = string[];
export type UnavailableReason = string | null;
export type GoldExcluded = number | null;
export type QueryId1 = string;
export type Page10 = number;
export type PageSize11 = number;
export type QueryId2 = string;
export type Page11 = number;
export type PageSize12 = number;
export type GroupId = string;
export type FactsState1 = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type QueryId3 = string;
export type GroupId1 = string;
export type FactsState2 = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type MemberCount3 = number;
export type DatasetCount = number;
export type PairCount2 = number;
export type Items9 = StrictGroup[];
export type Total13 = number;
export type QueryId4 = string;
export type GroupId2 = string;
export type FactsState3 = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type SampleId34 = string;
export type DatasetId36 = string;
export type RelativePath6 = string;
export type EvidenceId15 = string;
export type Items10 = GroupMember[];
export type Total14 = number;
export type QueryId5 = string;
export type Kind40 = "conflicts" | "groups";
export type GroupId3 = string;
export type FactsState4 = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type QueryId6 = string;
export type Kind41 = "conflicts" | "groups";
export type Page12 = number;
export type PageSize13 = number;
export type Search6 = string;
export type Order = "recent" | "members";
export type DifferenceFilter = "all" | "category" | "geometry" | "presence" | "instances" | "multiple";
export type ModelFilter = "all" | "NOT_ANALYZED" | "RUNNING" | "FAILED" | "EQUIVALENT" | "MATERIAL" | "UNCERTAIN";
export type QueryId7 = string;
export type Kind42 = "conflicts" | "groups";
export type GroupId4 = string;
export type FactsState5 = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type Page13 = number;
export type PageSize14 = number;
export type QueryId8 = string;
export type Kind43 = "conflicts" | "groups";
export type Value = "all" | "category" | "geometry" | "presence" | "instances" | "multiple";
export type Label3 = string;
export type Count = number;
export type Filters = GalleryFilterCount[];
export type Value1 = "all" | "NOT_ANALYZED" | "RUNNING" | "FAILED" | "EQUIVALENT" | "MATERIAL" | "UNCERTAIN";
export type Label4 = string;
export type Count1 = number;
export type ModelFilters = GalleryModelFilterCount[];
export type GroupId5 = string;
export type FactsState6 = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type EvidenceId16 = string;
export type Side1 = "left" | "right";
export type Available1 = boolean;
export type MemberCount4 = number;
export type CandidateCount = number;
export type DatasetCount1 = number;
export type PairCount3 = number;
export type DifferenceTypes = ("QUALITY_LABEL" | "CATEGORY" | "ONE_SIDED_REGION" | "GEOMETRY" | "SPLIT_MERGE" | "AMBIGUOUS_MATCH" | "POLICY_UNCONFIRMED" | "ANNOTATION_UNREADABLE")[];
export type ConfirmedConflict3 = boolean;
export type ModelState = "NOT_ANALYZED" | "RUNNING" | "FAILED" | "EQUIVALENT" | "MATERIAL" | "UNCERTAIN";
export type Items11 = GalleryItem[];
export type Total15 = number;
export type QueryId9 = string;
export type GroupId6 = string;
export type EvidenceId17 = string;
export type ResultId7 = string;
export type AnchorSide = "left" | "right";
export type Items12 = GalleryMember[];
export type Total16 = number;
export type QueryId10 = string;
export type Kind44 = "conflicts" | "groups";
export type GroupId7 = string;
export type FactsState7 = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type RequestId3 = string;
export type GroupId8 = string;
export type Status22 = ("PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED") | "NOT_ANALYZED";
export type RunId10 = string | null;
export type ModelName5 = string | null;
/**
 * 一句简短的整组差异结论，如标注类别不同、标注位置或范围不同、缺少或多出标注；详细依据写入conclusions，不限制其他实际发现
 */
export type Text4 = string;
/**
 * @minItems 1
 * @maxItems 100
 */
export type References1 = [GroupAnalysisReference, ...GroupAnalysisReference[]];
export type CandidateId = string;
export type ResultId8 = string;
export type EvidenceId18 = string;
export type DifferenceId3 = string | null;
export type Verdict = "EQUIVALENT" | "MATERIAL" | "UNCERTAIN";
/**
 * 覆盖全部候选且每个候选恰好一次；未获得固定主图直接证据时只能UNCERTAIN
 *
 * @minItems 1
 * @maxItems 10000
 */
export type Assessments = [GroupPairAssessment, ...GroupPairAssessment[]];
export type CandidateId1 = string;
export type Verdict1 = "EQUIVALENT" | "MATERIAL" | "UNCERTAIN";
export type Explanation = string;
/**
 * 自由描述实际发现的问题，不受程序差异分类限制；视觉基本一致时可为空
 *
 * @maxItems 100
 */
export type Findings4 = string[];
/**
 * @minItems 1
 * @maxItems 100
 */
export type Conclusions = [GroupAnalysisConclusion, ...GroupAnalysisConclusion[]];
export type Text5 = string;
/**
 * @minItems 1
 * @maxItems 100
 */
export type References2 = [GroupAnalysisReference, ...GroupAnalysisReference[]];
/**
 * @maxItems 100
 */
export type Limitations14 = string[];
export type Error2 = string | null;
export type Device = string;
export type BatchSize = number;
export type GpuMemoryMb = number;
export type ComputeDtype = "float32" | "float16";
export type DecodeWorkers = number;
export type DecodeMemoryMb = number;
export type Revision3 = number;
export type Device1 = string;
export type BatchSize1 = number;
export type GpuMemoryMb1 = number;
export type ComputeDtype1 = "float32" | "float16";
export type DecodeWorkers1 = number;
export type DecodeMemoryMb1 = number;
export type ExpectedRevision5 = number;
export type Device2 = string;
export type BatchSize2 = number;
export type GpuMemoryMb2 = number;
export type ComputeDtype2 = "float32" | "float16";
export type DecodeWorkers2 = number;
export type DecodeMemoryMb2 = number;
export type ProfileId10 = string;
export type Backend1 = "torch_hub" | "torchscript" | "transformers";
export type ModelId9 = "dinov2_vitb14_reg" | "dinov3_vitb16" | "sscd_disc_mixup";
export type WeightsRef1 = string;
export type WeightsSha2561 = string;
export type SourceRef1 = string | null;
export type SourceSha2564 = string | null;
export type ArtifactsSha2561 = string | null;
export type RuntimeVersion1 = string | null;
export type Processor1 = "dinov2_imagenet_eval" | "dinov3_lvd_eval" | "dinov3_hf_eval" | "sscd_skew320";
export type InputSize1 = number;
export type Pooling1 = "x_norm_clstoken" | "serialized_global" | "pooler_output";
export type Dim1 = number;
export type ResizeSize1 = number;
export type ResizeMode1 = "shorter_side" | "stretch";
export type Crop1 = "center" | "none";
export type Interpolation1 = "bicubic" | "bilinear";
/**
 * @minItems 3
 * @maxItems 3
 */
export type Mean1 = [unknown, unknown, unknown];
/**
 * @minItems 3
 * @maxItems 3
 */
export type Std1 = [unknown, unknown, unknown];
export type StorageDtype1 = "float32" | "float16";
export type ColorConversion1 = "rgb_alpha_white_uint16_div257";
export type Orientation1 = "raw";
export type Device3 = string;
export type BatchSize3 = number;
export type GpuMemoryMb3 = number;
export type ComputeDtype3 = "float32" | "float16";
export type DecodeWorkers3 = number;
export type DecodeMemoryMb3 = number;
export type ModelId10 = "dinov2_vitb14_reg" | "dinov3_vitb16" | "sscd_disc_mixup";
export type WeightsRef2 = string;
export type SourceRef2 = string | null;
export type StorageDtype2 = "float32" | "float16";
export interface WorkbenchDomain {
    ExplorationPromptPreset?: ExplorationPromptPreset;
    ExplorationPresetEdit?: ExplorationPresetEdit;
    ProviderEdit?: ProviderEdit;
    ProviderReference?: ProviderReference;
    ProviderDiscovery?: ProviderDiscovery;
    ModelConnection?: ModelConnection;
    ModelLimits?: ModelLimits;
    ModelProfile?: ModelProfile;
    ModelExecution?: ModelExecution;
    WorkbenchModelSelection?: WorkbenchModelSelection;
    WorkbenchModelSettings?: WorkbenchModelSettings;
    WorkbenchModelEdit?: WorkbenchModelEdit;
    WorkbenchProvider?: WorkbenchProvider;
    WorkbenchModelView?: WorkbenchModelView;
    DirectionAdoption?: DirectionAdoption;
    ExplorationStart?: ExplorationStart;
    ExplorationSnapshot?: ExplorationSnapshot;
    ExplorationCatalog?: ExplorationCatalog;
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
    ConsistencyStart?: ConsistencyStart;
    ImageRetrieve?: ImageRetrieve;
    ImageIndexPrepare?: ImageIndexPrepare;
    ConsistencyScopesSnapshot?: ConsistencyScopesSnapshot;
    ConsistencyCoverage?: ConsistencyCoverage;
    PixelDescriptor?: PixelDescriptor;
    PixelComparison?: PixelComparison;
    RetrievalCandidate?: RetrievalCandidate;
    AnnotationPolicy?: AnnotationPolicy;
    AnnotationSet?: AnnotationSet;
    AnnotationComparison?: AnnotationComparison;
    AnnotationDifference?: AnnotationDifference;
    AnnotationMatchingConfig?: AnnotationMatchingConfig;
    RetrievalPage?: RetrievalPage;
    TemporaryImageRef?: TemporaryImageRef;
    AuditConsistencyView?: AuditConsistencyView;
    ConsistencyReviewSubmission?: ConsistencyReviewSubmission;
    ConsistencyReviewContext?: ConsistencyReviewContext;
    CorrectionVerification?: CorrectionVerification;
    CorrectionCheck?: CorrectionCheck;
    ConsistencyCompare?: ConsistencyCompare;
    ConsistencyResult?: ConsistencyResult;
    EvidenceBundle?: EvidenceBundle;
    ConsistencyEvidenceReference?: ConsistencyEvidenceReference;
    ConsistencyEvidenceMediaReference?: ConsistencyEvidenceMediaReference;
    ArtifactRef?: ArtifactRef;
    ConsistencyContextRequest?: ConsistencyContextRequest;
    ConsistencyContext?: ConsistencyContext;
    ConsistencyReturnLocation?: ConsistencyReturnLocation;
    ConsistencyBatch?: ConsistencyBatch;
    ConsistencyBatchReference?: ConsistencyBatchReference;
    ConsistencyBatchRetry?: ConsistencyBatchRetry;
    ConsistencyBatchList?: ConsistencyBatchList;
    StartResultResponse?: StartResultResponse;
    ConsistencyQuery?: ConsistencyQuery;
    ResultPage?: ResultPage;
    ConsistencyReport?: ConsistencyReport;
    GroupQuery?: GroupQuery;
    GroupMemberQuery?: GroupMemberQuery;
    StrictGroupPage?: StrictGroupPage;
    GroupMemberPage?: GroupMemberPage;
    GalleryReference?: GalleryReference;
    GalleryQuery?: GalleryQuery;
    GalleryMemberQuery?: GalleryMemberQuery;
    GalleryPage?: GalleryPage;
    GalleryMemberPage?: GalleryMemberPage;
    GroupAnalysisStart?: GroupAnalysisStart;
    GroupAnalysisView?: GroupAnalysisView;
    EmbeddingProfile?: EmbeddingProfile;
    ImageEncoderConfig?: ImageEncoderConfig;
    ImageEncoderSettings?: ImageEncoderSettings;
    ImageEncoderEdit?: ImageEncoderEdit;
    ImageProfileCreate?: ImageProfileCreate;
}
export interface ExplorationPromptPreset {
    name: Name;
    text: Text;
    id: Id;
    builtin: Builtin;
}
export interface ExplorationPresetEdit {
    name: Name1;
    text: Text1;
}
export interface ProviderEdit {
    expected_revision: ExpectedRevision;
    provider_id: ProviderId;
    name: Name2;
    endpoint: Endpoint;
    models: Models;
    api_key?: ApiKey;
}
export interface ProviderModel {
    model_id: ModelId;
    name: Name3;
    input_modalities?: InputModalities;
    context_tokens?: ContextTokens;
    max_output_tokens?: MaxOutputTokens;
}
export interface ProviderReference {
    expected_revision: ExpectedRevision1;
    provider_id: ProviderId1;
}
export interface ProviderDiscovery {
    endpoint: Endpoint1;
    provider_id?: ProviderId2;
    api_key?: ApiKey1;
}
export interface ModelConnection {
    model_id: ModelId1;
    capacity_mode: CapacityMode;
    context_tokens: ContextTokens1;
    image_verified: ImageVerified;
}
export interface ModelLimits {
    capacity_mode: CapacityMode1;
    max_visual_inputs: MaxVisualInputs;
    max_request_bytes: MaxRequestBytes;
    context_tokens: ContextTokens2;
    max_output_tokens: MaxOutputTokens1;
    request_parameters: RequestParameters;
    generation_timeout_seconds: GenerationTimeoutSeconds;
    connect_timeout_seconds: ConnectTimeoutSeconds;
    write_timeout_seconds: WriteTimeoutSeconds;
    pool_timeout_seconds: PoolTimeoutSeconds;
}
export interface RequestParameters {
    [k: string]: unknown;
}
export interface ModelProfile {
    capacity_mode: CapacityMode2;
    max_visual_inputs: MaxVisualInputs1;
    max_request_bytes: MaxRequestBytes1;
    context_tokens: ContextTokens3;
    max_output_tokens: MaxOutputTokens2;
    request_parameters: RequestParameters1;
    generation_timeout_seconds: GenerationTimeoutSeconds1;
    connect_timeout_seconds: ConnectTimeoutSeconds1;
    write_timeout_seconds: WriteTimeoutSeconds1;
    pool_timeout_seconds: PoolTimeoutSeconds1;
    endpoint: Endpoint2;
    provider_id: ProviderId3;
    provider_name: ProviderName;
    model_id: ModelId2;
    credential_ref: CredentialRef;
    api: Api;
}
export interface RequestParameters1 {
    [k: string]: unknown;
}
export interface ModelExecution {
    profile: ModelProfile1;
    api_key?: ApiKey2;
}
export interface ModelProfile1 {
    capacity_mode?: CapacityMode3;
    max_visual_inputs?: MaxVisualInputs2;
    max_request_bytes?: MaxRequestBytes2;
    context_tokens?: ContextTokens4;
    max_output_tokens?: MaxOutputTokens3;
    request_parameters?: RequestParameters2;
    generation_timeout_seconds?: GenerationTimeoutSeconds2;
    connect_timeout_seconds?: ConnectTimeoutSeconds2;
    write_timeout_seconds?: WriteTimeoutSeconds2;
    pool_timeout_seconds?: PoolTimeoutSeconds2;
    endpoint: Endpoint3;
    provider_id?: ProviderId4;
    provider_name?: ProviderName1;
    model_id?: ModelId3;
    credential_ref?: CredentialRef1;
    api?: Api1;
}
export interface RequestParameters2 {
    [k: string]: unknown;
}
export interface WorkbenchModelSelection {
    provider_id: ProviderId5;
    model_id: ModelId4;
    limits?: ModelLimits1;
}
export interface ModelLimits1 {
    capacity_mode?: CapacityMode4;
    max_visual_inputs?: MaxVisualInputs3;
    max_request_bytes?: MaxRequestBytes3;
    context_tokens?: ContextTokens5;
    max_output_tokens?: MaxOutputTokens4;
    request_parameters?: RequestParameters3;
    generation_timeout_seconds?: GenerationTimeoutSeconds3;
    connect_timeout_seconds?: ConnectTimeoutSeconds3;
    write_timeout_seconds?: WriteTimeoutSeconds3;
    pool_timeout_seconds?: PoolTimeoutSeconds3;
}
export interface RequestParameters3 {
    [k: string]: unknown;
}
export interface WorkbenchModelSettings {
    revision: Revision;
    selection: WorkbenchModelSelection1 | null;
}
export interface WorkbenchModelSelection1 {
    provider_id: ProviderId6;
    model_id: ModelId5;
    limits: ModelLimits;
}
export interface WorkbenchModelEdit {
    expected_revision: ExpectedRevision2;
    selection: WorkbenchModelSelection;
}
export interface WorkbenchProvider {
    provider_id: ProviderId7;
    name: Name4;
    endpoint: Endpoint4;
    api: Api2;
    models: Models1;
    error: Error;
    editable: Editable;
    removable: Removable;
    credential_configured: CredentialConfigured;
    credential_writable: CredentialWritable;
}
export interface ProviderModel1 {
    model_id: ModelId6;
    name: Name5;
    input_modalities: InputModalities1;
    context_tokens: ContextTokens6;
    max_output_tokens: MaxOutputTokens5;
}
export interface WorkbenchModelView {
    revision: Revision1;
    selection: WorkbenchModelSelection1 | null;
    providers: Providers;
    ready: Ready;
    error: Error1;
    provider_revision: ProviderRevision;
}
export interface DirectionAdoption {
    dataset_id: DatasetId;
    kind: Kind;
    expected_revision: ExpectedRevision3;
    directions: Directions;
}
export interface DirectionChoice {
    direction_id: DirectionId;
    title?: Title;
    instruction?: Instruction;
    enabled?: Enabled;
}
export interface ExplorationStart {
    dataset_id: DatasetId1;
    normal_images: NormalImages;
    defect_images: DefectImages;
    objective?: Objective;
    prompt?: FrozenExplorationPrompt | null;
}
export interface FrozenExplorationPrompt {
    preset_id?: PresetId;
    preset_name?: PresetName;
    text: Text2;
}
export interface ExplorationSnapshot {
    summary: Summary;
    directions: Directions1;
    limitations: Limitations1;
    version_id: VersionId;
    dataset_id: DatasetId2;
    run_id: RunId;
    created_at: CreatedAt;
    model_name: ModelName;
    signature: Signature;
    request: ExplorationStart1;
    normal_sources: NormalSources;
    defect_sources: DefectSources;
    evidence: Evidence;
}
export interface ExploredDirection {
    title: Title1;
    instruction: Instruction1;
    applies_to: AppliesTo;
    rationale: Rationale;
    evidence_ids: EvidenceIds;
    limitations: Limitations;
    direction_id: DirectionId1;
}
export interface ExplorationStart1 {
    dataset_id: DatasetId3;
    normal_images: NormalImages1;
    defect_images: DefectImages1;
    objective: Objective1;
    prompt: FrozenExplorationPrompt1 | null;
}
export interface FrozenExplorationPrompt1 {
    preset_id: PresetId1;
    preset_name: PresetName1;
    text: Text3;
}
export interface KnowledgeSource {
    sample_id: SampleId;
    sha256: Sha256;
    annotations_sha256: AnnotationsSha256;
    quality_status: QualityStatus;
    quality_source: QualitySource;
    review_sha256: ReviewSha256;
    audit_suggestion_ids: AuditSuggestionIds;
    qualification: Qualification;
    pixel_sha256: PixelSha256;
}
export interface KnowledgeEvidence {
    sample_id: SampleId1;
    image: VisualEvidence;
}
export interface VisualEvidence {
    evidence_id: EvidenceId;
    role: Role;
    source: Source;
    original_size: OriginalSize;
    crop_bbox: CropBbox;
    sent_size: SentSize;
    sha256: Sha2561;
    source_sha256: SourceSha256;
    representation: Representation;
    annotation_ids: AnnotationIds;
    annotation_sha256: AnnotationSha256;
    media_type: MediaType;
}
export interface ExplorationCatalog {
    dataset_id: DatasetId4;
    versions: Versions;
    exploration: ExplorationSnapshot | null;
}
export interface ExplorationVersion {
    version_id: VersionId1;
    dataset_id: DatasetId5;
    run_id: RunId1;
    created_at: CreatedAt1;
    direction_count: DirectionCount;
}
export interface MiningPrompt {
    dataset_id: DatasetId6;
    kind: Kind1;
    instruction: Instruction2;
    configuration: MiningPromptConfiguration;
    revision: Revision2;
    customized: Customized;
}
export interface MiningPromptConfiguration {
    objective: Objective2;
    directions: Directions2;
}
export interface MiningDirection {
    direction_id: DirectionId2;
    title: Title2;
    instruction: Instruction3;
    enabled: Enabled1;
    origin: Origin;
}
export interface MiningPromptEdit {
    dataset_id: DatasetId7;
    kind: Kind2;
    expected_revision: ExpectedRevision4;
    /**
     * 完整替换挖掘目标和方向；null恢复默认
     */
    configuration: MiningPromptConfiguration | null;
}
export interface KnowledgeDiscoveryPage {
    version_id: VersionId2;
    dataset_id: DatasetId8;
    kind: Kind3;
    recorded: Recorded;
    parts: Parts;
    total: Total;
    page: Page;
    page_size: PageSize;
    items: Items;
}
export interface ObservedPart {
    name: Name6;
    location: Location;
    evidence_ids: EvidenceIds1;
}
export interface DiscoveryArea {
    direction_id: DirectionId3;
    direction: Direction;
    status: Status;
    reason: Reason;
    evidence_ids: EvidenceIds2;
    subjects: Subjects;
    check_titles: CheckTitles;
}
export interface KnowledgeTracePage {
    run_id: RunId2;
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
    sample_id: SampleId2;
    image: VisualEvidence;
    observed: Observed;
}
export interface KnowledgeScopeOpen {
    dataset_id: DatasetId9;
    kind: Kind4;
    objective: Objective3;
    search?: Search;
    seed?: Seed;
    starting_version_id?: StartingVersionId;
    normal_version_id?: NormalVersionId;
}
export interface KnowledgeScopeSnapshot {
    search: Search1;
    seed: Seed1;
    scope_run_id: ScopeRunId;
    dataset_id: DatasetId10;
    kind: Kind5;
    objective: Objective4;
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
    version_id: VersionId3;
    check_id?: CheckId;
    section?: Section;
    page?: Page2;
    page_size?: PageSize2;
}
export interface KnowledgeCheckPage {
    version_id: VersionId4;
    dataset_id: DatasetId11;
    kind: Kind6;
    total: Total3;
    page: Page3;
    page_size: PageSize3;
    items: Items2;
}
export interface KnowledgeCheckSummary {
    title: Title3;
    subject: Subject;
    location: Location1;
    criterion: Criterion;
    allowed_variations: AllowedVariations;
    limitations: Limitations2;
    status: Status3;
    pending_recheck_source_count: PendingRecheckSourceCount;
    check_id: CheckId1;
    support_count: SupportCount;
    counter_count: CounterCount;
    conflict_ids: ConflictIds;
    support_limitations: SupportLimitations;
}
export interface KnowledgeCheckEvidencePage {
    version_id: VersionId5;
    dataset_id: DatasetId12;
    kind: Kind7;
    check: KnowledgeCheckSummary;
    total: Total4;
    page: Page4;
    page_size: PageSize4;
    items: Items3;
}
export interface KnowledgeReviewContext {
    scope_run_id: ScopeRunId1;
    reference: KnowledgeReviewReference;
    dataset_id: DatasetId13;
    conflict: KnowledgeConflict;
    checks: Checks;
    evidence: Evidence1;
    events: Events;
    sample_review: ReviewDecisionRecord | null;
    is_latest: IsLatest;
    source_current: SourceCurrent;
    state: State;
    context_signature: ContextSignature1;
}
export interface KnowledgeReviewReference {
    version_id: VersionId6;
    conflict_id: ConflictId;
}
export interface KnowledgeConflict {
    conflict_id: ConflictId1;
    category: Category;
    origin_version_id: OriginVersionId;
    resolution: KnowledgeRecheckDecision | null;
    check_ids: CheckIds;
    sample_id: SampleId3;
    source_sha256: SourceSha2561;
    bbox: Bbox;
    observation_step_ids: ObservationStepIds;
    new_evidence_ids: NewEvidenceIds;
    comparison_evidence_ids: ComparisonEvidenceIds;
    description: Description1;
    normal_explanation: NormalExplanation;
    limitations: Limitations4;
}
export interface KnowledgeRecheckDecision {
    submission_id: SubmissionId;
    status: Status4;
    description: Description;
    evidence_ids: EvidenceIds3;
    limitations: Limitations3;
}
export interface KnowledgeCheck {
    title: Title4;
    subject: Subject1;
    location: Location2;
    criterion: Criterion1;
    allowed_variations: AllowedVariations1;
    limitations: Limitations5;
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
    version_id: VersionId7;
    conflict_id: ConflictId2;
    submission_id: SubmissionId1;
    context_signature: ContextSignature;
    reviewer: Reviewer;
    action: Action;
    instruction: Instruction4;
    reason: Reason1;
    created_at: CreatedAt2;
}
export interface ReviewDecisionRecord {
    decision_id: DecisionId;
    sample_id: SampleId4;
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
    version_id: VersionId8;
    conflict_id: ConflictId3;
    submission_id: SubmissionId2;
    context_signature: ContextSignature2;
    reviewer: Reviewer2;
    action: Action1;
    instruction?: Instruction5;
    reason: Reason2;
}
export interface KnowledgeReviewItem {
    version_id: VersionId9;
    conflict_id: ConflictId4;
    dataset_id: DatasetId14;
    kind: Kind8;
    sample_id: SampleId5;
    description: Description2;
    state: State1;
}
export interface AuditAnalysis {
    consistency: AuditConsistencyReference | null;
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
export interface AuditConsistencyReference {
    check_id: CheckId3;
    results: Results;
}
export interface AuditConsistencyEvidenceReference {
    result_id: ResultId;
    evidence_id: EvidenceId1;
}
export interface CheckAssessment {
    description: Description3;
    position_analysis: PositionAnalysis;
    illumination_analysis: IlluminationAnalysis;
    check_id: CheckId4;
    status: Status6;
    evidence_ids: EvidenceIds4;
    limitations: Limitations6;
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
    limitations: Limitations7;
    review_action: ReviewAction;
    priority: Priority;
    evidence_ids: EvidenceIds5;
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
    evidence_ids: EvidenceIds6;
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
    evidence_ids: EvidenceIds7;
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
    limitations: Limitations8;
    review_action: ReviewAction1;
    priority: Priority1;
    evidence_ids: EvidenceIds8;
    related_findings: RelatedFindings1;
}
export interface FindingResolution {
    related_findings: RelatedFindings2;
    description: Description13;
    normal_explanation: NormalExplanation3;
    evidence_ids: EvidenceIds9;
}
export interface KnowledgeSnapshot {
    version_id: VersionId10;
    dataset_id: DatasetId15;
    kind: Kind9;
    parent_version_id: ParentVersionId;
    normal_version_id: NormalVersionId3;
    model_name: ModelName1;
    generation_version: GenerationVersion;
    signature: Signature1;
    summary: Summary1;
    checks: Checks1;
    revisions: Revisions;
    corrections: Corrections;
    comparison_sources: ComparisonSources;
    suspects: Suspects;
    limitations: Limitations9;
    sources: Sources;
    evidence: Evidence2;
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
    created_at: CreatedAt3;
}
export interface CheckRevision {
    previous_check_id: PreviousCheckId;
    current_check_titles: CurrentCheckTitles;
    reason: Reason4;
}
export interface KnowledgeCorrection {
    check_id: CheckId5;
    instruction: Instruction6;
}
export interface KnowledgeSuspect {
    evidence_id: EvidenceId2;
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
    summary: Summary2;
    checks: Checks2;
    suspects: Suspects1;
    limitations: Limitations11;
    revisions: Revisions1;
    /**
     * 逐部件观察与各挖掘方向的实际结果；未返回时明确未记录，不能据此宣称观察完整
     */
    discovery: KnowledgeDiscovery | null;
}
export interface LearnedCheck {
    title: Title5;
    subject: Subject2;
    location: Location5;
    criterion: Criterion2;
    allowed_variations: AllowedVariations2;
    limitations: Limitations10;
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
    version_id: VersionId11;
    purpose: Purpose;
    checks: Checks3;
    input_evidence_ids: InputEvidenceIds1;
    result: KnowledgeObservations;
}
export interface KnowledgeObservations {
    observations: Observations;
}
export interface KnowledgeObservation {
    status: Status8;
    description: Description15;
    position_analysis: PositionAnalysis6;
    illumination_analysis: IlluminationAnalysis6;
    normal_explanation: NormalExplanation5;
    evidence_ids: EvidenceIds10;
    suspects: Suspects2;
    check_id: CheckId6;
    sample_id: SampleId6;
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
    limitations: Limitations12;
    evidence_ids: EvidenceIds11;
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
    check_id: CheckId7;
}
export interface FrozenMiningPrompt {
    configuration: MiningPromptConfiguration;
    instruction: Instruction7;
    signature: Signature2;
}
export interface KnowledgeVersion {
    version_id: VersionId12;
    dataset_id: DatasetId16;
    kind: Kind10;
    parent_version_id: ParentVersionId1;
    normal_version_id: NormalVersionId4;
    model_name: ModelName2;
    created_at: CreatedAt4;
    source_count: SourceCount;
    check_count: CheckCount;
}
export interface KnowledgeQuery {
    knowledge: KnowledgeSnapshot | null;
    versions: Versions1;
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
    dataset_id: DatasetId17;
    kind: Kind11;
    normal_version_id?: NormalVersionId5;
    uncovered_from_version?: UncoveredFromVersion;
    page?: Page5;
    page_size?: PageSize5;
    search?: Search2;
}
export interface KnowledgeSourcePage {
    dataset_id: DatasetId18;
    kind: Kind12;
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
    version_id: VersionId13;
    total: Total6;
    observed: Observed2;
    pending_review: PendingReview1;
    stale: Stale1;
    remaining: Remaining1;
}
export interface AuditStart {
    dataset_id: DatasetId19;
    origin_session_id?: OriginSessionId;
    model_name?: ModelName3;
    normal_version_id?: NormalVersionId7;
    defect_version_id?: DefectVersionId1;
    sample_ids?: SampleIds;
    filters?: SampleFilters;
    consistency_mode?: ConsistencyMode;
    consistency_profile_id?: ConsistencyProfileId;
    corpus_scope?: CorpusScope;
}
export interface SampleFilters {
    raw_label_filters?: RawLabelFilters;
    annotation_filters?: AnnotationFilters;
    model_status?: ModelStatus;
    review_status?: ReviewStatus;
    technical?: Technical;
    reference_status?: ReferenceStatus;
    search?: Search3;
    sort_by?: SortBy;
}
export interface AllRegisteredScope {
    kind?: Kind13;
}
export interface DatasetScope {
    kind?: Kind14;
    dataset_ids: DatasetIds;
}
export interface ModelCallDetail {
    call_id: CallId;
    run_id: RunId3;
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
    run_id: RunId4;
    sample_ids?: SampleIds1;
}
export interface JobSnapshot {
    run_id: RunId5;
    task_id: TaskId;
    dataset_id: DatasetId20;
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
    submitted_at: SubmittedAt1;
    started_at: StartedAt2;
    finished_at: FinishedAt1;
    deleted_at: DeletedAt;
    model_name: ModelName4;
    model_profile: ModelProfileSnapshot | null;
    embedding_profile: EmbeddingProfile | null;
    current_sample: JobSample | null;
    phase: Phase1;
    phase_started_at: PhaseStartedAt;
    prepared_sources: PreparedSources;
    queue_position: QueuePosition;
    normal_version_id: NormalVersionId8;
    defect_version_id: DefectVersionId2;
    kind: Kind15;
    knowledge_version_id: KnowledgeVersionId1;
    exploration_version_id: ExplorationVersionId;
    exploration_prompt: FrozenExplorationPrompt1 | null;
    exploration_request: ExplorationStart1 | null;
    mining_prompt: FrozenMiningPrompt | null;
    inspected_regions: InspectedRegions1;
    planned_regions: PlannedRegions1;
    completed_batches: CompletedBatches;
    total_batches: TotalBatches;
    errors: Errors;
    model_calls: ModelCalls;
    [k: string]: unknown;
}
/**
 * Immutable job metadata preserves fields from the captured execution schema.
 */
export interface ModelProfileSnapshot {
    capacity_mode: CapacityMode5;
    max_visual_inputs: MaxVisualInputs4;
    max_request_bytes: MaxRequestBytes4;
    context_tokens: ContextTokens7;
    max_output_tokens: MaxOutputTokens6;
    request_parameters: RequestParameters4;
    generation_timeout_seconds: GenerationTimeoutSeconds4;
    connect_timeout_seconds: ConnectTimeoutSeconds4;
    write_timeout_seconds: WriteTimeoutSeconds4;
    pool_timeout_seconds: PoolTimeoutSeconds4;
    endpoint: Endpoint5;
    provider_id: ProviderId8;
    provider_name: ProviderName2;
    model_id: ModelId7;
    credential_ref: CredentialRef2;
    api: Api3;
    [k: string]: unknown;
}
export interface RequestParameters4 {
    [k: string]: unknown;
}
export interface EmbeddingProfile {
    profile_id: ProfileId;
    backend: Backend;
    model_id: ModelId8;
    weights_ref: WeightsRef;
    weights_sha256: WeightsSha256;
    source_ref: SourceRef;
    source_sha256: SourceSha2562;
    artifacts_sha256: ArtifactsSha256;
    runtime_version: RuntimeVersion;
    processor: Processor;
    input_size: InputSize;
    pooling: Pooling;
    dim: Dim;
    resize_size: ResizeSize;
    resize_mode: ResizeMode;
    crop: Crop;
    interpolation: Interpolation;
    mean: Mean;
    std: Std;
    storage_dtype: StorageDtype;
    color_conversion: ColorConversion;
    orientation: Orientation;
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
    code: Code;
    sample_uuid: SampleUuid1;
}
export interface ModelCallSummary {
    call_id: CallId1;
    run_id: RunId6;
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
    run_id: RunId7;
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
    dataset_id: DatasetId21;
    sample_id: SampleId15;
    suggestion_id: SuggestionId;
    finding_id?: FindingId3;
    evidence_id?: EvidenceId3;
}
export interface InspectionSnapshot {
    reference: InspectionReference1;
    sample: Sample;
    analysis: AuditAnalysis;
    evidence: Evidence3;
    audit_run_id: AuditRunId;
    origin_session_id: OriginSessionId2;
    is_latest: IsLatest1;
}
export interface InspectionReference1 {
    dataset_id: DatasetId22;
    sample_id: SampleId16;
    suggestion_id: SuggestionId1;
    finding_id: FindingId4;
    evidence_id: EvidenceId4;
}
export interface Sample {
    sample_id: SampleId17;
    task_id: TaskId1;
    dataset_id?: DatasetId23;
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
    name: Name7;
    annotation_policy?: AnnotationPolicy;
    format?: Format;
    image_dir: ImageDir;
    annotation_dir: AnnotationDir;
    archive_path?: ArchivePath;
    unannotated_is_normal?: UnannotatedIsNormal;
}
export interface AnnotationPolicy {
    policy_id?: PolicyId;
    annotation_role?: AnnotationRole;
    annotation_coverage?: AnnotationCoverage;
    category_mapping?: CategoryMapping;
}
export interface CategoryMapping {
    [k: string]: string;
}
export interface FolderClassificationImport {
    name: Name8;
    annotation_policy?: AnnotationPolicy;
    format?: Format1;
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
    dataset_id: DatasetId24;
    task_id: TaskId2;
    image_count: ImageCount2;
    annotation_count: AnnotationCount1;
    issue_count: IssueCount;
    db_path: DbPath;
    pixel_index: PixelScanSummary;
}
export interface PixelScanSummary {
    scan_ref: ScanRef;
    coverage: CoverageCount;
    reused_samples: ReusedSamples;
    decoded_images: DecodedImages;
    compared_pairs: ComparedPairs;
    cache_peak_bytes: CachePeakBytes;
}
export interface CoverageCount {
    total: Total7;
    completed: Completed1;
    failed: Failed1;
    unsupported: Unsupported;
    pending: Pending;
}
export interface DatasetReport {
    dataset_id: DatasetId25;
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
    limitations: Limitations13;
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
    kind: Kind16;
}
export interface Annotation {
    annotation_id: AnnotationId3;
    sample_id: SampleId18;
    annotation_type: AnnotationType;
    raw_label: RawLabel;
    is_ignored?: IsIgnored;
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
    dataset_id: DatasetId26;
    sample_id: SampleId19;
    reviewer: Reviewer3;
    decision: ReviewDecisionEnum;
    reason_code?: ReasonCode1;
    comment?: Comment1;
    duration_ms?: DurationMs;
    started_at?: StartedAt4;
}
export interface ReviewHistoryQuery {
    dataset_id: DatasetId27;
    page?: Page7;
    page_size?: PageSize7;
    search?: Search4;
}
export interface ReviewHistoryPage {
    items: Items6;
    total: Total8;
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
    submitted_at: SubmittedAt2;
    review_duration_ms: ReviewDurationMs1;
    relative_path: RelativePath5;
}
export interface SampleQuery {
    raw_label_filters?: RawLabelFilters1;
    annotation_filters?: AnnotationFilters1;
    model_status?: ModelStatus1;
    review_status?: ReviewStatus1;
    technical?: Technical1;
    reference_status?: ReferenceStatus1;
    search?: Search5;
    sort_by?: SortBy1;
    dataset_id?: DatasetId28;
    task_id?: TaskId4;
    page?: Page9;
    page_size?: PageSize9;
}
export interface ConsistencyStart {
    subjects: Subjects1;
    corpus_scope?: CorpusScope1;
    mode?: Mode;
    profile_id?: ProfileId1;
    request_id: RequestId;
}
export interface SampleScope {
    kind?: Kind17;
    sample_ids: SampleIds3;
}
export interface FilteredScope {
    kind?: Kind18;
    dataset_id: DatasetId29;
    filters?: SampleFilters;
}
export interface ImageRetrieve {
    query: Query;
    corpus_scope?: CorpusScope2;
    mode?: Mode1;
    profile_id?: ProfileId2;
    top_k?: TopK;
    cursor?: Cursor;
}
export interface SampleImageQuery {
    kind?: Kind19;
    sample_id: SampleId21;
}
export interface TemporaryImageQuery {
    kind?: Kind20;
    image_ref: ImageRef;
}
export interface ImageIndexPrepare {
    corpus_scope?: CorpusScope3;
    profile_id?: ProfileId3;
    request_id: RequestId1;
}
export interface ConsistencyScopesSnapshot {
    subjects: FrozenScope;
    corpus: FrozenScope;
}
export interface FrozenScope {
    scope_id: ScopeId;
    dataset_ids: DatasetIds1;
    frozen_at: FrozenAt;
    sample_count: SampleCount1;
    selector: Selector;
    samples: Samples1;
    scans: Scans;
}
export interface AllRegisteredScope1 {
    kind: Kind21;
}
export interface DatasetScope1 {
    kind: Kind22;
    dataset_ids: DatasetIds2;
}
export interface SampleScope1 {
    kind: Kind23;
    sample_ids: SampleIds4;
}
export interface FilteredScope1 {
    kind: Kind24;
    dataset_id: DatasetId30;
    filters: SampleFilters;
}
export interface FrozenSample {
    sample_id: SampleId22;
    dataset_id: DatasetId31;
    task_id: TaskId5;
    source_fingerprint: SourceFingerprint;
    quality_status: QualityStatus1;
    quality_source: QualitySource2;
}
export interface ScanReference {
    dataset_id: DatasetId32;
    scan_ref: ScanRef1;
}
export interface ConsistencyCoverage {
    corpus: CoverageCount;
    verification: CoverageCount;
    annotation: CoverageCount;
}
export interface PixelDescriptor {
    compare_profile: CompareProfile;
    width: Width1;
    height: Height1;
    channel_semantics: ChannelSemantics;
    dtype: Dtype;
    bit_depth: BitDepth;
    pixel_key: PixelKey;
    decode_status: DecodeStatus;
    reason: Reason5;
    annotation_coordinates: AnnotationCoordinates;
}
export interface PixelComparison {
    status: Status12;
    compare_profile: CompareProfile1;
    exact_equal: ExactEqual;
    compared_pixels: ComparedPixels;
    changed_pixels: ChangedPixels;
    max_abs_diff: MaxAbsDiff;
    reason: Reason6;
}
export interface RetrievalCandidate {
    sample_id: SampleId23;
    content_group_id: ContentGroupId;
    retrieval_branch: RetrievalBranch;
    rank: Rank;
    score: Score;
    profile_id: ProfileId4;
    relation: Relation;
    evidence_id: EvidenceId5;
}
export interface AnnotationSet {
    sample_id: SampleId24;
    dataset_id: DatasetId33;
    width: Width2;
    height: Height2;
    quality_status: QualityStatus1;
    quality_source: QualitySource3;
    annotations: Annotations;
    policy: AnnotationPolicy1;
    errors: Errors1;
    annotation_coordinates: AnnotationCoordinates1;
}
export interface AnnotationPolicy1 {
    policy_id: PolicyId1;
    annotation_role: AnnotationRole1;
    annotation_coverage: AnnotationCoverage1;
    category_mapping: CategoryMapping1;
}
export interface CategoryMapping1 {
    [k: string]: string;
}
export interface AnnotationComparison {
    status: Status13;
    policy_relation: PolicyRelation;
    matches: Matches;
    differences: Differences;
    invalid_left: InvalidLeft;
    invalid_right: InvalidRight;
    confirmed_conflict: ConfirmedConflict1;
    ignore_regions: IgnoreRegions;
    masking: Masking;
}
export interface InstanceMatch {
    left_id: LeftId;
    right_id: RightId;
    bbox_iou: BboxIou;
    segmentation_iou: SegmentationIou;
    geometry_equal: GeometryEqual;
    comparison_kind: ComparisonKind;
}
export interface AnnotationDifference {
    difference_id: DifferenceId;
    type: Type1;
    left: Left;
    right: Right;
    region: Region;
    policy_relation: PolicyRelation1;
    facts: Facts;
    pending: Pending1;
    reference_from_other: ReferenceFromOther;
    suspected_missing: SuspectedMissing;
    confirmed_conflict: ConfirmedConflict;
}
export interface Facts {
    [k: string]: JsonValue;
}
export interface AnnotationMasking {
    annotation_id: AnnotationId4;
    total_pixels: TotalPixels;
    visible_pixels: VisiblePixels;
    ignore_annotation_ids: IgnoreAnnotationIds;
}
export interface AnnotationMatchingConfig {
    minimum_iou?: MinimumIou;
    ambiguity_tolerance?: AmbiguityTolerance;
    tiny_area?: TinyArea;
    split_coverage?: SplitCoverage;
    max_instances?: MaxInstances;
    max_roi_pixels?: MaxRoiPixels;
    max_cached_pixels?: MaxCachedPixels;
}
export interface RetrievalPage {
    query: Query1;
    scope_id: ScopeId1;
    mode: Mode2;
    profile_id: ProfileId5;
    exact: RetrievalBranchPage;
    visual: RetrievalBranchPage;
    coverage: ConsistencyCoverage;
    group_count: GroupCount1;
    member_count: MemberCount2;
    visual_k: VisualK;
    retrieval_completeness: RetrievalCompleteness;
}
export interface SampleImageQuery1 {
    kind: Kind25;
    sample_id: SampleId25;
}
export interface TemporaryImageQuery1 {
    kind: Kind26;
    image_ref: ImageRef1;
}
export interface RetrievalBranchPage {
    status: Status14;
    corpus_coverage: CoverageCount;
    groups: Groups;
    group_count: GroupCount;
    member_count: MemberCount1;
    next_cursor: NextCursor;
    error_code: ErrorCode1;
    reason: Reason10;
}
export interface RetrievalGroup {
    content_group_id: ContentGroupId1;
    origins: Origins3;
    member_count: MemberCount;
    conflict_count: ConflictCount;
    members: Members;
    next_member_cursor: NextMemberCursor;
}
export interface RetrievalOrigin {
    branch: Branch;
    rank: Rank1;
    score: Score1;
    profile_id: ProfileId6;
}
export interface RetrievalMember {
    sample_id: SampleId26;
    dataset_id: DatasetId34;
    quality_status: QualityStatus1;
    relation: Relation1;
    pixel: PixelComparison;
    near: NearVerification | null;
    local: RegionPixelStatistics | null;
    registration: Registration | null;
    annotation: AnnotationComparison | null;
    error_code: ErrorCode;
    reason: Reason9;
}
export interface NearVerification {
    verified: Verified;
    dino_cosine: DinoCosine;
    pixel_cosine: PixelCosine;
    ncc: Ncc;
    mean_abs_diff: MeanAbsDiff;
    high_diff_ratio: HighDiffRatio;
    best_shift: BestShift;
    details: Details;
}
export interface Details {
    [k: string]: JsonValue;
}
export interface RegionPixelStatistics {
    status: Status15;
    regions: Regions2;
    compared_pixels: ComparedPixels1;
    changed_pixels: ChangedPixels1;
    max_abs_diff: MaxAbsDiff1;
    reason: Reason7;
}
export interface Registration {
    status: Status16;
    reason: Reason8;
}
export interface TemporaryImageRef {
    image_ref: ImageRef2;
    sha256: Sha2563;
    source_bytes: SourceBytes;
    expires_in_seconds: ExpiresInSeconds;
}
export interface AuditConsistencyView {
    check_id: CheckId8;
    run_id: RunId8;
    sample_id: SampleId27;
    scope_id: ScopeId2;
    mode: Mode3;
    profile_id: ProfileId7;
    status: Status17;
    coverage: ConsistencyCoverage | null;
    references: References;
    error_code: ErrorCode2;
    reason: Reason11;
    results: Results1;
}
export interface AuditResultReference {
    result_id: ResultId1;
    evidence_id: EvidenceId6;
    sample_id: SampleId28;
}
export interface ConsistencyResult {
    result_id: ResultId2;
    evidence_id: EvidenceId7;
    verification: VerificationResult;
    annotation: AnnotationComparison;
}
export interface VerificationResult {
    verified: Verified1;
    dino_cosine: DinoCosine1;
    pixel_cosine: PixelCosine1;
    ncc: Ncc1;
    mean_abs_diff: MeanAbsDiff1;
    high_diff_ratio: HighDiffRatio1;
    best_shift: BestShift1;
    details: Details1;
    relation: Relation2;
    pixel: PixelComparison;
    local: RegionPixelStatistics | null;
    registration: Registration;
}
export interface Details1 {
    [k: string]: JsonValue;
}
export interface ConsistencyReviewSubmission {
    client_request_id: ClientRequestId;
    evidence_id: EvidenceId8;
    result_id: ResultId3;
    difference_ids: DifferenceIds;
    reviewer: Reviewer5;
    comment: Comment3;
    action: Action2;
}
export interface ConfirmDifference {
    kind: Kind27;
}
export interface ExpectedPolicyDifference {
    kind: Kind28;
}
export interface NeedsContext {
    kind: Kind29;
}
export interface SetEffectiveQuality {
    kind: Kind30;
    targets: Targets;
}
export interface QualityTarget {
    sample_id: SampleId29;
    quality: Quality;
}
export interface ProposeRegionChange {
    kind: Kind31;
    changes: Changes;
}
export interface AddRegion {
    operation: Operation2;
    sample_id: SampleId30;
    category: Category1;
    geometry: Geometry;
}
export interface BoxProposal {
    kind: Kind32;
    coordinates: Coordinates;
}
export interface PolygonProposal {
    kind: Kind33;
    points: Points;
}
export interface RemoveRegion {
    operation: Operation3;
    sample_id: SampleId31;
    annotation_id: AnnotationId5;
}
export interface RelabelRegion {
    operation: Operation4;
    sample_id: SampleId32;
    annotation_id: AnnotationId6;
    category: Category2;
}
export interface ReshapeRegion {
    operation: Operation5;
    sample_id: SampleId33;
    annotation_id: AnnotationId7;
    geometry: Geometry1;
}
export interface ConsistencyReviewContext {
    evidence_id: EvidenceId9;
    result_id: ResultId4;
    source_states: EvidenceSourceStates;
    differences: Differences1;
    decisions: Decisions;
    review_events: ReviewEvents;
    corrections: Corrections1;
}
export interface EvidenceSourceStates {
    left: Left1;
    right: Right1;
}
export interface DifferenceReview {
    difference_id: DifferenceId1;
    review_state: ReviewState;
    correction_state: CorrectionState;
    decision_id: DecisionId2;
    correction_decision_id: CorrectionDecisionId;
}
export interface ConsistencyDecision {
    decision_id: DecisionId3;
    request: ConsistencyReviewSubmission;
    review_decision_ids: ReviewDecisionIds;
    submitted_at: SubmittedAt3;
}
export interface CorrectionCheck {
    check_id: CheckId9;
    request: CorrectionVerification;
    correction_state: CorrectionState1;
    reason: Reason12;
    checked_at: CheckedAt1;
}
export interface CorrectionVerification {
    client_request_id: ClientRequestId1;
    decision_id: DecisionId4;
    evidence_id: EvidenceId10;
    reviewer: Reviewer6;
}
export interface ConsistencyCompare {
    sample_a: SampleA;
    sample_b: SampleB;
    matching?: AnnotationMatchingConfig;
    near?: NearComparisonConfig;
}
export interface NearComparisonConfig {
    target_size?: TargetSize;
    pixel_cosine_threshold?: PixelCosineThreshold;
    ncc_threshold?: NccThreshold;
    max_mean_abs_diff?: MaxMeanAbsDiff;
    max_high_diff_ratio?: MaxHighDiffRatio;
    diff_pixel_threshold?: DiffPixelThreshold;
    enable_translation_search?: EnableTranslationSearch;
}
export interface EvidenceBundle {
    result: ConsistencyResult;
    sources: EvidenceSources;
    parameters: ConsistencyCompare1;
    algorithm_fingerprint: AlgorithmFingerprint;
    checked_at: CheckedAt2;
    media: Media;
    source_states: EvidenceSourceStates;
}
export interface EvidenceSources {
    left: FrozenEvidenceSource;
    right: FrozenEvidenceSource;
}
export interface FrozenEvidenceSource {
    sample: Sample;
    annotations: AnnotationSet;
    review: ReviewDecisionRecord | null;
    source_sha256: SourceSha2563;
    scan_ref: ScanRef2;
    content_group_id: ContentGroupId2;
    descriptor: PixelDescriptor;
    image: EvidenceBlob;
    masks: Masks;
    issues: Issues;
}
export interface EvidenceBlob {
    sha256: Sha2564;
    byte_count: ByteCount;
}
export interface Masks {
    [k: string]: EvidenceBlob;
}
export interface ConsistencyCompare1 {
    sample_a: SampleA1;
    sample_b: SampleB1;
    matching: AnnotationMatchingConfig1;
    near: NearComparisonConfig1;
}
export interface AnnotationMatchingConfig1 {
    minimum_iou: MinimumIou1;
    ambiguity_tolerance: AmbiguityTolerance1;
    tiny_area: TinyArea1;
    split_coverage: SplitCoverage1;
    max_instances: MaxInstances1;
    max_roi_pixels: MaxRoiPixels1;
    max_cached_pixels: MaxCachedPixels1;
}
export interface NearComparisonConfig1 {
    target_size: TargetSize1;
    pixel_cosine_threshold: PixelCosineThreshold1;
    ncc_threshold: NccThreshold1;
    max_mean_abs_diff: MaxMeanAbsDiff1;
    max_high_diff_ratio: MaxHighDiffRatio1;
    diff_pixel_threshold: DiffPixelThreshold1;
    enable_translation_search: EnableTranslationSearch1;
}
export interface EvidenceMedia {
    media_id: MediaId;
    side: Side;
    representation: Representation1;
    bbox: Bbox8;
    difference_id: DifferenceId2;
    reference_from_other: ReferenceFromOther1;
    annotation_id: AnnotationId8;
    normalization: Normalization;
    available: Available;
    reason: Reason13;
}
export interface ConsistencyEvidenceReference {
    evidence_id: EvidenceId11;
}
export interface ConsistencyEvidenceMediaReference {
    evidence_id: EvidenceId12;
    media_id: MediaId1;
    max_side?: MaxSide;
}
export interface ArtifactRef {
    artifact_id: ArtifactId;
    artifact_type: ArtifactType;
    uri: Uri;
    path: Path3;
    summary?: Summary3;
}
export interface ConsistencyContextRequest {
    evidence_id: EvidenceId13;
    result_id: ResultId5;
    difference_ids?: DifferenceIds1;
    return_location?: ConsistencyReturnLocation | null;
    cursor?: Cursor1;
    difference_page_size?: DifferencePageSize;
    max_images?: MaxImages;
    max_image_bytes?: MaxImageBytes;
    max_text_bytes?: MaxTextBytes;
}
export interface ConsistencyReturnLocation {
    pageId?: Pageid;
    tab?: Tab;
    scope?: Scope2;
    query?: SampleImageQuery | null;
    batchId?: Batchid;
    resultId?: Resultid;
    evidenceId?: Evidenceid;
    facts?: Facts1;
    groupId?: Groupid;
    memberId?: Memberid;
    differenceId?: Differenceid;
    returnPage?: Returnpage;
    sessionId?: Sessionid;
    queryId?: Queryid;
    gallerySearch?: Gallerysearch;
    galleryOrder?: Galleryorder;
    differenceFilter?: Differencefilter;
    modelFilter?: Modelfilter;
    galleryPage?: Gallerypage;
    detailTab?: Detailtab;
    subjectId?: Subjectid;
    reviewFilter?: Reviewfilter;
    groupPage?: Grouppage;
    memberPage?: Memberpage;
}
export interface ConsistencyContext {
    evidence_id: EvidenceId14;
    result_id: ResultId6;
    source_states: EvidenceSourceStates;
    review_context: ConsistencyReviewContext;
    sources: Sources1;
    verification: VerificationResult;
    differences: Differences2;
    total_differences: TotalDifferences;
    requested_differences: RequestedDifferences;
    unselected_differences: UnselectedDifferences;
    remaining_differences: RemainingDifferences;
    next_cursor: NextCursor1;
    media: Media1;
    return_location: ConsistencyReturnLocation1;
    normalization_note: NormalizationNote;
}
export interface Sources1 {
    [k: string]: ContextSource;
}
export interface ContextSource {
    sample: Sample;
    review: ReviewDecisionRecord | null;
    policy: AnnotationPolicy1;
    annotation_count: AnnotationCount2;
    issues: Issues1;
}
export interface ContextMedia {
    descriptor: EvidenceMedia;
    sides: Sides;
    byte_count: ByteCount1;
    sha256: Sha2565;
}
export interface ConsistencyReturnLocation1 {
    pageId: Pageid1;
    tab: Tab1;
    scope: Scope3;
    query: SampleImageQuery1 | null;
    batchId: Batchid1;
    resultId: Resultid1;
    evidenceId: Evidenceid1;
    facts: Facts2;
    groupId: Groupid1;
    memberId: Memberid1;
    differenceId: Differenceid1;
    returnPage: Returnpage1;
    sessionId: Sessionid1;
    queryId: Queryid1;
    gallerySearch: Gallerysearch1;
    galleryOrder: Galleryorder1;
    differenceFilter: Differencefilter1;
    modelFilter: Modelfilter1;
    galleryPage: Gallerypage1;
    detailTab: Detailtab1;
    subjectId: Subjectid1;
    reviewFilter: Reviewfilter1;
    groupPage: Grouppage1;
    memberPage: Memberpage1;
}
export interface ConsistencyBatch {
    batch_id: BatchId1;
    root_batch_id: RootBatchId;
    parent_batch_id: ParentBatchId;
    kind: Kind34;
    scopes: ConsistencyScopesSnapshot;
    status: Status18;
    cancel_requested: CancelRequested1;
    error: BatchFailure | null;
    total: Total9;
    completed: Completed2;
    failed: Failed2;
    unprocessed: Unprocessed2;
    pair_count: PairCount;
    created_at: CreatedAt5;
    children: Children;
}
export interface BatchFailure {
    code: Code1;
    message: Message3;
}
export interface ConsistencyBatchReference {
    batch_id: BatchId2;
}
export interface ConsistencyBatchRetry {
    batch_id: BatchId3;
    request_id: RequestId2;
    sample_ids?: SampleIds5;
}
export interface ConsistencyBatchList {
    items: Items7;
}
export interface ConsistencyBatchSummary {
    batch_id: BatchId4;
    root_batch_id: RootBatchId1;
    parent_batch_id: ParentBatchId1;
    kind: Kind35;
    scopes: ConsistencyScopesSummary;
    status: Status19;
    cancel_requested: CancelRequested2;
    error: BatchFailure | null;
    total: Total10;
    completed: Completed3;
    failed: Failed3;
    unprocessed: Unprocessed3;
    pair_count: PairCount1;
    created_at: CreatedAt6;
    children: Children1;
}
export interface ConsistencyScopesSummary {
    subjects: ScopeSummary;
    corpus: ScopeSummary;
}
export interface ScopeSummary {
    scope_id: ScopeId3;
    dataset_ids: DatasetIds3;
    frozen_at: FrozenAt1;
    sample_count: SampleCount2;
}
export interface ConsistencyChildSummary {
    run_id: RunId9;
    dataset_id: DatasetId35;
    job_type: JobType1;
    status: Status20;
    phase: Phase3;
    completed: Completed4;
    failed: Failed4;
    unprocessed: Unprocessed4;
    errors: Errors2;
}
export interface Started {
    kind: Kind36;
    batch_id: BatchId5;
    status: Status21;
}
export interface NoWork {
    kind: Kind37;
    reason: Reason14;
    coverage: ConsistencyCoverage;
}
export interface ConsistencyQuery {
    selection: Selection1;
    annotation_differences_only?: AnnotationDifferencesOnly;
    relation?: Relation3;
    confirmed_conflict?: ConfirmedConflict2;
    difference_type?: DifferenceType;
    review_state?: ReviewState1;
    correction_state?: CorrectionState2;
    cursor?: Cursor2;
    page_size?: PageSize10;
}
export interface BatchSelection {
    kind?: Kind38;
    batch_id: BatchId6;
}
export interface ScopeSelection {
    kind?: Kind39;
    subjects: Subjects2;
    corpus_scope?: CorpusScope4;
    facts?: Facts3;
    mode?: Mode4;
    profile_id?: ProfileId8;
}
export interface ResultPage {
    query_id: QueryId;
    scopes: ConsistencyScopesSummary;
    observed_at: ObservedAt;
    facts: FactCounts;
    items: Items8;
    total: Total11;
    next_cursor: NextCursor2;
    execution: CoverageCount;
    corpus: CoverageCount;
    mode: Mode5;
    profile_id: ProfileId9;
    retrieval_completeness: RetrievalCompleteness1;
}
export interface FactCounts {
    current: Current;
    historical: Historical;
    unknown: Unknown;
}
export interface ResultSummary {
    sample_a: SampleA2;
    sample_b: SampleB2;
    result: ConsistencyResult;
    checked_at: CheckedAt3;
    facts_state: FactsState;
    source_states: EvidenceSourceStates;
    evidence_available: EvidenceAvailable;
}
export interface ConsistencyReport {
    page: ResultPage;
    statistics: ReportStatistics;
    pending_review: PendingReview3;
    pending_correction: PendingCorrection1;
    gold: GoldAvailability;
    gold_excluded: GoldExcluded;
}
export interface ReportStatistics {
    current: FactStatistics;
    historical: FactStatistics;
    unknown: FactStatistics;
}
export interface FactStatistics {
    pairs: Pairs;
    strict_groups: StrictGroups;
    strict_members: StrictMembers;
    confirmed_quality_conflicts: ConfirmedQualityConflicts;
    regional_differences: RegionalDifferences;
    policy_unknown: PolicyUnknown;
    differences: Differences3;
    invalid_annotation_pairs: InvalidAnnotationPairs;
    unavailable_evidence_pairs: UnavailableEvidencePairs;
    pending_review: PendingReview2;
    pending_correction: PendingCorrection;
}
export interface GoldAvailability {
    total: Total12;
    confirmed: Confirmed;
    conflicts: Conflicts5;
    excluded: Excluded1;
    policy_names: PolicyNames;
    unavailable_reason: UnavailableReason;
}
export interface GroupQuery {
    query_id: QueryId1;
    page?: Page10;
    page_size?: PageSize11;
}
export interface GroupMemberQuery {
    query_id: QueryId2;
    page?: Page11;
    page_size?: PageSize12;
    group_id: GroupId;
    facts_state?: FactsState1;
}
export interface StrictGroupPage {
    query_id: QueryId3;
    items: Items9;
    total: Total13;
}
export interface StrictGroup {
    group_id: GroupId1;
    facts_state: FactsState2;
    member_count: MemberCount3;
    dataset_count: DatasetCount;
    pair_count: PairCount2;
}
export interface GroupMemberPage {
    query_id: QueryId4;
    group_id: GroupId2;
    facts_state: FactsState3;
    items: Items10;
    total: Total14;
}
export interface GroupMember {
    sample_id: SampleId34;
    dataset_id: DatasetId36;
    relative_path: RelativePath6;
    evidence_id: EvidenceId15;
}
export interface GalleryReference {
    query_id: QueryId5;
    kind: Kind40;
    group_id: GroupId3;
    facts_state?: FactsState4;
}
export interface GalleryQuery {
    query_id: QueryId6;
    kind: Kind41;
    page?: Page12;
    page_size?: PageSize13;
    search?: Search6;
    order?: Order;
    difference_filter?: DifferenceFilter;
    model_filter?: ModelFilter;
}
export interface GalleryMemberQuery {
    query_id: QueryId7;
    kind: Kind42;
    group_id: GroupId4;
    facts_state?: FactsState5;
    page?: Page13;
    page_size?: PageSize14;
}
export interface GalleryPage {
    query_id: QueryId8;
    kind: Kind43;
    filters: Filters;
    model_filters: ModelFilters;
    items: Items11;
    total: Total15;
}
export interface GalleryFilterCount {
    value: Value;
    label: Label3;
    count: Count;
}
export interface GalleryModelFilterCount {
    value: Value1;
    label: Label4;
    count: Count1;
}
export interface GalleryItem {
    group_id: GroupId5;
    facts_state: FactsState6;
    anchor: GalleryImage;
    member_count: MemberCount4;
    candidate_count: CandidateCount;
    dataset_count: DatasetCount1;
    pair_count: PairCount3;
    difference_types: DifferenceTypes;
    confirmed_conflict: ConfirmedConflict3;
    model_state: ModelState;
}
export interface GalleryImage {
    sample: Sample;
    evidence_id: EvidenceId16;
    side: Side1;
    available: Available1;
}
export interface GalleryMemberPage {
    query_id: QueryId9;
    group_id: GroupId6;
    anchor: GalleryImage;
    items: Items12;
    total: Total16;
}
export interface GalleryMember {
    image: GalleryImage;
    comparison: GalleryComparison | null;
}
export interface GalleryComparison {
    evidence_id: EvidenceId17;
    result_id: ResultId7;
    anchor_side: AnchorSide;
}
export interface GroupAnalysisStart {
    query_id: QueryId10;
    kind: Kind44;
    group_id: GroupId7;
    facts_state?: FactsState7;
    request_id: RequestId3;
}
export interface GroupAnalysisView {
    group_id: GroupId8;
    status: Status22;
    run_id: RunId10;
    model_name: ModelName5;
    result: GroupAnalysisDraft | null;
    error: Error2;
}
export interface GroupAnalysisDraft {
    overall: GroupOverallConclusion;
    assessments: Assessments;
    conclusions: Conclusions;
    limitations: Limitations14;
}
/**
 * 整组唯一简短结论；详细分析保留在conclusions
 */
export interface GroupOverallConclusion {
    text: Text4;
    references: References1;
    verdict: Verdict;
}
export interface GroupAnalysisReference {
    candidate_id: CandidateId;
    comparison: GroupAnalysisComparison | null;
}
export interface GroupAnalysisComparison {
    result_id: ResultId8;
    evidence_id: EvidenceId18;
    difference_id: DifferenceId3;
}
export interface GroupPairAssessment {
    candidate_id: CandidateId1;
    verdict: Verdict1;
    explanation: Explanation;
    findings: Findings4;
}
export interface GroupAnalysisConclusion {
    text: Text5;
    references: References2;
}
export interface ImageEncoderConfig {
    device: Device;
    batch_size: BatchSize;
    gpu_memory_mb: GpuMemoryMb;
    compute_dtype: ComputeDtype;
    decode_workers: DecodeWorkers;
    decode_memory_mb: DecodeMemoryMb;
    profile: EmbeddingProfile;
}
export interface ImageEncoderSettings {
    revision: Revision3;
    selection: ImageEncoderConfig | null;
    resources: ImageResources;
}
export interface ImageResources {
    device: Device1;
    batch_size: BatchSize1;
    gpu_memory_mb: GpuMemoryMb1;
    compute_dtype: ComputeDtype1;
    decode_workers: DecodeWorkers1;
    decode_memory_mb: DecodeMemoryMb1;
}
export interface ImageEncoderEdit {
    expected_revision: ExpectedRevision5;
    selection: ImageEncoderConfig1 | null;
    resources?: ImageResources1 | null;
}
export interface ImageEncoderConfig1 {
    device?: Device2;
    batch_size?: BatchSize2;
    gpu_memory_mb?: GpuMemoryMb2;
    compute_dtype?: ComputeDtype2;
    decode_workers?: DecodeWorkers2;
    decode_memory_mb?: DecodeMemoryMb2;
    profile: EmbeddingProfile1;
}
export interface EmbeddingProfile1 {
    profile_id: ProfileId10;
    backend: Backend1;
    model_id: ModelId9;
    weights_ref: WeightsRef1;
    weights_sha256: WeightsSha2561;
    source_ref?: SourceRef1;
    source_sha256?: SourceSha2564;
    artifacts_sha256?: ArtifactsSha2561;
    runtime_version?: RuntimeVersion1;
    processor: Processor1;
    input_size: InputSize1;
    pooling: Pooling1;
    dim: Dim1;
    resize_size: ResizeSize1;
    resize_mode: ResizeMode1;
    crop: Crop1;
    interpolation: Interpolation1;
    mean: Mean1;
    std: Std1;
    storage_dtype?: StorageDtype1;
    color_conversion?: ColorConversion1;
    orientation?: Orientation1;
}
export interface ImageResources1 {
    device?: Device3;
    batch_size?: BatchSize3;
    gpu_memory_mb?: GpuMemoryMb3;
    compute_dtype?: ComputeDtype3;
    decode_workers?: DecodeWorkers3;
    decode_memory_mb?: DecodeMemoryMb3;
}
export interface ImageProfileCreate {
    model_id: ModelId10;
    weights_ref: WeightsRef2;
    source_ref?: SourceRef2;
    storage_dtype?: StorageDtype2;
}
//# sourceMappingURL=domain.generated.d.ts.map