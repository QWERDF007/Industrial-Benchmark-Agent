/* Generated from Python Pydantic models by scripts/generate-contracts.js. */

export type Summary = string;
export type Title = string;
export type Instruction = string;
export type AppliesTo = "normal" | "defect" | "both";
export type Rationale = string;
export type Limitations = string[];
/**
 * @minItems 1
 */
export type EvidenceIds = [string, ...string[]];
/**
 * 延续或修订历史方向时填写给定direction_id；本轮新增方向为null，历史文本不是本轮视觉证据
 */
export type PreviousDirectionId = string | null;
export type DirectionId = string;
export type Directions = ExploredDirection[];
export type Limitations1 = string[];
export type VersionId = string;
export type DatasetId = string;
export type RunId = string;
export type CreatedAt = string;
export type ModelName = string;
export type Signature = string;
export type DatasetId1 = string;
export type NormalImages = string[];
export type DefectImages = string[];
export type Objective = string;
export type PresetId = string | null;
export type PresetName = string | null;
export type PresetRevision = string | null;
export type Text = string;
export type ParentVersionId = string | null;
export type SampleId = string;
export type Sha256 = string;
export type AnnotationsSha256 = string;
export type QualityStatus = string | null;
export type QualitySource = string | null;
export type Status = "VALID_NONEMPTY" | "VALID_EMPTY" | "NOT_PROVIDED" | "UNREADABLE" | "UNKNOWN";
export type Origin = "FILE" | "DATASET_CONVENTION" | "FOLDER_RULE" | "UNKNOWN";
export type Source = string | null;
export type ReviewSha256 = string;
export type AuditSuggestionIds = string[];
export type Qualification =
  | "human_pass"
  | "human_hard_normal"
  | "manual_selection"
  | "raw_pass"
  | "initial_unannotated"
  | "human_fail"
  | "human_uncertain"
  | "human_skip"
  | "raw_fail"
  | "annotated_candidate"
  | "normal_suspect"
  | "audit_suspect";
export type PixelSha256 = string | null;
export type NormalSources = KnowledgeSource[];
export type DefectSources = KnowledgeSource[];
export type SampleId1 = string;
export type Role = "normal" | "overview" | "roi";
export type Source1 = "reference" | "global" | "annotation" | "model" | "coverage";
export type OriginalSize = number[];
export type CropBbox = number[];
export type SentSize = number[];
export type Sha2561 = string;
export type SourceSha256 = string;
export type Representation = "raw" | "annotation_mask" | "annotation_overlay";
export type AnnotationIds = string[];
export type AnnotationSha256 = string | null;
export type MediaType = "image/png";
export type EvidenceId = string;
export type Evidence = KnowledgeEvidence[];
export type Snapshots = ExplorationSnapshot[];
export type RemovedDirectionIds = string[];
export type DatasetId2 = string;
export type VersionId1 = string;
export type DirectionId1 = string;
export type Name = string;
export type Text1 = string;
export type Id = string;
export type Builtin = boolean;
export type Revision = string;
export type Name1 = string;
export type Text2 = string;
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
export type ReasoningEfforts = ("low" | "medium" | "high" | "xhigh")[];
export type ApiKey = string | null;
export type ExpectedRevision1 = number;
export type ProviderId1 = string;
export type Endpoint1 = string;
export type ProviderId2 = string | null;
export type ApiKey1 = string | null;
export type ContextTokens1 = number | null;
export type MaxOutputTokens1 = number | null;
export type GenerationTimeoutSeconds = number | null;
export type CapacityMode = ("vllm_tokenize" | "provider_managed") | null;
export type MaxVisualInputs = number | null;
export type MaxRequestBytes = number | null;
export type ConnectTimeoutSeconds = number | null;
export type WriteTimeoutSeconds = number | null;
export type PoolTimeoutSeconds = number | null;
export type ContextTokens2 = number | null;
export type MaxOutputTokens2 = number | null;
export type GenerationTimeoutSeconds1 = number | null;
export type CapacityMode1 = ("vllm_tokenize" | "provider_managed") | null;
export type MaxVisualInputs1 = number | null;
export type MaxRequestBytes1 = number | null;
export type ConnectTimeoutSeconds1 = number | null;
export type WriteTimeoutSeconds1 = number | null;
export type PoolTimeoutSeconds1 = number | null;
export type Endpoint2 = string;
export type ProviderId3 = string | null;
export type ProviderName = string | null;
export type ModelId1 = string | null;
export type CredentialRef = string | null;
export type Api = "openai-completions" | "openai-responses";
export type ReasoningEffort = ("low" | "medium" | "high" | "xhigh") | null;
export type ContextTokens3 = number | null;
export type MaxOutputTokens3 = number | null;
export type GenerationTimeoutSeconds2 = number | null;
export type CapacityMode2 = ("vllm_tokenize" | "provider_managed") | null;
export type MaxVisualInputs2 = number | null;
export type MaxRequestBytes2 = number | null;
export type ConnectTimeoutSeconds2 = number | null;
export type WriteTimeoutSeconds2 = number | null;
export type PoolTimeoutSeconds2 = number | null;
export type Endpoint3 = string;
export type ProviderId4 = string | null;
export type ProviderName1 = string | null;
export type ModelId2 = string | null;
export type CredentialRef1 = string | null;
export type Api1 = "openai-completions" | "openai-responses";
export type ReasoningEffort1 = ("low" | "medium" | "high" | "xhigh") | null;
export type ApiKey2 = string | null;
export type ProviderId5 = string;
export type Name4 = string;
export type Endpoint4 = string | null;
export type Api2 = string | null;
export type ModelId3 = string;
export type Name5 = string;
export type InputModalities1 = string[] | null;
export type ContextTokens4 = number | null;
export type MaxOutputTokens4 = number | null;
export type ReasoningEfforts1 = ("low" | "medium" | "high" | "xhigh")[];
export type Models1 = ProviderModel1[];
export type Error = string | null;
export type Editable = boolean;
export type Removable = boolean;
export type CredentialConfigured = boolean;
export type CredentialWritable = boolean;
export type Providers = WorkbenchProvider[];
export type ProviderRevision = number | null;
export type DatasetId3 = string;
export type Kind = "normal" | "defect";
export type ExpectedRevision2 = string;
/**
 * @minItems 1
 */
export type Directions1 = [DirectionChoice, ...DirectionChoice[]];
export type DirectionId2 = string;
export type Title1 = string | null;
export type Instruction1 = string | null;
export type Enabled = boolean;
export type DatasetId4 = string;
export type NormalImages1 = string[];
export type DefectImages1 = string[];
export type Objective1 = string;
export type PresetId1 = string | null;
export type PresetName1 = string | null;
export type PresetRevision1 = string | null;
export type Text3 = string;
export type ParentVersionId1 = string | null;
export type DatasetId5 = string;
export type VersionId2 = string;
export type DatasetId6 = string;
export type RunId1 = string;
export type CreatedAt1 = string;
export type DirectionCount = number;
export type Versions = ExplorationVersion[];
export type RemovedDirectionIds1 = string[];
export type VersionId3 = string;
export type DatasetId7 = string;
export type Kind1 = ("normal" | "defect") | null;
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
 * 最终状态；仅关联本次checks的实际判据且有图像证据时可填已形成知识。没有对应本次判据时保留观察，状态为证据不足、不可观察或不适用，不得用无关判据填充引用
 */
export type Status1 = "已形成知识" | "证据不足" | "不可观察" | "不适用";
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
export type VersionId4 = string;
export type CheckId = string | null;
export type EvidenceRole = ("support" | "counter") | null;
export type Section = "checks" | "discovery" | "evidence";
export type EvidenceIds3 = string[];
export type Page1 = number;
export type PageSize1 = number;
export type Search = string;
export type ReviewStatus = "all" | "pending" | "confirmed" | "rejected" | "conflict";
export type VersionId5 = string;
export type DatasetId8 = string;
export type Kind2 = ("normal" | "defect") | null;
export type Total1 = number;
export type Page2 = number;
export type PageSize2 = number;
export type Title2 = string;
export type Subject = string;
export type Location1 = string;
export type Criterion = string;
export type AllowedVariations = string[];
export type Limitations2 = string[];
/**
 * supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status2 = "supported" | "provisional" | "conflicted";
export type Status3 = "pending" | "confirmed" | "rejected";
export type Note = string;
export type Revision1 = number;
export type CreatedAt2 = string | null;
export type PendingRecheckSourceCount = number;
export type CheckId1 = string;
export type SupportCount = number;
export type CounterCount = number;
export type ConflictIds = string[];
export type SupportLimitations = string[];
export type Items1 = KnowledgeCheckSummary[];
export type VersionId6 = string | null;
export type DatasetId9 = string;
export type Ref = string;
export type Source2 = PresetDirectionSource | ExploredDirectionSource;
export type Origin1 = "preset";
export type CatalogId = string;
export type DirectionId4 = string;
export type Revision2 = string;
export type Origin2 = "explored";
export type RunId2 = string;
export type VersionId7 = string;
export type DirectionId5 = string;
export type SourceTitle = string;
export type SourceInstruction = string;
export type Title3 = string;
export type Instruction2 = string;
export type SourceSummary = string;
export type SourceLimitations = string[];
export type SourceDatasetIds = string[];
export type SourceEvidenceIds = string[];
export type SourceCounterEvidenceIds = string[];
export type Directions2 = FrozenAnalysisDirection[];
export type SupportEvidenceIds = string[];
export type CounterEvidenceIds = string[];
export type Total2 = number;
export type Page3 = number;
export type PageSize3 = number;
export type Items2 = KnowledgeEvidence[];
export type VersionId8 = string;
export type Total3 = number;
export type Page4 = number;
export type PageSize4 = number;
export type Items3 = KnowledgeEvidence[];
export type ScopeRunId = string | null;
export type VersionId9 = string;
export type ConflictId = string;
export type DatasetId10 = string;
export type ConflictId1 = string;
export type Category = "observation" | "retirement_proposal";
export type OriginVersionId = string;
export type SubmissionId = string;
export type Status4 = "resolved" | "unresolved" | "insufficient";
export type Description = string;
/**
 * @minItems 1
 */
export type EvidenceIds4 = [string, ...string[]];
export type Limitations3 = string[];
export type CheckIds = string[];
export type SampleId2 = string;
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
 * supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status5 = "supported" | "provisional" | "conflicted";
export type SupportEvidenceIds1 = string[];
export type CounterEvidenceIds1 = string[];
export type SupportLimitations1 = string[];
export type RecheckSampleIds = string[];
export type ConflictIds1 = string[];
export type CheckId2 = string;
export type PredecessorCheckIds = string[];
export type FindingIds = string[];
export type NormalCheckIds = string[];
export type Checks = KnowledgeCheck[];
export type Evidence1 = KnowledgeEvidence[];
export type VersionId10 = string;
export type ConflictId2 = string;
export type SubmissionId1 = string;
export type ContextSignature = string;
export type Reviewer = string;
export type Action = "retain" | "revise" | "retire" | "need_evidence";
export type Instruction3 = string;
export type Reason1 = string;
export type CreatedAt3 = string;
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
export type VersionId11 = string;
export type ConflictId3 = string;
export type SubmissionId2 = string;
export type ContextSignature2 = string;
export type Reviewer2 = string;
export type Action1 = "retain" | "revise" | "retire" | "need_evidence";
export type Instruction4 = string;
export type Reason2 = string;
export type VersionId12 = string;
export type ConflictId4 = string;
export type DatasetId11 = string;
export type Kind3 = ("normal" | "defect") | null;
export type SampleId4 = string;
export type Description2 = string;
export type State1 = "pending_review" | "pending_recheck" | "resolved";
export type KnowledgeVersionId = string | null;
export type CheckId3 = string;
export type ResultId = string;
export type EvidenceId1 = string;
export type Results = AuditConsistencyEvidenceReference[];
export type NormalVersionId = string | null;
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
export type EvidenceIds5 = [string, ...string[]];
export type Limitations6 = string[];
/**
 * 相对当前图像的归一化矩形ROI [x1,y1,x2,y2]，坐标0..1000，必须x1<x2且y1<y2、有面积；细线或点状疑点也用其周围矩形包围，不能输出线段或中心点
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
export type EvidenceIds6 = [string, ...string[]];
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
export type Source3 = "annotation" | "model" | "coverage";
export type AnnotationId = string | null;
export type Label = string;
export type Bbox3 = number[];
export type CheckIds3 = string[];
export type Source4 = "annotation" | "model" | "coverage";
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
export type Conclusion = AuditConclusion | VlmResult;
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
export type EvidenceIds7 = [string, ...string[]];
export type Conflicts = string[];
export type MissingEvidence = string[];
/**
 * 结合当前图像、冻结知识、实际比较图和一致性记录的连贯综合分析；不罗列输入全文
 */
export type AnalysisText = string;
/**
 * 与最终结论直接相关的可见事实及其真实引用
 *
 * @minItems 1
 */
export type Basis = [AuditBasis, ...AuditBasis[]];
export type Text4 = string;
/**
 * @minItems 1
 */
export type EvidenceIds8 = [string, ...string[]];
export type KnowledgeCheckIds = string[];
export type ConsistencyResultIds = string[];
/**
 * 实际可见的外观事实，与候选解释和验收判据分开
 */
export type Observation = string;
/**
 * 适用的冻结判据及条件；无适用规则时明确说明
 */
export type ApplicableRule = string;
/**
 * 正常替代解释及实际支持或反驳依据
 */
export type NormalAlternative = string;
export type LabelRelation =
  "consistent" | "suspected_missing" | "suspected_mislabel" | "different_conditions" | "undetermined";
export type Name7 = string;
export type Observation1 = string;
/**
 * @minItems 1
 */
export type EvidenceIds9 = [string, ...string[]];
/**
 * 有可见依据的能力切片候选；没有时为空，不作为已确认难度或真值
 */
export type ProposedSlice = AuditSliceCandidate[];
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
export type EvidenceIds10 = [string, ...string[]];
export type Conflicts1 = string[];
export type MissingEvidence1 = string[];
export type StepId1 = string;
export type InputEvidenceIds = string[];
export type ChildStepIds = string[];
/**
 * 一句话综合建议，指出优先复核位置与问题；整体和局部观察放在对应字段，不重复长篇视觉描述
 */
export type Description11 = string;
export type PositionAnalysis5 = string;
export type IlluminationAnalysis5 = string;
export type SuggestedLabel2 = "PASS" | "FAIL" | "UNCERTAIN";
export type ReasonCategory2 = string;
export type Confidence2 = number;
export type DefectLocation2 = string;
/**
 * @minItems 1
 */
export type EvidenceIds11 = [string, ...string[]];
export type Conflicts2 = string[];
export type MissingEvidence2 = string[];
export type Description12 = string;
export type PositionAnalysis6 = string;
export type IlluminationAnalysis6 = string;
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
export type Description13 = string;
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
export type EvidenceIds12 = [string, ...string[]];
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
export type Description14 = string;
export type NormalExplanation3 = string;
/**
 * @minItems 1
 */
export type EvidenceIds13 = [string, ...string[]];
export type ResolvedFindings = FindingResolution[];
export type JointSteps = SynthesisStep[];
export type SampleId5 = string;
export type TaskId = string;
export type DatasetId12 = string;
export type ImagePath = string;
export type RelativePath = string;
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
export type SampleUuid = string;
export type DatasetFormat = "labelme" | "folder_classification";
export type AnnotationId2 = string;
export type SampleId6 = string;
export type AnnotationType = "bbox" | "polygon" | "mask" | "image";
export type RawLabel = string;
export type IsIgnored = boolean;
export type Phenomenon = string | null;
export type Bbox5 = number[] | null;
export type Polygon = number[][] | null;
export type MaskPath = string | null;
export type MaskSha256 = string | null;
export type GeometryStatus = "VALID" | "CLIPPED" | "SCALED" | "INVALID";
export type AnnotationSource = "manual" | "existing_detector" | "production_system" | "imported" | "unknown";
export type SourceWidth = number | null;
export type SourceHeight = number | null;
export type Annotations = Annotation[];
export type OverviewEvidenceId = string;
export type ImageSources = AuditImageSource[];
export type ReferenceEvidence = VisualEvidence[];
export type InputSnapshotSignature = string | null;
export type VersionId13 = string;
export type DatasetId13 = string;
export type Kind4 = ("normal" | "defect") | null;
export type ParentVersionId2 = string | null;
export type NormalVersionId1 = string | null;
export type NormalReferenceVersionId = string | null;
export type ModelName1 = string;
export type GenerationVersion = string;
export type Signature1 = string;
export type Summary1 = string;
export type Checks1 = KnowledgeCheck[];
/**
 * 仅引用本次明确冻结父版本checks中的旧条目ID；没有父版本时revisions为空
 */
export type PreviousCheckId = string;
/**
 * 同一判据对应的当前检查项；拆分可多项，退役为空。仅改措辞或允许变化保持一对一
 */
export type CurrentCheckTitles = string[];
export type Reason4 = string;
export type Revisions = CheckRevision[];
/**
 * 冻结父版本的检查项ID；整体限制填null
 */
export type CheckId5 = string | null;
export type Field = "limitations" | "allowed_variations";
/**
 * 逐字引用要撤回的父版本表述；替代表述写入本轮相应字段
 */
export type Text5 = string;
export type Reason5 = string;
/**
 * 支持撤回理由的本轮实际原图证据
 *
 * @minItems 1
 */
export type EvidenceIds14 = [string, ...string[]];
export type TextRetractions = KnowledgeTextRetraction[];
/**
 * 冻结基准版本中的检查项ID
 */
export type CheckId6 = string;
/**
 * 待视觉核验的人工修订建议，不是已证实事实
 */
export type Instruction5 = string;
export type Corrections = KnowledgeCorrection[];
export type ComparisonSources = KnowledgeSource[];
export type EvidenceId2 = string;
/**
 * 相对当前图像的归一化矩形ROI [x1,y1,x2,y2]，坐标0..1000，必须x1<x2且y1<y2、有面积；细线或点状疑点也用其周围矩形包围，不能输出线段或中心点
 *
 * @minItems 4
 * @maxItems 4
 */
export type Bbox10001 = [number, number, number, number];
export type Description15 = string;
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
 * supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status7 = "supported" | "provisional" | "conflicted";
export type SupportEvidenceIds2 = string[];
export type CounterEvidenceIds2 = string[];
export type Checks2 = LearnedCheck[];
export type Suspects1 = KnowledgeSuspect[];
export type Limitations11 = string[];
export type Revisions1 = CheckRevision[];
export type TextRetractions1 = KnowledgeTextRetraction[];
export type Parts1 = ObservedPart[];
export type Areas = DiscoveryArea[];
export type MiningSteps = KnowledgeStep[];
export type StepId3 = string;
export type VersionId14 = string;
export type Purpose = "current" | "comparison" | "revision";
export type Checks3 = KnowledgeCheck[];
export type InputEvidenceIds1 = string[];
export type Status8 = "supports" | "contradicts" | "unobservable";
export type Description16 = string;
export type PositionAnalysis7 = string;
export type IlluminationAnalysis7 = string;
export type NormalExplanation5 = string;
/**
 * @minItems 1
 */
export type EvidenceIds15 = [string, ...string[]];
export type Suspects2 = KnowledgeSuspect[];
export type CheckId7 = string;
export type SampleId7 = string;
export type Observations = KnowledgeObservation[];
export type ObservationSteps = KnowledgeObservationStep[];
export type Conflicts3 = KnowledgeConflict[];
export type ReviewApplications = KnowledgeRecheckDecision[];
export type FindingId1 = string;
export type SampleId8 = string;
export type Bbox6 = number[];
export type Origins1 = RegionOrigin[];
export type OriginFindingId = string | null;
export type OriginSuggestionId = string | null;
export type Source5 = "annotation" | "model" | "coverage";
export type AnnotationId3 = string | null;
export type Label2 = string;
export type Bbox7 = number[];
export type CheckIds6 = string[];
export type Origins2 = RegionOrigin[];
export type CropBbox2 = number[];
export type Regions1 = RegionImage[];
export type FindingId2 = string;
export type Status9 = "supported" | "refuted" | "insufficient";
export type AffectedCheckTitles = string[];
export type Description17 = string;
export type NormalExplanation6 = string;
export type Limitations12 = string[];
/**
 * @minItems 1
 */
export type EvidenceIds16 = [string, ...string[]];
/**
 * 仅填写尚未消解的证据判断矛盾；目标偏离正常规则本身不是判断矛盾
 */
export type Conflicts4 = string[];
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
export type ScopeRunId1 = string | null;
export type ObservedSourceIds = string[] | null;
export type KnowledgePreset = string[] | null;
export type SubmissionId3 = string;
export type CheckId8 = string;
export type Objective2 = string;
export type DirectionId6 = string;
export type Title6 = string;
export type Instruction6 = string;
export type Enabled1 = boolean;
export type Origin3 = "preset" | "dataset" | "explored";
export type Source6 = (PresetDirectionSource | ExploredDirectionSource) | null;
export type Directions3 = MiningDirection[];
export type Instruction7 = string | null;
export type VersionId15 = string;
export type Summary3 = string;
export type Limitations13 = string[];
export type Instruction8 = string;
export type Signature2 = string;
export type CreatedAt4 = string;
export type VersionId16 = string;
export type DatasetId14 = string;
export type SourceRunId = string | null;
export type Kind5 = ("normal" | "defect") | null;
export type ParentVersionId3 = string | null;
export type NormalVersionId2 = string | null;
export type ModelName2 = string;
export type CreatedAt5 = string;
export type SourceCount = number;
export type CheckCount = number;
export type SupportedCheckCount = number;
export type ManuallyEdited = boolean;
export type Versions1 = KnowledgeVersion[];
export type Status10 = "current" | "changed" | "unverified";
export type CheckedAt = string;
export type CurrentVersionId = string | null;
export type CurrentNormalVersionId = string | null;
export type SampleId9 = string;
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
export type ScopeRunId2 = string | null;
export type DatasetId15 = string;
export type Kind6 = ("normal" | "defect") | null;
export type NormalVersionId3 = string | null;
/**
 * 仅查询指定版本语义链尚未观察的新来源；已变更旧来源单列待重核验
 */
export type UncoveredFromVersion = string | null;
export type Page5 = number;
/**
 * 每页1..200，默认10；仅取本次已确认图组所需引用，不预先枚举全库
 */
export type PageSize5 = number;
export type Search1 = string;
export type DatasetId16 = string;
export type Kind7 = ("normal" | "defect") | null;
export type NormalVersionId4 = string | null;
export type Total4 = number;
export type UnavailableSourceCount1 = number;
export type Page6 = number;
export type PageSize6 = number;
export type SampleId10 = string;
export type RelativePath1 = string;
export type Qualification1 = string;
export type Items4 = KnowledgeSourceItem[];
export type Recheck = number;
export type VersionId17 = string | null;
export type Total5 = number;
export type Observed = number;
export type PendingReview = number;
export type Stale = number;
export type Remaining = number;
export type SubmissionId4 = string;
/**
 * @minItems 1
 */
export type SubsetIds = [string, ...string[]];
export type ConsistencyJobId = string;
export type JobId = string;
export type VersionId18 = string;
export type EntryIds = string[];
export type SystemPrompt = string | null;
export type UserPrompt = string;
export type ReportInstruction = string;
export type BenchmarkBuildId = string | null;
export type CallId = string;
export type RunId3 = string;
export type Operation = "tokenize" | "generate";
export type SchemaName = string | null;
export type Phase = string | null;
export type SampleId11 = string | null;
export type Role1 = ("agent" | "vision") | null;
export type RequestId = string | null;
export type Source7 = "http" | "native_llm";
export type SessionId = string | null;
export type Attempt = number | null;
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
/**
 * http来源为传输正文；native_llm来源为省略运行时signal的SDK请求JSON
 */
export type RequestBody = string;
/**
 * http来源为传输正文；native_llm来源为SDK流的实际终态与可得用量
 */
export type ResponseBody = string | null;
export type RunId4 = string;
export type SampleIds = string[] | null;
export type RunId5 = string;
export type TaskId1 = string;
export type DatasetId17 = string;
export type DatasetIds = string[];
export type AnalysisKind = ("exploration" | "knowledge" | "consistency") | null;
export type AnalysisVersionId = string | null;
export type DatasetId18 = string;
export type RunId6 = string;
export type Status11 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type ExplorationVersionId = string | null;
export type KnowledgeVersionId1 = string | null;
export type DatasetResults = DatasetAnalysisResult[];
export type ProgramBatchId = string | null;
export type TotalGalleryGroups = number | null;
export type CompletedGalleryGroups = number | null;
export type JobType =
  | "ANALYSIS_WORKFLOW"
  | "MODEL_AUDIT"
  | "MODEL_AUDIT_SAMPLE"
  | "KNOWLEDGE"
  | "NORMAL_KNOWLEDGE"
  | "DEFECT_KNOWLEDGE"
  | "KNOWLEDGE_BATCH"
  | "DIRECTION_EXPLORATION"
  | "EXPLORATION_BATCH"
  | "IMAGE_INDEX"
  | "DATA_CONSISTENCY"
  | "CONSISTENCY_ANALYSIS"
  | "CONSISTENCY_MODEL_BATCH";
export type OriginSessionId = string | null;
export type RootRunId = string;
export type ParentRunId = string | null;
export type Status12 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type CancelRequested = boolean;
export type CompletionPending = boolean;
export type SampleIds1 = string[];
export type CompletedSampleIds = string[];
export type FailedSampleIds = string[];
export type Completed = number;
export type Failed = number;
export type TotalSamples = number;
export type Unprocessed = number;
export type Progress = number;
export type Message1 = string;
export type SubmittedAt1 = string;
export type StartedAt2 = string | null;
export type FinishedAt1 = string | null;
export type DeletedAt = string | null;
export type ModelName3 = string | null;
export type ContextTokens5 = number | null;
export type MaxOutputTokens5 = number | null;
export type GenerationTimeoutSeconds3 = number | null;
export type CapacityMode3 = ("vllm_tokenize" | "provider_managed") | null;
export type MaxVisualInputs3 = number | null;
export type MaxRequestBytes3 = number | null;
export type ConnectTimeoutSeconds3 = number | null;
export type WriteTimeoutSeconds3 = number | null;
export type PoolTimeoutSeconds3 = number | null;
export type Endpoint5 = string;
export type ProviderId6 = string | null;
export type ProviderName2 = string | null;
export type ModelId4 = string | null;
export type CredentialRef2 = string | null;
export type Api3 = "openai-completions" | "openai-responses";
export type ReasoningEffort2 = ("low" | "medium" | "high" | "xhigh") | null;
export type ProfileId = string;
export type Backend = "torch_hub" | "torchscript" | "transformers";
export type ModelId5 = "dinov2_vitb14_reg" | "dinov3_vitb16" | "sscd_disc_mixup";
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
export type SampleId12 = string;
export type RelativePath2 = string | null;
export type SampleUuid1 = string;
export type Phase1 = string | null;
export type PhaseStartedAt = string | null;
export type Phase2 = string;
export type StartedAt3 = string;
export type FinishedAt2 = string | null;
export type PhaseTimings = JobPhaseTiming[];
export type PreparedSources = number;
export type QueuePosition = number | null;
export type NormalVersionId5 = string | null;
export type DefectVersionId1 = string | null;
export type Kind8 = ("normal" | "defect") | null;
export type KnowledgeVersionId2 = string | null;
export type ExplorationVersionId1 = string | null;
export type ConsistencyPrompt = string | null;
export type GateSystem = string;
export type GateUser = string;
export type GateExamples = string;
export type SystemPrompt1 = string | null;
export type ConsistencyCheckVersion = 1 | null;
export type ConsistencyTaskType = ("anomaly_detection" | "bbox_defect") | null;
export type InspectedRegions1 = number | null;
export type PlannedRegions1 = number | null;
export type CompletedBatches = number | null;
export type TotalBatches = number | null;
export type BatchRuns = string[];
export type ActiveBatchRunId = string | null;
export type SampleId13 = string;
export type RelativePath3 = string | null;
export type Message2 = string;
export type Code = string | null;
export type SourceRunId1 = string | null;
export type SourcePhase = string | null;
export type SampleUuid2 = string;
export type Errors = JobFailure[];
export type ErrorHistory = JobFailure[];
export type CallId1 = string;
export type RunId7 = string;
export type Operation1 = "tokenize" | "generate";
export type SchemaName1 = string | null;
export type Phase3 = string | null;
export type SampleId14 = string | null;
export type Role2 = ("agent" | "vision") | null;
export type RequestId1 = string | null;
export type Source8 = "http" | "native_llm";
export type SessionId1 = string | null;
export type Attempt1 = number | null;
export type StartedAt4 = string;
export type FinishedAt3 = string | null;
export type ElapsedMs1 = number | null;
export type HttpStatus1 = number | null;
export type ResponseId1 = string | null;
export type ResponseModel1 = string | null;
export type FinishReason1 = string | null;
export type Usage1 = {
  [k: string]: unknown;
} | null;
export type ModelCalls = ModelCallSummary[];
export type RunId8 = string;
export type RootRunId1 = string;
export type SelectionMode = "subset" | "all_sources";
export type ActiveRunId = string | null;
export type SampleId15 = string;
export type RelativePath4 = string | null;
export type State2 = "failed" | "unprocessed";
export type SampleUuid3 = string;
export type Samples = RetrySample[];
export type DatasetId19 = string;
export type SampleId16 = string;
export type SuggestionId = string;
export type FindingId3 = string | null;
export type EvidenceId3 = string | null;
export type DatasetId20 = string;
export type SampleId17 = string;
export type SuggestionId1 = string;
export type FindingId4 = string | null;
export type EvidenceId4 = string | null;
export type Evidence3 = VisualEvidence[];
export type AuditRunId = string | null;
export type OriginSessionId1 = string | null;
export type IsLatest1 = boolean;
export type DatasetImport = LabelmeImport | FolderClassificationImport;
export type Name8 = string;
export type PolicyId = string | null;
export type AnnotationRole = "REFERENCE" | "PREDICTION" | "UNKNOWN";
export type AnnotationCoverage = "EXHAUSTIVE" | "PARTIAL" | "UNKNOWN";
export type GroupId = string | null;
export type Format = "labelme";
export type ImageDir = string;
export type AnnotationDir = string;
export type ArchivePath = string | null;
export type UnannotatedIsNormal = boolean;
export type Name9 = string;
export type GroupId1 = string | null;
export type Format1 = "folder_classification";
export type RootDir = string;
/**
 * Relative directory path under dataset root, or '.' for root images
 */
export type Path = string;
/**
 * Role assigned to this directory
 */
export type Role3 = "normal" | "anomaly" | "unlabeled" | "excluded";
export type Rules = FolderRule[];
export type PreviewFingerprint = string;
export type Format2 = "folder_classification";
export type RootDir1 = string;
export type SuggestedName = string;
export type TotalImages = number;
export type Path1 = string;
export type ImageCount = number;
export type SuggestedRole = "normal" | "anomaly" | "unlabeled" | "excluded";
export type Role4 = "normal" | "anomaly" | "unlabeled" | "excluded";
export type Items5 = FolderPreviewItem[];
export type Conflicts5 = string[];
export type PreviewFingerprint1 = string;
export type ArchivePath1 = string;
export type Sha2562 = string;
export type FileCount = number;
export type UncompressedBytes = number;
export type Path2 = string;
export type ImageCount1 = number;
export type AnnotationCount = number;
export type Directories = ArchiveDirectory[];
export type DatasetId21 = string;
export type TaskId2 = string;
export type ImageCount2 = number;
export type AnnotationCount1 = number;
export type IssueCount = number;
export type DbPath = string;
export type ScanRef = string;
export type Total6 = number;
export type Completed1 = number;
export type Failed1 = number;
export type Unsupported = number;
export type Pending = number;
export type ReusedSamples = number;
export type DecodedImages = number;
export type ComparedPairs = number;
export type CachePeakBytes = number;
export type DatasetId22 = string | null;
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
export type Basis1 = "persisted_samples_and_import_issues";
export type Selection = "latest_per_sample";
export type Limitations14 = string[];
export type Numerator = number;
export type Denominator = number;
export type Basis2 = string;
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
export type KnowledgeVersionId3 = string | null;
export type LegacyProfileId1 = string | null;
export type SampleCount = number;
export type KnowledgeVersions = KnowledgeUsage[];
export type AuditRunIds = string[];
export type SubmissionId5 = string;
export type DatasetId23 = string;
export type SampleId18 = string;
export type Reviewer3 = string;
export type ReviewDecisionEnum = "PASS" | "HARD_NORMAL" | "FAIL" | "UNCERTAIN" | "SKIP";
export type ReasonCode1 = string | null;
export type Comment1 = string | null;
export type DurationMs = number;
export type StartedAt5 = string | null;
export type DatasetId24 = string;
export type Page7 = number;
export type PageSize7 = number;
export type Search2 = string;
export type DecisionId1 = string;
export type SampleId19 = string;
export type Decision1 = string;
export type Reviewer4 = string;
export type ReasonCode2 = string | null;
export type Comment2 = string | null;
export type EvidenceVersion1 = string;
export type ReviewSessionId1 = string | null;
export type StartedAt6 = string | null;
export type SubmittedAt2 = string | null;
export type ReviewDurationMs1 = number;
export type RelativePath5 = string;
export type Items6 = ReviewHistoryRecord[];
export type Total7 = number;
export type Page8 = number;
export type PageSize8 = number;
export type RawLabelFilters = ("PASS" | "FAIL" | "UNCERTAIN")[];
export type AnnotationFilters = string[];
export type ModelStatus = "all" | "pending" | "audited" | "risk" | "PASS" | "FAIL" | "UNCERTAIN";
export type ReviewStatus1 = "all" | "pending" | "reviewed" | "PASS" | "HARD_NORMAL" | "FAIL" | "UNCERTAIN" | "SKIP";
export type Technical = "all" | "issues";
export type ReferenceStatus = "all" | "candidate" | "excluded";
export type Search3 = string;
export type SortBy = "default" | "risk" | "tech";
export type DatasetId25 = string | null;
export type DatasetIds1 = string[] | null;
export type TaskId4 = string | null;
export type Page9 = number;
export type PageSize9 = number;
export type RunId9 = string;
export type TaskId5 = string;
export type DatasetId26 = string;
export type DatasetIds2 = string[];
export type AnalysisKind1 = ("exploration" | "knowledge" | "consistency") | null;
export type AnalysisVersionId1 = string | null;
export type DatasetResults1 = DatasetAnalysisResult[];
export type ProgramBatchId1 = string | null;
export type TotalGalleryGroups1 = number | null;
export type CompletedGalleryGroups1 = number | null;
export type JobType1 =
  | "ANALYSIS_WORKFLOW"
  | "MODEL_AUDIT"
  | "MODEL_AUDIT_SAMPLE"
  | "KNOWLEDGE"
  | "NORMAL_KNOWLEDGE"
  | "DEFECT_KNOWLEDGE"
  | "KNOWLEDGE_BATCH"
  | "DIRECTION_EXPLORATION"
  | "EXPLORATION_BATCH"
  | "IMAGE_INDEX"
  | "DATA_CONSISTENCY"
  | "CONSISTENCY_ANALYSIS"
  | "CONSISTENCY_MODEL_BATCH";
export type OriginSessionId2 = string | null;
export type RootRunId2 = string;
export type ParentRunId1 = string | null;
export type Status13 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type CancelRequested1 = boolean;
export type CompletionPending1 = boolean;
export type SampleIds2 = string[];
export type CompletedSampleIds1 = string[];
export type FailedSampleIds1 = string[];
export type Completed2 = number;
export type Failed2 = number;
export type TotalSamples2 = number;
export type Unprocessed1 = number;
export type Progress1 = number;
export type Message3 = string;
export type SubmittedAt3 = string;
export type StartedAt7 = string | null;
export type FinishedAt4 = string | null;
export type DeletedAt1 = string | null;
export type ModelName4 = string | null;
export type Phase4 = string | null;
export type PhaseStartedAt1 = string | null;
export type PhaseTimings1 = JobPhaseTiming[];
export type PreparedSources1 = number;
export type QueuePosition1 = number | null;
export type NormalVersionId6 = string | null;
export type DefectVersionId2 = string | null;
export type Kind9 = ("normal" | "defect") | null;
export type KnowledgeVersionId4 = string | null;
export type ExplorationVersionId2 = string | null;
export type ConsistencyPrompt1 = string | null;
export type SystemPrompt2 = string | null;
export type ConsistencyCheckVersion1 = 1 | null;
export type ConsistencyTaskType1 = ("anomaly_detection" | "bbox_defect") | null;
export type InspectedRegions2 = number | null;
export type PlannedRegions2 = number | null;
export type CompletedBatches1 = number | null;
export type TotalBatches1 = number | null;
export type BatchRuns1 = string[];
export type ActiveBatchRunId1 = string | null;
export type Errors1 = JobFailure[];
export type ErrorHistory1 = JobFailure[];
export type ModelCalls1 = ModelCallSummary[];
export type Subjects1 = AllRegisteredScope | DatasetScope | SampleScope | FilteredScope;
export type Kind10 = "all_registered";
export type Kind11 = "datasets";
/**
 * @minItems 1
 */
export type DatasetIds3 = [string, ...string[]];
export type Kind12 = "samples";
/**
 * @minItems 1
 */
export type SampleIds3 = [string, ...string[]];
export type Kind13 = "filtered";
export type DatasetId27 = string;
export type RawLabelFilters1 = ("PASS" | "FAIL" | "UNCERTAIN")[];
export type AnnotationFilters1 = string[];
export type ModelStatus1 = "all" | "pending" | "audited" | "risk" | "PASS" | "FAIL" | "UNCERTAIN";
export type ReviewStatus2 = "all" | "pending" | "reviewed" | "PASS" | "HARD_NORMAL" | "FAIL" | "UNCERTAIN" | "SKIP";
export type Technical1 = "all" | "issues";
export type ReferenceStatus1 = "all" | "candidate" | "excluded";
export type Search4 = string;
export type SortBy1 = "default" | "risk" | "tech";
export type CorpusScope = AllRegisteredScope | DatasetScope;
export type Mode = "exact" | "visual" | "combined";
export type MinSimilarity = number;
export type ProfileId1 = string | null;
export type RequestId2 = string;
export type ModelAnalysisPrompt = string | null;
export type Prompt = string | null;
export type Query = SampleImageQuery | TemporaryImageQuery;
export type Kind14 = "sample";
export type SampleId20 = string;
export type Kind15 = "temporary";
export type ImageRef = string;
export type CorpusScope1 = AllRegisteredScope | DatasetScope;
export type Mode1 = "exact" | "visual" | "combined";
export type ProfileId2 = string | null;
export type TopK = number | null;
export type MinSimilarity1 = number | null;
export type Cursor = string | null;
export type CorpusScope2 = AllRegisteredScope | DatasetScope;
export type ProfileId3 = string | null;
export type RequestId3 = string;
export type ScopeId = string;
export type DatasetIds4 = string[];
export type FrozenAt = string;
export type SampleCount1 = number;
export type Selector = AllRegisteredScope1 | DatasetScope1 | SampleScope1 | FilteredScope1;
export type Kind16 = "all_registered";
export type Kind17 = "datasets";
/**
 * @minItems 1
 */
export type DatasetIds5 = [string, ...string[]];
export type Kind18 = "samples";
/**
 * @minItems 1
 */
export type SampleIds4 = [string, ...string[]];
export type Kind19 = "filtered";
export type DatasetId28 = string;
export type SampleId21 = string;
export type DatasetId29 = string;
export type TaskId6 = string;
export type SourceFingerprint = string | null;
export type QualitySource2 = string | null;
export type Samples1 = FrozenSample[];
export type DatasetId30 = string;
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
export type Reason6 = string | null;
export type AnnotationCoordinates = "RAW" | "EXIF_AMBIGUOUS";
export type Status14 = "COMPLETE" | "INCOMPATIBLE" | "UNAVAILABLE" | "UNSUPPORTED" | "PENDING";
export type CompareProfile1 = "raw-decoded-v1";
export type ExactEqual = boolean | null;
export type ComparedPixels = number;
export type ChangedPixels = number | null;
export type MaxAbsDiff = number | null;
export type Reason7 = string | null;
export type SampleId22 = string;
export type ContentGroupId = string;
export type RetrievalBranch = "exact" | "visual";
export type Rank = number;
export type Score = number | null;
export type ProfileId4 = string | null;
export type Relation = "EXACT" | "NEAR_CANDIDATE" | "VISUAL_REFERENCE" | "DIFFERENT" | "UNCHECKED";
export type EvidenceId5 = string | null;
export type SampleId23 = string;
export type DatasetId31 = string;
export type Width2 = number;
export type Height2 = number;
export type QualitySource3 = string | null;
export type Annotations1 = Annotation[];
export type DatasetFormat1 = ("labelme" | "folder_classification") | null;
export type PolicyId1 = string | null;
export type AnnotationRole1 = "REFERENCE" | "PREDICTION" | "UNKNOWN";
export type AnnotationCoverage1 = "EXHAUSTIVE" | "PARTIAL" | "UNKNOWN";
export type Errors2 = string[];
export type AnnotationCoordinates1 = "RAW" | "EXIF_AMBIGUOUS" | "UNKNOWN";
export type Status15 = "COMPLETE" | "PARTIAL" | "UNAVAILABLE";
export type PolicyRelation = "SAME" | "DIFFERENT" | "UNKNOWN";
export type LeftId = string;
export type RightId = string;
export type BboxIou = number;
export type SegmentationIou = number | null;
export type GeometryEqual = boolean;
export type ComparisonKind = "LOCATION_ONLY" | "SEGMENTATION" | "IMAGE_LABEL";
export type Matches = InstanceMatch[];
export type DifferenceId = string;
export type Type1 =
  | "QUALITY_LABEL"
  | "CATEGORY"
  | "ANNOTATION_COUNT"
  | "ONE_SIDED_REGION"
  | "GEOMETRY"
  | "SPLIT_MERGE"
  | "AMBIGUOUS_MATCH"
  | "POLICY_UNCONFIRMED"
  | "ANNOTATION_UNREADABLE";
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
export type CoordinateFrame = "RAW_EXACT" | "RELATIVE_IMAGE" | "UNAVAILABLE";
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
export type Kind20 = "sample";
export type SampleId24 = string;
export type Kind21 = "temporary";
export type ImageRef1 = string;
export type ScopeId1 = string;
export type Mode2 = "exact" | "visual" | "combined";
export type ProfileId5 = string | null;
export type Status16 = "READY" | "PARTIAL" | "NOT_READY" | "UNSUPPORTED" | "NOT_REQUESTED";
export type ContentGroupId1 = string;
export type Branch = "exact" | "visual";
export type Rank1 = number;
export type Score1 = number | null;
export type ProfileId6 = string | null;
export type Origins3 = RetrievalOrigin[];
export type MemberCount = number;
export type ConflictCount = number;
export type SampleId25 = string;
export type DatasetId32 = string;
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
export type Status17 = "COMPLETE" | "INCOMPATIBLE" | "UNAVAILABLE" | "UNSUPPORTED" | "NOT_OBSERVABLE";
export type Regions2 = [unknown, unknown, unknown, unknown][];
export type ComparedPixels1 = number;
export type ChangedPixels1 = number | null;
export type MaxAbsDiff1 = number | null;
export type Reason8 = string | null;
export type Status18 = "UNSUPPORTED" | "registered" | "unregistered";
export type Reason9 = string;
export type CandidateToMain = [unknown, unknown, unknown] | null;
export type Matches1 = number | null;
export type Inliers = number | null;
export type MainVisibleFraction = number | null;
export type MeanAbsoluteResidual = number | null;
export type ReprojectionErrorPx = number | null;
export type ErrorCode =
  | (
      | "INVALID_SCOPE"
      | "SOURCE_UNAVAILABLE"
      | "UNSUPPORTED_IMAGE"
      | "INDEX_NOT_READY"
      | "PROFILE_NOT_CONFIGURED"
      | "ENCODER_UNAVAILABLE"
      | "ANNOTATION_UNREADABLE"
      | "RESOURCE_LIMIT"
      | "REFERENCE_NOT_FOUND"
      | "GATE_REVIEW_REQUIRED"
    )
  | null;
export type Reason10 = string | null;
export type Members = RetrievalMember[];
export type NextMemberCursor = string | null;
export type Groups = RetrievalGroup[];
export type GroupCount = number;
export type MemberCount1 = number;
export type NextCursor = string | null;
export type ErrorCode1 =
  | (
      | "INVALID_SCOPE"
      | "SOURCE_UNAVAILABLE"
      | "UNSUPPORTED_IMAGE"
      | "INDEX_NOT_READY"
      | "PROFILE_NOT_CONFIGURED"
      | "ENCODER_UNAVAILABLE"
      | "ANNOTATION_UNREADABLE"
      | "RESOURCE_LIMIT"
      | "REFERENCE_NOT_FOUND"
      | "GATE_REVIEW_REQUIRED"
    )
  | null;
export type Reason11 = string | null;
export type GroupCount1 = number;
export type MemberCount2 = number;
export type VisualK = number | null;
export type MinSimilarity2 = number | null;
export type RetrievalCompleteness = "EXACT_SCOPE" | "TOP_K" | "SIMILARITY_THRESHOLD" | "PARTIAL";
export type ImageRef2 = string;
export type Sha2563 = string;
export type SourceBytes = number;
export type ExpiresInSeconds = number;
export type CheckId9 = string;
export type RunId10 = string;
export type SampleId26 = string;
export type ScopeId2 = string;
export type Mode3 = "exact" | "visual" | "combined";
export type ProfileId7 = string | null;
export type Status19 = "COMPLETE" | "PARTIAL" | "FAILED";
export type ResultId1 = string;
export type EvidenceId6 = string;
export type SampleId27 = string;
export type References = AuditResultReference[];
export type ErrorCode2 =
  | (
      | "INVALID_SCOPE"
      | "SOURCE_UNAVAILABLE"
      | "UNSUPPORTED_IMAGE"
      | "INDEX_NOT_READY"
      | "PROFILE_NOT_CONFIGURED"
      | "ENCODER_UNAVAILABLE"
      | "ANNOTATION_UNREADABLE"
      | "RESOURCE_LIMIT"
      | "REFERENCE_NOT_FOUND"
      | "GATE_REVIEW_REQUIRED"
    )
  | null;
export type Reason12 = string | null;
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
export type JobId1 = string;
export type DatasetId33 = string;
export type VersionId19 = string;
export type SubmittedAt4 = string;
export type StartedAt8 = string | null;
export type FinishedAt5 = string | null;
export type Entries = KnowledgeCheckSummary[];
export type PublicationStatus = "complete" | "partial";
export type KnowledgeJobs = AuditKnowledgeSource[];
export type JobId2 = string;
export type DatasetIds6 = string[];
export type SubmittedAt5 = string;
export type StartedAt9 = string | null;
export type FinishedAt6 = string | null;
export type ConflictCount1 = number;
export type BatchId1 = string | null;
export type ConsistencyJobs = AuditConsistencySource[];
export type BuildId = string;
export type Name10 = string;
export type SourceImages = number;
export type CoveredImages = number;
export type BenchmarkBuilds = AuditBenchmarkChoice[];
export type Kind22 = "audit_records";
export type JobId3 = string;
export type Phase5 = "review" | "report";
export type Number = number;
export type SampleIds5 = string[];
export type State3 = "PENDING" | "AUDITING" | "REVIEWING" | "RECHECKING" | "COMPLETED";
export type CluesRevision = number | null;
export type GroupId2 = string;
export type Title7 = string;
export type VisualSignature = string;
export type AnnotationRelation = string;
export type NextBatchFocus = string;
export type SampleId28 = string;
export type ResultRevision = number;
export type Kind23 = "finding" | "observation" | "feature" | "image";
export type Index = number | null;
export type SupportRefs = AuditResultReference1[];
export type CounterRefs = AuditResultReference1[];
export type GroupId3 = string;
export type Title8 = string;
export type VisualSignature1 = string;
export type AnnotationRelation1 = string;
export type NextBatchFocus1 = string;
export type SupportImageCount = number;
export type CounterImageCount = number;
export type Clues = (AuditClue | AuditClueIndex)[];
export type ReviewRevision = number | null;
export type Revision3 = number;
export type SampleId29 = string;
export type ResultRevision1 = number;
export type State4 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type ExecutionStatus = "completed" | "incomplete" | "failed";
export type State5 = ("normal" | "suspect") | null;
/**
 * 只概括本图可见形态及标注覆盖、定位、实例关系。上游与知识评估分别填写对应字段。
 */
export type Analysis = string;
export type Conclusion1 = string;
/**
 * 支持本图判断的具体图像事实。
 */
export type Basis3 = string[];
/**
 * 本次实际观察的完整原图身份；原图及全部局部必须实际观察，但仅引用所属原图。
 */
export type EvidenceIds17 = string[];
/**
 * 必须来自本场knowledge.entries[].check.check_id；不是标注ID、上游差异ID或自拟图像检查项。
 */
export type CheckId10 = string;
export type Status20 = "consistent" | "deviates" | "unobservable" | "not_applicable";
/**
 * 说明本图可见现象与该知识检查动作的具体对应和适用理由。
 */
export type Description18 = string;
/**
 * 本次实际观察的完整原图身份；局部图仅用于观察，不单独引用。
 */
export type EvidenceIds18 = string[];
/**
 * 仅逐项评估本场选中的knowledge.entries，恰好覆盖其check_id；knowledge为null时必须填[]。普通图像/标注观察写入analysis和basis，不生成自拟check_id。
 */
export type CheckAssessments2 = AuditCheckAssessment[];
export type SourceIssueId = string;
export type Assessment = "supported" | "unsupported" | "insufficient";
export type Reason13 = string;
export type EvidenceIds19 = string[];
/**
 * 恰好处理本图上游result.issues中的每个issue_id一次；无上游问题时为空。supported须由findings关联，unsupported不能作为本图疑点来源。
 */
export type ConsistencyReview = AuditConsistencyAssessment[];
export type FindingId5 = string;
export type Description19 = string;
export type Location6 = string;
/**
 * 仅引用本场选中知识的check_id；无选中知识或独立发现时为空，不填写自拟图像检查项。
 */
export type CheckIds7 = string[];
/**
 * @minItems 1
 */
export type EvidenceIds20 = [string, ...string[]];
export type NormalExplanation7 = string;
export type Limitations15 = string[];
/**
 * 按可见问题分类；类别差异指有效同内容对照中同一对象的原始分组差异。
 */
export type Type2 =
  | "image_label_mismatch"
  | "category_mismatch"
  | "extra_annotation"
  | "missing_annotation"
  | "position_difference"
  | "split"
  | "merge";
/**
 * 引用当前主图真实annotation_id；类别、多标、位置和合并至少1个，拆分至少2个，少标或图像级可以为空。
 */
export type AnnotationIds1 = string[];
/**
 * 只引用本图上游result.issues中的真实issue_id，独立发现且不采纳上游问题时为空。
 */
export type ConsistencyIssueRefs = string[];
export type Findings4 = AuditFinding1[];
export type Description20 = string;
export type AnnotationIds2 = string[];
/**
 * 本次实际观察的完整原图身份，不单独引用局部图。
 *
 * @minItems 1
 */
export type EvidenceIds21 = [string, ...string[]];
/**
 * 记录有比较价值的可见现象，描述简短；普通观察不计入质量疑点。
 */
export type Observations1 = AuditObservation[];
export type GroupId4 = string;
export type Assessment1 = "supported" | "counter" | "unconfirmed" | "not_applicable";
export type Reason14 = string;
export type EvidenceIds22 = string[];
export type HypothesisAssessments = AuditHypothesisAssessment[];
export type Kind24 =
  "morphology" | "location" | "size" | "contrast" | "structural_relation" | "instances" | "background";
export type Description21 = string;
export type AnnotationIds3 = string[];
/**
 * @minItems 1
 */
export type EvidenceIds23 = [string, ...string[]];
export type VisualFeatures = AuditVisualFeature[];
export type EvidenceId8 = string;
export type Reason15 = string;
/**
 * 推荐供主Agent复看的少数完整原图及选择理由，可为空；不自动成为正式精选，不重复另一份精选ID列表。
 */
export type SelectedEvidence = AnalysisEvidenceCandidate[];
/**
 * 画面模糊、目标截断、必要图像读取失败等实际影响本图核查的取证缺口；没有则填[]。
 */
export type Limitations16 = string[];
export type SourceStatus = string;
export type Reason16 = string;
export type ProgramConclusion = string;
export type ModelConclusion = ConflictCategory | "无冲突" | null;
export type ConflictCategory = "类别不一致" | "位置差异" | "多类别" | "少类别" | "拆分" | "合并" | "对应关系差异";
export type Result = (NoCandidateResult | NoEligibleResult | ModelReviewedResult) | null;
export type TaskType = ("anomaly_detection" | "bbox_defect") | null;
export type CandidateRecordIds = number[];
export type ExecutionStatus1 = ("completed" | "partial" | "failed") | null;
export type Result1 = ("passed" | "discrepancy" | "needs_review" | "incomplete") | null;
export type PassReason =
  ("no_retrieved_candidate" | "no_eligible_candidate" | "no_valid_candidate" | "all_eligible_consistent") | null;
export type Retrieved = number;
export type Eligible = number;
export type Rejected = number;
export type Unverified = number;
export type Assessed = number;
export type Consistent = number;
export type Discrepancy = number;
export type Undetermined = number;
export type Failed3 = number;
export type Pending2 = number;
export type CandidateGateIds = string[];
export type IssueId = string;
export type Type3 =
  | "image_label_mismatch"
  | "category_mismatch"
  | "extra_annotation"
  | "missing_annotation"
  | "position_difference"
  | "split"
  | "merge";
export type MainAnnotationIds = string[];
export type Description22 = string;
export type SupportingAssessmentIds = number[];
export type AssessmentId = number;
export type CandidateId = string;
export type CandidateAnnotationIds = string[];
export type MediaIds = string[];
export type CandidateLabel = ("OK" | "NG") | null;
export type CandidateId1 = string;
/**
 * @minItems 1
 * @maxItems 1
 */
export type AnnotationIds4 = [string];
export type SameMainObjectAs = CandidateObjectReference[];
export type Evidence4 = MainIssueEvidence[];
export type Limitations17 = string[];
export type ReviewSuggestion = string;
export type MainLabel = ("OK" | "NG") | null;
export type Issues = MainAnnotationIssue[];
export type SchemaVersion = 1 | "4.0" | "5.0" | "7.0" | "8.0";
export type Verdict = "EQUIVALENT";
export type Reason17 = "NO_CANDIDATES";
export type Conclusion2 = "通过（无候选）";
/**
 * @maxItems 0
 */
export type Categories1 = [];
/**
 * @maxItems 0
 */
export type Assessments = [];
export type TaskType1 = ("anomaly_detection" | "bbox_defect") | null;
export type CandidateRecordIds1 = number[];
export type ExecutionStatus2 = ("completed" | "partial" | "failed") | null;
export type Result2 = ("passed" | "discrepancy" | "needs_review" | "incomplete") | null;
export type PassReason1 =
  ("no_retrieved_candidate" | "no_eligible_candidate" | "no_valid_candidate" | "all_eligible_consistent") | null;
export type CandidateGateIds1 = string[];
export type Issues1 = MainAnnotationIssue[];
export type SchemaVersion1 = "4.0" | "5.0" | "7.0" | "8.0";
export type Verdict1 = "EQUIVALENT";
export type Reason18 = "NO_ELIGIBLE_CANDIDATES";
export type Conclusion3 = "通过（无有效候选）";
/**
 * @maxItems 0
 */
export type Categories2 = [];
/**
 * @maxItems 0
 */
export type Assessments1 = [];
export type TaskType2 = ("anomaly_detection" | "bbox_defect") | null;
export type CandidateRecordIds2 = number[];
export type ExecutionStatus3 = ("completed" | "partial" | "failed") | null;
export type Result3 = ("passed" | "discrepancy" | "needs_review" | "incomplete") | null;
export type PassReason2 =
  ("no_retrieved_candidate" | "no_eligible_candidate" | "no_valid_candidate" | "all_eligible_consistent") | null;
export type CandidateGateIds2 = string[];
export type Issues2 = MainAnnotationIssue[];
export type Text6 = ("类别不一致" | "位置差异" | "多类别" | "少类别" | "拆分" | "合并" | "一致") | null;
/**
 * 根据逐候选结论汇总的整组结论
 */
export type Verdict2 = "EQUIVALENT" | "MATERIAL" | "UNCERTAIN";
/**
 * @minItems 1
 * @maxItems 100
 */
export type References1 = [GroupAnalysisReference, ...GroupAnalysisReference[]];
export type CandidateId2 = string;
export type ResultId3 = string;
export type EvidenceId9 = string;
export type DifferenceId1 = string | null;
/**
 * @minItems 1
 * @maxItems 100
 */
export type Conclusions = [GroupAnalysisConclusion, ...GroupAnalysisConclusion[]];
export type Text7 = string;
/**
 * @minItems 1
 * @maxItems 100
 */
export type References2 = [GroupAnalysisReference, ...GroupAnalysisReference[]];
/**
 * @maxItems 100
 */
export type Limitations18 = string[];
/**
 * 覆盖全部候选且每个候选恰好一次；未获得固定主图直接证据时只能UNCERTAIN
 *
 * @minItems 1
 * @maxItems 10000
 */
export type Assessments2 = [GroupPairAssessment, ...GroupPairAssessment[]];
export type CandidateId3 = string;
/**
 * 当前候选的标注一致性判定：MATERIAL为实质冲突，EQUIVALENT为一致，UNCERTAIN为关键证据缺失
 */
export type Verdict3 = "EQUIVALENT" | "MATERIAL" | "UNCERTAIN";
/**
 * 当前候选的标注比对分析
 */
export type Explanation = string;
/**
 * 当前候选的具体发现
 *
 * @maxItems 100
 */
export type Findings5 = string[];
/**
 * 独立保存未能确认的部分；已确认差异仍保留在issues，不因局部不确定而丢失。
 *
 * @maxItems 100
 */
export type Limitations19 = string[];
export type Description23 = string;
/**
 * 实际观察的两侧原图身份各一次。
 *
 * @minItems 2
 * @maxItems 2
 */
export type MediaIds1 = [string, string];
export type Limitations20 = string[];
export type ReviewSuggestion1 = string;
export type Type4 =
  "category_mismatch" | "extra_annotation" | "missing_annotation" | "position_difference" | "split" | "merge";
export type MainAnnotationIds1 = string[];
export type CandidateAnnotationIds1 = string[];
/**
 * 支持本问题的已核实区域对ID；像素一致的程序捷径可为空。
 */
export type RegionPairIds = string[];
/**
 * 位置问题必须确认实际缺陷覆盖存在material_change；不能仅因坐标、中心或尺寸数值不同报告问题。
 */
export type CoverageEffect = ("unchanged" | "material_change" | "unverified") | null;
/**
 * 位置问题说明实际缺陷的漏盖、偏离或范围实质变化，不自行制定像素阈值。
 */
export type CoverageReason = string | null;
/**
 * 仅用于主图少标：实际共同观察且确认是同一主图对象的其他候选原始框引用；没有确认则留空。程序验证真实映射区域与唯一对应，不能按文字或重叠猜测。
 */
export type SameMainObjectAs1 = CandidateObjectReference[];
export type Description24 = string;
/**
 * 实际观察的两侧原图身份各一次。
 *
 * @minItems 2
 * @maxItems 2
 */
export type MediaIds2 = [string, string];
export type Limitations21 = string[];
export type ReviewSuggestion2 = string;
export type Type5 = "image_label_mismatch";
export type MainLabel1 = "OK" | "NG";
export type CandidateLabel1 = "OK" | "NG";
/**
 * 全部独立问题；框ID来自冻结事实，引用实际送达的两侧原图。拆分合并不重复计同组数量差异。
 */
export type Issues3 = (BboxAnnotationIssue | ImageLabelIssue)[];
export type Conclusion4 = ("类别不一致" | "位置差异" | "多类别" | "少类别" | "拆分" | "合并" | "一致") | null;
/**
 * 与conclusion相同的唯一主要冲突分类；主图比候选少标注为少类别，多标注为多类别；主图同一对象多个框而候选一个为拆分，反之为合并。无差异及缺失证据时为空，其他实际差异保留在分析中。
 */
export type Categories3 = ConflictCategory[] | null;
export type SchemaVersion2 = 1 | "4.0" | "5.0" | "7.0" | "8.0";
export type Reason19 = "MODEL_REVIEWED";
export type Fingerprint = string;
export type CandidateId4 = string;
export type GateStatus = string | null;
export type Relation3 = ("pixel_identical" | "transformed_same_content" | "content_different" | "unverified") | null;
export type Reason20 = string;
export type Limitations22 = string[];
export type Gates = AuditMasterComparison[];
export type Items7 = AuditMasterRecord[];
export type GroupId5 = string;
export type Kind25 = "quality_issue" | "visual_pattern" | "judgment_boundary";
export type Dimension = "annotation_quality" | "visual_coverage" | "evaluation_difficulty";
export type Status21 = "pending" | "supported" | "disputed" | "withdrawn";
export type Title9 = string;
export type Description25 = string;
export type VisualSignature2 = string;
export type AnnotationRelation2 = string;
export type Scope2 = string;
export type KeyDifference = string;
/**
 * 需要新图像或对照才能回答的具体问题；没有则为空字符串。
 */
export type UnresolvedQuestion = string;
export type NextBatchFocus2 = string;
/**
 * @minItems 1
 */
export type SupportRefs1 = [AuditResultReference1, ...AuditResultReference1[]];
export type CounterRefs1 = AuditResultReference1[];
export type SampleId30 = string;
/**
 * representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。
 */
export type Role5 = "representative" | "counter";
/**
 * 用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。
 */
export type Reason21 = string;
export type Representatives = AuditRepresentative[];
export type AffectedImageCount = number;
export type GroupId6 = string;
export type Title10 = string;
export type Status22 = "pending" | "supported" | "disputed" | "withdrawn";
export type NextBatchFocus3 = string;
export type SupportImageCount1 = number;
export type CounterImageCount1 = number;
export type Representatives1 = AuditRepresentative[];
export type Discoveries = (AuditDiscovery | AuditDiscoveryIndex)[];
export type ContextPolicy = "legacy" | "evidence-on-demand-v1";
export type SampleId31 = string;
export type ResultRevision2 = number;
export type Reason22 = string;
/**
 * @minItems 1
 */
export type ConflictRefs = [AuditResultReference1, ...AuditResultReference1[]];
export type ReviewId = string;
export type BatchNumber = number;
export type State6 = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
export type Error1 = string | null;
export type Reviews = AuditRecheck[];
export type TotalImages1 = number;
export type DatasetFormat2 = "labelme" | "folder_classification";
export type BoxCount = number;
export type AnnotatedImages = number;
export type Minimum = number;
export type Q25 = number;
export type Median = number;
export type Q75 = number;
export type Maximum = number;
export type CoveredImages1 = number;
export type DistinctCount = number | null;
export type StrictDuplicateGroups = number | null;
export type StrictDuplicateImages = number | null;
export type NearCandidatePairs = number;
export type BuildId1 = string;
export type SourceImageCount = number;
export type CoveredImages2 = number;
export type SourceMatchesScope = boolean;
export type ConfirmedGoldImages = number;
export type PixelGoldImages = number;
export type IsPassed = boolean;
export type TotalViolations = number;
export type PhysicalLeakages = {
  [k: string]: unknown;
}[];
export type CaptureLeakages = {
  [k: string]: unknown;
}[];
export type DuplicateLeakages = {
  [k: string]: unknown;
}[];
export type ComponentLeakages = {
  [k: string]: unknown;
}[];
export type AugmentedLeakages = {
  [k: string]: unknown;
}[];
export type StrictContentLeakages = {
  [k: string]: unknown;
}[];
export type TrackName = string;
export type TrackStatus = "READY" | "PARTIAL" | "NOT_READY" | "NOT_EVALUATED";
export type Reason23 = string;
export type ContrastMeasurement = null;
export type ApplicableIssueTypes = (
  | "image_label_mismatch"
  | "category_mismatch"
  | "extra_annotation"
  | "missing_annotation"
  | "position_difference"
  | "split"
  | "merge"
)[];
export type TotalImages2 = number;
export type CompletedImages = number;
export type NormalImages2 = number;
export type SuspectImages = number;
export type IncompleteImages = number;
export type CompletionRate = number | null;
export type SuspectRateAmongCompleted = number | null;
export type IssueOccurrences = number;
export type ImageCount3 = number;
export type Occurrences = number;
export type ProgramIssueTypes = {
  [k: string]: number;
} | null;
export type ObservationImages = number;
export type ObservationOccurrences = number;
export type DatasetIds7 = string[];
export type Revision4 = number;
export type ExecutionStatus4 = string;
export type Total8 = number;
export type Completed3 = number;
export type Failed4 = number;
export type Unprocessed2 = number;
export type PreparedVisuals = number;
export type ObservedVisuals = number;
export type WholeImagesObserved = number;
export type FinalizationComplete = boolean | null;
export type Ref1 = string;
export type Source9 = PresetDirectionSource | ExploredDirectionSource;
export type Title11 = string;
export type Instruction9 = string;
export type Directions4 = AuditKnowledgeDirection[];
export type Check = AnalysisKnowledgeCheck | KnowledgeCheck;
/**
 * supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status23 = "supported" | "provisional" | "conflicted";
export type IndependentSourceCount = number;
export type SuggestedStatus = ("supported" | "provisional" | "conflicted") | null;
export type SupportLimitations2 = string[];
export type AssessmentReason = string | null;
/**
 * 改变已有主张或适用条件的原因；只改标题或精选图不需要。
 */
export type ChangeReason = string | null;
/**
 * 当前条目有序精选原图，合计最多4张。role须与该图的一项有效论据完全相同，可为support、counter、context或allowed_variation。省略保留既有选择；不影响完整论据和强度。
 */
export type KeyEvidence =
  | []
  | [AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence]
  | null;
export type EvidenceId10 = string;
export type Role6 = "support" | "counter" | "context" | "allowed_variation";
/**
 * 它独有地说明主张的哪项事实；与已有精选重复则不选。
 */
export type Reason24 = string;
export type Title12 = string;
export type Subject3 = string;
export type Location7 = string;
export type Criterion3 = string;
export type AllowedVariations3 = string[];
export type Limitations23 = string[];
export type CheckId11 = string;
/**
 * 只引用当前selected_directions中的完整ref。
 *
 * @minItems 1
 */
export type DirectionRefs = [string, ...string[]];
/**
 * 仅列当前条目实际有证据的子数据集。
 *
 * @minItems 1
 */
export type DatasetIds8 = [string, ...string[]];
export type SupportEvidenceIds3 = string[];
export type CounterEvidenceIds3 = string[];
export type PredecessorCheckIds1 = string[];
export type Entries1 = AuditSelectedCheck[];
export type Evidence5 = KnowledgeEvidence[];
export type CommitKey = string;
export type BatchNumber1 = number;
export type BaseRevision = number;
export type GroupId7 = string;
export type Kind26 = "quality_issue" | "visual_pattern" | "judgment_boundary";
export type Dimension1 = "annotation_quality" | "visual_coverage" | "evaluation_difficulty";
export type Status24 = "pending" | "supported" | "disputed" | "withdrawn";
export type Title13 = string;
export type Description26 = string;
export type VisualSignature3 = string;
export type AnnotationRelation3 = string;
export type Scope3 = string;
export type KeyDifference1 = string;
/**
 * 需要新图像或对照才能回答的具体问题；没有则为空字符串。
 */
export type UnresolvedQuestion1 = string;
export type NextBatchFocus4 = string;
/**
 * @minItems 1
 */
export type SupportRefs2 = [AuditResultReference2, ...AuditResultReference2[]];
export type SampleId32 = string;
export type ResultRevision3 = number;
export type Kind27 = "finding" | "observation" | "feature" | "image";
export type Index1 = number | null;
export type CounterRefs2 = AuditResultReference2[];
export type SampleId33 = string;
/**
 * representative为典型证据原图；counter为用于解释判断边界的已观察对照原图。
 */
export type Role7 = "representative" | "counter";
/**
 * 用日常用语指出这张原图中该看哪里、看什么。有对照关系的图将role设为counter。
 */
export type Reason25 = string;
export type Representatives2 = AuditRepresentative1[];
export type Discoveries1 = AuditDiscovery1[];
export type SampleId34 = string;
export type ResultRevision4 = number;
export type Reason26 = string;
/**
 * @minItems 1
 */
export type ConflictRefs1 = [AuditResultReference2, ...AuditResultReference2[]];
export type ReviewRequests = AuditReviewRequest[];
export type CommitKey1 = string;
export type BatchNumber2 = number;
export type BaseRevision1 = number;
export type GroupId8 = string;
export type Kind28 = "quality_issue" | "visual_pattern" | "judgment_boundary";
export type Dimension2 = "annotation_quality" | "visual_coverage" | "evaluation_difficulty";
export type Status25 = "pending" | "supported" | "disputed" | "withdrawn";
export type Title14 = string;
export type Description27 = string;
export type VisualSignature4 = string;
export type AnnotationRelation4 = string;
export type Scope4 = string;
export type KeyDifference2 = string;
/**
 * 需要新图像或对照才能回答的具体问题；没有则为空字符串。
 */
export type UnresolvedQuestion2 = string;
export type NextBatchFocus5 = string;
/**
 * 只提交新增或正文变化的完整发现。未变传[]；支持、反例和精选分别提交。
 */
export type Discoveries2 = AuditDiscoveryBody[];
export type GroupId9 = string;
export type Action2 = "add" | "remove" | "keep";
export type Role8 = "support" | "counter";
export type Reason27 = string;
/**
 * 只提交引用变化。改变主张或范围时，以keep、remove或角色迁移逐项复核全部旧引用并说明理由。
 */
export type EvidenceChanges = AuditEvidenceChange[];
export type GroupId10 = string;
export type Representatives3 = AuditRepresentative1[];
/**
 * 仅提交精选变化的条目，省略保留既有选择。数量按信息价值决定，不重复堆图。
 */
export type RepresentativeChanges = AuditRepresentativeChange[];
export type ReviewRequests1 = AuditReviewRequest[];
export type GroupId11 = string;
export type Revision5 = number | null;
export type Page10 = number;
export type PageSize10 = number;
export type Role9 = ("support" | "counter") | null;
/**
 * 本次图级终稿的幂等键，仅同内容重传复用。
 */
export type CommitKey2 = string;
export type ExecutionStatus5 = "completed" | "incomplete" | "failed";
export type State7 = ("normal" | "suspect") | null;
/**
 * 只概括本图可见形态及标注覆盖、定位、实例关系。上游与知识评估分别填写对应字段。
 */
export type Analysis1 = string;
export type Conclusion5 = string;
/**
 * 支持本图判断的具体图像事实。
 */
export type Basis4 = string[];
/**
 * 本次实际观察的完整原图身份；原图及全部局部必须实际观察，但仅引用所属原图。
 */
export type EvidenceIds24 = string[];
/**
 * 仅逐项评估本场选中的knowledge.entries，恰好覆盖其check_id；knowledge为null时必须填[]。普通图像/标注观察写入analysis和basis，不生成自拟check_id。
 */
export type CheckAssessments3 = AuditCheckAssessment[];
/**
 * 恰好处理本图上游result.issues中的每个issue_id一次；无上游问题时为空。supported须由findings关联，unsupported不能作为本图疑点来源。
 */
export type ConsistencyReview1 = AuditConsistencyAssessment[];
export type FindingId6 = string;
export type Description28 = string;
export type Location8 = string;
/**
 * 仅引用本场选中知识的check_id；无选中知识或独立发现时为空，不填写自拟图像检查项。
 */
export type CheckIds8 = string[];
/**
 * @minItems 1
 */
export type EvidenceIds25 = [string, ...string[]];
export type NormalExplanation8 = string;
export type Limitations24 = string[];
/**
 * 按可见问题分类；类别差异指有效同内容对照中同一对象的原始分组差异。
 */
export type Type6 =
  | "image_label_mismatch"
  | "category_mismatch"
  | "extra_annotation"
  | "missing_annotation"
  | "position_difference"
  | "split"
  | "merge";
/**
 * 引用当前主图真实annotation_id；类别、多标、位置和合并至少1个，拆分至少2个，少标或图像级可以为空。
 */
export type AnnotationIds5 = string[];
/**
 * 只引用本图上游result.issues中的真实issue_id，独立发现且不采纳上游问题时为空。
 */
export type ConsistencyIssueRefs1 = string[];
export type Findings6 = AuditFinding2[];
export type Description29 = string;
export type AnnotationIds6 = string[];
/**
 * 本次实际观察的完整原图身份，不单独引用局部图。
 *
 * @minItems 1
 */
export type EvidenceIds26 = [string, ...string[]];
/**
 * 记录有比较价值的可见现象，描述简短；普通观察不计入质量疑点。
 */
export type Observations2 = AuditObservation1[];
export type HypothesisAssessments1 = AuditHypothesisAssessment[];
export type Kind29 =
  "morphology" | "location" | "size" | "contrast" | "structural_relation" | "instances" | "background";
export type Description30 = string;
export type AnnotationIds7 = string[];
/**
 * @minItems 1
 */
export type EvidenceIds27 = [string, ...string[]];
export type VisualFeatures1 = AuditVisualFeature1[];
/**
 * 推荐供主Agent复看的少数完整原图及选择理由，可为空；不自动成为正式精选，不重复另一份精选ID列表。
 */
export type SelectedEvidence1 = AnalysisEvidenceCandidate[];
/**
 * 画面模糊、目标截断、必要图像读取失败等实际影响本图核查的取证缺口；没有则填[]。
 */
export type Limitations25 = string[];
export type SampleId35 = string;
export type Offset = number;
export type Limit = number | null;
/**
 * whole仅完整原图和标注元数据；annotation_rois为全部标注局部；all显式读取整图及全部必需局部。
 */
export type View = "whole" | "annotation_rois" | "all";
export type RunId11 = string;
export type Page11 = number;
export type PageSize11 = number;
export type Status26 = "all" | "suspect" | "insufficient" | "normal" | "unprocessed" | "incomplete";
export type Search5 = string;
export type IssueType = string | null;
export type GroupId12 = string | null;
export type ConsistencyAssessment = string | null;
export type KnowledgeId = string | null;
export type RunId12 = string;
export type Total9 = number;
export type Page12 = number;
export type PageSize12 = number;
export type RunId13 = string;
export type SampleId36 = string;
export type DatasetId34 = string;
export type Filename = string;
export type Width3 = number;
export type Height3 = number;
export type AuditState = "suspect" | "insufficient" | "normal" | "unprocessed" | "incomplete";
export type OverviewEvidenceId1 = string | null;
export type HasFindings = boolean;
export type InsufficientEvidence = boolean;
export type ConsistencyPending = boolean;
export type SessionId2 = string | null;
export type ExecutionStatus6 =
  ("PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED") | null;
export type Items8 = AuditSampleItem[];
export type Archived = boolean;
export type RunId14 = string;
export type DatasetId35 = string;
export type Status27 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type TotalSamples3 = number;
export type AuditedSamples = number;
export type CoveragePercent = number | null;
export type SuspectSamples1 = number;
export type InsufficientSamples = number;
export type ConsistencyPendingSamples = number;
export type KnowledgeVersionId5 = string | null;
export type ModelName5 = string | null;
export type SubmittedAt6 = string;
export type FinishedAt7 = string | null;
export type GeneratedAt1 = string;
export type Conclusion6 = string;
export type Limitations26 = string[];
export type ExportReady = boolean;
export type ConsistencyJobId1 = string | null;
export type ReportState =
  ("PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED") | null;
export type ReportSessionId = string | null;
export type ConsistencyAnalysis = string;
export type KnowledgeAnalysis = string;
export type SampleId37 = string;
export type Role10 = "representative" | "counter";
export type Caption = string;
export type Reason28 = string;
export type SourceFingerprint1 = string | null;
export type Annotations2 = Annotation[];
export type DatasetFormat3 = "labelme" | "folder_classification";
export type SamplingGroup = ("normal" | "abnormal" | "unclassified") | null;
export type Discoveries3 = AuditDiscovery[];
export type CoverageAnalysis = string;
/**
 * 围绕现象、共性、差异与判断边界的综合分析，不写逐图详情。
 */
export type Analysis2 = string;
/**
 * @minItems 1
 */
export type EvidenceRefs = [AuditResultReference1, ...AuditResultReference1[]];
/**
 * 精选3至8张主Agent已实际观察、能共同解释本段分析的完整原图；对照图设为counter。
 */
export type Representatives4 = AuditRepresentative[];
/**
 * 按与本段分析的关系和重要程度关联案例，在本段就地复用其原图。
 */
export type RelatedCaseIds = string[];
/**
 * 根据本作业实际观察命名，不加序号，不照搬固定的覆盖主题。
 */
export type Title15 = string;
export type CoverageTopics = AuditCoverageTopic[];
/**
 * 围绕现象、共性、差异与判断边界的综合分析，不写逐图详情。
 */
export type Analysis3 = string;
/**
 * 支撑本项分析的当前有效图级记录。没有相关材料时为空并在正文说明。
 */
export type EvidenceRefs1 = AuditResultReference1[];
/**
 * 精选3至8张主Agent已实际观察、能共同解释本段分析的完整原图；对照图设为counter。
 */
export type Representatives5 = AuditRepresentative[];
/**
 * 按与本段分析的关系和重要程度关联案例，在本段就地复用其原图。
 */
export type RelatedCaseIds1 = string[];
/**
 * 沿用本数据格式的现有差异类型，每类单独分析，不合并多标少标或拆分合并。
 */
export type IssueType1 =
  | "image_label_mismatch"
  | "category_mismatch"
  | "extra_annotation"
  | "missing_annotation"
  | "position_difference"
  | "split"
  | "merge";
export type Title16 = string;
/**
 * 简短说明该类冲突的实际可见现象。
 */
export type Description31 = string;
/**
 * 结合当前图证说明本次保留或排除该疑点的具体理由。
 */
export type AuditResult = string;
export type ConsistencyAnalyses = AuditConsistencyAnalysis[];
export type SourceStatus1 =
  | "NO_CANDIDATES"
  | "NO_ELIGIBLE_CANDIDATES"
  | "MODEL_REVIEWED:EQUIVALENT"
  | "MODEL_REVIEWED:MATERIAL"
  | "MODEL_REVIEWED:UNCERTAIN";
/**
 * 只讲这组能否找到可比较的图、相同内容的标注是否一致及具体差异；用日常语言说明。
 */
export type Analysis4 = string;
/**
 * 每张精选原图都须关联其当前有效图级版本；通常kind为image，sample_id与representatives中的原图一致。
 */
export type EvidenceRefs2 = AuditResultReference1[];
/**
 * 从该范围精选3至8张主Agent已实际查看的完整原图；用于比较的图指定counter。
 */
export type Representatives6 = AuditRepresentative[];
export type ConsistencyScopes = AuditConsistencyScope[];
export type CheckId12 = string;
/**
 * 用自然语言概括该知识关注的可见现象和检查动作。
 */
export type Description32 = string;
/**
 * 说明本次哪些可见场景适用，哪些不适用。
 */
export type Applicability = string;
/**
 * 依据本次实际图像说明观察、对照及与知识的关系。
 */
export type Analysis5 = string;
/**
 * 该知识帮助辨认或区分的具体可见现象及其对本次判断的影响。
 */
export type AuditImpact = string;
export type EvidenceRefs3 = AuditResultReference1[];
export type Representatives7 = AuditRepresentative[];
export type KnowledgeEntries = AuditReportedKnowledge[];
export type IndependenceAnalysis = string;
export type Tag =
  | "representative_test_set"
  | "ordinary_normal"
  | "hard_normal"
  | "near_ok_ng_pair"
  | "tiny_defect"
  | "low_contrast_defect"
  | "structural_relation"
  | "missing_component"
  | "misalignment"
  | "multi_object"
  | "in_domain"
  | "unseen_batch"
  | "lighting_shift";
export type CoverageStatus = "observed" | "candidate" | "not_observed" | "not_applicable";
/**
 * 该能力实际出现的视觉困难，或尚缺的具体场景。
 */
export type Reason29 = string;
export type EvidenceRefs4 = AuditResultReference1[];
export type Representatives8 = AuditRepresentative[];
/**
 * 仅列该能力特有的使用条件，共同条件留在报告用途章节。
 */
export type MissingConditions = string[];
export type ReadinessStatus = "ready" | "partial" | "not_ready" | "not_evaluated";
export type ReadinessTrack = string | null;
export type Capabilities = AuditReportedCapability[];
export type Purpose1 =
  | "exploration"
  | "training_experiment"
  | "debug"
  | "image_evaluation"
  | "bbox_evaluation"
  | "pixel_evaluation"
  | "formal_benchmark";
export type Status28 = "usable" | "candidate" | "not_ready" | "not_evaluated";
/**
 * 本用途能开展的具体工作，或需先完成的具体准备，用一句话说明。
 */
export type Reason30 = string;
export type Usability = AuditUsabilityAssessment[];
export type ReviewPriorities = string[];
export type CaseId = string;
export type Title17 = string;
/**
 * 用日常用语指出图里看哪里、看到了什么、标注圈住了什么。
 */
export type Observation2 = string;
/**
 * 直接说明图中哪些地方相同或不同，以及为什么这样判断。
 */
export type Comparison = string;
/**
 * 这些图可以用来检查模型的什么表现，或接下来具体应做什么。
 */
export type Significance = string;
/**
 * 引用具体标注疑点时使用finding及其索引；普通图像比较使用observation、feature或image。
 *
 * @minItems 1
 */
export type EvidenceRefs5 = [AuditResultReference1, ...AuditResultReference1[]];
/**
 * @minItems 1
 */
export type Representatives9 = [AuditRepresentative, ...AuditRepresentative[]];
export type ReportCases = AuditReportCase[];
export type Title18 = string;
export type Summary4 = string;
export type CapabilityTags = (
  | "representative_test_set"
  | "ordinary_normal"
  | "hard_normal"
  | "near_ok_ng_pair"
  | "tiny_defect"
  | "low_contrast_defect"
  | "structural_relation"
  | "missing_component"
  | "misalignment"
  | "multi_object"
  | "in_domain"
  | "unseen_batch"
  | "lighting_shift"
)[];
/**
 * @minItems 1
 */
export type Points = [AuditCapabilityPoint, ...AuditCapabilityPoint[]];
export type Title19 = string;
export type ObservationAndComparison = string;
export type EvaluationValue = string;
/**
 * 支撑本能力小点的报告案例，须有主Agent实际观察的完整原图。
 *
 * @minItems 1
 */
export type CaseIds = [string, ...string[]];
export type MissingConditions1 = string[];
export type CapabilityTopics = AuditCapabilityTopic[];
export type Archived1 = boolean;
export type Page13 = number;
export type PageSize13 = number;
export type SampleId38 = string | null;
export type IssueType2 = string | null;
export type ConsistencyAssessment1 = ("supported" | "unsupported" | "insufficient") | null;
export type KnowledgeId1 = string | null;
export type State8 = ("normal" | "suspect" | "incomplete") | null;
export type CommitKey3 = string;
export type DiscoveryIds = string[];
/**
 * 概括当前用途及最重要的视觉发现；图像数、疑点数和来源状态由页面另行展示。
 */
export type Conclusion7 = string;
/**
 * 用一两句直白的话回答可对照图像的标注是否一致，结合程序统计与模型复核统计解释差别。具体图像细节放在对应的小节。
 */
export type ConsistencyAnalysis1 = string;
/**
 * 简述知识帮助看到了什么，可留空；各条具体应用在knowledge_analyses展开。
 */
export type KnowledgeAnalysis1 = string;
/**
 * 概括实际可见形态、背景、结构关系及尚缺场景。
 */
export type CoverageAnalysis1 = string;
/**
 * 围绕现象、共性、差异与判断边界的综合分析，不写逐图详情。
 */
export type Analysis6 = string;
/**
 * @minItems 1
 */
export type EvidenceRefs6 = [AuditResultReference2, ...AuditResultReference2[]];
/**
 * 精选3至8张主Agent已实际观察、能共同解释本段分析的完整原图；对照图设为counter。
 */
export type Representatives10 = AuditRepresentative1[];
/**
 * 按与本段分析的关系和重要程度关联案例，在本段就地复用其原图。
 */
export type RelatedCaseIds2 = string[];
/**
 * 根据本作业实际观察命名，不加序号，不照搬固定的覆盖主题。
 */
export type Title20 = string;
/**
 * 本作业有真实图证的覆盖画像主题，标题、条数、正文及选图由实际作业决定。
 */
export type CoverageTopics1 = AuditCoverageTopic1[];
/**
 * 围绕现象、共性、差异与判断边界的综合分析，不写逐图详情。
 */
export type Analysis7 = string;
/**
 * 支撑本项分析的当前有效图级记录。没有相关材料时为空并在正文说明。
 */
export type EvidenceRefs7 = AuditResultReference2[];
/**
 * 精选3至8张主Agent已实际观察、能共同解释本段分析的完整原图；对照图设为counter。
 */
export type Representatives11 = AuditRepresentative1[];
/**
 * 按与本段分析的关系和重要程度关联案例，在本段就地复用其原图。
 */
export type RelatedCaseIds3 = string[];
/**
 * 沿用本数据格式的现有差异类型，每类单独分析，不合并多标少标或拆分合并。
 */
export type IssueType3 =
  | "image_label_mismatch"
  | "category_mismatch"
  | "extra_annotation"
  | "missing_annotation"
  | "position_difference"
  | "split"
  | "merge";
export type Title21 = string;
/**
 * 简短说明该类冲突的实际可见现象。
 */
export type Description33 = string;
/**
 * 结合当前图证说明本次保留或排除该疑点的具体理由。
 */
export type AuditResult1 = string;
/**
 * 按上下文applicable_issue_types的每个适用差异类型各一项；零疑点也如实分析，无候选、无有效候选、一致在范围分析中展开。
 */
export type ConsistencyAnalyses1 = AuditConsistencyAnalysis1[];
export type SourceStatus2 =
  | "NO_CANDIDATES"
  | "NO_ELIGIBLE_CANDIDATES"
  | "MODEL_REVIEWED:EQUIVALENT"
  | "MODEL_REVIEWED:MATERIAL"
  | "MODEL_REVIEWED:UNCERTAIN";
/**
 * 只讲这组能否找到可比较的图、相同内容的标注是否一致及具体差异；用日常语言说明。
 */
export type Analysis8 = string;
/**
 * 每张精选原图都须关联其当前有效图级版本；通常kind为image，sample_id与representatives中的原图一致。
 */
export type EvidenceRefs8 = AuditResultReference2[];
/**
 * 从该范围精选3至8张主Agent已实际查看的完整原图；用于比较的图指定counter。
 */
export type Representatives12 = AuditRepresentative1[];
/**
 * 分别解释无候选、无有效候选、标注一致等来源范围。
 */
export type ConsistencyScopes1 = AuditConsistencyScope1[];
export type CheckId13 = string;
/**
 * 用自然语言概括该知识关注的可见现象和检查动作。
 */
export type Description34 = string;
/**
 * 说明本次哪些可见场景适用，哪些不适用。
 */
export type Applicability1 = string;
/**
 * 依据本次实际图像说明观察、对照及与知识的关系。
 */
export type Analysis9 = string;
/**
 * 该知识帮助辨认或区分的具体可见现象及其对本次判断的影响。
 */
export type AuditImpact1 = string;
export type EvidenceRefs9 = AuditResultReference2[];
export type Representatives13 = AuditRepresentative1[];
/**
 * 逐项覆盖全部所选知识，说明内容、适用性、图证对照及实际作用。
 */
export type KnowledgeAnalyses = AuditKnowledgeAnalysis1[];
/**
 * 依据真实重复和来源登记说明样本结构，以及尚缺哪些具体登记。
 */
export type IndependenceAnalysis1 = string;
export type Tag1 =
  | "representative_test_set"
  | "ordinary_normal"
  | "hard_normal"
  | "near_ok_ng_pair"
  | "tiny_defect"
  | "low_contrast_defect"
  | "structural_relation"
  | "missing_component"
  | "misalignment"
  | "multi_object"
  | "in_domain"
  | "unseen_batch"
  | "lighting_shift";
export type CoverageStatus1 = "observed" | "candidate" | "not_observed" | "not_applicable";
/**
 * 该能力实际出现的视觉困难，或尚缺的具体场景。
 */
export type Reason31 = string;
export type EvidenceRefs10 = AuditResultReference2[];
export type Representatives14 = AuditRepresentative1[];
/**
 * 仅列该能力特有的使用条件，共同条件留在报告用途章节。
 */
export type MissingConditions2 = string[];
export type Capabilities1 = AuditCapability[];
export type Usability1 = AuditUsabilityAssessment[];
/**
 * 本轮真实保留疑点的复看位置和动作；没有则为空。
 */
export type ReviewPriorities1 = string[];
/**
 * 需补充的图像、参考标注、来源登记或划分成果及对应准备动作，同一条件集中说明一次。
 */
export type Limitations27 = string[];
export type CaseId1 = string;
export type Title22 = string;
/**
 * 用日常用语指出图里看哪里、看到了什么、标注圈住了什么。
 */
export type Observation3 = string;
/**
 * 直接说明图中哪些地方相同或不同，以及为什么这样判断。
 */
export type Comparison1 = string;
/**
 * 这些图可以用来检查模型的什么表现，或接下来具体应做什么。
 */
export type Significance1 = string;
/**
 * 引用具体标注疑点时使用finding及其索引；普通图像比较使用observation、feature或image。
 *
 * @minItems 1
 */
export type EvidenceRefs11 = [AuditResultReference2, ...AuditResultReference2[]];
/**
 * @minItems 1
 */
export type Representatives15 = [AuditRepresentative1, ...AuditRepresentative1[]];
/**
 * 各分析点关联的图像依据；相同案例供多个分析点复用，页面在对应正文旁直接展示精选原图。
 */
export type ReportCases1 = AuditReportCase1[];
export type Title23 = string;
export type Summary5 = string;
export type CapabilityTags1 = (
  | "representative_test_set"
  | "ordinary_normal"
  | "hard_normal"
  | "near_ok_ng_pair"
  | "tiny_defect"
  | "low_contrast_defect"
  | "structural_relation"
  | "missing_component"
  | "misalignment"
  | "multi_object"
  | "in_domain"
  | "unseen_batch"
  | "lighting_shift"
)[];
/**
 * @minItems 1
 */
export type Points1 = [AuditCapabilityPoint, ...AuditCapabilityPoint[]];
export type MissingConditions3 = string[];
/**
 * 由实际视觉困难形成的能力专题，每个小点引用有原图的案例；无图证项在缺口中说明。
 */
export type CapabilityTopics1 = AuditCapabilityTopic1[];
export type JobId4 = string;
export type SessionId3 = string;
export type SessionCreated = boolean;
export type State9 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type CommitKey4 = string;
export type DiscoveryIds1 = string[];
/**
 * 概括当前用途及最重要的视觉发现；图像数、疑点数和来源状态由页面另行展示。
 */
export type Conclusion8 = string;
/**
 * 用一两句直白的话回答可对照图像的标注是否一致，结合程序统计与模型复核统计解释差别。具体图像细节放在对应的小节。
 */
export type ConsistencyAnalysis2 = string;
/**
 * 简述知识帮助看到了什么，可留空；各条具体应用在knowledge_analyses展开。
 */
export type KnowledgeAnalysis2 = string;
/**
 * 概括实际可见形态、背景、结构关系及尚缺场景。
 */
export type CoverageAnalysis2 = string;
/**
 * 本作业有真实图证的覆盖画像主题，标题、条数、正文及选图由实际作业决定。
 */
export type CoverageTopics2 = AuditCoverageTopic[];
/**
 * 按上下文applicable_issue_types的每个适用差异类型各一项；零疑点也如实分析，无候选、无有效候选、一致在范围分析中展开。
 */
export type ConsistencyAnalyses2 = AuditConsistencyAnalysis[];
/**
 * 分别解释无候选、无有效候选、标注一致等来源范围。
 */
export type ConsistencyScopes2 = AuditConsistencyScope[];
/**
 * 逐项覆盖全部所选知识，说明内容、适用性、图证对照及实际作用。
 */
export type KnowledgeAnalyses1 = AuditKnowledgeAnalysis[];
/**
 * 依据真实重复和来源登记说明样本结构，以及尚缺哪些具体登记。
 */
export type IndependenceAnalysis2 = string;
export type Tag2 =
  | "representative_test_set"
  | "ordinary_normal"
  | "hard_normal"
  | "near_ok_ng_pair"
  | "tiny_defect"
  | "low_contrast_defect"
  | "structural_relation"
  | "missing_component"
  | "misalignment"
  | "multi_object"
  | "in_domain"
  | "unseen_batch"
  | "lighting_shift";
export type CoverageStatus2 = "observed" | "candidate" | "not_observed" | "not_applicable";
/**
 * 该能力实际出现的视觉困难，或尚缺的具体场景。
 */
export type Reason32 = string;
export type EvidenceRefs12 = AuditResultReference1[];
export type Representatives16 = AuditRepresentative[];
/**
 * 仅列该能力特有的使用条件，共同条件留在报告用途章节。
 */
export type MissingConditions4 = string[];
export type Capabilities2 = AuditCapability1[];
export type Usability2 = AuditUsabilityAssessment[];
/**
 * 本轮真实保留疑点的复看位置和动作；没有则为空。
 */
export type ReviewPriorities2 = string[];
/**
 * 需补充的图像、参考标注、来源登记或划分成果及对应准备动作，同一条件集中说明一次。
 */
export type Limitations28 = string[];
/**
 * 各分析点关联的图像依据；相同案例供多个分析点复用，页面在对应正文旁直接展示精选原图。
 */
export type ReportCases2 = AuditReportCase[];
/**
 * 由实际视觉困难形成的能力专题，每个小点引用有原图的案例；无图证项在缺口中说明。
 */
export type CapabilityTopics2 = AuditCapabilityTopic[];
export type Error2 = string | null;
export type Revision6 = number;
export type Discoveries4 = AuditDiscovery[];
export type SampleId39 = string;
export type EvidenceId11 = string;
export type VersionId20 = string;
export type CheckId14 = string;
export type SubmissionId6 = string;
export type ExpectedRevision3 = number;
export type Status29 = "pending" | "confirmed" | "rejected";
export type Note1 = string;
export type Objective3 = string;
export type Directions5 = MiningDirection[];
export type Instruction10 = string;
export type WaveId = number | null;
export type RoundId = number;
/**
 * @minItems 1
 */
export type Targets = [AnalysisTarget, ...AnalysisTarget[]];
export type DatasetId36 = string;
export type SampleId40 = string;
export type CandidateRole = ("normal" | "defect") | null;
export type Normal = number;
export type Abnormal = number;
export type Unclassified = number;
export type WaveId1 = number;
export type SessionId4 = string;
export type CatalogRevision = number;
export type Summary6 = string;
/**
 * 改变已有主张或适用条件的原因；只改标题或精选图不需要。
 */
export type ChangeReason1 = string | null;
/**
 * 当前条目有序精选原图，合计最多4张。role须与该图的一项有效论据完全相同，可为support、counter、context或allowed_variation。省略保留既有选择；不影响完整论据和强度。
 */
export type KeyEvidence1 =
  | []
  | [AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence]
  | null;
export type Title24 = string;
export type Instruction11 = string;
export type AppliesTo1 = "normal" | "defect" | "both";
export type Rationale1 = string;
export type Limitations29 = string[];
export type DirectionId7 = string;
/**
 * @minItems 1
 */
export type DatasetIds9 = [string, ...string[]];
/**
 * @minItems 1
 */
export type EvidenceIds28 = [string, ...string[]];
export type CounterEvidenceIds4 = string[];
export type PredecessorDirectionIds = string[];
export type Directions6 = AnalysisDirection[];
export type Checks4 = AnalysisKnowledgeCheck[];
export type Limitations30 = string[];
export type UnresolvedQuestions = string[];
export type Report =
  ExplorationBatchReport | KnowledgeBatchReport | ExplorationEvidenceReport | KnowledgeEvidenceReport | null;
export type DatasetId37 = string;
export type SampleId41 = string;
/**
 * 仅描述这张图实际观察的事实；局部定位使用原图坐标。
 */
export type Description35 = string;
/**
 * 实际送达且已观察的完整原图evidence_id；原图关联其原始标注及全部局部视图，不单独引用裁图或掩膜。
 */
export type EvidenceIds29 = string[];
export type DirectionRef = string;
/**
 * 逐图按所选方向要求判断：applicable表示所需结构和核对范围可见，足以回答该方向问题，未见所查现象也适用；not_applicable表示目标结构不存在或不属于该方向；uncertain表示遮挡、失焦或画面缺失使要求范围不能充分核对。只看清一部分不能把整个范围记为applicable，也不能将未看清当成允许变化或完整支持；可见部分事实可保留为context，不能静默缩小方向要求。
 */
export type Status30 = "applicable" | "not_applicable" | "uncertain";
export type Reason33 = string;
export type Directions7 = AnalysisDirectionObservation[];
export type Limitations31 = string[];
/**
 * 仅在已有实际取证错误回执时设为true；能读取原图时仍保留可见事实。
 */
export type ReportPreparationError = boolean;
/**
 * 可选的明确图像事实；不要求本批每张图生成文字，方向关系和候选应自带可见依据。
 */
export type Observations3 = AnalysisSampleObservation[];
export type DirectionId8 = string;
export type Role11 = "support" | "normal_control" | "counter" | "not_comparable" | "uncertain" | "not_present";
export type EvidenceIds30 = string[];
export type Reason34 = string;
export type Assessments3 = ExplorationAssessment[];
export type Title25 = string;
export type Instruction12 = string;
export type AppliesTo2 = "normal" | "defect" | "both";
export type Rationale2 = string;
export type Limitations32 = string[];
/**
 * @minItems 1
 */
export type EvidenceIds31 = [string, ...string[]];
export type CandidateId5 = string;
export type Discoveries5 = ExplorationDiscovery[];
export type DiscoverySummary = string;
export type Limitations33 = string[];
export type UnresolvedQuestions1 = string[];
export type KeyEvidenceIds = string[];
export type Observations4 = AnalysisSampleObservation[];
export type CheckId15 = string;
export type Role12 =
  | "support"
  | "counter"
  | "allowed_variation"
  | "context"
  | "normal_control"
  | "not_comparable"
  | "uncertain"
  | "not_present";
export type EvidenceIds32 = string[];
export type Reason35 = string;
export type Assessments4 = KnowledgeAssessment[];
export type Title26 = string;
export type Subject4 = string;
export type Location9 = string;
export type Criterion4 = string;
export type AllowedVariations4 = string[];
export type Limitations34 = string[];
/**
 * supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status31 = "supported" | "provisional" | "conflicted";
export type SupportEvidenceIds4 = string[];
export type CounterEvidenceIds5 = string[];
export type CandidateId6 = string;
/**
 * @minItems 1
 */
export type DirectionRefs1 = [string, ...string[]];
/**
 * @minItems 1
 */
export type DatasetIds10 = [string, ...string[]];
export type Discoveries6 = KnowledgeDiscovery1[];
export type DiscoverySummary1 = string;
export type Limitations35 = string[];
export type UnresolvedQuestions2 = string[];
export type KeyEvidenceIds1 = string[];
/**
 * 可选的明确图像事实；不要求本批每张图生成文字，方向关系和候选应自带可见依据。
 */
export type Observations5 = AnalysisSampleObservation[];
export type Assessments5 = ExplorationAssessment[];
export type Discoveries7 = ExplorationDiscovery[];
export type DiscoverySummary2 = string;
export type Limitations36 = string[];
export type UnresolvedQuestions3 = string[];
export type SelectedEvidence2 = AnalysisEvidenceCandidate[];
export type Observations6 = AnalysisSampleObservation[];
export type Assessments6 = KnowledgeAssessment[];
export type Discoveries8 = KnowledgeDiscovery1[];
export type DiscoverySummary3 = string;
export type Limitations37 = string[];
export type UnresolvedQuestions4 = string[];
export type SelectedEvidence3 = AnalysisEvidenceCandidate[];
export type Reviewed = boolean;
export type Tasks = AnalysisBatchTask[];
export type DatasetId38 = string;
export type SampleId42 = string;
/**
 * 仅描述这张图实际观察的事实；局部定位使用原图坐标。
 */
export type Description36 = string;
/**
 * 实际送达且已观察的完整原图evidence_id；原图关联其原始标注及全部局部视图，不单独引用裁图或掩膜。
 */
export type EvidenceIds33 = string[];
export type Directions8 = AnalysisDirectionObservation[];
export type Limitations38 = string[];
/**
 * 仅在已有实际取证错误回执时设为true；能读取原图时仍保留可见事实。
 */
export type ReportPreparationError1 = boolean;
/**
 * 可选的明确图像事实；不要求本批每张图生成文字，方向关系和候选应自带可见依据。
 */
export type Observations7 = AnalysisSampleObservation1[];
export type Assessments7 = ExplorationAssessment[];
export type Discoveries9 = ExplorationDiscovery[];
export type DiscoverySummary4 = string;
export type Limitations39 = string[];
export type UnresolvedQuestions5 = string[];
export type KeyEvidenceIds2 = string[];
export type Observations8 = AnalysisSampleObservation1[];
export type Assessments8 = KnowledgeAssessment[];
export type Title27 = string;
export type Subject5 = string;
export type Location10 = string;
export type Criterion5 = string;
export type AllowedVariations5 = string[];
export type Limitations40 = string[];
/**
 * supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status32 = "supported" | "provisional" | "conflicted";
export type SupportEvidenceIds5 = string[];
export type CounterEvidenceIds6 = string[];
export type CandidateId7 = string;
/**
 * @minItems 1
 */
export type DirectionRefs2 = [string, ...string[]];
/**
 * @minItems 1
 */
export type DatasetIds11 = [string, ...string[]];
export type Discoveries10 = KnowledgeDiscovery2[];
export type DiscoverySummary5 = string;
export type Limitations41 = string[];
export type UnresolvedQuestions6 = string[];
export type KeyEvidenceIds3 = string[];
export type Role13 = "observer";
export type JobId5 = string;
export type Sources1 = AnalysisRegistration[];
export type SampleId43 = string;
export type EvidenceId12 = string | null;
export type Total10 = number;
export type Offset1 = number;
export type SampleId44 = string;
export type DatasetId39 = string;
export type Path3 = string;
export type Required = boolean;
export type Images = RegistrationMedia[];
export type Error3 = string | null;
export type Registrations = RegistrationMediaPage[];
export type SelectedDirections = FrozenAnalysisDirection[];
/**
 * 可选的明确图像事实；不要求本批每张图生成文字，方向关系和候选应自带可见依据。
 */
export type Observations9 = AnalysisSampleObservation1[];
export type Assessments9 = ExplorationAssessment[];
export type Discoveries11 = ExplorationDiscovery[];
export type DiscoverySummary6 = string;
export type Limitations42 = string[];
export type UnresolvedQuestions7 = string[];
export type SelectedEvidence4 = AnalysisEvidenceCandidate[];
export type Observations10 = AnalysisSampleObservation1[];
export type Assessments10 = KnowledgeAssessment[];
export type Discoveries12 = KnowledgeDiscovery2[];
export type DiscoverySummary7 = string;
export type Limitations43 = string[];
export type UnresolvedQuestions8 = string[];
export type SelectedEvidence5 = AnalysisEvidenceCandidate[];
export type EntryId = string;
/**
 * @minItems 1
 * @maxItems 4
 */
export type KeyEvidence2 =
  | [AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence];
/**
 * 仅提交精选发生变化或本次明确复核的条目。每条最多4张，省略保留既有精选；完整论据由arguments账本派生。
 */
export type Selections = AnalysisSelectionChange[];
/**
 * 本次提交的幂等键；仅相同内容重传复用，修改内容须更换。
 */
export type CommitKey5 = string;
/**
 * 观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。
 */
export type BaseRevision2 = number;
/**
 * 截至本次提交的整个作业摘要，不写轮次或本批新增。
 */
export type Summary7 = string;
/**
 * 整个作业仍有效的实际限制。
 */
export type Limitations44 = string[];
/**
 * 整个作业仍待核对的问题。
 */
export type UnresolvedQuestions9 = string[];
export type TargetId = string;
/**
 * @minItems 1
 */
export type SourceIds = [string, ...string[]];
export type Reason36 = string;
export type Merges = AnalysisCatalogMerge[];
export type EntryId1 = string;
/**
 * 本场已观察的完整原图ID，不接受裁图或别名。
 */
export type EvidenceId13 = string;
/**
 * support支持主张，counter是在主张适用且目标可观察时成立的反例，context提供上下文，allowed_variation说明已观察的相容变化；不适用或不确定不构成反例。
 */
export type Role14 = "support" | "counter" | "context" | "allowed_variation";
/**
 * 该图的实际观察如何支持、反驳或限定这条主张；解释或移出范围时说明原因。
 */
export type Reason37 = string;
export type State10 = "active" | "resolved" | "out_of_scope";
/**
 * 关联已保存观察；本次新观察可省略，由宿主按明确引用的原图绑定实际观察。
 */
export type ObservationId = string | null;
/**
 * 明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。
 */
export type Arguments = AnalysisArgumentEdit[];
export type EntryId2 = string;
export type EvidenceId14 = string;
export type WholeImageId = string;
/**
 * 按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。
 */
export type CitationCorrections = AnalysisCitationCorrection[];
/**
 * 当前上下文给出的轮次，不能自行推进。
 */
export type RoundId1 = number;
export type Observations11 = AnalysisSampleObservation1[];
/**
 * 改变已有主张或适用条件的原因；只改标题或精选图不需要。
 */
export type ChangeReason2 = string | null;
export type Title28 = string;
export type Instruction13 = string;
export type AppliesTo3 = "normal" | "defect" | "both";
export type Rationale3 = string;
export type Limitations45 = string[];
export type DirectionId9 = string;
/**
 * @minItems 1
 */
export type DatasetIds12 = [string, ...string[]];
/**
 * 只提交新增或正文变化的完整业务条目；未变传[]。不重复累计图像ID，论据在arguments提交增量，精选在selections独立提交。
 */
export type Directions9 = AnalysisDirectionBody[];
export type RoundId2 = number;
export type CandidateId8 = string;
export type Action3 = "new" | "merge" | "reject";
export type DirectionId10 = string | null;
export type Reason38 = string;
export type DiscoveryDecisions = ExplorationDiscoveryDecision[];
export type ReportReviews = ExplorationReportReview[];
/**
 * 仅提交精选发生变化或本次明确复核的条目。每条最多4张，省略保留既有精选；完整论据由arguments账本派生。
 */
export type Selections1 = AnalysisSelectionChange[];
/**
 * 本次提交的幂等键；仅相同内容重传复用，修改内容须更换。
 */
export type CommitKey6 = string;
/**
 * 观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。
 */
export type BaseRevision3 = number;
/**
 * 截至本次提交的整个作业摘要，不写轮次或本批新增。
 */
export type Summary8 = string;
/**
 * 整个作业仍有效的实际限制。
 */
export type Limitations46 = string[];
/**
 * 整个作业仍待核对的问题。
 */
export type UnresolvedQuestions10 = string[];
export type Merges1 = AnalysisCatalogMerge[];
/**
 * 明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。
 */
export type Arguments1 = AnalysisArgumentEdit[];
/**
 * 按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。
 */
export type CitationCorrections1 = AnalysisCitationCorrection[];
/**
 * 当前上下文给出的轮次，不能自行推进。
 */
export type RoundId3 = number;
/**
 * 本次新增或补充的实际逐图观察，可分次提交；无需重复输出已保存的观察。
 */
export type Observations12 = AnalysisSampleObservation1[];
/**
 * 改变已有主张或适用条件的原因；只改标题或精选图不需要。
 */
export type ChangeReason3 = string | null;
export type Title29 = string;
export type Subject6 = string;
export type Location11 = string;
export type Criterion6 = string;
export type AllowedVariations6 = string[];
export type Limitations47 = string[];
/**
 * supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status33 = "supported" | "provisional" | "conflicted";
export type CheckId16 = string;
/**
 * 只引用当前selected_directions中的完整ref。
 *
 * @minItems 1
 */
export type DirectionRefs3 = [string, ...string[]];
/**
 * 仅列当前条目实际有证据的子数据集。
 *
 * @minItems 1
 */
export type DatasetIds13 = [string, ...string[]];
/**
 * 只提交新增或正文变化的完整业务条目；未变传[]。论据在arguments提交增量，精选在selections独立提交。
 */
export type Checks5 = AnalysisCheckBody[];
export type RoundId4 = number;
export type CandidateId9 = string;
export type Action4 = "new" | "merge" | "reject";
export type CheckId17 = string | null;
export type Reason39 = string;
export type DiscoveryDecisions1 = KnowledgeDiscoveryDecision[];
export type ReportReviews1 = KnowledgeReportReview[];
/**
 * 仅提交精选发生变化或本次明确复核的条目。每条最多4张，省略保留既有精选；完整论据由arguments账本派生。
 */
export type Selections2 = AnalysisSelectionChange[];
/**
 * 本次提交的幂等键；仅相同内容重传复用，修改内容须更换。
 */
export type CommitKey7 = string;
/**
 * 观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。
 */
export type BaseRevision4 = number;
/**
 * 截至本次提交的整个作业摘要，不写轮次或本批新增。
 */
export type Summary9 = string;
/**
 * 整个作业仍有效的实际限制。
 */
export type Limitations48 = string[];
/**
 * 整个作业仍待核对的问题。
 */
export type UnresolvedQuestions11 = string[];
export type Merges2 = AnalysisCatalogMerge[];
/**
 * 明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。
 */
export type Arguments2 = AnalysisArgumentEdit[];
/**
 * 按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。
 */
export type CitationCorrections2 = AnalysisCitationCorrection[];
/**
 * 全部条目已复核后，最后提交作业全局摘要并设为true。
 */
export type Complete1 = boolean;
export type Directions10 = AnalysisDirectionBody[];
/**
 * 仅提交精选发生变化或本次明确复核的条目。每条最多4张，省略保留既有精选；完整论据由arguments账本派生。
 */
export type Selections3 = AnalysisSelectionChange[];
/**
 * 本次提交的幂等键；仅相同内容重传复用，修改内容须更换。
 */
export type CommitKey8 = string;
/**
 * 观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。
 */
export type BaseRevision5 = number;
/**
 * 截至本次提交的整个作业摘要，不写轮次或本批新增。
 */
export type Summary10 = string;
/**
 * 整个作业仍有效的实际限制。
 */
export type Limitations49 = string[];
/**
 * 整个作业仍待核对的问题。
 */
export type UnresolvedQuestions12 = string[];
export type Merges3 = AnalysisCatalogMerge[];
/**
 * 明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。
 */
export type Arguments3 = AnalysisArgumentEdit[];
/**
 * 按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。
 */
export type CitationCorrections3 = AnalysisCitationCorrection[];
/**
 * 全部条目已复核后，最后提交作业全局摘要并设为true。
 */
export type Complete2 = boolean;
export type Checks6 = AnalysisCheckBody[];
export type DirectionRef1 = string;
export type Reason40 = string;
export type DirectionReviews = AnalysisDirectionReview[];
export type View1 = "whole" | "annotation_rois";
export type EvidenceId15 = string;
export type View2 = "whole" | "annotation_rois";
export type SampleId45 = string;
export type DatasetId40 = string;
export type CurrentVersionId1 = string | null;
export type Versions2 = KnowledgeVersion[];
export type SampleId46 = string;
/**
 * @minItems 4
 * @maxItems 4
 */
export type Bbox8 = [number, number, number, number];
export type SampleId47 = string;
export type JobId6 = string;
export type SessionId5 = string;
export type SessionCreated1 = boolean;
export type Revision7 = number;
export type Registrations1 = AnalysisRegistration[];
export type SelectedDirections1 = FrozenAnalysisDirection[];
export type CompletedSampleIds2 = string[];
export type FailedSampleIds2 = string[];
export type DatasetId41 = string;
export type SampleId48 = string;
/**
 * 仅描述这张图实际观察的事实；局部定位使用原图坐标。
 */
export type Description37 = string;
/**
 * 实际送达且已观察的完整原图evidence_id；原图关联其原始标注及全部局部视图，不单独引用裁图或掩膜。
 */
export type EvidenceIds34 = string[];
export type Directions11 = AnalysisDirectionObservation[];
export type Limitations50 = string[];
/**
 * 仅在已有实际取证错误回执时设为true；能读取原图时仍保留可见事实。
 */
export type ReportPreparationError2 = boolean;
export type ObservationId1 = string;
export type RoundId5 = number;
export type Revision8 = number;
export type AcceptedObservations = AnalysisObservationRecord[];
export type DatasetId42 = string;
export type SampleId49 = string;
export type State11 = "completed" | "failed" | "unprocessed";
export type ObservedEvidenceIds = string[];
export type DeliveredOffsets = number[];
export type SourceError = string | null;
export type EvidenceId16 = string | null;
export type Role15 = "normal" | "overview" | "roi";
export type Source10 = "reference" | "global" | "annotation" | "model" | "coverage";
export type OriginalSize1 = number[];
export type CropBbox3 = number[];
export type SentSize1 = number[];
export type Sha2564 = string;
export type SourceSha2563 = string;
export type Representation1 = "raw" | "annotation_mask" | "annotation_overlay";
export type AnnotationIds8 = string[];
export type AnnotationSha2561 = string | null;
export type MediaType1 = "image/png";
export type RequiredMedia = VisualView[];
export type SupplementalMedia = VisualView[];
export type MediaProgress = AnalysisMediaProgress[];
export type Directions12 = number;
export type Checks7 = number;
export type Registrations2 = RegistrationMediaPage[];
export type DatasetIds14 = string[];
export type FrozenAt1 = string;
/**
 * @minItems 1
 */
export type Records = [AnalysisRegistration, ...AnalysisRegistration[]];
export type Module = "exploration" | "knowledge";
export type BatchSize = number;
export type Normal1 = number;
export type Abnormal1 = number;
/**
 * @minItems 1
 */
export type Rounds = [AnalysisRound, ...AnalysisRound[]];
export type SampleId50 = string;
export type Offset2 = number;
export type Limit1 = number | null;
export type EvidenceId17 = string;
/**
 * 本次提交的幂等键；仅相同内容重传复用，修改内容须更换。
 */
export type CommitKey9 = string;
/**
 * 观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。
 */
export type BaseRevision6 = number;
/**
 * 截至本次提交的整个作业摘要，不写轮次或本批新增。
 */
export type Summary11 = string;
/**
 * 整个作业仍有效的实际限制。
 */
export type Limitations51 = string[];
/**
 * 整个作业仍待核对的问题。
 */
export type UnresolvedQuestions13 = string[];
export type Merges4 = AnalysisCatalogMerge[];
/**
 * 明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。
 */
export type Arguments4 = AnalysisArgumentEdit[];
/**
 * 按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。
 */
export type CitationCorrections4 = AnalysisCitationCorrection[];
/**
 * 全部条目已复核后，最后提交作业全局摘要并设为true。
 */
export type Complete3 = boolean;
/**
 * 改变已有主张或适用条件的原因；只改标题或精选图不需要。
 */
export type ChangeReason4 = string | null;
/**
 * @minItems 1
 * @maxItems 4
 */
export type KeyEvidence3 =
  | [AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence];
export type Title30 = string;
export type Instruction14 = string;
export type AppliesTo4 = "normal" | "defect" | "both";
export type Rationale4 = string;
export type Limitations52 = string[];
export type DirectionId11 = string;
/**
 * @minItems 1
 */
export type DatasetIds15 = [string, ...string[]];
/**
 * @minItems 1
 */
export type EvidenceIds35 = [string, ...string[]];
export type CounterEvidenceIds7 = string[];
/**
 * JSON数组，不是包含JSON的字符串。只提交新增或修改的完整条目，未变条目由服务端保留，无目录变化时传[]。支持和反例是完整论据，遗漏不撤销；arguments说明每项作用，key_evidence另选最多4张展示原图。正文图像引用写成[工具返回的完整原图evidence_id]，不缩写，不引用裁图。
 */
export type Directions13 = FinalizedAnalysisDirection[];
/**
 * 本次提交的幂等键；仅相同内容重传复用，修改内容须更换。
 */
export type CommitKey10 = string;
/**
 * 观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。
 */
export type BaseRevision7 = number;
/**
 * 截至本次提交的整个作业摘要，不写轮次或本批新增。
 */
export type Summary12 = string;
/**
 * 整个作业仍有效的实际限制。
 */
export type Limitations53 = string[];
/**
 * 整个作业仍待核对的问题。
 */
export type UnresolvedQuestions14 = string[];
export type Merges5 = AnalysisCatalogMerge[];
/**
 * 明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。
 */
export type Arguments5 = AnalysisArgumentEdit[];
/**
 * 按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。
 */
export type CitationCorrections5 = AnalysisCitationCorrection[];
/**
 * 全部条目已复核后，最后提交作业全局摘要并设为true。
 */
export type Complete4 = boolean;
/**
 * 改变已有主张或适用条件的原因；只改标题或精选图不需要。
 */
export type ChangeReason5 = string | null;
/**
 * @minItems 1
 * @maxItems 4
 */
export type KeyEvidence4 =
  | [AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence];
export type Title31 = string;
export type Subject7 = string;
export type Location12 = string;
export type Criterion7 = string;
export type AllowedVariations7 = string[];
export type Limitations54 = string[];
/**
 * supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status34 = "supported" | "provisional" | "conflicted";
export type CheckId18 = string;
/**
 * 只引用当前selected_directions中的完整ref。
 *
 * @minItems 1
 */
export type DirectionRefs4 = [string, ...string[]];
/**
 * 仅列当前条目实际有证据的子数据集。
 *
 * @minItems 1
 */
export type DatasetIds16 = [string, ...string[]];
export type SupportEvidenceIds6 = string[];
export type CounterEvidenceIds8 = string[];
/**
 * 只提交新增或修改的完整知识条目；真实原图引用放在结构化证据和论据字段，正文不堆放ID。key_evidence从首批起维护最多4张典型原图，与完整论据分开。
 */
export type Checks8 = FinalizedAnalysisCheck[];
/**
 * 逐selected_directions.ref说明实际产出或零产出的原因；不能填新生成的知识check_id，最终提交前必须全部核对。
 */
export type DirectionReviews1 = AnalysisDirectionReview[];
export type BaseRevision8 = number | null;
export type ReviewedEntryIds = string[];
export type PendingEntryIds = string[];
export type DirectionReviews2 = AnalysisDirectionReview[];
export type Complete5 = boolean;
export type VersionId21 = string | null;
export type Phase6 = "finalize";
export type JobId7 = string;
export type SessionId6 = string;
export type Revision9 = number;
export type EntryId3 = string;
export type Title32 = string;
export type DatasetIds17 = string[];
export type DirectionRefs5 = string[];
export type PredecessorIds = string[];
export type ArgumentCount = number;
export type Issues4 = string[];
export type Entries2 = AnalysisFinalizationEntry[];
export type SelectedDirections2 = FrozenAnalysisDirection[];
export type DirectionRef2 = string;
export type Applicable = number;
export type NotApplicable = number;
export type Uncertain = number;
export type Failed5 = number;
export type EntryIds1 = string[];
export type Directions14 = AnalysisDirectionCoverage[];
export type Summary13 = string;
export type Limitations55 = string[];
export type UnresolvedQuestions15 = string[];
export type BaseRevision9 = number | null;
export type ReviewedEntryIds1 = string[];
export type PendingEntryIds1 = string[];
export type DirectionReviews3 = AnalysisDirectionReview[];
export type Complete6 = boolean;
export type VersionId22 = string | null;
export type CommitKey11 = string;
export type Revision10 = number;
export type EntryId4 = string;
export type Revision11 = number | null;
export type Offset3 = number;
export type Limit2 = number;
export type Role16 = ("support" | "counter" | "context" | "allowed_variation") | null;
export type State12 = ("active" | "resolved" | "out_of_scope") | null;
export type History = boolean;
export type JobId8 = string;
export type Revision12 = number;
export type Total11 = number;
export type Offset4 = number;
export type NextOffset = number | null;
export type JobId9 = string;
export type EntryId5 = string;
export type ClaimRevision = number;
export type Revision13 = number;
export type ObservationId2 = string;
export type EvidenceId18 = string;
export type LocatorId = string | null;
export type Role17 = "support" | "counter" | "context" | "allowed_variation";
export type State13 = "active" | "resolved" | "out_of_scope";
export type Reason41 = string | null;
export type OriginEntryId = string;
export type Items9 = AnalysisArgumentRecord[];
export type EntryId6 = string;
export type Revision14 = number | null;
export type Offset5 = number;
export type Limit3 = number;
export type JobId10 = string;
export type EntryId7 = string;
export type Revision15 = number;
export type Total12 = number;
export type Offset6 = number;
export type NextOffset1 = number | null;
export type ClaimRevision1 = number;
export type Revision16 = number;
export type Reason42 = string | null;
export type Content = ProposedAnalysisDirection | ProposedAnalysisCheck | AnalysisDirectionBody1 | AnalysisCheckBody1;
/**
 * 改变已有主张或适用条件的原因；只改标题或精选图不需要。
 */
export type ChangeReason6 = string | null;
/**
 * 当前条目有序精选原图，合计最多4张。role须与该图的一项有效论据完全相同，可为support、counter、context或allowed_variation。省略保留既有选择；不影响完整论据和强度。
 */
export type KeyEvidence5 =
  | []
  | [AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence]
  | null;
export type Title33 = string;
export type Instruction15 = string;
export type AppliesTo5 = "normal" | "defect" | "both";
export type Rationale5 = string;
export type Limitations56 = string[];
export type DirectionId12 = string;
/**
 * @minItems 1
 */
export type DatasetIds18 = [string, ...string[]];
/**
 * @minItems 1
 */
export type EvidenceIds36 = [string, ...string[]];
export type CounterEvidenceIds9 = string[];
/**
 * 改变已有主张或适用条件的原因；只改标题或精选图不需要。
 */
export type ChangeReason7 = string | null;
/**
 * 当前条目有序精选原图，合计最多4张。role须与该图的一项有效论据完全相同，可为support、counter、context或allowed_variation。省略保留既有选择；不影响完整论据和强度。
 */
export type KeyEvidence6 =
  | []
  | [AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence]
  | null;
export type Title34 = string;
export type Subject8 = string;
export type Location13 = string;
export type Criterion8 = string;
export type AllowedVariations8 = string[];
export type Limitations57 = string[];
/**
 * supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status35 = "supported" | "provisional" | "conflicted";
export type CheckId19 = string;
/**
 * 只引用当前selected_directions中的完整ref。
 *
 * @minItems 1
 */
export type DirectionRefs6 = [string, ...string[]];
/**
 * 仅列当前条目实际有证据的子数据集。
 *
 * @minItems 1
 */
export type DatasetIds19 = [string, ...string[]];
export type SupportEvidenceIds7 = string[];
export type CounterEvidenceIds10 = string[];
/**
 * 改变已有主张或适用条件的原因；只改标题或精选图不需要。
 */
export type ChangeReason8 = string | null;
export type Title35 = string;
export type Instruction16 = string;
export type AppliesTo6 = "normal" | "defect" | "both";
export type Rationale6 = string;
export type Limitations58 = string[];
export type DirectionId13 = string;
/**
 * @minItems 1
 */
export type DatasetIds20 = [string, ...string[]];
/**
 * 改变已有主张或适用条件的原因；只改标题或精选图不需要。
 */
export type ChangeReason9 = string | null;
export type Title36 = string;
export type Subject9 = string;
export type Location14 = string;
export type Criterion9 = string;
export type AllowedVariations9 = string[];
export type Limitations59 = string[];
/**
 * supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status36 = "supported" | "provisional" | "conflicted";
export type CheckId20 = string;
/**
 * 只引用当前selected_directions中的完整ref。
 *
 * @minItems 1
 */
export type DirectionRefs7 = [string, ...string[]];
/**
 * 仅列当前条目实际有证据的子数据集。
 *
 * @minItems 1
 */
export type DatasetIds21 = [string, ...string[]];
export type Items10 = AnalysisClaimRevision[];
export type AnalysisAgentStart = ExplorationAgentStart | KnowledgeAgentStart;
export type SubmissionId7 = string;
/**
 * @minItems 1
 */
export type DatasetIds22 = [string, ...string[]];
export type AnalysisKind2 = "exploration";
export type NormalImages3 = string[];
export type DefectImages2 = string[];
export type SystemPrompt3 = string | null;
export type SubmissionId8 = string;
/**
 * @minItems 1
 */
export type DatasetIds23 = [string, ...string[]];
export type AnalysisKind3 = "knowledge";
export type SystemPrompt4 = string | null;
export type SubmissionId9 = string;
/**
 * @minItems 1
 */
export type DatasetIds24 = [string, ...string[]];
export type AnalysisKind4 = "exploration";
export type NormalImages4 = string[];
export type DefectImages3 = string[];
export type SystemPrompt5 = string | null;
export type SubmissionId10 = string;
/**
 * @minItems 1
 */
export type DatasetIds25 = [string, ...string[]];
export type AnalysisKind5 = "knowledge";
export type Objective4 = string;
export type DirectionId14 = string;
export type Title37 = string;
export type Instruction17 = string;
export type Enabled2 = boolean;
export type Origin4 = "preset" | "dataset" | "explored";
export type Source11 = (PresetDirectionSource1 | ExploredDirectionSource1) | null;
export type Origin5 = "preset";
export type CatalogId1 = string;
export type DirectionId15 = string;
export type Revision17 = string;
export type Origin6 = "explored";
export type RunId15 = string;
export type VersionId23 = string;
export type DirectionId16 = string;
export type Directions15 = MiningDirection1[];
export type Instruction18 = string;
export type SystemPrompt6 = string | null;
export type Module1 = "exploration" | "knowledge";
export type SettingsRevision = number;
export type Settings = ExplorationSettingsValues | KnowledgeSettingsValues;
export type ProviderId7 = string;
export type ModelId6 = string;
export type ReasoningEffort3 = ("low" | "medium" | "high" | "xhigh") | null;
export type BatchSize1 = number;
export type WholeImageMaxSide = number | null;
export type ContextTokens6 = number | null;
export type MaxOutputTokens6 = number | null;
export type GenerationTimeoutSeconds4 = number | null;
export type Concurrency = number;
export type ReasoningEffort4 = ("low" | "medium" | "high" | "xhigh") | null;
export type BatchSize2 = number;
export type WholeImageMaxSide1 = number | null;
export type Concurrency1 = number;
/**
 * @minItems 1
 */
export type DatasetIds26 = [string, ...string[]];
export type Section1 = "directions" | "checks";
export type Ids = string[];
export type Offset7 = number;
export type Limit4 = number;
export type JobId11 = string;
export type Revision18 = number;
export type Section2 = "directions" | "checks";
export type Total13 = number;
export type Offset8 = number;
export type NextOffset2 = number | null;
export type Items11 = (AnalysisDirection | AnalysisKnowledgeCheck)[];
export type Module2 = "exploration" | "knowledge";
export type SettingsRevision1 = number;
export type Settings1 = ExplorationSettingsValues | KnowledgeSettingsValues;
export type SchemaVersion3 = 1 | 2;
export type InputModalities2 = string[];
export type NativeProfile = {
  [k: string]: unknown;
} | null;
export type Error4 = string | null;
export type Instruction19 = string;
export type SystemPrompt7 = string | null;
export type FinalizationInstruction = string | null;
export type Initial = string;
export type Observe = string;
export type Review = string;
export type Finalize = string;
export type SelectedDirections3 = FrozenAnalysisDirection[];
export type InputOrganization = "registration-tools" | "exploration-batch-v2" | "batch-materials-v1";
export type ExplorationReviewPolicy = "comparative-v1" | null;
export type ExecutionMode = "serial" | "dsh-subagents";
export type ContextPolicy1 = "legacy" | "evidence-on-demand-v1";
export type ContextInstruction = string | null;
export type JobId12 = string;
export type SessionId7 = string;
export type SessionCreated2 = boolean;
export type Revision19 = number;
export type JobId13 = string;
export type SubmittedAt7 = string;
export type Module3 = "exploration" | "knowledge";
export type RoundId6 = number | null;
/**
 * 本次提交的幂等键；仅相同内容重传复用，修改内容须更换。
 */
export type CommitKey12 = string;
/**
 * 观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。
 */
export type BaseRevision10 = number;
/**
 * 截至本次提交的整个作业摘要，不写轮次或本批新增。
 */
export type Summary14 = string;
/**
 * 整个作业仍有效的实际限制。
 */
export type Limitations60 = string[];
/**
 * 整个作业仍待核对的问题。
 */
export type UnresolvedQuestions16 = string[];
export type Merges6 = AnalysisCatalogMerge[];
/**
 * 明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。
 */
export type Arguments6 = AnalysisArgumentEdit[];
/**
 * 按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。
 */
export type CitationCorrections6 = AnalysisCitationCorrection[];
/**
 * 当前上下文给出的轮次，不能自行推进。
 */
export type RoundId7 = number;
/**
 * 仅在需要时补充有明确图像引用的实际事实，不要求逐图填写；技术覆盖由整批媒体送达和正式提交核验。
 */
export type Observations13 = AnalysisSampleObservation1[];
/**
 * 改变已有主张或适用条件的原因；只改标题或精选图不需要。
 */
export type ChangeReason10 = string | null;
/**
 * 当前条目有序精选原图，合计最多4张。role须与该图的一项有效论据完全相同，可为support、counter、context或allowed_variation。省略保留既有选择；不影响完整论据和强度。
 */
export type KeyEvidence7 =
  | []
  | [AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence]
  | null;
export type Title38 = string;
export type Instruction20 = string;
export type AppliesTo7 = "normal" | "defect" | "both";
export type Rationale7 = string;
export type Limitations61 = string[];
export type DirectionId17 = string;
/**
 * @minItems 1
 */
export type DatasetIds27 = [string, ...string[]];
/**
 * @minItems 1
 */
export type EvidenceIds37 = [string, ...string[]];
export type CounterEvidenceIds11 = string[];
/**
 * JSON数组，不是包含JSON的字符串。只提交新增或修改的完整条目，未变条目由服务端保留，无目录变化时传[]。支持和反例是完整论据，遗漏不撤销；arguments说明每项作用，key_evidence另选最多4张展示原图。正文图像引用写成[工具返回的完整原图evidence_id]，不缩写，不引用裁图。
 */
export type Directions16 = ProposedAnalysisDirection1[];
/**
 * 主Agent一次复核当前波全部报告，按各报告round.round_id填写。每份报告的discovery_decisions逐项处理全部候选：new新建、merge兼容归并、reject说明实际依据；无候选时填空数组。
 */
export type ReportReviews2 = ExplorationReportReview[];
/**
 * 本次提交的幂等键；仅相同内容重传复用，修改内容须更换。
 */
export type CommitKey13 = string;
/**
 * 观察阶段取最新上下文或提交回执的revision；定稿阶段始终取定稿上下文锁定的base_revision。
 */
export type BaseRevision11 = number;
/**
 * 截至本次提交的整个作业摘要，不写轮次或本批新增。
 */
export type Summary15 = string;
/**
 * 整个作业仍有效的实际限制。
 */
export type Limitations62 = string[];
/**
 * 整个作业仍待核对的问题。
 */
export type UnresolvedQuestions17 = string[];
export type Merges7 = AnalysisCatalogMerge[];
/**
 * 明确关联条目主张与本场实际观察；新增、解释或移出适用范围都附理由。未提交的历史关系继续保留。
 */
export type Arguments7 = AnalysisArgumentEdit[];
/**
 * 按校验回执显式纠正目录引用，只填条目ID、旧证据ID和同来源完整原图ID；同步更新该条目支持、反例及正文，不重写未变的条目内容。
 */
export type CitationCorrections7 = AnalysisCitationCorrection[];
/**
 * 当前上下文给出的轮次，不能自行推进。
 */
export type RoundId8 = number;
/**
 * 本次新增或补充的实际逐图观察，可分次提交；无需重复输出已保存的观察。
 */
export type Observations14 = AnalysisSampleObservation1[];
/**
 * 改变已有主张或适用条件的原因；只改标题或精选图不需要。
 */
export type ChangeReason11 = string | null;
/**
 * 当前条目有序精选原图，合计最多4张。role须与该图的一项有效论据完全相同，可为support、counter、context或allowed_variation。省略保留既有选择；不影响完整论据和强度。
 */
export type KeyEvidence8 =
  | []
  | [AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence]
  | [AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence, AnalysisKeyEvidence]
  | null;
export type Title39 = string;
export type Subject10 = string;
export type Location15 = string;
export type Criterion10 = string;
export type AllowedVariations10 = string[];
export type Limitations63 = string[];
/**
 * supported：当前版本完整有效证据支持该条件性可观察判据；provisional：单例或待验证假设；conflicted：证据存在未消解矛盾。不可观察的尺寸/材质写入limitations，不否定已有的可见外观证据；supported不是工业真值
 */
export type Status37 = "supported" | "provisional" | "conflicted";
export type CheckId21 = string;
/**
 * 只引用当前selected_directions中的完整ref。
 *
 * @minItems 1
 */
export type DirectionRefs8 = [string, ...string[]];
/**
 * 仅列当前条目实际有证据的子数据集。
 *
 * @minItems 1
 */
export type DatasetIds28 = [string, ...string[]];
export type SupportEvidenceIds8 = string[];
export type CounterEvidenceIds12 = string[];
/**
 * 只提交新增或修改的完整知识条目；真实原图引用放在结构化证据和论据字段，正文不堆放ID。key_evidence从首批起维护最多4张典型原图，与完整论据分开。
 */
export type Checks9 = ProposedAnalysisCheck1[];
/**
 * 一次复核当前波全部报告，discovery_decisions逐项处理全部候选，目标使用check_id。
 */
export type ReportReviews3 = KnowledgeReportReview[];
export type CommitKey14 = string;
export type Revision20 = number;
export type RoundId9 = number;
export type ObservationIds1 = string[];
export type CompletedDelta = number;
export type FailedDelta = number;
export type RoundComplete = boolean;
export type VersionId24 = string;
export type JobId14 = string;
export type Module4 = "exploration" | "knowledge";
export type Revision21 = number;
export type ExecutionStatus7 = string;
export type CreatedAt6 = string;
export type Total14 = number;
export type Completed4 = number;
export type Failed6 = number;
export type Unprocessed3 = number;
export type PreparedVisuals1 = number;
export type ObservedVisuals1 = number;
export type WholeImagesObserved1 = number;
export type DatasetId43 = string;
export type SampleId51 = string;
export type State14 = "completed" | "failed" | "unprocessed";
export type ObservedEvidenceIds1 = string[];
export type DeliveredOffsets1 = number[];
export type SourceError1 = string | null;
export type RequiredMedia1 = VisualEvidence[];
export type SupplementalMedia1 = VisualEvidence[];
export type Records1 = AnalysisRecordCoverage[];
export type BaseRevision12 = number | null;
export type ReviewedEntryIds2 = string[];
export type PendingEntryIds2 = string[];
export type DirectionReviews4 = AnalysisDirectionReview[];
export type Complete7 = boolean;
export type VersionId25 = string | null;
export type ModelCallIds = string[] | null;
export type SessionId8 = string | null;
export type ParentVersionId4 = string | null;
export type RoundId10 = number;
export type WaveId2 = number;
export type SessionId9 = string;
export type CatalogRevision1 = number;
export type Report1 = ExplorationBatchReport | ExplorationEvidenceReport | null;
export type ReviewRevision1 = number | null;
export type CandidateId10 = string;
export type Action5 = "new" | "merge" | "reject";
export type DirectionId18 = string | null;
export type Reason43 = string;
export type DiscoveryDecisions2 = ExplorationDiscoveryDecision1[];
export type RoundId11 = number;
export type WaveId3 = number;
export type SessionId10 = string;
export type CatalogRevision2 = number;
export type Report2 = KnowledgeBatchReport | KnowledgeEvidenceReport | null;
export type ReviewRevision2 = number | null;
export type CandidateId11 = string;
export type Action6 = "new" | "merge" | "reject";
export type CheckId22 = string | null;
export type Reason44 = string;
export type DiscoveryDecisions3 = KnowledgeDiscoveryDecision1[];
export type Delegations = (ExplorationBatchArchive | KnowledgeBatchArchive)[];
export type JobId15 = string;
export type Module5 = "exploration" | "knowledge";
export type Revision22 = number;
export type SessionId11 = string | null;
export type EvidenceId19 = string;
export type SampleId52 = string;
export type DatasetId44 = string;
export type Filename1 = string;
export type CandidateRole1 = ("normal" | "defect") | null;
export type SamplingGroup1 = "normal" | "abnormal" | "unclassified";
export type Observed1 = boolean;
export type Evidence6 = AnalysisEvidenceView[];
export type SelectedDirections4 = FrozenAnalysisDirection[];
export type RemovedDirectionIds2 = string[];
export type JobId16 = string;
export type Module6 = "exploration" | "knowledge";
export type Revision23 = number;
export type SessionId12 = string | null;
export type Evidence7 = AnalysisEvidenceView[];
export type SelectedDirections5 = FrozenAnalysisDirection[];
export type RemovedDirectionIds3 = string[];
export type VersionId26 = string;
export type ExecutionStatus8 = string;
export type CreatedAt7 = string;
export type ModelCallIds1 = string[] | null;
export type ParentVersionId5 = string | null;
export type Delegations1 = (ExplorationBatchArchive | KnowledgeBatchArchive)[];
export type VersionId27 = string | null;
export type Module7 = "exploration" | "knowledge";
export type Items12 = AnalysisEvidenceView[];
export type EntryId8 = string | null;
export type EvidenceRole1 = ("support" | "counter" | "context" | "allowed_variation") | null;
export type SampleId53 = string | null;
export type DirectionRef3 = string | null;
export type RoundId12 = number | null;
export type Page14 = number;
export type PageSize14 = number;
export type VersionId28 = string;
export type SelectedDirections6 = FrozenAnalysisDirection[];
export type Total15 = number;
export type Page15 = number;
export type PageSize15 = number;
export type Items13 = AnalysisObservationRecord[];
export type JobId17 = string;
export type Revision24 = number;
export type Total16 = number;
export type Page16 = number;
export type PageSize16 = number;
export type Items14 = AnalysisObservationRecord[];
export type JobId18 = string;
export type Module8 = "exploration" | "knowledge";
export type Revision25 = number;
export type SessionId13 = string | null;
export type Evidence8 = AnalysisEvidenceView[];
export type SelectedDirections7 = FrozenAnalysisDirection[];
export type RemovedDirectionIds4 = string[];
export type Checks10 = KnowledgeCheckSummary[];
export type Support = KnowledgeEvidence[];
export type Counter = KnowledgeEvidence[];
export type DirectionId19 = string;
export type Title40 = string;
export type Instruction21 = string;
export type Enabled3 = boolean;
export type Origin7 = "preset" | "dataset" | "explored";
export type Source12 = (PresetDirectionSource | ExploredDirectionSource) | null;
export type Summary16 = string;
export type Limitations64 = string[];
export type Directions17 = PublishedDirectionChoice[];
export type SampleId54 = string;
export type DatasetId45 = string;
export type RelativePath6 = string;
export type CandidateRole2 = ("normal" | "defect") | null;
export type AnnotationCategories = string[];
export type Items15 = AnalysisSource[];
export type ClientRequestId = string;
export type EvidenceId20 = string;
export type ResultId4 = string;
/**
 * @minItems 1
 * @maxItems 100
 */
export type DifferenceIds = [string, ...string[]];
export type Reviewer5 = string;
export type Comment3 = string;
export type Action7 =
  | ConfirmDifference
  | ExpectedPolicyDifference
  | RejectDifference
  | NeedsContext
  | SetEffectiveQuality
  | ProposeRegionChange;
export type Kind30 = "CONFIRM_DIFFERENCE";
export type Kind31 = "EXPECTED_POLICY_DIFFERENCE";
export type Kind32 = "REJECT_DIFFERENCE";
export type Kind33 = "NEEDS_CONTEXT";
export type Kind34 = "SET_EFFECTIVE_QUALITY";
/**
 * @minItems 1
 * @maxItems 2
 */
export type Targets1 = [QualityTarget] | [QualityTarget, QualityTarget];
export type SampleId55 = string;
export type Quality = "PASS" | "FAIL" | "HARD_NORMAL" | "UNCERTAIN";
export type Kind35 = "PROPOSE_REGION_CHANGE";
/**
 * @minItems 1
 * @maxItems 100
 */
export type Changes = [
  AddRegion | RemoveRegion | RelabelRegion | ReshapeRegion,
  ...(AddRegion | RemoveRegion | RelabelRegion | ReshapeRegion)[]
];
export type Operation2 = "add";
export type SampleId56 = string;
export type Category1 = string;
export type Geometry = BoxProposal | PolygonProposal;
export type Kind36 = "bbox";
/**
 * @minItems 4
 * @maxItems 4
 */
export type Coordinates = [unknown, unknown, unknown, unknown];
export type Kind37 = "polygon";
/**
 * @minItems 3
 * @maxItems 10000
 */
export type Points2 = [[unknown, unknown], [unknown, unknown], [unknown, unknown], ...[unknown, unknown][]];
export type Operation3 = "remove";
export type SampleId57 = string;
export type AnnotationId5 = string;
export type Operation4 = "relabel";
export type SampleId58 = string;
export type AnnotationId6 = string;
export type Category2 = string;
export type Operation5 = "reshape";
export type SampleId59 = string;
export type AnnotationId7 = string;
export type Geometry1 = BoxProposal | PolygonProposal;
export type EvidenceId21 = string;
export type ResultId5 = string;
export type Left1 = "CURRENT" | "CHANGED" | "MISSING" | "UNKNOWN";
export type Right1 = "CURRENT" | "CHANGED" | "MISSING" | "UNKNOWN";
export type DifferenceId2 = string;
export type ReviewState = "OPEN" | "NEEDS_CONTEXT" | "RESOLVED";
export type CorrectionState = "NOT_REQUIRED" | "PROPOSED" | "AWAITING_RESCAN" | "VERIFIED";
export type DecisionId2 = string | null;
export type CorrectionDecisionId = string | null;
export type Differences1 = DifferenceReview[];
export type DecisionId3 = string;
export type ReviewDecisionIds = string[];
export type SubmittedAt8 = string;
export type Decisions = ConsistencyDecision[];
export type ReviewEvents = ReviewDecisionRecord[];
export type CheckId23 = string;
export type ClientRequestId1 = string;
export type DecisionId4 = string;
export type EvidenceId22 = string;
export type Reviewer6 = string;
export type CorrectionState1 = "AWAITING_RESCAN" | "VERIFIED";
export type Reason45 = string;
export type CheckedAt1 = string;
export type Corrections1 = CorrectionCheck[];
export type ClientRequestId2 = string;
export type ResultFingerprint = string;
export type Reviewer7 = string;
export type Comment4 = string;
export type Action8 = ConfirmDifference | RejectDifference | NeedsContext;
export type JobId19 = string;
export type AnchorId = string;
export type ResultFingerprint1 = string;
export type CandidateId12 = string;
export type AssessmentId1 = number;
export type EvidenceId23 = string;
export type ResultId6 = string;
export type DifferenceIds1 = string[];
export type References3 = GroupReviewReference[];
export type Disposition = "pending" | "confirmed" | "rejected";
export type DecisionId5 = string;
export type JobId20 = string;
export type AnchorId1 = string;
export type References4 = GroupReviewReference[];
export type SubmittedAt9 = string;
export type Decisions1 = GroupReviewDecision[];
export type JobId21 = string;
export type AnchorId2 = string;
export type SampleId60 = string;
export type ContentGroupId2 = string;
export type Kind38 = "exact" | "similar";
export type Rank2 = number;
export type Score2 = number | null;
export type EvidenceId24 = string;
export type Side = "left" | "right";
export type Available = boolean;
export type Items16 = AnchorCandidatePreview[];
export type JobId22 = string;
export type Total17 = number;
export type TaskType3 = ("anomaly_detection" | "bbox_defect") | null;
export type CandidateRecordIds3 = number[];
export type ExecutionStatus9 = ("completed" | "partial" | "failed") | null;
export type Result4 = ("passed" | "discrepancy" | "needs_review" | "incomplete") | null;
export type PassReason3 =
  ("no_retrieved_candidate" | "no_eligible_candidate" | "no_valid_candidate" | "all_eligible_consistent") | null;
export type CandidateGateIds3 = string[];
export type Issues5 = MainAnnotationIssue[];
export type DatasetFormat4 = ("labelme" | "folder_classification") | null;
export type SchemaVersion4 = 1;
export type JobId23 = string;
export type AnchorId3 = string;
export type SessionId14 = string;
export type State15 = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type Phase7 = string;
export type Attempt2 = number;
export type Mode4 = "exact" | "combined";
export type MinSimilarity3 = number | null;
export type MaxExactCandidates = number;
export type MaxSimilarCandidates = number | null;
export type SelectedExact = number | null;
export type SelectedSimilar = number | null;
export type Verdict4 = ("EQUIVALENT" | "MATERIAL" | "UNCERTAIN") | null;
export type Reason46 = string;
export type Categories4 = ConflictCategory[];
export type Conclusion9 = string | null;
export type OriginalCategories = ConflictCategory[];
export type ProgramConclusion1 = string;
export type ModelConclusion1 = ConflictCategory | "无冲突" | null;
export type ResultRef = string;
export type ReviewState1 = "pending" | "confirmed" | "rejected";
export type Items17 = AnchorImageItem[];
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
export type SourceSha2564 = string;
export type ScanRef2 = string | null;
export type ContentGroupId3 = string | null;
export type Sha2565 = string;
export type ByteCount = number;
export type Issues6 = string[];
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
export type Side1 = "left" | "right";
export type Representation2 = "original" | "preview" | "annotation_overlay" | "annotation_mask" | "reference_overlay";
/**
 * @minItems 4
 * @maxItems 4
 */
export type Bbox9 = [unknown, unknown, unknown, unknown];
export type DifferenceId3 = string | null;
export type ReferenceFromOther1 = ("left" | "right") | null;
export type AnnotationId8 = string | null;
export type Normalization = "RAW" | "UINT8_DISPLAY" | "UINT16_FULL_RANGE_DISPLAY";
export type Available1 = boolean;
export type Reason47 = string | null;
export type Media = EvidenceMedia[];
export type Categories5 = ConflictCategory[];
export type Summary17 = string;
export type GeometryCompared = boolean;
export type Conclusion10 = string;
export type EvidenceId25 = string;
export type EvidenceId26 = string;
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
export type Path4 = string;
export type Summary18 = string | null;
export type EvidenceId27 = string;
export type ResultId7 = string;
/**
 * @maxItems 100
 */
export type DifferenceIds2 = string[];
export type Pageid = "industrial-consistency";
export type Tab = ("conflicts" | "search" | "groups" | "jobs") | null;
export type Scope5 = (AllRegisteredScope | DatasetScope) | null;
export type Parentid = string | null;
export type Datasetids = string[] | null;
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
export type Modelfilter =
  ("all" | "NOT_ANALYZED" | "RUNNING" | "FAILED" | "EQUIVALENT" | "MATERIAL" | "UNCERTAIN") | null;
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
export type EvidenceId28 = string;
export type ResultId8 = string;
export type AnnotationCount2 = number;
export type Issues7 = string[];
export type Differences2 = AnnotationDifference[];
export type TotalDifferences = number;
export type RequestedDifferences = number;
export type UnselectedDifferences = number;
export type RemainingDifferences = number;
export type NextCursor1 = string | null;
export type Sides = ("left" | "right")[];
export type ByteCount1 = number;
export type Sha2566 = string;
export type Media1 = ContextMedia[];
export type Pageid1 = "industrial-consistency";
export type Tab1 = ("conflicts" | "search" | "groups" | "jobs") | null;
export type Scope6 = (AllRegisteredScope1 | DatasetScope1) | null;
export type Parentid1 = string | null;
export type Datasetids1 = string[] | null;
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
export type Modelfilter1 =
  ("all" | "NOT_ANALYZED" | "RUNNING" | "FAILED" | "EQUIVALENT" | "MATERIAL" | "UNCERTAIN") | null;
export type Gallerypage1 = number | null;
export type Detailtab1 = ("summary" | "evidence" | "review") | null;
export type Subjectid1 = string | null;
export type Reviewfilter1 = ("OPEN" | "NEEDS_CONTEXT" | "RESOLVED") | null;
export type Grouppage1 = number | null;
export type Memberpage1 = number | null;
export type NormalizationNote = string;
export type BatchId2 = string;
export type RootBatchId = string;
export type ParentBatchId = string | null;
export type Kind39 = "index" | "consistency";
export type Status38 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type CancelRequested2 = boolean;
export type Code1 =
  | "INVALID_SCOPE"
  | "SOURCE_UNAVAILABLE"
  | "UNSUPPORTED_IMAGE"
  | "INDEX_NOT_READY"
  | "PROFILE_NOT_CONFIGURED"
  | "ENCODER_UNAVAILABLE"
  | "ANNOTATION_UNREADABLE"
  | "RESOURCE_LIMIT"
  | "REFERENCE_NOT_FOUND"
  | "GATE_REVIEW_REQUIRED";
export type Message4 = string;
export type Total18 = number;
export type Completed5 = number;
export type Failed7 = number;
export type Unprocessed4 = number;
export type PairCount = number;
export type CreatedAt8 = string;
export type ConflictCount2 = number | null;
export type DurationSeconds = number | null;
export type Children = JobSnapshot[];
export type BatchId3 = string;
export type BatchId4 = string;
export type RequestId4 = string;
export type SampleIds6 = [string, ...string[]] | null;
export type BatchId5 = string;
export type RootBatchId1 = string;
export type ParentBatchId1 = string | null;
export type Kind40 = "index" | "consistency";
export type ScopeId3 = string;
export type DatasetIds29 = string[];
export type FrozenAt2 = string;
export type SampleCount2 = number;
export type Status39 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type CancelRequested3 = boolean;
export type Total19 = number;
export type Completed6 = number;
export type Failed8 = number;
export type Unprocessed5 = number;
export type PairCount1 = number;
export type CreatedAt9 = string;
export type ConflictCount3 = number | null;
export type DurationSeconds1 = number | null;
export type RunId16 = string;
export type DatasetId46 = string;
export type JobType2 =
  | "ANALYSIS_WORKFLOW"
  | "MODEL_AUDIT"
  | "MODEL_AUDIT_SAMPLE"
  | "KNOWLEDGE"
  | "NORMAL_KNOWLEDGE"
  | "DEFECT_KNOWLEDGE"
  | "KNOWLEDGE_BATCH"
  | "DIRECTION_EXPLORATION"
  | "EXPLORATION_BATCH"
  | "IMAGE_INDEX"
  | "DATA_CONSISTENCY"
  | "CONSISTENCY_ANALYSIS"
  | "CONSISTENCY_MODEL_BATCH";
export type Status40 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type Phase8 = string | null;
export type Completed7 = number;
export type Failed9 = number;
export type Unprocessed6 = number;
export type Errors3 = JobFailure[];
export type Children1 = ConsistencyChildSummary[];
export type Items18 = ConsistencyBatchSummary[];
export type StartResultResponse = Started | NoWork;
export type Kind41 = "started";
export type BatchId6 = string;
export type Status41 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type Kind42 = "no_work";
export type Reason48 = string;
export type Selection1 = BatchSelection | ScopeSelection;
export type Kind43 = "batch";
export type BatchId7 = string;
export type Kind44 = "scope";
export type Subjects2 = AllRegisteredScope | DatasetScope | SampleScope | FilteredScope;
export type CorpusScope3 = AllRegisteredScope | DatasetScope;
export type Facts3 = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type Mode5 = "exact" | "visual" | "combined";
export type ProfileId8 = string | null;
export type MinSimilarity4 = number;
export type AnnotationDifferencesOnly = boolean;
export type Relation4 = ("EXACT" | "NEAR_CANDIDATE" | "VISUAL_REFERENCE" | "DIFFERENT" | "UNCHECKED") | null;
export type ConfirmedConflict2 = boolean | null;
export type DifferenceType =
  | (
      | "QUALITY_LABEL"
      | "CATEGORY"
      | "ANNOTATION_COUNT"
      | "ONE_SIDED_REGION"
      | "GEOMETRY"
      | "SPLIT_MERGE"
      | "AMBIGUOUS_MATCH"
      | "POLICY_UNCONFIRMED"
      | "ANNOTATION_UNREADABLE"
    )
  | null;
export type ReviewState2 = ("OPEN" | "NEEDS_CONTEXT" | "RESOLVED") | null;
export type CorrectionState2 = ("NOT_REQUIRED" | "PROPOSED" | "AWAITING_RESCAN" | "VERIFIED") | null;
export type Cursor2 = string | null;
export type PageSize17 = number;
export type QueryId = string;
export type ObservedAt = string;
export type Current = number;
export type Historical = number;
export type Unknown = number;
export type Total20 = number;
export type Mode6 = ("exact" | "visual" | "combined") | null;
export type ProfileId9 = string | null;
export type MinSimilarity5 = number | null;
export type RetrievalCompleteness1 = "EXACT_SCOPE" | "TOP_K" | "SIMILARITY_THRESHOLD" | "PARTIAL" | "INDEX_ONLY";
export type SampleA2 = string;
export type SampleB2 = string;
export type CheckedAt3 = string;
export type FactsState = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type EvidenceAvailable = boolean;
export type Items19 = ResultSummary[];
export type NextCursor2 = string | null;
export type Pairs = number;
export type StrictGroups = number;
export type StrictMembers = number;
export type ConfirmedQualityConflicts = number;
export type RegionalDifferences = number;
export type PolicyUnknown = number;
export type Differences3 = number;
export type InvalidAnnotationPairs = number;
export type UnavailableEvidencePairs = number;
export type PendingReview1 = number;
export type PendingCorrection = number;
export type PendingReview2 = number;
export type PendingCorrection1 = number;
export type Total21 = number;
export type Confirmed = number | null;
export type Conflicts6 = number | null;
export type Excluded = number | null;
export type PolicyNames = string[];
export type UnavailableReason = string | null;
export type GoldExcluded = number | null;
export type QueryId1 = string;
export type Page17 = number;
export type PageSize18 = number;
export type QueryId2 = string;
export type Page18 = number;
export type PageSize19 = number;
export type GroupId13 = string;
export type FactsState1 = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type QueryId3 = string;
export type GroupId14 = string;
export type FactsState2 = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type MemberCount3 = number;
export type DatasetCount = number;
export type PairCount2 = number;
export type Items20 = StrictGroup[];
export type Total22 = number;
export type QueryId4 = string;
export type GroupId15 = string;
export type FactsState3 = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type SampleId61 = string;
export type DatasetId47 = string;
export type RelativePath7 = string;
export type EvidenceId29 = string;
export type Items21 = GroupMember[];
export type Total23 = number;
export type QueryId5 = string;
export type Kind45 = "conflicts" | "groups";
export type GroupId16 = string;
export type FactsState4 = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type QueryId6 = string;
export type Kind46 = "conflicts" | "groups";
export type Page19 = number;
export type PageSize20 = number;
export type Search6 = string;
export type Order = "recent" | "members";
export type DifferenceFilter = "all" | "category" | "geometry" | "presence" | "instances" | "multiple";
export type ModelFilter = "all" | "NOT_ANALYZED" | "RUNNING" | "FAILED" | "EQUIVALENT" | "MATERIAL" | "UNCERTAIN";
export type QueryId7 = string;
export type Kind47 = "conflicts" | "groups";
export type GroupId17 = string;
export type FactsState5 = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type Page20 = number;
export type PageSize21 = number;
export type QueryId8 = string;
export type Kind48 = "conflicts" | "groups";
export type Value = "all" | "category" | "geometry" | "presence" | "instances" | "multiple";
export type Label3 = string;
export type Count = number;
export type Filters = GalleryFilterCount[];
export type Value1 = "all" | "NOT_ANALYZED" | "RUNNING" | "FAILED" | "EQUIVALENT" | "MATERIAL" | "UNCERTAIN";
export type Label4 = string;
export type Count1 = number;
export type ModelFilters = GalleryModelFilterCount[];
export type GroupId18 = string;
export type FactsState6 = "CURRENT" | "HISTORICAL" | "UNKNOWN";
export type MemberCount4 = number;
export type CandidateCount = number;
export type DatasetCount1 = number;
export type PairCount3 = number;
export type DifferenceTypes = (
  | "QUALITY_LABEL"
  | "CATEGORY"
  | "ANNOTATION_COUNT"
  | "ONE_SIDED_REGION"
  | "GEOMETRY"
  | "SPLIT_MERGE"
  | "AMBIGUOUS_MATCH"
  | "POLICY_UNCONFIRMED"
  | "ANNOTATION_UNREADABLE"
)[];
export type ConflictCategories = ConflictCategory[];
export type ModelCategories = ConflictCategory[];
export type ConfirmedConflict3 = boolean;
export type ModelState = "NOT_ANALYZED" | "RUNNING" | "FAILED" | "EQUIVALENT" | "MATERIAL" | "UNCERTAIN";
export type ModelConclusion2 = string | null;
export type AnnotationConclusion = string;
export type ReviewState3 = "pending" | "confirmed" | "rejected";
export type Items22 = GalleryItem[];
export type Total24 = number;
export type QueryId9 = string;
export type GroupId19 = string;
export type EvidenceId30 = string;
export type ResultId9 = string;
export type AnchorSide = "left" | "right";
export type Items23 = GalleryMember[];
export type Total25 = number;
export type GroupId20 = string;
export type Status42 =
  ("PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED") | "NOT_ANALYZED";
export type RunId17 = string | null;
export type ModelName6 = string | null;
/**
 * @minItems 1
 * @maxItems 100
 */
export type Conclusions1 = [GroupAnalysisConclusion, ...GroupAnalysisConclusion[]];
/**
 * @maxItems 100
 */
export type Limitations65 = string[];
/**
 * 覆盖全部候选且每个候选恰好一次；未获得固定主图直接证据时只能UNCERTAIN
 *
 * @minItems 1
 * @maxItems 10000
 */
export type Assessments11 = [GroupPairAssessment, ...GroupPairAssessment[]];
export type Error5 = string | null;
export type CompletedBatches2 = number;
export type TotalBatches2 = number | null;
export type Device = string;
export type BatchSize3 = number;
export type GpuMemoryMb = number;
export type ComputeDtype = "float32" | "float16";
export type DecodeWorkers = number;
export type DecodeMemoryMb = number;
export type Revision26 = number;
export type Device1 = string;
export type BatchSize4 = number;
export type GpuMemoryMb1 = number;
export type ComputeDtype1 = "float32" | "float16";
export type DecodeWorkers1 = number;
export type DecodeMemoryMb1 = number;
export type ExpectedRevision4 = number;
export type Device2 = string;
export type BatchSize5 = number;
export type GpuMemoryMb2 = number;
export type ComputeDtype2 = "float32" | "float16";
export type DecodeWorkers2 = number;
export type DecodeMemoryMb2 = number;
export type ProfileId10 = string;
export type Backend1 = "torch_hub" | "torchscript" | "transformers";
export type ModelId7 = "dinov2_vitb14_reg" | "dinov3_vitb16" | "sscd_disc_mixup";
export type WeightsRef1 = string;
export type WeightsSha2561 = string;
export type SourceRef1 = string | null;
export type SourceSha2565 = string | null;
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
export type BatchSize6 = number;
export type GpuMemoryMb3 = number;
export type ComputeDtype3 = "float32" | "float16";
export type DecodeWorkers3 = number;
export type DecodeMemoryMb3 = number;
export type ModelId8 = "dinov2_vitb14_reg" | "dinov3_vitb16" | "sscd_disc_mixup";
export type WeightsRef2 = string;
export type SourceRef2 = string | null;
export type StorageDtype2 = "float32" | "float16";
export type Module9 = "exploration" | "knowledge" | "consistency" | "audit";
export type Settings2 =
  | ModuleSettingsValues
  | ExplorationSettingsValues
  | KnowledgeSettingsValues
  | ConsistencySettingsValues
  | AuditSettingsValues;
export type ReasoningEffort5 = ("low" | "medium" | "high" | "xhigh") | null;
export type Mode7 = "exact" | "combined";
export type MinSimilarity6 = number;
export type MaxExactCandidates1 = number;
export type MaxSimilarCandidates1 = number;
export type ReasoningEffort6 = ("low" | "medium" | "high" | "xhigh") | null;
export type Concurrency2 = number;
export type PolicyVersion = string;
export type AbsoluteBoundaryPx = number | null;
export type RelativeBoundaryFraction = number | null;
export type MinCoverageConsistency = number | null;
export type ConsiderRegistrationUncertainty = true;
export type TinyDefectCoverageOverride = true;
export type ReasoningEffort7 = ("low" | "medium" | "high" | "xhigh") | null;
export type WholeImageMaxSide2 = number | null;
export type BatchSize7 = number;
export type Concurrency3 = number;
export type Revision27 = number;
export type Module10 = "exploration" | "knowledge" | "consistency" | "audit";
export type Settings3 =
  | ModuleSettingsValues1
  | ExplorationSettingsValues1
  | KnowledgeSettingsValues1
  | ConsistencySettingsValues1
  | AuditSettingsValues1;
export type ReasoningEffort8 = ("low" | "medium" | "high" | "xhigh") | null;
export type ReasoningEffort9 = ("low" | "medium" | "high" | "xhigh") | null;
export type BatchSize8 = number;
export type WholeImageMaxSide3 = number | null;
export type ContextTokens7 = number | null;
export type MaxOutputTokens7 = number | null;
export type GenerationTimeoutSeconds5 = number | null;
export type Concurrency4 = number;
export type ReasoningEffort10 = ("low" | "medium" | "high" | "xhigh") | null;
export type BatchSize9 = number;
export type WholeImageMaxSide4 = number | null;
export type Concurrency5 = number;
export type Mode8 = "exact" | "combined";
export type MinSimilarity7 = number;
export type MaxExactCandidates2 = number;
export type MaxSimilarCandidates2 = number;
export type ReasoningEffort11 = ("low" | "medium" | "high" | "xhigh") | null;
export type Concurrency6 = number;
export type ContextTokens8 = number | null;
export type MaxOutputTokens8 = number | null;
export type GenerationTimeoutSeconds6 = number | null;
export type CapacityMode4 = ("vllm_tokenize" | "provider_managed") | null;
export type MaxVisualInputs4 = number | null;
export type MaxRequestBytes4 = number | null;
export type ConnectTimeoutSeconds4 = number | null;
export type WriteTimeoutSeconds4 = number | null;
export type PoolTimeoutSeconds4 = number | null;
export type PolicyVersion1 = string;
export type AbsoluteBoundaryPx1 = number | null;
export type RelativeBoundaryFraction1 = number | null;
export type MinCoverageConsistency1 = number | null;
export type ConsiderRegistrationUncertainty1 = true;
export type TinyDefectCoverageOverride1 = true;
export type ReasoningEffort12 = ("low" | "medium" | "high" | "xhigh") | null;
export type WholeImageMaxSide5 = number | null;
export type BatchSize10 = number;
export type Concurrency7 = number;
export type ExpectedRevision5 = number;
export type Mode9 = "exact" | "combined";
export type MinSimilarity8 = number;
export type MaxExactCandidates3 = number;
export type MaxSimilarCandidates3 = number;
/**
 * 本次新建检查的稳定提交ID；重传使用同一ID，主动新建使用新ID
 */
export type SubmissionId11 = string;
/**
 * @minItems 1
 */
export type DatasetIds30 = [string, ...string[]];
export type AnalysisKind6 = "consistency";
export type Instruction22 = string | null;
export type SystemPrompt8 = string | null;
export type Subjects3 = (AllRegisteredScope | DatasetScope | SampleScope | FilteredScope) | null;
export type CorpusScope4 = (AllRegisteredScope | DatasetScope) | null;
export type SchemaVersion5 = 1;
export type SettingsRevision2 = number;
export type Concurrency8 = number;
export type Retrieval = ExactCandidatePolicy | CombinedCandidatePolicy;
export type Mode10 = "exact";
export type MinSimilarity9 = null;
export type MaxExactCandidates4 = number;
export type MaxSimilarCandidates4 = null;
export type Mode11 = "combined";
export type MinSimilarity10 = number;
export type MaxExactCandidates5 = number;
export type MaxSimilarCandidates5 = number;
export type Instruction23 = string;
export type SystemPrompt9 = string | null;
export type PromptVersion = string;
export type PixelProfile = "raw-decoded-v1";
export type ModelCallLogging = "native-v1" | null;
export type PhaseLogging = "timeline-v1" | null;
export type ReviewPipeline = ("identity-v4" | "identity-v5" | "identity-v7" | "identity-v8") | null;
export type TaskType4 = ("anomaly_detection" | "bbox_defect") | null;
export type JobId24 = string;
export type AnchorId4 = string;
export type Ordinal = number;
export type SessionId15 = string;
export type SessionCreated3 = boolean;
export type Attempt3 = number;
export type State16 = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type Phase9 = string;
export type TraceState = "OPEN" | "PENDING" | "CLOSED";
export type TraceError = string | null;
export type AnchorId5 = string;
export type ScopeId4 = string;
export type Mode12 = "exact" | "combined";
export type MinSimilarity11 = number | null;
export type State17 = "done" | "disabled";
export type Limit5 = number;
export type Matched = number | null;
export type Selected = number;
export type Truncated = boolean;
export type SampleId62 = string;
export type ContentGroupId4 = string;
export type Kind49 = "exact" | "similar";
export type Rank3 = number;
export type Score3 = number | null;
export type Candidates = SelectedCandidate[];
export type Fingerprint1 = string;
/**
 * @minItems 1
 */
export type Pages = [AnchorVisualStart, ...AnchorVisualStart[]];
/**
 * request_id标识完整的视觉请求；复用已保存观察须保持原始参数，改变question或candidate_ids时须使用新的request_id。
 */
export type RequestId5 = string;
/**
 * 上下文提供的当前冻结清单指纹。
 */
export type Fingerprint2 = string;
/**
 * 完整使用上下文中一个冻结页的候选集合，不拆页、不跨页拼接。
 *
 * @minItems 1
 */
export type CandidateIds = [string, ...string[]];
export type Question = string;
export type Result5 = (NoCandidateResult | NoEligibleResult | ModelReviewedResult) | null;
export type SettingsRevision3 = number;
export type SchemaVersion6 = 1;
export type JobId25 = string;
export type AnchorId6 = string;
export type SessionId16 = string;
export type Attempt4 = number;
export type State18 = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type Result6 = (NoCandidateResult | NoEligibleResult | ModelReviewedResult) | null;
export type Errors4 = JobFailure[];
export type RunId18 = string;
export type RunId19 = string;
export type AnchorId7 = string;
export type RunId20 = string;
export type Page21 = number;
export type PageSize22 = number;
export type PairKey = string;
export type AnchorId8 = string;
export type CandidateId13 = string;
export type Links = PairReviewLink[];
export type PairKey1 = string;
export type Links1 = PairReviewLink[];
export type ObservationOwnerId = string;
export type ObservationCallIds = string[];
/**
 * request_id标识完整的视觉请求；复用已保存观察须保持原始参数，改变question或candidate_ids时须使用新的request_id。
 */
export type RequestId6 = string;
/**
 * 上下文提供的当前冻结清单指纹。
 */
export type Fingerprint3 = string;
/**
 * 完整使用上下文中一个冻结页的候选集合，不拆页、不跨页拼接。
 *
 * @minItems 1
 */
export type CandidateIds1 = [string, ...string[]];
export type Question1 = string;
export type SampleId63 = string;
/**
 * 原图像素半开窗口[x0,y0,x1,y1)
 *
 * @minItems 4
 * @maxItems 4
 */
export type Bbox10 = [unknown, unknown, unknown, unknown];
/**
 * 四侧扩边的像素数，实际窗口裁至原图画布
 */
export type Padding = number;
export type Reason49 = string;
export type Windows = VisualWindow[];
export type ObservationId3 = string;
/**
 * request_id标识完整的视觉请求；复用已保存观察须保持原始参数，改变question或candidate_ids时须使用新的request_id。
 */
export type RequestId7 = string;
/**
 * 上下文提供的当前冻结清单指纹。
 */
export type Fingerprint4 = string;
/**
 * 完整使用上下文中一个冻结页的候选集合，不拆页、不跨页拼接。
 *
 * @minItems 1
 */
export type CandidateIds2 = [string, ...string[]];
export type Question2 = string;
export type AnchorId9 = string;
export type InputFingerprint = string;
/**
 * @minItems 1
 */
export type Media2 = [VisualEvidence, ...VisualEvidence[]];
/**
 * 恰好覆盖本次输入的全部候选，每个candidate_id一次。
 *
 * @minItems 1
 */
export type Observations15 = [CandidateVisualObservation, ...CandidateVisualObservation[]];
export type CandidateId14 = string;
export type Description38 = string;
/**
 * 主图与当前候选的两个原图evidence_id；原始标注和全部裁剪视图随原图分组，不单独引用裁图。
 *
 * @minItems 1
 */
export type MediaIds3 = [string, ...string[]];
export type Limitations66 = string[];
export type CandidateId15 = string;
/**
 * MATERIAL存在差异；EQUIVALENT一致；UNCERTAIN为合格候选的标注审核证据不足。
 */
export type Verdict5 = "EQUIVALENT" | "MATERIAL" | "UNCERTAIN";
/**
 * 当前候选的标注比对分析
 */
export type Explanation1 = string;
/**
 * 当前候选的具体发现
 *
 * @maxItems 100
 */
export type Findings7 = string[];
/**
 * 独立保存未能确认的部分；已确认差异仍保留在issues，不因局部不确定而丢失。
 *
 * @maxItems 100
 */
export type Limitations67 = string[];
/**
 * MATERIAL必须保存全部独立矩形问题，关联真实两侧框ID与实际原图身份；拆分合并不重复计数量差异。
 */
export type Issues8 = BboxAnnotationIssue[];
export type Reason50 = string;
/**
 * 本次实际观察到内容矛盾的真实配对区域ID；仅原图证据时为空。
 */
export type RegionPairIds1 = string[];
export type CandidateId16 = string | null;
/**
 * 当前冻结清单指纹。
 */
export type Fingerprint5 = string;
/**
 * 本场已保存且实际包含当前候选的视觉观察回执。
 *
 * @minItems 1
 */
export type ObservationIds2 = [string, ...string[]];
export type CandidateId17 = string;
/**
 * MATERIAL存在差异；EQUIVALENT一致；UNCERTAIN为合格候选的标注审核证据不足。
 */
export type Verdict6 = "EQUIVALENT" | "MATERIAL" | "UNCERTAIN";
/**
 * 当前候选的标注比对分析
 */
export type Explanation2 = string;
/**
 * 当前候选的具体发现
 *
 * @maxItems 100
 */
export type Findings8 = string[];
/**
 * 独立保存未能确认的部分；已确认差异仍保留在issues，不因局部不确定而丢失。
 *
 * @maxItems 100
 */
export type Limitations68 = string[];
export type Description39 = string;
/**
 * 实际观察的两侧原图身份各一次。
 *
 * @minItems 2
 * @maxItems 2
 */
export type MediaIds4 = [string, string];
export type Limitations69 = string[];
export type ReviewSuggestion3 = string;
export type Type7 =
  "category_mismatch" | "extra_annotation" | "missing_annotation" | "position_difference" | "split" | "merge";
export type MainAnnotationIds2 = string[];
export type CandidateAnnotationIds2 = string[];
/**
 * 支持本问题的已核实区域对ID；像素一致的程序捷径可为空。
 */
export type RegionPairIds2 = string[];
/**
 * 位置问题必须确认实际缺陷覆盖存在material_change；不能仅因坐标、中心或尺寸数值不同报告问题。
 */
export type CoverageEffect1 = ("unchanged" | "material_change" | "unverified") | null;
/**
 * 位置问题说明实际缺陷的漏盖、偏离或范围实质变化，不自行制定像素阈值。
 */
export type CoverageReason1 = string | null;
/**
 * 仅用于主图少标：实际共同观察且确认是同一主图对象的其他候选原始框引用；没有确认则留空。程序验证真实映射区域与唯一对应，不能按文字或重叠猜测。
 */
export type SameMainObjectAs2 = CandidateObjectReference[];
/**
 * MATERIAL必须保存全部独立矩形问题，关联真实两侧框ID与实际原图身份；拆分合并不重复计数量差异。
 */
export type Issues9 = BboxAnnotationIssue1[];
export type RequestId8 = string | null;
/**
 * 当前冻结清单指纹。
 */
export type Fingerprint6 = string;
/**
 * 恰好包含当前有效候选的最新评估回执；零有效候选时为空。
 */
export type AssessmentIds = number[];
export type DatasetFormat5 = ("labelme" | "folder_classification") | null;
export type SchemaVersion7 = 1;
export type JobId26 = string;
export type AnchorId10 = string;
export type SessionId17 = string;
export type State19 = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type Phase10 = string;
export type Attempt5 = number;
export type Mode13 = "exact" | "combined";
export type MinSimilarity12 = number | null;
export type MaxExactCandidates6 = number;
export type MaxSimilarCandidates6 = number | null;
export type SelectedExact1 = number | null;
export type SelectedSimilar1 = number | null;
export type Verdict7 = ("EQUIVALENT" | "MATERIAL" | "UNCERTAIN") | null;
export type Reason51 = string;
export type Categories6 = ConflictCategory[];
export type Conclusion11 = string | null;
export type OriginalCategories1 = ConflictCategory[];
export type ProgramConclusion2 = string;
export type ModelConclusion3 = ConflictCategory | "无冲突" | null;
export type ResultRef1 = string;
export type RecordId = number;
export type CandidateId18 = string;
export type Phase11 = "gate" | "audit";
export type Revision28 = number;
export type GateRevision = number;
export type RequestId9 = string;
export type Active = boolean;
export type GateId = string;
export type CandidateId19 = string;
export type Fingerprint7 = string;
export type ExecutionStatus10 = "pending" | "completed" | "failed";
export type Revision29 = number;
export type Relation5 = ("pixel_identical" | "transformed_same_content" | "content_different" | "unverified") | null;
export type Reason52 = string;
export type Limitations70 = string[];
export type Media3 = VisualEvidence[];
export type ErrorCode3 = string | null;
export type GateStatus1 = ("eligible" | "rejected" | "unverified") | null;
export type Source13 = ("program" | "vision") | null;
export type PairKey2 = string | null;
export type ObservationCallIds1 = string[];
export type RegionPairId = string;
/**
 * @minItems 1
 */
export type SourceAnnotations = [IdentityRegionSource, ...IdentityRegionSource[]];
export type Side2 = "main" | "candidate";
export type AnnotationId9 = string;
/**
 * @minItems 4
 * @maxItems 4
 */
export type OriginalBbox = [unknown, unknown, unknown, unknown];
export type MainWindow = [unknown, unknown, unknown, unknown] | null;
export type CandidateWindow = [unknown, unknown, unknown, unknown] | null;
export type Mapping = "registered" | "unverified";
export type Limitation = string | null;
export type RegionPairs = IdentityRegionPair[];
export type RequiredRegionPairIds = string[];
export type RegionPairId1 = string;
export type MainMediaId = string;
export type CandidateMediaId = string;
export type VisualRelation = "same" | "different" | "unverified";
export type MainDescription = string;
export type CandidateDescription = string;
export type Reason53 = string | null;
export type RegionChecks = IdentityRegionCheck[];
export type RegionPairId2 = string;
/**
 * @minItems 1
 */
export type MediaIds5 = [string, ...string[]];
export type Observation4 = string;
export type UnmappedRegionChecks = UnmappedRegionCheck[];
export type OverviewRelation = ("same" | "different" | "unverified") | null;
/**
 * 当前冻结清单指纹。
 */
export type Fingerprint8 = string;
/**
 * 本场实际保存且包含当前候选的视觉观察回执ID。程序完成的图像级标签比较为空。
 */
export type ObservationIds3 = string[];
export type GateRevision1 = number;
export type CandidateRecords = CandidatePhaseRecord[];
export type Gates1 = CandidateIdentityRecord[];
export type CandidateId20 = string;
export type EvidenceId31 = string;
export type ResultId10 = string;
export type DetailRef = string;
export type CapturedEvidence = AnchorEvidenceReference[];
export type SessionCreated4 = boolean;
export type TraceState1 = "OPEN" | "PENDING" | "CLOSED";
export type TraceError1 = string | null;
export type SnapshotRef = string;
export type TraceRef = string | null;
export type DiagnosticsRef = string;
export type Result7 = (NoCandidateResult | NoEligibleResult | ModelReviewedResult) | null;
export type Requests = AnchorVisualRequest[];
export type Observations16 = AnchorObservation[];
export type AssessmentId2 = number;
export type Assessments12 = AnchorAssessmentRecord[];
export type Evidence9 = AnchorEvidenceReference[];
export type Errors5 = JobFailure[];
export type ErrorHistory2 = JobFailure[];
export type JobId27 = string;
export type Total26 = number;
export type Items24 = AnchorResultSummary[];
export type SchemaVersion8 = 1;
export type JobId28 = string;
export type Status43 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type Total27 = number;
export type Completed8 = number;
export type NoCandidates = number;
export type OriginalConflicts = number;
export type CallId2 = string;
export type StartedAt10 = string;
export type CallId3 = string;
export type FinishedAt8 = string;
export type ElapsedMs2 = number;
export type FinishReason2 = string | null;
export type Usage2 = {
  [k: string]: unknown;
} | null;
export type HttpStatus2 = number | null;
export type InputTokens = number;
export type ContextTokens9 = number;
export type OutputReserve = number;
export type Fits = boolean;
export type JobId29 = string;
export type SubmittedAt10 = string;
export type ImageName = string;
export type ImageId = string;
export type SettingsRevision4 = number;
export type SettingsRevision5 = number;
export type SchemaVersion9 = 4;
export type ContextPolicy2 = "legacy" | "evidence-on-demand-v1";
export type ReportInstruction1 = string;
export type ConsistencyJobId2 = string;
export type JobId30 = string;
export type SampleId64 = string;
export type Ordinal1 = number;
export type SessionId18 = string;
export type SessionCreated5 = boolean;
export type State20 = "PENDING" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type ResultRevision5 = number;
export type JobId31 = string;
export type SampleId65 = string;
export type SessionId19 = string;
export type DatasetFormat6 = ("labelme" | "folder_classification") | null;
export type SchemaVersion10 = 1;
export type JobId32 = string;
export type AnchorId11 = string;
export type SessionId20 = string;
export type State21 = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type Phase12 = string;
export type Attempt6 = number;
export type Mode14 = "exact" | "combined";
export type MinSimilarity13 = number | null;
export type MaxExactCandidates7 = number;
export type MaxSimilarCandidates7 = number | null;
export type SelectedExact2 = number | null;
export type SelectedSimilar2 = number | null;
export type Verdict8 = ("EQUIVALENT" | "MATERIAL" | "UNCERTAIN") | null;
export type Reason54 = string;
export type Categories7 = ConflictCategory[];
export type Conclusion12 = string | null;
export type OriginalCategories3 = ConflictCategory[];
export type ProgramConclusion3 = string;
export type ModelConclusion4 = ConflictCategory | "无冲突" | null;
export type ResultRef2 = string;
export type Result8 = (NoCandidateResult | NoEligibleResult | ModelReviewedResult) | null;
export type Evidence10 = AnchorEvidenceReference[];
export type Assessments13 = AnchorAssessmentRecord[];
export type Gates2 = CandidateIdentityRecord[];
export type Observations17 = AnchorObservation[];
export type CapturedEvidence1 = AnchorEvidenceReference[];
/**
 * 本次图级终稿的幂等键，仅同内容重传复用。
 */
export type CommitKey15 = string;
export type ExecutionStatus11 = "completed" | "incomplete" | "failed";
export type State22 = ("normal" | "suspect") | null;
/**
 * 只概括本图可见形态及标注覆盖、定位、实例关系。上游与知识评估分别填写对应字段。
 */
export type Analysis10 = string;
export type Conclusion13 = string;
/**
 * 支持本图判断的具体图像事实。
 */
export type Basis5 = string[];
/**
 * 本次实际观察的完整原图身份；原图及全部局部必须实际观察，但仅引用所属原图。
 */
export type EvidenceIds38 = string[];
/**
 * 仅逐项评估本场选中的knowledge.entries，恰好覆盖其check_id；knowledge为null时必须填[]。普通图像/标注观察写入analysis和basis，不生成自拟check_id。
 */
export type CheckAssessments4 = AuditCheckAssessment[];
/**
 * 恰好处理本图上游result.issues中的每个issue_id一次；无上游问题时为空。supported须由findings关联，unsupported不能作为本图疑点来源。
 */
export type ConsistencyReview2 = AuditConsistencyAssessment[];
export type Findings9 = AuditFinding2[];
/**
 * 记录有比较价值的可见现象，描述简短；普通观察不计入质量疑点。
 */
export type Observations18 = AuditObservation1[];
export type HypothesisAssessments2 = AuditHypothesisAssessment[];
export type VisualFeatures2 = AuditVisualFeature1[];
/**
 * 画面模糊、目标截断、必要图像读取失败等实际影响本图核查的取证缺口；没有则填[]。
 */
export type Limitations71 = string[];
export type Title41 = string;
export type Text8 = string;
export type Sections = AuditPromptSection[];
/**
 * @minItems 4
 * @maxItems 4
 */
export type Bbox11 = [number, number, number, number];
export type SampleId66 = string;
export type Offset9 = number;
export type Limit6 = number | null;
export type SampleId67 = string;
export type Evidence11 = AuditMediaView[];
export type Errors6 = string[];
export type AuditEvidenceQuery = NativeAuditEvidenceReference | HistoricalAuditEvidenceReference;
export type RunId21 = string;
export type SampleId68 = string;
export type EvidenceId32 = string;
export type SuggestionId2 = string;
export type EvidenceId33 = string;
export type ObservationId4 = string;
export type RequestId10 = string;
/**
 * @minItems 1
 */
export type CandidateIds3 = [string, ...string[]];
export type SchemaVersion11 = 1;
export type JobId33 = string;
export type AnchorId12 = string;
export type SessionId21 = string;
export type Attempt7 = number;
export type State23 = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type Phase13 = string;
export type PhaseRecording = "COMPLETE" | "UNAVAILABLE";
export type Attempt8 = number;
export type Phase14 = string;
export type State24 = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | "INTERRUPTED";
export type StartedAt11 = string;
export type EndedAt = string | null;
/**
 * 仅可靠结束时间对应的阶段耗时；运行中或中断点未知时为null。
 */
export type DurationSeconds2 = number | null;
export type Phases = AnchorPhaseTiming[];
export type Recording = "COMPLETE" | "UNAVAILABLE";
export type RecordedRequests = number;
export type Requests1 = number | null;
export type GenerationRequests = number | null;
export type TokenizationRequests = number | null;
export type FailedRequests = number | null;
export type InFlightRequests = number | null;
export type UnknownOutcomes = number | null;
export type UsageMissing = number;
/**
 * 生成请求完整输入计数，包含缓存；任一调用不可得时为null
 */
export type InputTokens1 = number | null;
export type OutputTokens = number | null;
export type TotalTokens = number | null;
/**
 * 来源未提供实际费用时为null，不以单价估算替代
 */
export type Cost = number | null;
export type Calls = ModelCallSummary[];
export type CandidateId21 = string | null;
export type Phase15 = "gate";
export type RequestId11 = string;
export type Fingerprint9 = string;
/**
 * @minItems 1
 */
export type CandidateIds4 = [string, ...string[]];
export type Phase16 = "gate" | "audit";
export type RequestId12 = string;
export type Fingerprint10 = string;
/**
 * @minItems 1
 */
export type CandidateIds5 = [string, ...string[]];
export type Question3 = string | null;
export type Phase17 = "gate" | "audit";
export type RequestId13 = string;
export type Fingerprint11 = string;
export type CandidateId22 = string;
export type ExpectedRevision6 = number;
export type Action9 = "commit" | "recheck";
export type ObservationIds4 = string[];
export type Phase18 = "gate" | "audit";
export type RequestId14 = string;
export type Fingerprint12 = string;
export type CandidateId23 = string;
export type ExpectedRevision7 = number;
export type Action10 = "commit" | "recheck";
export type ObservationIds5 = string[];
export type RequestId15 = string;
export type Fingerprint13 = string;
export type AssessmentIds1 = number[];

export interface WorkbenchDomain {
  ExplorationResults?: ExplorationResults;
  DirectionRemoval?: DirectionRemoval;
  ExplorationPromptPreset?: ExplorationPromptPreset;
  ExplorationPresetEdit?: ExplorationPresetEdit;
  ProviderEdit?: ProviderEdit;
  ProviderReference?: ProviderReference;
  ProviderDiscovery?: ProviderDiscovery;
  ModelLimits?: ModelLimits;
  ModelProfile?: ModelProfile;
  ModelExecution?: ModelExecution;
  WorkbenchProvider?: WorkbenchProvider;
  ModelCatalog?: ModelCatalog;
  DirectionAdoption?: DirectionAdoption;
  ExplorationStart?: ExplorationStart1;
  ExplorationSnapshot?: ExplorationSnapshot;
  ExplorationCatalog?: ExplorationCatalog;
  KnowledgeDiscoveryPage?: KnowledgeDiscoveryPage;
  KnowledgeDetailQuery?: KnowledgeDetailQuery;
  KnowledgeCheckPage?: KnowledgeCheckPage;
  KnowledgeCheckEvidencePage?: KnowledgeCheckEvidencePage;
  KnowledgeEvidencePage?: KnowledgeEvidencePage;
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
  AuditAgentStart?: AuditAgentStart;
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
  Annotation?: Annotation;
  ReviewDecisionRecord?: ReviewDecisionRecord;
  ReviewSubmission?: ReviewSubmission;
  ReviewHistoryQuery?: ReviewHistoryQuery;
  ReviewHistoryPage?: ReviewHistoryPage;
  SampleQuery?: SampleQuery;
  JobView?: JobView;
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
  AuditSourceCatalog?: AuditSourceCatalog;
  AuditMasterContext?: AuditMasterContext;
  AuditBatch?: AuditBatch;
  AuditRecheck?: AuditRecheck;
  AuditBatchCommit?: AuditBatchCommit;
  AuditBatchDelta?: AuditBatchDelta;
  AuditDiscoveryQuery?: AuditDiscoveryQuery;
  AuditEvidenceCommit?: AuditEvidenceCommit;
  AuditMediaQuery?: AuditMediaQuery;
  AuditSampleQuery?: AuditSampleQuery;
  AuditSamplePage?: AuditSamplePage;
  AuditRunReport?: AuditRunReport;
  AuditStatistics?: AuditStatistics;
  AuditRecordQuery?: AuditRecordQuery;
  AuditReportCommit?: AuditReportCommit;
  AuditReportSession?: AuditReportSession;
  AuditReportEvidenceQuery?: AuditReportEvidenceQuery;
  KnowledgeCheckReviewSubmission?: KnowledgeCheckReviewSubmission;
  SubmittedMiningPrompt?: SubmittedMiningPrompt;
  AnalysisWave?: AnalysisWave;
  ExplorationBatchReport?: ExplorationBatchReport1;
  KnowledgeBatchReport?: KnowledgeBatchReport1;
  AnalysisWorkerMaterials?: AnalysisWorkerMaterials;
  ExplorationEvidenceReport?: ExplorationEvidenceReport1;
  KnowledgeEvidenceReport?: KnowledgeEvidenceReport1;
  ExplorationDeltaCommit?: ExplorationDeltaCommit;
  KnowledgeDeltaCommit?: KnowledgeDeltaCommit;
  ExplorationDeltaFinalize?: ExplorationDeltaFinalize;
  KnowledgeDeltaFinalize?: KnowledgeDeltaFinalize;
  AnalysisEvidenceReferenceQuery?: AnalysisEvidenceReferenceQuery;
  AnalysisImageQuery?: AnalysisImageQuery;
  KnowledgeVersionCatalog?: KnowledgeVersionCatalog;
  RegistrationImageQuery?: RegistrationImageQuery;
  ExplorationCropQuery?: ExplorationCropQuery;
  AnalysisBatchMaterials?: AnalysisBatchMaterials;
  AnalysisManifest?: AnalysisManifest;
  AnalysisPlan?: AnalysisPlan;
  RegistrationMediaQuery?: RegistrationMediaQuery;
  RegistrationMediaPage?: RegistrationMediaPage;
  EvidenceReferenceQuery?: EvidenceReferenceQuery;
  ExplorationFinalize?: ExplorationFinalize;
  KnowledgeFinalize?: KnowledgeFinalize;
  AnalysisFinalizationContext?: AnalysisFinalizationContext;
  AnalysisFinalizationReceipt?: AnalysisFinalizationReceipt;
  AnalysisArgumentQuery?: AnalysisArgumentQuery;
  AnalysisArgumentPage?: AnalysisArgumentPage;
  AnalysisEntryQuery?: AnalysisEntryQuery;
  AnalysisClaimHistory?: AnalysisClaimHistory;
  AnalysisAgentStart?: AnalysisAgentStart;
  ExplorationAgentStart?: ExplorationAgentStart1;
  KnowledgeAgentStart?: KnowledgeAgentStart1;
  AnalysisAgentConfiguration?: AnalysisAgentConfiguration;
  AnalysisScope?: AnalysisScope;
  AnalysisCatalogQuery?: AnalysisCatalogQuery;
  AnalysisCatalogPage?: AnalysisCatalogPage;
  AnalysisWorkflowSnapshot?: AnalysisWorkflowSnapshot;
  AnalysisWorkflowState?: AnalysisWorkflowState;
  AnalysisAgentContext?: AnalysisAgentContext;
  AnalysisSessionLocation?: AnalysisSessionLocation;
  ExplorationCommit?: ExplorationCommit;
  KnowledgeCommit?: KnowledgeCommit;
  AnalysisCommitReceipt?: AnalysisCommitReceipt;
  AnalysisPublication?: AnalysisPublication;
  AnalysisResultView?: AnalysisResultView;
  AnalysisPublicationView?: AnalysisPublicationView;
  AnalysisSampleEvidence?: AnalysisSampleEvidence;
  AnalysisObservationQuery?: AnalysisObservationQuery;
  AnalysisObservationPage?: AnalysisObservationPage;
  AnalysisObservationHistoryPage?: AnalysisObservationHistoryPage;
  AnalysisResults?: AnalysisResults;
  AnalysisJobPrompts?: AnalysisJobPrompts;
  PublishedDirectionCatalog?: PublishedDirectionCatalog;
  AnalysisSourceCatalog?: AnalysisSourceCatalog;
  ConsistencyReviewSubmission?: ConsistencyReviewSubmission;
  ConsistencyReviewContext?: ConsistencyReviewContext;
  CorrectionVerification?: CorrectionVerification;
  CorrectionCheck?: CorrectionCheck;
  GroupReviewSubmission?: GroupReviewSubmission;
  GroupReviewContext?: GroupReviewContext;
  GroupReviewDecision?: GroupReviewDecision;
  AnchorCandidatePage?: AnchorCandidatePage;
  AnchorImagePage?: AnchorImagePage;
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
  GroupAnalysisView?: GroupAnalysisView;
  EmbeddingProfile?: EmbeddingProfile;
  ImageEncoderConfig?: ImageEncoderConfig;
  ImageEncoderSettings?: ImageEncoderSettings;
  ImageEncoderEdit?: ImageEncoderEdit;
  ImageProfileCreate?: ImageProfileCreate;
  ModuleSettingsSnapshot?: ModuleSettingsSnapshot;
  ModuleSettingsEdit?: ModuleSettingsEdit;
  ModuleModelReference?: ModuleModelReference;
  ModuleSettingsValues?: ModuleSettingsValues;
  ConsistencySettingsValues?: ConsistencySettingsValues;
  ConsistencyAgentStart?: ConsistencyAgentStart;
  ConsistencyCheckSnapshot?: ConsistencyCheckSnapshot;
  ConsistencyAnchorRun?: ConsistencyAnchorRun;
  ConsistencyCheckConfiguration?: ConsistencyCheckConfiguration;
  AnchorTraceEvent?: AnchorTraceEvent;
  ConsistencyCheckReference?: ConsistencyCheckReference;
  ConsistencyAnchorReference?: ConsistencyAnchorReference;
  ConsistencyCheckResultsQuery?: ConsistencyCheckResultsQuery;
  PairReviewTask?: PairReviewTask;
  PairReviewReceipt?: PairReviewReceipt;
  AnchorVisualStart?: AnchorVisualStart1;
  AnchorObservation?: AnchorObservation;
  AnchorContextQuery?: AnchorContextQuery;
  AnchorAssessmentInput?: AnchorAssessmentInput;
  AnchorReviewSubmission?: AnchorReviewSubmission;
  AnchorResultDetail?: AnchorResultDetail;
  AnchorResultPage?: AnchorResultPage;
  AnchorResultSummary?: AnchorResultSummary;
  ConsistencyCheckReport?: ConsistencyCheckReport;
  NativeModelCallStart?: NativeModelCallStart;
  NativeModelCallEnd?: NativeModelCallEnd;
  TokenBudget?: TokenBudget;
  ImageSessionLocation?: ImageSessionLocation;
  AuditAgentConfiguration?: AuditAgentConfiguration;
  AuditWorkflowSnapshot?: AuditWorkflowSnapshot;
  AuditSampleRun?: AuditSampleRun;
  AuditAgentContext?: AuditAgentContext;
  AuditCommit?: AuditCommit;
  AuditJobPrompts?: AuditJobPrompts;
  RegistrationCropQuery?: RegistrationCropQuery;
  NativeAuditSampleDetail?: NativeAuditSampleDetail;
  AuditEvidenceQuery?: AuditEvidenceQuery;
  AnchorObservationReceipt?: AnchorObservationReceipt;
  AnchorDiagnostics?: AnchorDiagnostics;
  WorkflowContextQuery?: WorkflowContextQuery;
  AnomalyWorkflowObserve?: AnomalyWorkflowObserve;
  BboxWorkflowObserve?: BboxWorkflowObserve;
  AnomalyWorkflowAssess?: AnomalyWorkflowAssess;
  BboxWorkflowAssess?: BboxWorkflowAssess;
  WorkflowSubmit?: WorkflowSubmit;
}
export interface ExplorationResults {
  snapshots: Snapshots;
  removed_direction_ids: RemovedDirectionIds;
}
export interface ExplorationSnapshot {
  summary: Summary;
  directions: Directions;
  limitations: Limitations1;
  visual_references: VisualReferences;
  version_id: VersionId;
  dataset_id: DatasetId;
  run_id: RunId;
  created_at: CreatedAt;
  model_name: ModelName;
  signature: Signature;
  request: ExplorationStart;
  normal_sources: NormalSources;
  defect_sources: DefectSources;
  evidence: Evidence;
}
export interface ExploredDirection {
  title: Title;
  instruction: Instruction;
  applies_to: AppliesTo;
  rationale: Rationale;
  limitations: Limitations;
  evidence_ids: EvidenceIds;
  previous_direction_id: PreviousDirectionId;
  direction_id: DirectionId;
}
export interface VisualReferences {
  [k: string]: string;
}
export interface ExplorationStart {
  dataset_id: DatasetId1;
  normal_images: NormalImages;
  defect_images: DefectImages;
  objective: Objective;
  prompt: FrozenExplorationPrompt | null;
  parent_version_id: ParentVersionId;
}
export interface FrozenExplorationPrompt {
  preset_id: PresetId;
  preset_name: PresetName;
  preset_revision: PresetRevision;
  text: Text;
}
export interface KnowledgeSource {
  sample_id: SampleId;
  sha256: Sha256;
  annotations_sha256: AnnotationsSha256;
  quality_status: QualityStatus;
  quality_source: QualitySource;
  annotation_availability: AnnotationAvailability;
  review_sha256: ReviewSha256;
  audit_suggestion_ids: AuditSuggestionIds;
  qualification: Qualification;
  pixel_sha256: PixelSha256;
}
export interface AnnotationAvailability {
  status?: Status;
  origin?: Origin;
  source?: Source;
}
export interface KnowledgeEvidence {
  sample_id: SampleId1;
  image: VisualEvidence;
}
export interface VisualEvidence {
  role: Role;
  source: Source1;
  original_size: OriginalSize;
  crop_bbox: CropBbox;
  sent_size: SentSize;
  sha256: Sha2561;
  source_sha256: SourceSha256;
  representation: Representation;
  annotation_ids: AnnotationIds;
  annotation_sha256: AnnotationSha256;
  media_type: MediaType;
  evidence_id: EvidenceId;
}
export interface DirectionRemoval {
  dataset_id: DatasetId2;
  version_id: VersionId1;
  direction_id: DirectionId1;
}
export interface ExplorationPromptPreset {
  name: Name;
  text: Text1;
  id: Id;
  builtin: Builtin;
  revision: Revision;
}
export interface ExplorationPresetEdit {
  name: Name1;
  text: Text2;
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
  reasoning_efforts?: ReasoningEfforts;
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
export interface ModelLimits {
  context_tokens: ContextTokens1;
  max_output_tokens: MaxOutputTokens1;
  request_parameters: RequestParameters;
  generation_timeout_seconds: GenerationTimeoutSeconds;
  capacity_mode: CapacityMode;
  max_visual_inputs: MaxVisualInputs;
  max_request_bytes: MaxRequestBytes;
  connect_timeout_seconds: ConnectTimeoutSeconds;
  write_timeout_seconds: WriteTimeoutSeconds;
  pool_timeout_seconds: PoolTimeoutSeconds;
}
export interface RequestParameters {
  [k: string]: unknown;
}
export interface ModelProfile {
  context_tokens: ContextTokens2;
  max_output_tokens: MaxOutputTokens2;
  request_parameters: RequestParameters1;
  generation_timeout_seconds: GenerationTimeoutSeconds1;
  capacity_mode: CapacityMode1;
  max_visual_inputs: MaxVisualInputs1;
  max_request_bytes: MaxRequestBytes1;
  connect_timeout_seconds: ConnectTimeoutSeconds1;
  write_timeout_seconds: WriteTimeoutSeconds1;
  pool_timeout_seconds: PoolTimeoutSeconds1;
  endpoint: Endpoint2;
  provider_id: ProviderId3;
  provider_name: ProviderName;
  model_id: ModelId1;
  credential_ref: CredentialRef;
  api: Api;
  reasoning_effort: ReasoningEffort;
}
export interface RequestParameters1 {
  [k: string]: unknown;
}
export interface ModelExecution {
  profile: ModelProfile1;
  api_key?: ApiKey2;
}
export interface ModelProfile1 {
  context_tokens?: ContextTokens3;
  max_output_tokens?: MaxOutputTokens3;
  request_parameters?: RequestParameters2;
  generation_timeout_seconds?: GenerationTimeoutSeconds2;
  capacity_mode?: CapacityMode2;
  max_visual_inputs?: MaxVisualInputs2;
  max_request_bytes?: MaxRequestBytes2;
  connect_timeout_seconds?: ConnectTimeoutSeconds2;
  write_timeout_seconds?: WriteTimeoutSeconds2;
  pool_timeout_seconds?: PoolTimeoutSeconds2;
  endpoint: Endpoint3;
  provider_id?: ProviderId4;
  provider_name?: ProviderName1;
  model_id?: ModelId2;
  credential_ref?: CredentialRef1;
  api?: Api1;
  reasoning_effort?: ReasoningEffort1;
}
export interface RequestParameters2 {
  [k: string]: unknown;
}
export interface WorkbenchProvider {
  provider_id: ProviderId5;
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
  model_id: ModelId3;
  name: Name5;
  input_modalities: InputModalities1;
  context_tokens: ContextTokens4;
  max_output_tokens: MaxOutputTokens4;
  reasoning_efforts: ReasoningEfforts1;
}
export interface ModelCatalog {
  providers: Providers;
  provider_revision: ProviderRevision;
}
export interface DirectionAdoption {
  dataset_id: DatasetId3;
  kind: Kind;
  expected_revision: ExpectedRevision2;
  directions: Directions1;
}
export interface DirectionChoice {
  direction_id: DirectionId2;
  title?: Title1;
  instruction?: Instruction1;
  enabled?: Enabled;
}
export interface ExplorationStart1 {
  dataset_id: DatasetId4;
  normal_images: NormalImages1;
  defect_images: DefectImages1;
  objective?: Objective1;
  prompt?: FrozenExplorationPrompt1 | null;
  parent_version_id?: ParentVersionId1;
}
export interface FrozenExplorationPrompt1 {
  preset_id?: PresetId1;
  preset_name?: PresetName1;
  preset_revision?: PresetRevision1;
  text: Text3;
}
export interface ExplorationCatalog {
  dataset_id: DatasetId5;
  versions: Versions;
  exploration: ExplorationSnapshot | null;
  removed_direction_ids: RemovedDirectionIds1;
}
export interface ExplorationVersion {
  version_id: VersionId2;
  dataset_id: DatasetId6;
  run_id: RunId1;
  created_at: CreatedAt1;
  direction_count: DirectionCount;
}
export interface KnowledgeDiscoveryPage {
  version_id: VersionId3;
  dataset_id: DatasetId7;
  kind: Kind1;
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
  status: Status1;
  reason: Reason;
  evidence_ids: EvidenceIds2;
  subjects: Subjects;
  check_titles: CheckTitles;
}
export interface KnowledgeDetailQuery {
  version_id: VersionId4;
  check_id?: CheckId;
  evidence_role?: EvidenceRole;
  section?: Section;
  evidence_ids?: EvidenceIds3;
  page?: Page1;
  page_size?: PageSize1;
  search?: Search;
  review_status?: ReviewStatus;
}
export interface KnowledgeCheckPage {
  version_id: VersionId5;
  dataset_id: DatasetId8;
  kind: Kind2;
  total: Total1;
  page: Page2;
  page_size: PageSize2;
  items: Items1;
}
export interface KnowledgeCheckSummary {
  title: Title2;
  subject: Subject;
  location: Location1;
  criterion: Criterion;
  allowed_variations: AllowedVariations;
  limitations: Limitations2;
  status: Status2;
  review: KnowledgeCheckReview;
  pending_recheck_source_count: PendingRecheckSourceCount;
  check_id: CheckId1;
  support_count: SupportCount;
  counter_count: CounterCount;
  conflict_ids: ConflictIds;
  support_limitations: SupportLimitations;
}
export interface KnowledgeCheckReview {
  status: Status3;
  note: Note;
  revision: Revision1;
  created_at: CreatedAt2;
}
export interface KnowledgeCheckEvidencePage {
  version_id: VersionId6;
  dataset_id: DatasetId9;
  check: KnowledgeCheckSummary;
  directions: Directions2;
  support_evidence_ids: SupportEvidenceIds;
  counter_evidence_ids: CounterEvidenceIds;
  total: Total2;
  page: Page3;
  page_size: PageSize3;
  items: Items2;
}
export interface FrozenAnalysisDirection {
  ref: Ref;
  source: Source2;
  source_title: SourceTitle;
  source_instruction: SourceInstruction;
  title: Title3;
  instruction: Instruction2;
  source_summary: SourceSummary;
  source_limitations: SourceLimitations;
  source_dataset_ids: SourceDatasetIds;
  source_evidence_ids: SourceEvidenceIds;
  source_counter_evidence_ids: SourceCounterEvidenceIds;
}
export interface PresetDirectionSource {
  origin: Origin1;
  catalog_id: CatalogId;
  direction_id: DirectionId4;
  revision: Revision2;
}
export interface ExploredDirectionSource {
  origin: Origin2;
  run_id: RunId2;
  version_id: VersionId7;
  direction_id: DirectionId5;
}
export interface KnowledgeEvidencePage {
  version_id: VersionId8;
  total: Total3;
  page: Page4;
  page_size: PageSize4;
  items: Items3;
}
export interface KnowledgeReviewContext {
  scope_run_id: ScopeRunId;
  reference: KnowledgeReviewReference;
  dataset_id: DatasetId10;
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
  version_id: VersionId9;
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
  limitations: Limitations4;
}
export interface KnowledgeRecheckDecision {
  submission_id: SubmissionId;
  status: Status4;
  description: Description;
  evidence_ids: EvidenceIds4;
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
  support_evidence_ids: SupportEvidenceIds1;
  counter_evidence_ids: CounterEvidenceIds1;
  support_limitations: SupportLimitations1;
  recheck_sample_ids: RecheckSampleIds;
  conflict_ids: ConflictIds1;
  check_id: CheckId2;
  predecessor_check_ids: PredecessorCheckIds;
  finding_ids: FindingIds;
  normal_check_ids: NormalCheckIds;
}
export interface KnowledgeReviewEvent {
  version_id: VersionId10;
  conflict_id: ConflictId2;
  submission_id: SubmissionId1;
  context_signature: ContextSignature;
  reviewer: Reviewer;
  action: Action;
  instruction: Instruction3;
  reason: Reason1;
  created_at: CreatedAt3;
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
  version_id: VersionId11;
  conflict_id: ConflictId3;
  submission_id: SubmissionId2;
  context_signature: ContextSignature2;
  reviewer: Reviewer2;
  action: Action1;
  instruction?: Instruction4;
  reason: Reason2;
}
export interface KnowledgeReviewItem {
  version_id: VersionId12;
  conflict_id: ConflictId4;
  dataset_id: DatasetId11;
  kind: Kind3;
  sample_id: SampleId4;
  description: Description2;
  state: State1;
}
export interface AuditAnalysis {
  knowledge_version_id: KnowledgeVersionId;
  consistency: AuditConsistencyReference | null;
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
  conclusion: Conclusion;
  joint_steps: JointSteps;
  image_sources: ImageSources;
  reference_evidence: ReferenceEvidence;
  input_snapshot_signature: InputSnapshotSignature;
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
  evidence_ids: EvidenceIds5;
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
  evidence_ids: EvidenceIds6;
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
  source: Source3;
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
  source: Source4;
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
export interface AuditConclusion {
  description: Description9;
  position_analysis: PositionAnalysis3;
  illumination_analysis: IlluminationAnalysis3;
  suggested_label: SuggestedLabel;
  reason_category: ReasonCategory;
  confidence: Confidence;
  defect_location: DefectLocation;
  evidence_ids: EvidenceIds7;
  conflicts: Conflicts;
  missing_evidence: MissingEvidence;
  analysis_text: AnalysisText;
  basis: Basis;
  observation: Observation;
  applicable_rule: ApplicableRule;
  normal_alternative: NormalAlternative;
  label_relation: LabelRelation;
  proposed_slice: ProposedSlice;
}
export interface AuditBasis {
  text: Text4;
  evidence_ids: EvidenceIds8;
  knowledge_check_ids: KnowledgeCheckIds;
  consistency_result_ids: ConsistencyResultIds;
}
export interface AuditSliceCandidate {
  name: Name7;
  observation: Observation1;
  evidence_ids: EvidenceIds9;
}
export interface VlmResult {
  description: Description10;
  position_analysis: PositionAnalysis4;
  illumination_analysis: IlluminationAnalysis4;
  suggested_label: SuggestedLabel1;
  reason_category: ReasonCategory1;
  confidence: Confidence1;
  defect_location: DefectLocation1;
  evidence_ids: EvidenceIds10;
  conflicts: Conflicts1;
  missing_evidence: MissingEvidence1;
}
export interface SynthesisStep {
  step_id: StepId1;
  input_evidence_ids: InputEvidenceIds;
  child_step_ids: ChildStepIds;
  result: JointAnalysis;
}
export interface JointAnalysis {
  description: Description11;
  position_analysis: PositionAnalysis5;
  illumination_analysis: IlluminationAnalysis5;
  suggested_label: SuggestedLabel2;
  reason_category: ReasonCategory2;
  confidence: Confidence2;
  defect_location: DefectLocation2;
  evidence_ids: EvidenceIds11;
  conflicts: Conflicts2;
  missing_evidence: MissingEvidence2;
  global_view: GlobalAnalysis;
  region_observations: RegionObservations;
  check_assessments: CheckAssessments1;
  findings: Findings1;
  resolved_findings: ResolvedFindings;
}
export interface RegionObservation {
  description: Description12;
  position_analysis: PositionAnalysis6;
  illumination_analysis: IlluminationAnalysis6;
  region_index: RegionIndex;
}
export interface FindingObservation {
  check_ids: CheckIds5;
  location: Location4;
  description: Description13;
  hypothesis: Hypothesis1;
  normal_explanation: NormalExplanation2;
  limitations: Limitations8;
  review_action: ReviewAction1;
  priority: Priority1;
  evidence_ids: EvidenceIds12;
  related_findings: RelatedFindings1;
}
export interface FindingResolution {
  related_findings: RelatedFindings2;
  description: Description14;
  normal_explanation: NormalExplanation3;
  evidence_ids: EvidenceIds13;
}
export interface AuditImageSource {
  sample: Sample;
  dataset_format: DatasetFormat;
  annotations: Annotations;
  overview_evidence_id: OverviewEvidenceId;
  mask_evidence_ids: MaskEvidenceIds;
}
export interface Sample {
  sample_id: SampleId5;
  task_id: TaskId;
  dataset_id?: DatasetId12;
  image_path: ImagePath;
  relative_path: RelativePath;
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
  annotation_availability?: AnnotationAvailability;
  sample_uuid: SampleUuid;
}
export interface Annotation {
  annotation_id: AnnotationId2;
  sample_id: SampleId6;
  annotation_type: AnnotationType;
  raw_label: RawLabel;
  is_ignored?: IsIgnored;
  phenomenon?: Phenomenon;
  bbox?: Bbox5;
  polygon?: Polygon;
  mask_path?: MaskPath;
  mask_sha256?: MaskSha256;
  geometry_status?: GeometryStatus;
  source?: AnnotationSource;
  source_width?: SourceWidth;
  source_height?: SourceHeight;
}
export interface MaskEvidenceIds {
  [k: string]: string;
}
export interface KnowledgeSnapshot {
  version_id: VersionId13;
  dataset_id: DatasetId13;
  kind: Kind4;
  parent_version_id: ParentVersionId2;
  normal_version_id: NormalVersionId1;
  normal_reference_version_id: NormalReferenceVersionId;
  model_name: ModelName1;
  generation_version: GenerationVersion;
  signature: Signature1;
  summary: Summary1;
  checks: Checks1;
  revisions: Revisions;
  text_retractions: TextRetractions;
  corrections: Corrections;
  comparison_sources: ComparisonSources;
  suspects: Suspects;
  limitations: Limitations9;
  sources: Sources;
  evidence: Evidence2;
  mining_steps: MiningSteps;
  observation_steps: ObservationSteps;
  conflicts: Conflicts3;
  review_applications: ReviewApplications;
  findings: Findings2;
  verification_steps: VerificationSteps;
  support_policy: KnowledgeSupportPolicy | null;
  support_groups: SupportGroups;
  scope_run_id: ScopeRunId1;
  observed_source_ids: ObservedSourceIds;
  knowledge_preset: KnowledgePreset;
  manual_edit: KnowledgeCheckRemoval | null;
  mining_prompt: FrozenMiningPrompt | null;
  created_at: CreatedAt4;
}
export interface CheckRevision {
  previous_check_id: PreviousCheckId;
  current_check_titles: CurrentCheckTitles;
  reason: Reason4;
}
export interface KnowledgeTextRetraction {
  check_id: CheckId5;
  field: Field;
  text: Text5;
  reason: Reason5;
  evidence_ids: EvidenceIds14;
}
export interface KnowledgeCorrection {
  check_id: CheckId6;
  instruction: Instruction5;
}
export interface KnowledgeSuspect {
  evidence_id: EvidenceId2;
  bbox_1000: Bbox10001;
  description: Description15;
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
  text_retractions: TextRetractions1;
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
  support_evidence_ids: SupportEvidenceIds2;
  counter_evidence_ids: CounterEvidenceIds2;
}
export interface KnowledgeDiscovery {
  parts: Parts1;
  areas: Areas;
}
export interface KnowledgeObservationStep {
  step_id: StepId3;
  version_id: VersionId14;
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
  description: Description16;
  position_analysis: PositionAnalysis7;
  illumination_analysis: IlluminationAnalysis7;
  normal_explanation: NormalExplanation5;
  evidence_ids: EvidenceIds15;
  suspects: Suspects2;
  check_id: CheckId7;
  sample_id: SampleId7;
}
export interface KnowledgeFinding {
  finding_id: FindingId1;
  sample_id: SampleId8;
  bbox: Bbox6;
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
  source: Source5;
  annotation_id: AnnotationId3;
  label: Label2;
  bbox: Bbox7;
  check_ids: CheckIds6;
  origins: Origins2;
  image: VisualEvidence;
  crop_bbox: CropBbox2;
}
export interface KnowledgeJudgment {
  finding_id: FindingId2;
  status: Status9;
  affected_check_titles: AffectedCheckTitles;
  description: Description17;
  normal_explanation: NormalExplanation6;
  limitations: Limitations12;
  evidence_ids: EvidenceIds16;
  conflicts: Conflicts4;
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
  check_id: CheckId8;
}
export interface FrozenMiningPrompt {
  configuration: MiningPromptConfiguration;
  instruction: Instruction8;
  signature: Signature2;
}
export interface MiningPromptConfiguration {
  objective: Objective2;
  directions: Directions3;
  instruction: Instruction7;
  exploration: MiningExploration | null;
}
export interface MiningDirection {
  direction_id: DirectionId6;
  title: Title6;
  instruction: Instruction6;
  enabled: Enabled1;
  origin: Origin3;
  source: Source6;
}
export interface MiningExploration {
  version_id: VersionId15;
  summary: Summary3;
  limitations: Limitations13;
}
export interface KnowledgeVersion {
  version_id: VersionId16;
  dataset_id: DatasetId14;
  source_run_id: SourceRunId;
  kind: Kind5;
  parent_version_id: ParentVersionId3;
  normal_version_id: NormalVersionId2;
  model_name: ModelName2;
  created_at: CreatedAt5;
  source_count: SourceCount;
  check_count: CheckCount;
  supported_check_count: SupportedCheckCount;
  manually_edited: ManuallyEdited;
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
  current_version_id: CurrentVersionId;
  current_normal_version_id: CurrentNormalVersionId;
  source_changes: SourceChanges;
  additional_source_ids: AdditionalSourceIds;
  generation_changed: GenerationChanged;
  normal_version_changed: NormalVersionChanged;
  normal_sources_changed: NormalSourcesChanged;
}
export interface KnowledgeSourceChange {
  sample_id: SampleId9;
  reasons: Reasons;
}
export interface KnowledgeSourceQuery {
  recheck_from_version?: RecheckFromVersion;
  include_observed?: IncludeObserved;
  scope_run_id?: ScopeRunId2;
  dataset_id: DatasetId15;
  kind?: Kind6;
  normal_version_id?: NormalVersionId3;
  uncovered_from_version?: UncoveredFromVersion;
  page?: Page5;
  page_size?: PageSize5;
  search?: Search1;
}
export interface KnowledgeSourcePage {
  dataset_id: DatasetId16;
  kind: Kind7;
  normal_version_id: NormalVersionId4;
  total: Total4;
  unavailable_source_count: UnavailableSourceCount1;
  page: Page6;
  page_size: PageSize6;
  items: Items4;
  coverage: KnowledgeCoverage | null;
}
export interface KnowledgeSourceItem {
  sample_id: SampleId10;
  relative_path: RelativePath1;
  qualification: Qualification1;
}
export interface KnowledgeCoverage {
  recheck: Recheck;
  version_id: VersionId17;
  total: Total5;
  observed: Observed;
  pending_review: PendingReview;
  stale: Stale;
  remaining: Remaining;
}
export interface AuditAgentStart {
  submission_id: SubmissionId4;
  subset_ids: SubsetIds;
  consistency_job_id: ConsistencyJobId;
  knowledge?: AuditKnowledgeSelection | null;
  master_prompt?: AnalysisRolePrompts;
  report_instruction?: ReportInstruction;
  observer_prompt?: AnalysisRolePrompts;
  benchmark_build_id?: BenchmarkBuildId;
}
export interface AuditKnowledgeSelection {
  job_id: JobId;
  version_id: VersionId18;
  entry_ids: EntryIds;
}
export interface AnalysisRolePrompts {
  system_prompt: SystemPrompt;
  user_prompt: UserPrompt;
}
export interface ModelCallDetail {
  call_id: CallId;
  run_id: RunId3;
  operation: Operation;
  schema_name: SchemaName;
  phase: Phase;
  sample_id: SampleId11;
  role: Role1;
  request_id: RequestId;
  source: Source7;
  session_id: SessionId;
  attempt: Attempt;
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
  sample_ids?: SampleIds;
}
export interface JobSnapshot {
  run_id: RunId5;
  task_id: TaskId1;
  dataset_id: DatasetId17;
  dataset_ids: DatasetIds;
  analysis_kind: AnalysisKind;
  analysis_version_id: AnalysisVersionId;
  execution_error: ModelCallError | null;
  dataset_results: DatasetResults;
  program_batch_id: ProgramBatchId;
  total_gallery_groups: TotalGalleryGroups;
  completed_gallery_groups: CompletedGalleryGroups;
  job_type: JobType;
  origin_session_id: OriginSessionId;
  root_run_id: RootRunId;
  parent_run_id: ParentRunId;
  status: Status12;
  cancel_requested: CancelRequested;
  completion_pending: CompletionPending;
  sample_ids: SampleIds1;
  completed_sample_ids: CompletedSampleIds;
  failed_sample_ids: FailedSampleIds;
  completed: Completed;
  failed: Failed;
  total_samples: TotalSamples;
  unprocessed: Unprocessed;
  progress: Progress;
  message: Message1;
  submitted_at: SubmittedAt1;
  started_at: StartedAt2;
  finished_at: FinishedAt1;
  deleted_at: DeletedAt;
  model_name: ModelName3;
  model_profile: ModelProfileSnapshot | null;
  embedding_profile: EmbeddingProfile | null;
  current_sample: JobSample | null;
  phase: Phase1;
  phase_started_at: PhaseStartedAt;
  phase_timings: PhaseTimings;
  prepared_sources: PreparedSources;
  queue_position: QueuePosition;
  normal_version_id: NormalVersionId5;
  defect_version_id: DefectVersionId1;
  kind: Kind8;
  knowledge_version_id: KnowledgeVersionId2;
  exploration_version_id: ExplorationVersionId1;
  exploration_prompt: FrozenExplorationPrompt | null;
  exploration_request: ExplorationStart | null;
  mining_prompt: FrozenMiningPrompt | null;
  consistency_prompt: ConsistencyPrompt;
  consistency_identity_prompts: IdentityPrompts | null;
  system_prompt: SystemPrompt1;
  consistency_check_version: ConsistencyCheckVersion;
  consistency_task_type: ConsistencyTaskType;
  inspected_regions: InspectedRegions1;
  planned_regions: PlannedRegions1;
  completed_batches: CompletedBatches;
  total_batches: TotalBatches;
  batch_runs: BatchRuns;
  active_batch_run_id: ActiveBatchRunId;
  errors: Errors;
  error_history: ErrorHistory;
  model_calls: ModelCalls;
  [k: string]: unknown;
}
export interface DatasetAnalysisResult {
  dataset_id: DatasetId18;
  run_id: RunId6;
  status: Status11;
  exploration_version_id: ExplorationVersionId;
  knowledge_version_id: KnowledgeVersionId1;
}
/**
 * Immutable job metadata preserves fields from the captured execution schema.
 */
export interface ModelProfileSnapshot {
  context_tokens: ContextTokens5;
  max_output_tokens: MaxOutputTokens5;
  request_parameters: RequestParameters3;
  generation_timeout_seconds: GenerationTimeoutSeconds3;
  capacity_mode: CapacityMode3;
  max_visual_inputs: MaxVisualInputs3;
  max_request_bytes: MaxRequestBytes3;
  connect_timeout_seconds: ConnectTimeoutSeconds3;
  write_timeout_seconds: WriteTimeoutSeconds3;
  pool_timeout_seconds: PoolTimeoutSeconds3;
  endpoint: Endpoint5;
  provider_id: ProviderId6;
  provider_name: ProviderName2;
  model_id: ModelId4;
  credential_ref: CredentialRef2;
  api: Api3;
  reasoning_effort: ReasoningEffort2;
  [k: string]: unknown;
}
export interface RequestParameters3 {
  [k: string]: unknown;
}
export interface EmbeddingProfile {
  profile_id: ProfileId;
  backend: Backend;
  model_id: ModelId5;
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
  sample_id: SampleId12;
  relative_path: RelativePath2;
  sample_uuid: SampleUuid1;
}
export interface JobPhaseTiming {
  phase: Phase2;
  started_at: StartedAt3;
  finished_at: FinishedAt2;
}
export interface IdentityPrompts {
  gate_system: GateSystem;
  gate_user: GateUser;
  gate_examples: GateExamples;
}
export interface JobFailure {
  sample_id: SampleId13;
  relative_path: RelativePath3;
  message: Message2;
  code: Code;
  source_run_id: SourceRunId1;
  source_phase: SourcePhase;
  sample_uuid: SampleUuid2;
}
export interface ModelCallSummary {
  call_id: CallId1;
  run_id: RunId7;
  operation: Operation1;
  schema_name: SchemaName1;
  phase: Phase3;
  sample_id: SampleId14;
  role: Role2;
  request_id: RequestId1;
  source: Source8;
  session_id: SessionId1;
  attempt: Attempt1;
  started_at: StartedAt4;
  finished_at: FinishedAt3;
  elapsed_ms: ElapsedMs1;
  http_status: HttpStatus1;
  response_id: ResponseId1;
  response_model: ResponseModel1;
  finish_reason: FinishReason1;
  usage: Usage1;
  error: ModelCallError | null;
}
export interface JobRetryOptions {
  run_id: RunId8;
  root_run_id: RootRunId1;
  selection_mode: SelectionMode;
  active_run_id: ActiveRunId;
  samples: Samples;
}
export interface RetrySample {
  sample_id: SampleId15;
  relative_path: RelativePath4;
  state: State2;
  sample_uuid: SampleUuid3;
}
export interface InspectionReference {
  dataset_id: DatasetId19;
  sample_id: SampleId16;
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
  origin_session_id: OriginSessionId1;
  is_latest: IsLatest1;
}
export interface InspectionReference1 {
  dataset_id: DatasetId20;
  sample_id: SampleId17;
  suggestion_id: SuggestionId1;
  finding_id: FindingId4;
  evidence_id: EvidenceId4;
}
export interface LabelmeImport {
  name: Name8;
  annotation_policy?: AnnotationPolicy;
  group_id?: GroupId;
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
  name: Name9;
  annotation_policy?: AnnotationPolicy;
  group_id?: GroupId1;
  format?: Format1;
  root_dir: RootDir;
  rules: Rules;
  preview_fingerprint: PreviewFingerprint;
}
export interface FolderRule {
  path: Path;
  role: Role3;
}
export interface FolderPreview {
  format: Format2;
  root_dir: RootDir1;
  suggested_name: SuggestedName;
  total_images: TotalImages;
  items: Items5;
  conflicts: Conflicts5;
  preview_fingerprint: PreviewFingerprint1;
}
export interface FolderPreviewItem {
  path: Path1;
  image_count: ImageCount;
  suggested_role: SuggestedRole;
  role: Role4;
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
  dataset_id: DatasetId21;
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
  total: Total6;
  completed: Completed1;
  failed: Failed1;
  unsupported: Unsupported;
  pending: Pending;
}
export interface DatasetReport {
  dataset_id: DatasetId22;
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
  basis: Basis1;
  selection: Selection;
  limitations: Limitations14;
}
export interface QualityRatio {
  numerator: Numerator;
  denominator: Denominator;
  basis: Basis2;
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
  knowledge_version_id: KnowledgeVersionId3;
  legacy_profile_id: LegacyProfileId1;
  sample_count: SampleCount;
}
export interface ReviewSubmission {
  submission_id: SubmissionId5;
  dataset_id: DatasetId23;
  sample_id: SampleId18;
  reviewer: Reviewer3;
  decision: ReviewDecisionEnum;
  reason_code?: ReasonCode1;
  comment?: Comment1;
  duration_ms?: DurationMs;
  started_at?: StartedAt5;
}
export interface ReviewHistoryQuery {
  dataset_id: DatasetId24;
  page?: Page7;
  page_size?: PageSize7;
  search?: Search2;
}
export interface ReviewHistoryPage {
  items: Items6;
  total: Total7;
  page: Page8;
  page_size: PageSize8;
}
export interface ReviewHistoryRecord {
  decision_id: DecisionId1;
  sample_id: SampleId19;
  decision: Decision1;
  reviewer: Reviewer4;
  reason_code: ReasonCode2;
  comment: Comment2;
  evidence_version: EvidenceVersion1;
  review_session_id: ReviewSessionId1;
  started_at: StartedAt6;
  submitted_at: SubmittedAt2;
  review_duration_ms: ReviewDurationMs1;
  relative_path: RelativePath5;
}
export interface SampleQuery {
  raw_label_filters?: RawLabelFilters;
  annotation_filters?: AnnotationFilters;
  model_status?: ModelStatus;
  review_status?: ReviewStatus1;
  technical?: Technical;
  reference_status?: ReferenceStatus;
  search?: Search3;
  sort_by?: SortBy;
  dataset_id?: DatasetId25;
  dataset_ids?: DatasetIds1;
  task_id?: TaskId4;
  page?: Page9;
  page_size?: PageSize9;
}
export interface JobView {
  run_id: RunId9;
  task_id: TaskId5;
  dataset_id: DatasetId26;
  dataset_ids: DatasetIds2;
  analysis_kind: AnalysisKind1;
  analysis_version_id: AnalysisVersionId1;
  execution_error: ModelCallError | null;
  dataset_results: DatasetResults1;
  program_batch_id: ProgramBatchId1;
  total_gallery_groups: TotalGalleryGroups1;
  completed_gallery_groups: CompletedGalleryGroups1;
  job_type: JobType1;
  origin_session_id: OriginSessionId2;
  root_run_id: RootRunId2;
  parent_run_id: ParentRunId1;
  status: Status13;
  cancel_requested: CancelRequested1;
  completion_pending: CompletionPending1;
  sample_ids: SampleIds2;
  completed_sample_ids: CompletedSampleIds1;
  failed_sample_ids: FailedSampleIds1;
  completed: Completed2;
  failed: Failed2;
  total_samples: TotalSamples2;
  unprocessed: Unprocessed1;
  progress: Progress1;
  message: Message3;
  submitted_at: SubmittedAt3;
  started_at: StartedAt7;
  finished_at: FinishedAt4;
  deleted_at: DeletedAt1;
  model_name: ModelName4;
  model_profile: ModelProfileSnapshot | null;
  embedding_profile: EmbeddingProfile | null;
  current_sample: JobSample | null;
  phase: Phase4;
  phase_started_at: PhaseStartedAt1;
  phase_timings: PhaseTimings1;
  prepared_sources: PreparedSources1;
  queue_position: QueuePosition1;
  normal_version_id: NormalVersionId6;
  defect_version_id: DefectVersionId2;
  kind: Kind9;
  knowledge_version_id: KnowledgeVersionId4;
  exploration_version_id: ExplorationVersionId2;
  exploration_prompt: FrozenExplorationPrompt | null;
  exploration_request: ExplorationStart | null;
  mining_prompt: FrozenMiningPrompt | null;
  consistency_prompt: ConsistencyPrompt1;
  consistency_identity_prompts: IdentityPrompts | null;
  system_prompt: SystemPrompt2;
  consistency_check_version: ConsistencyCheckVersion1;
  consistency_task_type: ConsistencyTaskType1;
  inspected_regions: InspectedRegions2;
  planned_regions: PlannedRegions2;
  completed_batches: CompletedBatches1;
  total_batches: TotalBatches1;
  batch_runs: BatchRuns1;
  active_batch_run_id: ActiveBatchRunId1;
  errors: Errors1;
  error_history: ErrorHistory1;
  model_calls: ModelCalls1;
}
export interface ConsistencyStart {
  subjects: Subjects1;
  corpus_scope?: CorpusScope;
  mode?: Mode;
  min_similarity?: MinSimilarity;
  profile_id?: ProfileId1;
  request_id: RequestId2;
  model_analysis_prompt?: ModelAnalysisPrompt;
  prompt?: Prompt;
}
export interface AllRegisteredScope {
  kind?: Kind10;
}
export interface DatasetScope {
  kind?: Kind11;
  dataset_ids: DatasetIds3;
}
export interface SampleScope {
  kind?: Kind12;
  sample_ids: SampleIds3;
}
export interface FilteredScope {
  kind?: Kind13;
  dataset_id: DatasetId27;
  filters?: SampleFilters;
}
export interface SampleFilters {
  raw_label_filters?: RawLabelFilters1;
  annotation_filters?: AnnotationFilters1;
  model_status?: ModelStatus1;
  review_status?: ReviewStatus2;
  technical?: Technical1;
  reference_status?: ReferenceStatus1;
  search?: Search4;
  sort_by?: SortBy1;
}
export interface ImageRetrieve {
  query: Query;
  corpus_scope?: CorpusScope1;
  mode?: Mode1;
  profile_id?: ProfileId2;
  top_k?: TopK;
  min_similarity?: MinSimilarity1;
  cursor?: Cursor;
}
export interface SampleImageQuery {
  kind?: Kind14;
  sample_id: SampleId20;
}
export interface TemporaryImageQuery {
  kind?: Kind15;
  image_ref: ImageRef;
}
export interface ImageIndexPrepare {
  corpus_scope?: CorpusScope2;
  profile_id?: ProfileId3;
  request_id: RequestId3;
}
export interface ConsistencyScopesSnapshot {
  subjects: FrozenScope;
  corpus: FrozenScope;
}
export interface FrozenScope {
  scope_id: ScopeId;
  dataset_ids: DatasetIds4;
  frozen_at: FrozenAt;
  sample_count: SampleCount1;
  selector: Selector;
  samples: Samples1;
  scans: Scans;
}
export interface AllRegisteredScope1 {
  kind: Kind16;
}
export interface DatasetScope1 {
  kind: Kind17;
  dataset_ids: DatasetIds5;
}
export interface SampleScope1 {
  kind: Kind18;
  sample_ids: SampleIds4;
}
export interface FilteredScope1 {
  kind: Kind19;
  dataset_id: DatasetId28;
  filters: SampleFilters;
}
export interface FrozenSample {
  sample_id: SampleId21;
  dataset_id: DatasetId29;
  task_id: TaskId6;
  source_fingerprint: SourceFingerprint;
  quality_status: QualityStatus1;
  quality_source: QualitySource2;
}
export interface ScanReference {
  dataset_id: DatasetId30;
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
  reason: Reason6;
  annotation_coordinates: AnnotationCoordinates;
}
export interface PixelComparison {
  status: Status14;
  compare_profile: CompareProfile1;
  exact_equal: ExactEqual;
  compared_pixels: ComparedPixels;
  changed_pixels: ChangedPixels;
  max_abs_diff: MaxAbsDiff;
  reason: Reason7;
}
export interface RetrievalCandidate {
  sample_id: SampleId22;
  content_group_id: ContentGroupId;
  retrieval_branch: RetrievalBranch;
  rank: Rank;
  score: Score;
  profile_id: ProfileId4;
  relation: Relation;
  evidence_id: EvidenceId5;
}
export interface AnnotationSet {
  sample_id: SampleId23;
  dataset_id: DatasetId31;
  width: Width2;
  height: Height2;
  quality_status: QualityStatus1;
  quality_source: QualitySource3;
  annotations: Annotations1;
  availability: AnnotationAvailability;
  dataset_format: DatasetFormat1;
  policy: AnnotationPolicy1;
  errors: Errors2;
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
  status: Status15;
  policy_relation: PolicyRelation;
  matches: Matches;
  differences: Differences;
  invalid_left: InvalidLeft;
  invalid_right: InvalidRight;
  confirmed_conflict: ConfirmedConflict1;
  ignore_regions: IgnoreRegions;
  masking: Masking;
  coordinate_frame: CoordinateFrame;
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
  min_similarity: MinSimilarity2;
  retrieval_completeness: RetrievalCompleteness;
}
export interface SampleImageQuery1 {
  kind: Kind20;
  sample_id: SampleId24;
}
export interface TemporaryImageQuery1 {
  kind: Kind21;
  image_ref: ImageRef1;
}
export interface RetrievalBranchPage {
  status: Status16;
  corpus_coverage: CoverageCount;
  groups: Groups;
  group_count: GroupCount;
  member_count: MemberCount1;
  next_cursor: NextCursor;
  error_code: ErrorCode1;
  reason: Reason11;
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
  sample_id: SampleId25;
  dataset_id: DatasetId32;
  quality_status: QualityStatus1;
  relation: Relation1;
  pixel: PixelComparison;
  near: NearVerification | null;
  local: RegionPixelStatistics | null;
  registration: Registration | null;
  annotation: AnnotationComparison | null;
  error_code: ErrorCode;
  reason: Reason10;
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
  status: Status17;
  regions: Regions2;
  compared_pixels: ComparedPixels1;
  changed_pixels: ChangedPixels1;
  max_abs_diff: MaxAbsDiff1;
  reason: Reason8;
}
export interface Registration {
  status: Status18;
  reason: Reason9;
  candidate_to_main: CandidateToMain;
  matches: Matches1;
  inliers: Inliers;
  main_visible_fraction: MainVisibleFraction;
  mean_absolute_residual: MeanAbsoluteResidual;
  reprojection_error_px: ReprojectionErrorPx;
}
export interface TemporaryImageRef {
  image_ref: ImageRef2;
  sha256: Sha2563;
  source_bytes: SourceBytes;
  expires_in_seconds: ExpiresInSeconds;
}
export interface AuditConsistencyView {
  check_id: CheckId9;
  run_id: RunId10;
  sample_id: SampleId26;
  scope_id: ScopeId2;
  mode: Mode3;
  profile_id: ProfileId7;
  status: Status19;
  coverage: ConsistencyCoverage | null;
  references: References;
  error_code: ErrorCode2;
  reason: Reason12;
  results: Results1;
}
export interface AuditResultReference {
  result_id: ResultId1;
  evidence_id: EvidenceId6;
  sample_id: SampleId27;
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
export interface AuditSourceCatalog {
  knowledge_jobs: KnowledgeJobs;
  consistency_jobs: ConsistencyJobs;
  benchmark_builds: BenchmarkBuilds;
}
export interface AuditKnowledgeSource {
  job_id: JobId1;
  dataset_id: DatasetId33;
  version_id: VersionId19;
  submitted_at: SubmittedAt4;
  started_at: StartedAt8;
  finished_at: FinishedAt5;
  entries: Entries;
  publication_status: PublicationStatus;
}
export interface AuditConsistencySource {
  job_id: JobId2;
  dataset_ids: DatasetIds6;
  submitted_at: SubmittedAt5;
  started_at: StartedAt9;
  finished_at: FinishedAt6;
  conflict_count: ConflictCount1;
  batch_id: BatchId1;
}
export interface AuditBenchmarkChoice {
  build_id: BuildId;
  name: Name10;
  source_images: SourceImages;
  covered_images: CoveredImages;
}
export interface AuditMasterContext {
  kind: Kind22;
  job_id: JobId3;
  phase: Phase5;
  batch: AuditBatch | null;
  revision: Revision3;
  items: Items7;
  discoveries: Discoveries;
  context_policy: ContextPolicy;
  reviews: Reviews;
  dataset_profile: AuditDatasetProfile;
  applicable_issue_types: ApplicableIssueTypes;
  statistics: AuditStatistics;
  knowledge: AuditKnowledge | null;
}
export interface AuditBatch {
  number: Number;
  sample_ids: SampleIds5;
  state: State3;
  clues_revision: CluesRevision;
  clues: Clues;
  review_revision: ReviewRevision;
}
export interface AuditClue {
  group_id: GroupId2;
  title: Title7;
  visual_signature: VisualSignature;
  annotation_relation: AnnotationRelation;
  next_batch_focus: NextBatchFocus;
  support_refs: SupportRefs;
  counter_refs: CounterRefs;
}
export interface AuditResultReference1 {
  sample_id: SampleId28;
  result_revision: ResultRevision;
  kind: Kind23;
  index: Index;
}
export interface AuditClueIndex {
  group_id: GroupId3;
  title: Title8;
  visual_signature: VisualSignature1;
  annotation_relation: AnnotationRelation1;
  next_batch_focus: NextBatchFocus1;
  support_image_count: SupportImageCount;
  counter_image_count: CounterImageCount;
}
export interface AuditMasterRecord {
  sample_id: SampleId29;
  result_revision: ResultRevision1;
  state: State4;
  final: AuditFinal | null;
  consistency: AuditMasterConsistency;
}
export interface AuditFinal {
  execution_status: ExecutionStatus;
  state: State5;
  analysis: Analysis;
  conclusion: Conclusion1;
  basis: Basis3;
  evidence_ids: EvidenceIds17;
  check_assessments: CheckAssessments2;
  consistency_review: ConsistencyReview;
  findings: Findings4;
  observations: Observations1;
  hypothesis_assessments: HypothesisAssessments;
  visual_features: VisualFeatures;
  selected_evidence: SelectedEvidence;
  limitations: Limitations16;
}
export interface AuditCheckAssessment {
  check_id: CheckId10;
  status: Status20;
  description: Description18;
  evidence_ids: EvidenceIds18;
}
export interface AuditConsistencyAssessment {
  source_issue_id: SourceIssueId;
  assessment: Assessment;
  reason: Reason13;
  evidence_ids: EvidenceIds19;
}
export interface AuditFinding1 {
  finding_id: FindingId5;
  description: Description19;
  location: Location6;
  check_ids: CheckIds7;
  evidence_ids: EvidenceIds20;
  normal_explanation: NormalExplanation7;
  limitations: Limitations15;
  type: Type2;
  annotation_ids: AnnotationIds1;
  consistency_issue_refs: ConsistencyIssueRefs;
}
export interface AuditObservation {
  description: Description20;
  annotation_ids: AnnotationIds2;
  evidence_ids: EvidenceIds21;
}
export interface AuditHypothesisAssessment {
  group_id: GroupId4;
  assessment: Assessment1;
  reason: Reason14;
  evidence_ids: EvidenceIds22;
}
export interface AuditVisualFeature {
  kind: Kind24;
  description: Description21;
  annotation_ids: AnnotationIds3;
  evidence_ids: EvidenceIds23;
}
export interface AnalysisEvidenceCandidate {
  evidence_id: EvidenceId8;
  reason: Reason15;
}
export interface AuditMasterConsistency {
  source_status: SourceStatus;
  reason: Reason16;
  program_conclusion: ProgramConclusion;
  model_conclusion: ModelConclusion;
  result: Result;
  gates: Gates;
}
export interface NoCandidateResult {
  task_type: TaskType;
  candidate_record_ids: CandidateRecordIds;
  execution_status: ExecutionStatus1;
  result: Result1;
  pass_reason: PassReason;
  candidate_stats: CandidateStats | null;
  candidate_gate_ids: CandidateGateIds;
  issues: Issues;
  schema_version: SchemaVersion;
  verdict: Verdict;
  reason: Reason17;
  conclusion: Conclusion2;
  categories: Categories1;
  assessments: Assessments;
}
export interface CandidateStats {
  retrieved: Retrieved;
  eligible: Eligible;
  rejected: Rejected;
  unverified: Unverified;
  assessed: Assessed;
  consistent: Consistent;
  discrepancy: Discrepancy;
  undetermined: Undetermined;
  failed: Failed3;
  pending: Pending2;
}
export interface MainAnnotationIssue {
  issue_id: IssueId;
  type: Type3;
  main_annotation_ids: MainAnnotationIds;
  description: Description22;
  supporting_assessment_ids: SupportingAssessmentIds;
  evidence: Evidence4;
  limitations: Limitations17;
  review_suggestion: ReviewSuggestion;
  main_label: MainLabel;
}
export interface MainIssueEvidence {
  assessment_id: AssessmentId;
  candidate_id: CandidateId;
  candidate_annotation_ids: CandidateAnnotationIds;
  media_ids: MediaIds;
  candidate_label: CandidateLabel;
  same_main_object_as: SameMainObjectAs;
}
export interface CandidateObjectReference {
  candidate_id: CandidateId1;
  annotation_ids: AnnotationIds4;
}
export interface NoEligibleResult {
  task_type: TaskType1;
  candidate_record_ids: CandidateRecordIds1;
  execution_status: ExecutionStatus2;
  result: Result2;
  pass_reason: PassReason1;
  candidate_stats: CandidateStats | null;
  candidate_gate_ids: CandidateGateIds1;
  issues: Issues1;
  schema_version: SchemaVersion1;
  verdict: Verdict1;
  reason: Reason18;
  conclusion: Conclusion3;
  categories: Categories2;
  assessments: Assessments1;
}
export interface ModelReviewedResult {
  task_type: TaskType2;
  candidate_record_ids: CandidateRecordIds2;
  execution_status: ExecutionStatus3;
  result: Result3;
  pass_reason: PassReason2;
  candidate_stats: CandidateStats | null;
  candidate_gate_ids: CandidateGateIds2;
  issues: Issues2;
  overall: GroupOverallConclusion;
  conclusions: Conclusions;
  limitations: Limitations18;
  assessments: Assessments2;
  schema_version: SchemaVersion2;
  reason: Reason19;
  fingerprint: Fingerprint;
  observation_ids: ObservationIds;
}
/**
 * 整组唯一简短结论；详细分析保留在conclusions
 */
export interface GroupOverallConclusion {
  text: Text6;
  verdict: Verdict2;
  references: References1;
}
export interface GroupAnalysisReference {
  candidate_id: CandidateId2;
  comparison: GroupAnalysisComparison | null;
}
export interface GroupAnalysisComparison {
  result_id: ResultId3;
  evidence_id: EvidenceId9;
  difference_id: DifferenceId1;
}
export interface GroupAnalysisConclusion {
  text: Text7;
  references: References2;
}
export interface GroupPairAssessment {
  candidate_id: CandidateId3;
  verdict: Verdict3;
  explanation: Explanation;
  findings: Findings5;
  limitations: Limitations19;
  issues: Issues3;
  conclusion: Conclusion4;
  categories: Categories3;
}
export interface BboxAnnotationIssue {
  description: Description23;
  media_ids: MediaIds1;
  limitations: Limitations20;
  review_suggestion: ReviewSuggestion1;
  type: Type4;
  main_annotation_ids: MainAnnotationIds1;
  candidate_annotation_ids: CandidateAnnotationIds1;
  region_pair_ids: RegionPairIds;
  coverage_effect: CoverageEffect;
  coverage_reason: CoverageReason;
  same_main_object_as: SameMainObjectAs1;
}
export interface ImageLabelIssue {
  description: Description24;
  media_ids: MediaIds2;
  limitations: Limitations21;
  review_suggestion: ReviewSuggestion2;
  type: Type5;
  main_label: MainLabel1;
  candidate_label: CandidateLabel1;
}
export interface ObservationIds {
  [k: string]: string[];
}
export interface AuditMasterComparison {
  candidate_id: CandidateId4;
  gate_status: GateStatus;
  relation: Relation3;
  reason: Reason20;
  limitations: Limitations22;
}
export interface AuditDiscovery {
  group_id: GroupId5;
  kind: Kind25;
  dimension: Dimension;
  status: Status21;
  title: Title9;
  description: Description25;
  visual_signature: VisualSignature2;
  annotation_relation: AnnotationRelation2;
  scope: Scope2;
  key_difference: KeyDifference;
  unresolved_question: UnresolvedQuestion;
  next_batch_focus: NextBatchFocus2;
  support_refs: SupportRefs1;
  counter_refs: CounterRefs1;
  representatives: Representatives;
  affected_image_count: AffectedImageCount;
}
export interface AuditRepresentative {
  sample_id: SampleId30;
  role: Role5;
  reason: Reason21;
}
export interface AuditDiscoveryIndex {
  group_id: GroupId6;
  title: Title10;
  status: Status22;
  next_batch_focus: NextBatchFocus3;
  support_image_count: SupportImageCount1;
  counter_image_count: CounterImageCount1;
  representatives: Representatives1;
}
export interface AuditRecheck {
  sample_id: SampleId31;
  result_revision: ResultRevision2;
  reason: Reason22;
  conflict_refs: ConflictRefs;
  review_id: ReviewId;
  batch_number: BatchNumber;
  state: State6;
  error: Error1;
}
export interface AuditDatasetProfile {
  total_images: TotalImages1;
  dataset_format: DatasetFormat2;
  registered_quality: RegisteredQuality;
  geometry: AuditGeometryProfile | null;
  metadata: Metadata;
  strict_duplicate_groups: StrictDuplicateGroups;
  strict_duplicate_images: StrictDuplicateImages;
  near_candidate_pairs: NearCandidatePairs;
  benchmark: AuditBenchmarkSource | null;
  contrast_measurement: ContrastMeasurement;
}
export interface RegisteredQuality {
  [k: string]: number;
}
export interface AuditGeometryProfile {
  box_count: BoxCount;
  annotated_images: AnnotatedImages;
  instance_distribution: InstanceDistribution;
  relative_area: AuditQuantiles | null;
  relative_width: AuditQuantiles | null;
  relative_height: AuditQuantiles | null;
  aspect_ratio: AuditQuantiles | null;
  center_x: AuditQuantiles | null;
  center_y: AuditQuantiles | null;
}
export interface InstanceDistribution {
  [k: string]: number;
}
export interface AuditQuantiles {
  minimum: Minimum;
  q25: Q25;
  median: Median;
  q75: Q75;
  maximum: Maximum;
}
export interface Metadata {
  [k: string]: AuditMetadataCoverage;
}
export interface AuditMetadataCoverage {
  covered_images: CoveredImages1;
  distinct_count: DistinctCount;
  distribution: Distribution;
}
export interface Distribution {
  [k: string]: number;
}
export interface AuditBenchmarkSource {
  build_id: BuildId1;
  source_image_count: SourceImageCount;
  covered_images: CoveredImages2;
  source_matches_scope: SourceMatchesScope;
  split_distribution: SplitDistribution;
  confirmed_gold_images: ConfirmedGoldImages;
  pixel_gold_images: PixelGoldImages;
  leakage: LeakageReport;
  readiness: BenchmarkReadiness;
  source_hashes: SourceHashes;
}
export interface SplitDistribution {
  [k: string]: number;
}
export interface LeakageReport {
  is_passed: IsPassed;
  total_violations: TotalViolations;
  physical_leakages?: PhysicalLeakages;
  capture_leakages?: CaptureLeakages;
  duplicate_leakages?: DuplicateLeakages;
  component_leakages?: ComponentLeakages;
  augmented_leakages?: AugmentedLeakages;
  strict_content_leakages?: StrictContentLeakages;
}
export interface BenchmarkReadiness {
  standard_ad: TrackReadinessItem;
  open_hard_normal: TrackReadinessItem;
  domain_shift: TrackReadinessItem;
  small_weak: TrackReadinessItem;
  global_logical: TrackReadinessItem;
}
export interface TrackReadinessItem {
  track_name: TrackName;
  status: TrackStatus;
  reason: Reason23;
  metrics?: Metrics;
}
export interface Metrics {
  [k: string]: unknown;
}
export interface SourceHashes {
  [k: string]: string;
}
export interface AuditStatistics {
  total_images: TotalImages2;
  completed_images: CompletedImages;
  normal_images: NormalImages2;
  suspect_images: SuspectImages;
  incomplete_images: IncompleteImages;
  completion_rate: CompletionRate;
  suspect_rate_among_completed: SuspectRateAmongCompleted;
  issue_occurrences: IssueOccurrences;
  issue_types: IssueTypes;
  datasets: Datasets;
  consistency_cross: ConsistencyCross;
  consistency_assessments: ConsistencyAssessments;
  knowledge_assessments: KnowledgeAssessments;
  upstream_issue_types: UpstreamIssueTypes;
  program_issue_types: ProgramIssueTypes;
  observation_images: ObservationImages;
  observation_occurrences: ObservationOccurrences;
}
export interface IssueTypes {
  [k: string]: AuditCount;
}
export interface AuditCount {
  image_count: ImageCount3;
  occurrences: Occurrences;
}
export interface Datasets {
  [k: string]: {
    [k: string]: number;
  };
}
export interface ConsistencyCross {
  [k: string]: {
    [k: string]: number;
  };
}
export interface ConsistencyAssessments {
  [k: string]: number;
}
export interface KnowledgeAssessments {
  [k: string]: {
    [k: string]: number;
  };
}
export interface UpstreamIssueTypes {
  [k: string]: AuditCount;
}
export interface AuditKnowledge {
  selection: AuditKnowledgeSelection;
  source_scope: AuditKnowledgeScope;
  directions: Directions4;
  entries: Entries1;
  evidence: Evidence5;
}
export interface AuditKnowledgeScope {
  dataset_ids: DatasetIds7;
  revision: Revision4;
  execution_status: ExecutionStatus4;
  execution_error: ModelCallError | null;
  coverage: AnalysisCoverageSummary;
  finalization_complete: FinalizationComplete;
}
export interface AnalysisCoverageSummary {
  total: Total8;
  completed: Completed3;
  failed: Failed4;
  unprocessed: Unprocessed2;
  prepared_visuals: PreparedVisuals;
  observed_visuals: ObservedVisuals;
  whole_images_observed: WholeImagesObserved;
}
export interface AuditKnowledgeDirection {
  ref: Ref1;
  source: Source9;
  title: Title11;
  instruction: Instruction9;
}
export interface AuditSelectedCheck {
  check: Check;
  review: KnowledgeCheckReview;
}
export interface AnalysisKnowledgeCheck {
  status: Status23;
  independent_source_count: IndependentSourceCount;
  suggested_status: SuggestedStatus;
  support_limitations: SupportLimitations2;
  assessment_reason: AssessmentReason;
  change_reason: ChangeReason;
  key_evidence: KeyEvidence;
  title: Title12;
  subject: Subject3;
  location: Location7;
  criterion: Criterion3;
  allowed_variations: AllowedVariations3;
  limitations: Limitations23;
  check_id: CheckId11;
  direction_refs: DirectionRefs;
  dataset_ids: DatasetIds8;
  support_evidence_ids: SupportEvidenceIds3;
  counter_evidence_ids: CounterEvidenceIds3;
  predecessor_check_ids: PredecessorCheckIds1;
}
export interface AnalysisKeyEvidence {
  evidence_id: EvidenceId10;
  role: Role6;
  reason: Reason24;
}
export interface AuditBatchCommit {
  commit_key: CommitKey;
  batch_number: BatchNumber1;
  base_revision: BaseRevision;
  discoveries: Discoveries1;
  review_requests?: ReviewRequests;
}
export interface AuditDiscovery1 {
  group_id: GroupId7;
  kind: Kind26;
  dimension: Dimension1;
  status: Status24;
  title: Title13;
  description: Description26;
  visual_signature: VisualSignature3;
  annotation_relation: AnnotationRelation3;
  scope: Scope3;
  key_difference?: KeyDifference1;
  unresolved_question?: UnresolvedQuestion1;
  next_batch_focus?: NextBatchFocus4;
  support_refs: SupportRefs2;
  counter_refs?: CounterRefs2;
  representatives?: Representatives2;
}
export interface AuditResultReference2 {
  sample_id: SampleId32;
  result_revision: ResultRevision3;
  kind: Kind27;
  index?: Index1;
}
export interface AuditRepresentative1 {
  sample_id: SampleId33;
  role?: Role7;
  reason: Reason25;
}
export interface AuditReviewRequest {
  sample_id: SampleId34;
  result_revision: ResultRevision4;
  reason: Reason26;
  conflict_refs: ConflictRefs1;
}
export interface AuditBatchDelta {
  commit_key: CommitKey1;
  batch_number: BatchNumber2;
  base_revision: BaseRevision1;
  discoveries: Discoveries2;
  evidence_changes?: EvidenceChanges;
  representative_changes?: RepresentativeChanges;
  review_requests?: ReviewRequests1;
}
export interface AuditDiscoveryBody {
  group_id: GroupId8;
  kind: Kind28;
  dimension: Dimension2;
  status: Status25;
  title: Title14;
  description: Description27;
  visual_signature: VisualSignature4;
  annotation_relation: AnnotationRelation4;
  scope: Scope4;
  key_difference?: KeyDifference2;
  unresolved_question?: UnresolvedQuestion2;
  next_batch_focus?: NextBatchFocus5;
}
export interface AuditEvidenceChange {
  group_id: GroupId9;
  action: Action2;
  role: Role8;
  reference: AuditResultReference2;
  reason: Reason27;
}
export interface AuditRepresentativeChange {
  group_id: GroupId10;
  representatives: Representatives3;
}
export interface AuditDiscoveryQuery {
  group_id: GroupId11;
  revision?: Revision5;
  page?: Page10;
  page_size?: PageSize10;
  role?: Role9;
}
export interface AuditEvidenceCommit {
  commit_key: CommitKey2;
  final: AuditFinal1;
}
export interface AuditFinal1 {
  execution_status: ExecutionStatus5;
  state: State7;
  analysis: Analysis1;
  conclusion: Conclusion5;
  basis: Basis4;
  evidence_ids: EvidenceIds24;
  check_assessments: CheckAssessments3;
  consistency_review: ConsistencyReview1;
  findings: Findings6;
  observations?: Observations2;
  hypothesis_assessments?: HypothesisAssessments1;
  visual_features?: VisualFeatures1;
  selected_evidence?: SelectedEvidence1;
  limitations: Limitations25;
}
export interface AuditFinding2 {
  finding_id: FindingId6;
  description: Description28;
  location: Location8;
  check_ids?: CheckIds8;
  evidence_ids: EvidenceIds25;
  normal_explanation: NormalExplanation8;
  limitations: Limitations24;
  type: Type6;
  annotation_ids?: AnnotationIds5;
  consistency_issue_refs?: ConsistencyIssueRefs1;
}
export interface AuditObservation1 {
  description: Description29;
  annotation_ids?: AnnotationIds6;
  evidence_ids: EvidenceIds26;
}
export interface AuditVisualFeature1 {
  kind: Kind29;
  description: Description30;
  annotation_ids?: AnnotationIds7;
  evidence_ids: EvidenceIds27;
}
export interface AuditMediaQuery {
  sample_id: SampleId35;
  offset?: Offset;
  limit?: Limit;
  view?: View;
}
export interface AuditSampleQuery {
  run_id: RunId11;
  page: Page11;
  page_size: PageSize11;
  status: Status26;
  search: Search5;
  issue_type: IssueType;
  group_id: GroupId12;
  consistency_assessment: ConsistencyAssessment;
  knowledge_id: KnowledgeId;
}
export interface AuditSamplePage {
  run_id: RunId12;
  total: Total9;
  page: Page12;
  page_size: PageSize12;
  distribution: Distribution1;
  items: Items8;
  archived: Archived;
}
export interface Distribution1 {
  [k: string]: number;
}
export interface AuditSampleItem {
  run_id: RunId13;
  sample_id: SampleId36;
  dataset_id: DatasetId34;
  filename: Filename;
  width: Width3;
  height: Height3;
  audit_state: AuditState;
  overview_evidence_id: OverviewEvidenceId1;
  has_findings: HasFindings;
  insufficient_evidence: InsufficientEvidence;
  consistency_pending: ConsistencyPending;
  session_id: SessionId2;
  execution_status: ExecutionStatus6;
}
export interface AuditRunReport {
  run_id: RunId14;
  dataset_id: DatasetId35;
  status: Status27;
  total_samples: TotalSamples3;
  audited_samples: AuditedSamples;
  coverage_percent: CoveragePercent;
  suspect_samples: SuspectSamples1;
  insufficient_samples: InsufficientSamples;
  consistency_pending_samples: ConsistencyPendingSamples;
  distribution: Distribution2;
  knowledge_version_id: KnowledgeVersionId5;
  model_name: ModelName5;
  submitted_at: SubmittedAt6;
  finished_at: FinishedAt7;
  generated_at: GeneratedAt1;
  conclusion: Conclusion6;
  limitations: Limitations26;
  export_ready: ExportReady;
  statistics: AuditStatistics | null;
  consistency_job_id: ConsistencyJobId1;
  report_state: ReportState;
  report_session_id: ReportSessionId;
  consistency_analysis: ConsistencyAnalysis;
  knowledge_analysis: KnowledgeAnalysis;
  dataset_names: DatasetNames;
  knowledge_titles: KnowledgeTitles;
  evidence_groups: EvidenceGroups;
  discoveries: Discoveries3;
  dataset_profile: AuditDatasetProfile | null;
  coverage_analysis: CoverageAnalysis;
  coverage_topics: CoverageTopics;
  consistency_analyses: ConsistencyAnalyses;
  consistency_scopes: ConsistencyScopes;
  knowledge_entries: KnowledgeEntries;
  independence_analysis: IndependenceAnalysis;
  capabilities: Capabilities;
  usability: Usability;
  review_priorities: ReviewPriorities;
  report_cases: ReportCases;
  capability_topics: CapabilityTopics;
  archived: Archived1;
}
export interface Distribution2 {
  [k: string]: number;
}
export interface DatasetNames {
  [k: string]: string;
}
export interface KnowledgeTitles {
  [k: string]: string;
}
export interface EvidenceGroups {
  [k: string]: AuditReportImage[];
}
export interface AuditReportImage {
  sample_id: SampleId37;
  role: Role10;
  caption: Caption;
  reason: Reason28;
  image: VisualEvidence;
  source: AnalysisRegistration;
}
export interface AnalysisRegistration {
  sample: Sample;
  source_fingerprint: SourceFingerprint1;
  annotations: Annotations2;
  dataset_format: DatasetFormat3;
  sampling_group: SamplingGroup;
}
export interface AuditCoverageTopic {
  analysis: Analysis2;
  evidence_refs: EvidenceRefs;
  representatives: Representatives4;
  related_case_ids: RelatedCaseIds;
  title: Title15;
}
export interface AuditConsistencyAnalysis {
  analysis: Analysis3;
  evidence_refs: EvidenceRefs1;
  representatives: Representatives5;
  related_case_ids: RelatedCaseIds1;
  issue_type: IssueType1;
  title: Title16;
  description: Description31;
  audit_result: AuditResult;
}
export interface AuditConsistencyScope {
  source_status: SourceStatus1;
  analysis: Analysis4;
  evidence_refs: EvidenceRefs2;
  representatives: Representatives6;
}
export interface AuditReportedKnowledge {
  entry: AuditSelectedCheck;
  analysis: AuditKnowledgeAnalysis | null;
}
export interface AuditKnowledgeAnalysis {
  check_id: CheckId12;
  description: Description32;
  applicability: Applicability;
  analysis: Analysis5;
  audit_impact: AuditImpact;
  evidence_refs: EvidenceRefs3;
  representatives: Representatives7;
}
export interface AuditReportedCapability {
  tag: Tag;
  coverage_status: CoverageStatus;
  reason: Reason29;
  evidence_refs: EvidenceRefs4;
  representatives: Representatives8;
  missing_conditions: MissingConditions;
  readiness_status: ReadinessStatus;
  readiness_track: ReadinessTrack;
}
export interface AuditUsabilityAssessment {
  purpose: Purpose1;
  status: Status28;
  reason: Reason30;
}
export interface AuditReportCase {
  case_id: CaseId;
  title: Title17;
  observation: Observation2;
  comparison: Comparison;
  significance: Significance;
  evidence_refs: EvidenceRefs5;
  representatives: Representatives9;
}
export interface AuditCapabilityTopic {
  title: Title18;
  summary: Summary4;
  capability_tags: CapabilityTags;
  points: Points;
  missing_conditions: MissingConditions1;
}
export interface AuditCapabilityPoint {
  title: Title19;
  observation_and_comparison: ObservationAndComparison;
  evaluation_value: EvaluationValue;
  case_ids: CaseIds;
}
export interface AuditRecordQuery {
  page?: Page13;
  page_size?: PageSize13;
  sample_id?: SampleId38;
  issue_type?: IssueType2;
  consistency_assessment?: ConsistencyAssessment1;
  knowledge_id?: KnowledgeId1;
  state?: State8;
}
export interface AuditReportCommit {
  commit_key: CommitKey3;
  discovery_ids: DiscoveryIds;
  conclusion: Conclusion7;
  consistency_analysis: ConsistencyAnalysis1;
  knowledge_analysis?: KnowledgeAnalysis1;
  coverage_analysis: CoverageAnalysis1;
  coverage_topics?: CoverageTopics1;
  consistency_analyses?: ConsistencyAnalyses1;
  consistency_scopes?: ConsistencyScopes1;
  knowledge_analyses?: KnowledgeAnalyses;
  independence_analysis: IndependenceAnalysis1;
  capabilities: Capabilities1;
  usability: Usability1;
  review_priorities: ReviewPriorities1;
  limitations: Limitations27;
  report_cases?: ReportCases1;
  capability_topics?: CapabilityTopics1;
}
export interface AuditCoverageTopic1 {
  analysis: Analysis6;
  evidence_refs: EvidenceRefs6;
  representatives?: Representatives10;
  related_case_ids?: RelatedCaseIds2;
  title: Title20;
}
export interface AuditConsistencyAnalysis1 {
  analysis: Analysis7;
  evidence_refs: EvidenceRefs7;
  representatives?: Representatives11;
  related_case_ids?: RelatedCaseIds3;
  issue_type: IssueType3;
  title?: Title21;
  description?: Description33;
  audit_result?: AuditResult1;
}
export interface AuditConsistencyScope1 {
  source_status: SourceStatus2;
  analysis: Analysis8;
  evidence_refs?: EvidenceRefs8;
  representatives?: Representatives12;
}
export interface AuditKnowledgeAnalysis1 {
  check_id: CheckId13;
  description: Description34;
  applicability: Applicability1;
  analysis: Analysis9;
  audit_impact: AuditImpact1;
  evidence_refs: EvidenceRefs9;
  representatives?: Representatives13;
}
export interface AuditCapability {
  tag: Tag1;
  coverage_status: CoverageStatus1;
  reason: Reason31;
  evidence_refs: EvidenceRefs10;
  representatives?: Representatives14;
  missing_conditions?: MissingConditions2;
}
export interface AuditReportCase1 {
  case_id: CaseId1;
  title: Title22;
  observation: Observation3;
  comparison?: Comparison1;
  significance: Significance1;
  evidence_refs: EvidenceRefs11;
  representatives: Representatives15;
}
export interface AuditCapabilityTopic1 {
  title: Title23;
  summary: Summary5;
  capability_tags?: CapabilityTags1;
  points: Points1;
  missing_conditions?: MissingConditions3;
}
export interface AuditReportSession {
  job_id: JobId4;
  session_id: SessionId3;
  session_created: SessionCreated;
  state: State9;
  result: AuditReportCommit1 | null;
  error: Error2;
  revision: Revision6;
  discoveries: Discoveries4;
}
export interface AuditReportCommit1 {
  commit_key: CommitKey4;
  discovery_ids: DiscoveryIds1;
  conclusion: Conclusion8;
  consistency_analysis: ConsistencyAnalysis2;
  knowledge_analysis: KnowledgeAnalysis2;
  coverage_analysis: CoverageAnalysis2;
  coverage_topics: CoverageTopics2;
  consistency_analyses: ConsistencyAnalyses2;
  consistency_scopes: ConsistencyScopes2;
  knowledge_analyses: KnowledgeAnalyses1;
  independence_analysis: IndependenceAnalysis2;
  capabilities: Capabilities2;
  usability: Usability2;
  review_priorities: ReviewPriorities2;
  limitations: Limitations28;
  report_cases: ReportCases2;
  capability_topics: CapabilityTopics2;
}
export interface AuditCapability1 {
  tag: Tag2;
  coverage_status: CoverageStatus2;
  reason: Reason32;
  evidence_refs: EvidenceRefs12;
  representatives: Representatives16;
  missing_conditions: MissingConditions4;
}
export interface AuditReportEvidenceQuery {
  sample_id: SampleId39;
  evidence_id: EvidenceId11;
}
export interface KnowledgeCheckReviewSubmission {
  version_id: VersionId20;
  check_id: CheckId14;
  submission_id: SubmissionId6;
  expected_revision: ExpectedRevision3;
  status: Status29;
  note?: Note1;
}
export interface SubmittedMiningPrompt {
  objective: Objective3;
  directions: Directions5;
  instruction: Instruction10;
  exploration: MiningExploration | null;
}
export interface AnalysisWave {
  wave_id: WaveId;
  tasks: Tasks;
}
export interface AnalysisBatchTask {
  round: AnalysisRound;
  wave_id: WaveId1;
  session_id: SessionId4;
  catalog_revision: CatalogRevision;
  catalog: AnalysisCatalog;
  report: Report;
  reviewed: Reviewed;
}
export interface AnalysisRound {
  round_id: RoundId;
  targets: Targets;
  sampling_counts: SamplingCounts | null;
}
export interface AnalysisTarget {
  dataset_id: DatasetId36;
  sample_id: SampleId40;
  candidate_role: CandidateRole;
}
export interface SamplingCounts {
  normal: Normal;
  abnormal: Abnormal;
  unclassified: Unclassified;
}
export interface AnalysisCatalog {
  summary: Summary6;
  directions: Directions6;
  checks: Checks4;
  limitations: Limitations30;
  unresolved_questions: UnresolvedQuestions;
}
export interface AnalysisDirection {
  change_reason: ChangeReason1;
  key_evidence: KeyEvidence1;
  title: Title24;
  instruction: Instruction11;
  applies_to: AppliesTo1;
  rationale: Rationale1;
  limitations: Limitations29;
  direction_id: DirectionId7;
  dataset_ids: DatasetIds9;
  evidence_ids: EvidenceIds28;
  counter_evidence_ids: CounterEvidenceIds4;
  predecessor_direction_ids: PredecessorDirectionIds;
}
export interface ExplorationBatchReport {
  observations: Observations3;
  assessments: Assessments3;
  discoveries: Discoveries5;
  discovery_summary: DiscoverySummary;
  limitations: Limitations33;
  unresolved_questions: UnresolvedQuestions1;
  key_evidence_ids: KeyEvidenceIds;
}
export interface AnalysisSampleObservation {
  dataset_id: DatasetId37;
  sample_id: SampleId41;
  description: Description35;
  evidence_ids: EvidenceIds29;
  directions: Directions7;
  limitations: Limitations31;
  report_preparation_error: ReportPreparationError;
}
export interface AnalysisDirectionObservation {
  direction_ref: DirectionRef;
  status: Status30;
  reason: Reason33;
}
export interface ExplorationAssessment {
  direction_id: DirectionId8;
  role: Role11;
  evidence_ids: EvidenceIds30;
  reason: Reason34;
}
export interface ExplorationDiscovery {
  title: Title25;
  instruction: Instruction12;
  applies_to: AppliesTo2;
  rationale: Rationale2;
  limitations: Limitations32;
  evidence_ids: EvidenceIds31;
  candidate_id: CandidateId5;
}
export interface KnowledgeBatchReport {
  observations: Observations4;
  assessments: Assessments4;
  discoveries: Discoveries6;
  discovery_summary: DiscoverySummary1;
  limitations: Limitations35;
  unresolved_questions: UnresolvedQuestions2;
  key_evidence_ids: KeyEvidenceIds1;
}
export interface KnowledgeAssessment {
  check_id: CheckId15;
  role: Role12;
  evidence_ids: EvidenceIds32;
  reason: Reason35;
}
export interface KnowledgeDiscovery1 {
  title: Title26;
  subject: Subject4;
  location: Location9;
  criterion: Criterion4;
  allowed_variations: AllowedVariations4;
  limitations: Limitations34;
  status: Status31;
  support_evidence_ids: SupportEvidenceIds4;
  counter_evidence_ids: CounterEvidenceIds5;
  candidate_id: CandidateId6;
  direction_refs: DirectionRefs1;
  dataset_ids: DatasetIds10;
}
export interface ExplorationEvidenceReport {
  observations: Observations5;
  assessments: Assessments5;
  discoveries: Discoveries7;
  discovery_summary: DiscoverySummary2;
  limitations: Limitations36;
  unresolved_questions: UnresolvedQuestions3;
  selected_evidence: SelectedEvidence2;
}
export interface KnowledgeEvidenceReport {
  observations: Observations6;
  assessments: Assessments6;
  discoveries: Discoveries8;
  discovery_summary: DiscoverySummary3;
  limitations: Limitations37;
  unresolved_questions: UnresolvedQuestions4;
  selected_evidence: SelectedEvidence3;
}
export interface ExplorationBatchReport1 {
  observations?: Observations7;
  assessments: Assessments7;
  discoveries: Discoveries9;
  discovery_summary: DiscoverySummary4;
  limitations?: Limitations39;
  unresolved_questions?: UnresolvedQuestions5;
  key_evidence_ids: KeyEvidenceIds2;
}
export interface AnalysisSampleObservation1 {
  dataset_id: DatasetId38;
  sample_id: SampleId42;
  description: Description36;
  evidence_ids: EvidenceIds33;
  directions?: Directions8;
  limitations?: Limitations38;
  report_preparation_error?: ReportPreparationError1;
}
export interface KnowledgeBatchReport1 {
  observations: Observations8;
  assessments: Assessments8;
  discoveries: Discoveries10;
  discovery_summary: DiscoverySummary5;
  limitations?: Limitations41;
  unresolved_questions?: UnresolvedQuestions6;
  key_evidence_ids: KeyEvidenceIds3;
}
export interface KnowledgeDiscovery2 {
  title: Title27;
  subject: Subject5;
  location: Location10;
  criterion: Criterion5;
  allowed_variations: AllowedVariations5;
  limitations: Limitations40;
  status: Status32;
  support_evidence_ids: SupportEvidenceIds5;
  counter_evidence_ids: CounterEvidenceIds6;
  candidate_id: CandidateId7;
  direction_refs: DirectionRefs2;
  dataset_ids: DatasetIds11;
}
export interface AnalysisWorkerMaterials {
  role: Role13;
  job_id: JobId5;
  task: AnalysisBatchTask;
  sources: Sources1;
  registrations: Registrations;
  selected_directions: SelectedDirections;
}
export interface RegistrationMediaPage {
  sample_id: SampleId43;
  evidence_id: EvidenceId12;
  total: Total10;
  offset: Offset1;
  images: Images;
  error: Error3;
}
export interface RegistrationMedia {
  sample_id: SampleId44;
  dataset_id: DatasetId39;
  image: VisualEvidence;
  model_context: ModelContext;
  path: Path3;
  required: Required;
}
export interface ModelContext {
  [k: string]: unknown;
}
export interface ExplorationEvidenceReport1 {
  observations?: Observations9;
  assessments: Assessments9;
  discoveries: Discoveries11;
  discovery_summary: DiscoverySummary6;
  limitations?: Limitations42;
  unresolved_questions?: UnresolvedQuestions7;
  selected_evidence: SelectedEvidence4;
}
export interface KnowledgeEvidenceReport1 {
  observations: Observations10;
  assessments: Assessments10;
  discoveries: Discoveries12;
  discovery_summary: DiscoverySummary7;
  limitations?: Limitations43;
  unresolved_questions?: UnresolvedQuestions8;
  selected_evidence: SelectedEvidence5;
}
export interface ExplorationDeltaCommit {
  selections?: Selections;
  commit_key: CommitKey5;
  base_revision: BaseRevision2;
  summary: Summary7;
  limitations: Limitations44;
  unresolved_questions: UnresolvedQuestions9;
  merges?: Merges;
  arguments?: Arguments;
  citation_corrections?: CitationCorrections;
  round_id: RoundId1;
  observations?: Observations11;
  directions: Directions9;
  report_reviews?: ReportReviews;
}
export interface AnalysisSelectionChange {
  entry_id: EntryId;
  key_evidence: KeyEvidence2;
}
export interface AnalysisCatalogMerge {
  target_id: TargetId;
  source_ids: SourceIds;
  reason: Reason36;
}
export interface AnalysisArgumentEdit {
  entry_id: EntryId1;
  evidence_id: EvidenceId13;
  role: Role14;
  reason: Reason37;
  state?: State10;
  observation_id?: ObservationId;
}
export interface AnalysisCitationCorrection {
  entry_id: EntryId2;
  evidence_id: EvidenceId14;
  whole_image_id: WholeImageId;
}
export interface AnalysisDirectionBody {
  change_reason?: ChangeReason2;
  title: Title28;
  instruction: Instruction13;
  applies_to: AppliesTo3;
  rationale: Rationale3;
  limitations: Limitations45;
  direction_id: DirectionId9;
  dataset_ids: DatasetIds12;
}
export interface ExplorationReportReview {
  round_id: RoundId2;
  discovery_decisions: DiscoveryDecisions;
}
export interface ExplorationDiscoveryDecision {
  candidate_id: CandidateId8;
  action: Action3;
  direction_id?: DirectionId10;
  reason: Reason38;
}
export interface KnowledgeDeltaCommit {
  selections?: Selections1;
  commit_key: CommitKey6;
  base_revision: BaseRevision3;
  summary: Summary8;
  limitations: Limitations46;
  unresolved_questions: UnresolvedQuestions10;
  merges?: Merges1;
  arguments?: Arguments1;
  citation_corrections?: CitationCorrections1;
  round_id: RoundId3;
  observations: Observations12;
  checks: Checks5;
  report_reviews?: ReportReviews1;
}
export interface AnalysisCheckBody {
  change_reason?: ChangeReason3;
  title: Title29;
  subject: Subject6;
  location: Location11;
  criterion: Criterion6;
  allowed_variations: AllowedVariations6;
  limitations: Limitations47;
  status: Status33;
  check_id: CheckId16;
  direction_refs: DirectionRefs3;
  dataset_ids: DatasetIds13;
}
export interface KnowledgeReportReview {
  round_id: RoundId4;
  discovery_decisions: DiscoveryDecisions1;
}
export interface KnowledgeDiscoveryDecision {
  candidate_id: CandidateId9;
  action: Action4;
  check_id?: CheckId17;
  reason: Reason39;
}
export interface ExplorationDeltaFinalize {
  selections?: Selections2;
  commit_key: CommitKey7;
  base_revision: BaseRevision4;
  summary: Summary9;
  limitations: Limitations48;
  unresolved_questions: UnresolvedQuestions11;
  merges?: Merges2;
  arguments?: Arguments2;
  citation_corrections?: CitationCorrections2;
  complete?: Complete1;
  directions: Directions10;
}
export interface KnowledgeDeltaFinalize {
  selections?: Selections3;
  commit_key: CommitKey8;
  base_revision: BaseRevision5;
  summary: Summary10;
  limitations: Limitations49;
  unresolved_questions: UnresolvedQuestions12;
  merges?: Merges3;
  arguments?: Arguments3;
  citation_corrections?: CitationCorrections3;
  complete?: Complete2;
  checks: Checks6;
  direction_reviews?: DirectionReviews;
}
export interface AnalysisDirectionReview {
  direction_ref: DirectionRef1;
  reason: Reason40;
}
export interface AnalysisEvidenceReferenceQuery {
  view?: View1;
  evidence_id: EvidenceId15;
}
export interface AnalysisImageQuery {
  view?: View2;
  sample_id: SampleId45;
}
export interface KnowledgeVersionCatalog {
  dataset_id: DatasetId40;
  current_version_id: CurrentVersionId1;
  versions: Versions2;
}
export interface RegistrationImageQuery {
  sample_id: SampleId46;
}
export interface ExplorationCropQuery {
  bbox: Bbox8;
  sample_id: SampleId47;
}
export interface AnalysisBatchMaterials {
  context: AnalysisAgentContext;
  registrations: Registrations2;
}
export interface AnalysisAgentContext {
  job_id: JobId6;
  session_id: SessionId5;
  session_created: SessionCreated1;
  revision: Revision7;
  catalog: AnalysisCatalog;
  round: AnalysisRound | null;
  registrations: Registrations1;
  selected_directions: SelectedDirections1;
  completed_sample_ids: CompletedSampleIds2;
  failed_sample_ids: FailedSampleIds2;
  accepted_observations: AcceptedObservations;
  media_progress: MediaProgress;
  catalog_counts: AnalysisCatalogCounts;
}
export interface AnalysisObservationRecord {
  dataset_id: DatasetId41;
  sample_id: SampleId48;
  description: Description37;
  evidence_ids: EvidenceIds34;
  directions: Directions11;
  limitations: Limitations50;
  report_preparation_error: ReportPreparationError2;
  observation_id: ObservationId1;
  round_id: RoundId5;
  revision: Revision8;
}
export interface AnalysisMediaProgress {
  dataset_id: DatasetId42;
  sample_id: SampleId49;
  state: State11;
  observed_evidence_ids: ObservedEvidenceIds;
  delivered_offsets: DeliveredOffsets;
  source_error: SourceError;
  evidence_id: EvidenceId16;
  required_media: RequiredMedia;
  supplemental_media: SupplementalMedia;
}
export interface VisualView {
  role: Role15;
  source: Source10;
  original_size: OriginalSize1;
  crop_bbox: CropBbox3;
  sent_size: SentSize1;
  sha256: Sha2564;
  source_sha256: SourceSha2563;
  representation: Representation1;
  annotation_ids: AnnotationIds8;
  annotation_sha256: AnnotationSha2561;
  media_type: MediaType1;
}
export interface AnalysisCatalogCounts {
  directions: Directions12;
  checks: Checks7;
}
export interface AnalysisManifest {
  dataset_ids: DatasetIds14;
  frozen_at: FrozenAt1;
  records: Records;
}
export interface AnalysisPlan {
  module: Module;
  batch_size: BatchSize;
  sampling_ratio: SamplingRatio | null;
  rounds: Rounds;
}
export interface SamplingRatio {
  normal: Normal1;
  abnormal: Abnormal1;
}
export interface RegistrationMediaQuery {
  sample_id: SampleId50;
  offset?: Offset2;
  limit?: Limit1;
}
export interface EvidenceReferenceQuery {
  evidence_id: EvidenceId17;
}
export interface ExplorationFinalize {
  commit_key: CommitKey9;
  base_revision: BaseRevision6;
  summary: Summary11;
  limitations: Limitations51;
  unresolved_questions: UnresolvedQuestions13;
  merges?: Merges4;
  arguments?: Arguments4;
  citation_corrections?: CitationCorrections4;
  complete?: Complete3;
  directions: Directions13;
}
export interface FinalizedAnalysisDirection {
  change_reason?: ChangeReason4;
  key_evidence: KeyEvidence3;
  title: Title30;
  instruction: Instruction14;
  applies_to: AppliesTo4;
  rationale: Rationale4;
  limitations: Limitations52;
  direction_id: DirectionId11;
  dataset_ids: DatasetIds15;
  evidence_ids: EvidenceIds35;
  counter_evidence_ids?: CounterEvidenceIds7;
}
export interface KnowledgeFinalize {
  commit_key: CommitKey10;
  base_revision: BaseRevision7;
  summary: Summary12;
  limitations: Limitations53;
  unresolved_questions: UnresolvedQuestions14;
  merges?: Merges5;
  arguments?: Arguments5;
  citation_corrections?: CitationCorrections5;
  complete?: Complete4;
  checks: Checks8;
  direction_reviews?: DirectionReviews1;
}
export interface FinalizedAnalysisCheck {
  change_reason?: ChangeReason5;
  key_evidence: KeyEvidence4;
  title: Title31;
  subject: Subject7;
  location: Location12;
  criterion: Criterion7;
  allowed_variations: AllowedVariations7;
  limitations: Limitations54;
  status: Status34;
  check_id: CheckId18;
  direction_refs: DirectionRefs4;
  dataset_ids: DatasetIds16;
  support_evidence_ids: SupportEvidenceIds6;
  counter_evidence_ids: CounterEvidenceIds8;
}
export interface AnalysisFinalizationContext {
  base_revision: BaseRevision8;
  reviewed_entry_ids: ReviewedEntryIds;
  pending_entry_ids: PendingEntryIds;
  direction_reviews: DirectionReviews2;
  complete: Complete5;
  version_id: VersionId21;
  phase: Phase6;
  job_id: JobId7;
  session_id: SessionId6;
  revision: Revision9;
  coverage: AnalysisCoverageSummary;
  entries: Entries2;
  selected_directions: SelectedDirections2;
  directions: Directions14;
  summary: Summary13;
  limitations: Limitations55;
  unresolved_questions: UnresolvedQuestions15;
}
export interface AnalysisFinalizationEntry {
  entry_id: EntryId3;
  title: Title32;
  dataset_ids: DatasetIds17;
  direction_refs: DirectionRefs5;
  predecessor_ids: PredecessorIds;
  argument_count: ArgumentCount;
  issues: Issues4;
}
export interface AnalysisDirectionCoverage {
  direction_ref: DirectionRef2;
  applicable: Applicable;
  not_applicable: NotApplicable;
  uncertain: Uncertain;
  failed: Failed5;
  entry_ids: EntryIds1;
}
export interface AnalysisFinalizationReceipt {
  base_revision: BaseRevision9;
  reviewed_entry_ids: ReviewedEntryIds1;
  pending_entry_ids: PendingEntryIds1;
  direction_reviews: DirectionReviews3;
  complete: Complete6;
  version_id: VersionId22;
  commit_key: CommitKey11;
  revision: Revision10;
}
export interface AnalysisArgumentQuery {
  entry_id: EntryId4;
  revision?: Revision11;
  offset?: Offset3;
  limit?: Limit2;
  role?: Role16;
  state?: State12;
  history?: History;
}
export interface AnalysisArgumentPage {
  job_id: JobId8;
  revision: Revision12;
  total: Total11;
  offset: Offset4;
  next_offset: NextOffset;
  items: Items9;
}
export interface AnalysisArgumentRecord {
  job_id: JobId9;
  entry_id: EntryId5;
  claim_revision: ClaimRevision;
  revision: Revision13;
  observation_id: ObservationId2;
  evidence_id: EvidenceId18;
  locator_id: LocatorId;
  role: Role17;
  state: State13;
  reason: Reason41;
  origin_entry_id: OriginEntryId;
}
export interface AnalysisEntryQuery {
  entry_id: EntryId6;
  revision?: Revision14;
  offset?: Offset5;
  limit?: Limit3;
}
export interface AnalysisClaimHistory {
  job_id: JobId10;
  entry_id: EntryId7;
  revision: Revision15;
  total: Total12;
  offset: Offset6;
  next_offset: NextOffset1;
  items: Items10;
}
export interface AnalysisClaimRevision {
  claim_revision: ClaimRevision1;
  revision: Revision16;
  reason: Reason42;
  content: Content;
}
export interface ProposedAnalysisDirection {
  change_reason: ChangeReason6;
  key_evidence: KeyEvidence5;
  title: Title33;
  instruction: Instruction15;
  applies_to: AppliesTo5;
  rationale: Rationale5;
  limitations: Limitations56;
  direction_id: DirectionId12;
  dataset_ids: DatasetIds18;
  evidence_ids: EvidenceIds36;
  counter_evidence_ids: CounterEvidenceIds9;
}
export interface ProposedAnalysisCheck {
  change_reason: ChangeReason7;
  key_evidence: KeyEvidence6;
  title: Title34;
  subject: Subject8;
  location: Location13;
  criterion: Criterion8;
  allowed_variations: AllowedVariations8;
  limitations: Limitations57;
  status: Status35;
  check_id: CheckId19;
  direction_refs: DirectionRefs6;
  dataset_ids: DatasetIds19;
  support_evidence_ids: SupportEvidenceIds7;
  counter_evidence_ids: CounterEvidenceIds10;
}
export interface AnalysisDirectionBody1 {
  change_reason: ChangeReason8;
  title: Title35;
  instruction: Instruction16;
  applies_to: AppliesTo6;
  rationale: Rationale6;
  limitations: Limitations58;
  direction_id: DirectionId13;
  dataset_ids: DatasetIds20;
}
export interface AnalysisCheckBody1 {
  change_reason: ChangeReason9;
  title: Title36;
  subject: Subject9;
  location: Location14;
  criterion: Criterion9;
  allowed_variations: AllowedVariations9;
  limitations: Limitations59;
  status: Status36;
  check_id: CheckId20;
  direction_refs: DirectionRefs7;
  dataset_ids: DatasetIds21;
}
export interface ExplorationAgentStart {
  submission_id: SubmissionId7;
  dataset_ids: DatasetIds22;
  analysis_kind: AnalysisKind2;
  normal_images: NormalImages3;
  defect_images: DefectImages2;
  prompt: FrozenExplorationPrompt;
  system_prompt: SystemPrompt3;
  observer_prompt: AnalysisRolePrompts | null;
}
export interface KnowledgeAgentStart {
  submission_id: SubmissionId8;
  dataset_ids: DatasetIds23;
  analysis_kind: AnalysisKind3;
  mining_prompt: SubmittedMiningPrompt;
  system_prompt: SystemPrompt4;
  observer_prompt: AnalysisRolePrompts | null;
}
export interface ExplorationAgentStart1 {
  submission_id: SubmissionId9;
  dataset_ids: DatasetIds24;
  analysis_kind?: AnalysisKind4;
  normal_images?: NormalImages4;
  defect_images?: DefectImages3;
  prompt: FrozenExplorationPrompt1;
  system_prompt?: SystemPrompt5;
  observer_prompt?: AnalysisRolePrompts | null;
}
export interface KnowledgeAgentStart1 {
  submission_id: SubmissionId10;
  dataset_ids: DatasetIds25;
  analysis_kind?: AnalysisKind5;
  mining_prompt: SubmittedMiningPrompt1;
  system_prompt?: SystemPrompt6;
  observer_prompt?: AnalysisRolePrompts | null;
}
export interface SubmittedMiningPrompt1 {
  objective: Objective4;
  directions: Directions15;
  instruction: Instruction18;
  exploration?: MiningExploration | null;
}
export interface MiningDirection1 {
  direction_id: DirectionId14;
  title: Title37;
  instruction: Instruction17;
  enabled?: Enabled2;
  origin?: Origin4;
  source?: Source11;
}
export interface PresetDirectionSource1 {
  origin?: Origin5;
  catalog_id?: CatalogId1;
  direction_id: DirectionId15;
  revision: Revision17;
}
export interface ExploredDirectionSource1 {
  origin?: Origin6;
  run_id: RunId15;
  version_id: VersionId23;
  direction_id: DirectionId16;
}
export interface AnalysisAgentConfiguration {
  module: Module1;
  settings_revision: SettingsRevision;
  settings: Settings;
}
export interface ExplorationSettingsValues {
  model: ModuleModelReference | null;
  reasoning_effort: ReasoningEffort3;
  batch_size: BatchSize1;
  sampling_ratio: SamplingRatio1;
  whole_image_max_side: WholeImageMaxSide;
  agent_limits: GenerationLimits;
  concurrency: Concurrency;
}
export interface ModuleModelReference {
  provider_id: ProviderId7;
  model_id: ModelId6;
}
export interface SamplingRatio1 {
  normal: Normal1;
  abnormal: Abnormal1;
}
export interface GenerationLimits {
  context_tokens: ContextTokens6;
  max_output_tokens: MaxOutputTokens6;
  request_parameters: RequestParameters4;
  generation_timeout_seconds: GenerationTimeoutSeconds4;
}
export interface RequestParameters4 {
  [k: string]: unknown;
}
export interface KnowledgeSettingsValues {
  model: ModuleModelReference | null;
  reasoning_effort: ReasoningEffort4;
  batch_size: BatchSize2;
  sampling_ratio: SamplingRatio2;
  whole_image_max_side: WholeImageMaxSide1;
  agent_limits: GenerationLimits;
  concurrency: Concurrency1;
}
export interface SamplingRatio2 {
  normal: Normal1;
  abnormal: Abnormal1;
}
export interface AnalysisScope {
  dataset_ids: DatasetIds26;
}
export interface AnalysisCatalogQuery {
  section: Section1;
  ids?: Ids;
  offset?: Offset7;
  limit?: Limit4;
}
export interface AnalysisCatalogPage {
  job_id: JobId11;
  revision: Revision18;
  section: Section2;
  total: Total13;
  offset: Offset8;
  next_offset: NextOffset2;
  items: Items11;
}
export interface AnalysisWorkflowSnapshot {
  module: Module2;
  settings_revision: SettingsRevision1;
  settings: Settings1;
  schema_version: SchemaVersion3;
  manifest: AnalysisManifest;
  plan: AnalysisPlan;
  agent: FrozenModelRole;
  instruction: Instruction19;
  system_prompt: SystemPrompt7;
  observer_prompt: AnalysisRolePrompts | null;
  finalization_instruction: FinalizationInstruction;
  exploration_prompt: FrozenExplorationPrompt | null;
  exploration_tasks: FrozenAnalysisTasks | null;
  knowledge_tasks: FrozenAnalysisTasks | null;
  mining_prompt: FrozenMiningPrompt | null;
  selected_directions: SelectedDirections3;
  support_policy: KnowledgeSupportPolicy;
  input_organization: InputOrganization;
  exploration_review_policy: ExplorationReviewPolicy;
  execution_mode: ExecutionMode;
  context_policy: ContextPolicy1;
  context_instruction: ContextInstruction;
}
export interface FrozenModelRole {
  profile: ModelProfile | null;
  input_modalities: InputModalities2;
  native_profile: NativeProfile;
  error: Error4;
}
export interface FrozenAnalysisTasks {
  initial: Initial;
  observe: Observe;
  review: Review;
  finalize: Finalize;
  versions: Versions3;
}
export interface Versions3 {
  [k: string]: string;
}
export interface AnalysisWorkflowState {
  job_id: JobId12;
  session_id: SessionId7;
  session_created: SessionCreated2;
  revision: Revision19;
  catalog: AnalysisCatalog;
}
export interface AnalysisSessionLocation {
  job_id: JobId13;
  submitted_at: SubmittedAt7;
  module: Module3;
  round_id: RoundId6;
}
export interface ExplorationCommit {
  commit_key: CommitKey12;
  base_revision: BaseRevision10;
  summary: Summary14;
  limitations: Limitations60;
  unresolved_questions: UnresolvedQuestions16;
  merges?: Merges6;
  arguments?: Arguments6;
  citation_corrections?: CitationCorrections6;
  round_id: RoundId7;
  observations?: Observations13;
  directions: Directions16;
  report_reviews?: ReportReviews2;
}
export interface ProposedAnalysisDirection1 {
  change_reason?: ChangeReason10;
  key_evidence?: KeyEvidence7;
  title: Title38;
  instruction: Instruction20;
  applies_to: AppliesTo7;
  rationale: Rationale7;
  limitations: Limitations61;
  direction_id: DirectionId17;
  dataset_ids: DatasetIds27;
  evidence_ids: EvidenceIds37;
  counter_evidence_ids?: CounterEvidenceIds11;
}
export interface KnowledgeCommit {
  commit_key: CommitKey13;
  base_revision: BaseRevision11;
  summary: Summary15;
  limitations: Limitations62;
  unresolved_questions: UnresolvedQuestions17;
  merges?: Merges7;
  arguments?: Arguments7;
  citation_corrections?: CitationCorrections7;
  round_id: RoundId8;
  observations: Observations14;
  checks: Checks9;
  report_reviews?: ReportReviews3;
}
export interface ProposedAnalysisCheck1 {
  change_reason?: ChangeReason11;
  key_evidence?: KeyEvidence8;
  title: Title39;
  subject: Subject10;
  location: Location15;
  criterion: Criterion10;
  allowed_variations: AllowedVariations10;
  limitations: Limitations63;
  status: Status37;
  check_id: CheckId21;
  direction_refs: DirectionRefs8;
  dataset_ids: DatasetIds28;
  support_evidence_ids: SupportEvidenceIds8;
  counter_evidence_ids: CounterEvidenceIds12;
}
export interface AnalysisCommitReceipt {
  commit_key: CommitKey14;
  revision: Revision20;
  round_id: RoundId9;
  observation_ids: ObservationIds1;
  completed_delta: CompletedDelta;
  failed_delta: FailedDelta;
  round_complete: RoundComplete;
}
export interface AnalysisPublication {
  version_id: VersionId24;
  job_id: JobId14;
  module: Module4;
  revision: Revision21;
  execution_status: ExecutionStatus7;
  execution_error: ModelCallError | null;
  created_at: CreatedAt6;
  catalog: AnalysisCatalog;
  coverage: AnalysisCoverage;
  finalization: AnalysisFinalizationProgress | null;
  model_call_ids: ModelCallIds;
  session_id: SessionId8;
  parent_version_id: ParentVersionId4;
  manual_edit: KnowledgeCheckRemoval | null;
  inherited_reviews: InheritedReviews;
  delegations: Delegations;
}
export interface AnalysisCoverage {
  total: Total14;
  completed: Completed4;
  failed: Failed6;
  unprocessed: Unprocessed3;
  prepared_visuals: PreparedVisuals1;
  observed_visuals: ObservedVisuals1;
  whole_images_observed: WholeImagesObserved1;
  records: Records1;
}
export interface AnalysisRecordCoverage {
  dataset_id: DatasetId43;
  sample_id: SampleId51;
  state: State14;
  observed_evidence_ids: ObservedEvidenceIds1;
  delivered_offsets: DeliveredOffsets1;
  source_error: SourceError1;
  required_media: RequiredMedia1;
  supplemental_media: SupplementalMedia1;
}
export interface AnalysisFinalizationProgress {
  base_revision: BaseRevision12;
  reviewed_entry_ids: ReviewedEntryIds2;
  pending_entry_ids: PendingEntryIds2;
  direction_reviews: DirectionReviews4;
  complete: Complete7;
  version_id: VersionId25;
}
export interface InheritedReviews {
  [k: string]: KnowledgeCheckReview;
}
export interface ExplorationBatchArchive {
  round_id: RoundId10;
  wave_id: WaveId2;
  session_id: SessionId9;
  catalog_revision: CatalogRevision1;
  report: Report1;
  review_revision: ReviewRevision1;
  discovery_decisions: DiscoveryDecisions2;
}
export interface ExplorationDiscoveryDecision1 {
  candidate_id: CandidateId10;
  action: Action5;
  direction_id: DirectionId18;
  reason: Reason43;
}
export interface KnowledgeBatchArchive {
  round_id: RoundId11;
  wave_id: WaveId3;
  session_id: SessionId10;
  catalog_revision: CatalogRevision2;
  report: Report2;
  review_revision: ReviewRevision2;
  discovery_decisions: DiscoveryDecisions3;
}
export interface KnowledgeDiscoveryDecision1 {
  candidate_id: CandidateId11;
  action: Action6;
  check_id: CheckId22;
  reason: Reason44;
}
export interface AnalysisResultView {
  job_id: JobId15;
  module: Module5;
  revision: Revision22;
  catalog: AnalysisCatalog;
  coverage: AnalysisCoverage;
  session_id: SessionId11;
  finalization: AnalysisFinalizationProgress | null;
  evidence: Evidence6;
  selected_directions: SelectedDirections4;
  removed_direction_ids: RemovedDirectionIds2;
}
export interface AnalysisEvidenceView {
  evidence_id: EvidenceId19;
  sample_id: SampleId52;
  dataset_id: DatasetId44;
  filename: Filename1;
  candidate_role: CandidateRole1;
  sampling_group: SamplingGroup1;
  image: VisualEvidence;
  observed: Observed1;
}
export interface AnalysisPublicationView {
  job_id: JobId16;
  module: Module6;
  revision: Revision23;
  catalog: AnalysisCatalog;
  coverage: AnalysisCoverage;
  session_id: SessionId12;
  finalization: AnalysisFinalizationProgress | null;
  evidence: Evidence7;
  selected_directions: SelectedDirections5;
  removed_direction_ids: RemovedDirectionIds3;
  version_id: VersionId26;
  execution_status: ExecutionStatus8;
  execution_error: ModelCallError | null;
  created_at: CreatedAt7;
  model_call_ids: ModelCallIds1;
  parent_version_id: ParentVersionId5;
  manual_edit: KnowledgeCheckRemoval | null;
  inherited_reviews: InheritedReviews1;
  delegations: Delegations1;
}
export interface InheritedReviews1 {
  [k: string]: KnowledgeCheckReview;
}
export interface AnalysisSampleEvidence {
  version_id: VersionId27;
  module: Module7;
  registration: AnalysisRegistration;
  items: Items12;
}
export interface AnalysisObservationQuery {
  entry_id?: EntryId8;
  evidence_role?: EvidenceRole1;
  sample_id?: SampleId53;
  direction_ref?: DirectionRef3;
  round_id?: RoundId12;
  page?: Page14;
  page_size?: PageSize14;
}
export interface AnalysisObservationPage {
  version_id: VersionId28;
  selected_directions: SelectedDirections6;
  total: Total15;
  page: Page15;
  page_size: PageSize15;
  items: Items13;
}
export interface AnalysisObservationHistoryPage {
  job_id: JobId17;
  revision: Revision24;
  total: Total16;
  page: Page16;
  page_size: PageSize16;
  items: Items14;
}
export interface AnalysisResults {
  current: AnalysisCurrentResultView;
  publication: AnalysisPublicationView | null;
}
export interface AnalysisCurrentResultView {
  job_id: JobId18;
  module: Module8;
  revision: Revision25;
  catalog: AnalysisCatalog;
  coverage: AnalysisCoverage;
  session_id: SessionId13;
  finalization: AnalysisFinalizationProgress | null;
  evidence: Evidence8;
  selected_directions: SelectedDirections7;
  removed_direction_ids: RemovedDirectionIds4;
  checks: Checks10;
  check_evidence: CheckEvidence;
}
export interface CheckEvidence {
  [k: string]: AnalysisCheckEvidence;
}
export interface AnalysisCheckEvidence {
  support: Support;
  counter: Counter;
}
export interface AnalysisJobPrompts {
  main: AnalysisRolePrompts;
  observer: AnalysisRolePrompts | null;
}
export interface PublishedDirectionCatalog {
  directions: Directions17;
}
export interface PublishedDirectionChoice {
  direction_id: DirectionId19;
  title: Title40;
  instruction: Instruction21;
  enabled: Enabled3;
  origin: Origin7;
  source: Source12;
  summary: Summary16;
  limitations: Limitations64;
}
export interface AnalysisSourceCatalog {
  items: Items15;
}
export interface AnalysisSource {
  sample_id: SampleId54;
  dataset_id: DatasetId45;
  relative_path: RelativePath6;
  candidate_role: CandidateRole2;
  annotation_categories: AnnotationCategories;
}
export interface ConsistencyReviewSubmission {
  client_request_id: ClientRequestId;
  evidence_id: EvidenceId20;
  result_id: ResultId4;
  difference_ids: DifferenceIds;
  reviewer: Reviewer5;
  comment: Comment3;
  action: Action7;
}
export interface ConfirmDifference {
  kind: Kind30;
}
export interface ExpectedPolicyDifference {
  kind: Kind31;
}
export interface RejectDifference {
  kind: Kind32;
}
export interface NeedsContext {
  kind: Kind33;
}
export interface SetEffectiveQuality {
  kind: Kind34;
  targets: Targets1;
}
export interface QualityTarget {
  sample_id: SampleId55;
  quality: Quality;
}
export interface ProposeRegionChange {
  kind: Kind35;
  changes: Changes;
}
export interface AddRegion {
  operation: Operation2;
  sample_id: SampleId56;
  category: Category1;
  geometry: Geometry;
}
export interface BoxProposal {
  kind: Kind36;
  coordinates: Coordinates;
}
export interface PolygonProposal {
  kind: Kind37;
  points: Points2;
}
export interface RemoveRegion {
  operation: Operation3;
  sample_id: SampleId57;
  annotation_id: AnnotationId5;
}
export interface RelabelRegion {
  operation: Operation4;
  sample_id: SampleId58;
  annotation_id: AnnotationId6;
  category: Category2;
}
export interface ReshapeRegion {
  operation: Operation5;
  sample_id: SampleId59;
  annotation_id: AnnotationId7;
  geometry: Geometry1;
}
export interface ConsistencyReviewContext {
  evidence_id: EvidenceId21;
  result_id: ResultId5;
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
  difference_id: DifferenceId2;
  review_state: ReviewState;
  correction_state: CorrectionState;
  decision_id: DecisionId2;
  correction_decision_id: CorrectionDecisionId;
}
export interface ConsistencyDecision {
  decision_id: DecisionId3;
  request: ConsistencyReviewSubmission;
  review_decision_ids: ReviewDecisionIds;
  submitted_at: SubmittedAt8;
}
export interface CorrectionCheck {
  check_id: CheckId23;
  request: CorrectionVerification;
  correction_state: CorrectionState1;
  reason: Reason45;
  checked_at: CheckedAt1;
}
export interface CorrectionVerification {
  client_request_id: ClientRequestId1;
  decision_id: DecisionId4;
  evidence_id: EvidenceId22;
  reviewer: Reviewer6;
}
export interface GroupReviewSubmission {
  client_request_id: ClientRequestId2;
  result_fingerprint: ResultFingerprint;
  reviewer: Reviewer7;
  comment: Comment4;
  action: Action8;
}
export interface GroupReviewContext {
  job_id: JobId19;
  anchor_id: AnchorId;
  result_fingerprint: ResultFingerprint1;
  references: References3;
  disposition: Disposition;
  decisions: Decisions1;
}
export interface GroupReviewReference {
  candidate_id: CandidateId12;
  assessment_id: AssessmentId1;
  evidence_id: EvidenceId23;
  result_id: ResultId6;
  difference_ids: DifferenceIds1;
}
export interface GroupReviewDecision {
  decision_id: DecisionId5;
  job_id: JobId20;
  anchor_id: AnchorId1;
  request: GroupReviewSubmission;
  references: References4;
  submitted_at: SubmittedAt9;
}
export interface AnchorCandidatePage {
  job_id: JobId21;
  anchor_id: AnchorId2;
  items: Items16;
}
export interface AnchorCandidatePreview {
  sample_id: SampleId60;
  content_group_id: ContentGroupId2;
  kind: Kind38;
  rank: Rank2;
  score: Score2;
  image: GalleryImage;
  annotations: AnnotationSet;
}
export interface GalleryImage {
  sample: Sample;
  evidence_id: EvidenceId24;
  side: Side;
  available: Available;
}
export interface AnchorImagePage {
  job_id: JobId22;
  total: Total17;
  items: Items17;
}
export interface AnchorImageItem {
  sample: FrozenSample;
  summary: AnchorResultSummary;
  image: GalleryImage | null;
  review_state: ReviewState1;
}
export interface AnchorResultSummary {
  outcome: IdentityResultFields | null;
  dataset_format: DatasetFormat4;
  schema_version: SchemaVersion4;
  job_id: JobId23;
  anchor_id: AnchorId3;
  session_id: SessionId14;
  state: State15;
  phase: Phase7;
  attempt: Attempt2;
  mode: Mode4;
  min_similarity: MinSimilarity3;
  max_exact_candidates: MaxExactCandidates;
  max_similar_candidates: MaxSimilarCandidates;
  selected_exact: SelectedExact;
  selected_similar: SelectedSimilar;
  verdict: Verdict4;
  reason: Reason46;
  categories: Categories4;
  conclusion: Conclusion9;
  original_categories: OriginalCategories;
  original_conclusion: ConflictCategory | null;
  program_conclusion: ProgramConclusion1;
  model_conclusion: ModelConclusion1;
  result_ref: ResultRef;
}
export interface IdentityResultFields {
  task_type: TaskType3;
  candidate_record_ids: CandidateRecordIds3;
  execution_status: ExecutionStatus9;
  result: Result4;
  pass_reason: PassReason3;
  candidate_stats: CandidateStats | null;
  candidate_gate_ids: CandidateGateIds3;
  issues: Issues5;
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
  annotation_observations: AnnotationObservations;
}
export interface EvidenceSources {
  left: FrozenEvidenceSource;
  right: FrozenEvidenceSource;
}
export interface FrozenEvidenceSource {
  sample: Sample;
  annotations: AnnotationSet;
  review: ReviewDecisionRecord | null;
  source_sha256: SourceSha2564;
  scan_ref: ScanRef2;
  content_group_id: ContentGroupId3;
  descriptor: PixelDescriptor;
  image: EvidenceBlob;
  masks: Masks;
  issues: Issues6;
}
export interface EvidenceBlob {
  sha256: Sha2565;
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
  side: Side1;
  representation: Representation2;
  bbox: Bbox9;
  difference_id: DifferenceId3;
  reference_from_other: ReferenceFromOther1;
  annotation_id: AnnotationId8;
  normalization: Normalization;
  available: Available1;
  reason: Reason47;
}
export interface AnnotationObservations {
  [k: string]: AnnotationObservation;
}
export interface AnnotationObservation {
  categories: Categories5;
  summary: Summary17;
  geometry_compared: GeometryCompared;
  conclusion: Conclusion10;
}
export interface ConsistencyEvidenceReference {
  evidence_id: EvidenceId25;
}
export interface ConsistencyEvidenceMediaReference {
  evidence_id: EvidenceId26;
  media_id: MediaId1;
  max_side?: MaxSide;
}
export interface ArtifactRef {
  artifact_id: ArtifactId;
  artifact_type: ArtifactType;
  uri: Uri;
  path: Path4;
  summary?: Summary18;
}
export interface ConsistencyContextRequest {
  evidence_id: EvidenceId27;
  result_id: ResultId7;
  difference_ids?: DifferenceIds2;
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
  scope?: Scope5;
  parentId?: Parentid;
  datasetIds?: Datasetids;
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
  evidence_id: EvidenceId28;
  result_id: ResultId8;
  source_states: EvidenceSourceStates;
  review_context: ConsistencyReviewContext;
  sources: Sources2;
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
export interface Sources2 {
  [k: string]: ContextSource;
}
export interface ContextSource {
  sample: Sample;
  review: ReviewDecisionRecord | null;
  policy: AnnotationPolicy1;
  annotation_count: AnnotationCount2;
  issues: Issues7;
}
export interface ContextMedia {
  descriptor: EvidenceMedia;
  sides: Sides;
  byte_count: ByteCount1;
  sha256: Sha2566;
}
export interface ConsistencyReturnLocation1 {
  pageId: Pageid1;
  tab: Tab1;
  scope: Scope6;
  parentId: Parentid1;
  datasetIds: Datasetids1;
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
  batch_id: BatchId2;
  root_batch_id: RootBatchId;
  parent_batch_id: ParentBatchId;
  kind: Kind39;
  scopes: ConsistencyScopesSnapshot;
  status: Status38;
  cancel_requested: CancelRequested2;
  error: BatchFailure | null;
  total: Total18;
  completed: Completed5;
  failed: Failed7;
  unprocessed: Unprocessed4;
  pair_count: PairCount;
  created_at: CreatedAt8;
  conflict_count: ConflictCount2;
  duration_seconds: DurationSeconds;
  children: Children;
}
export interface BatchFailure {
  code: Code1;
  message: Message4;
}
export interface ConsistencyBatchReference {
  batch_id: BatchId3;
}
export interface ConsistencyBatchRetry {
  batch_id: BatchId4;
  request_id: RequestId4;
  sample_ids?: SampleIds6;
}
export interface ConsistencyBatchList {
  items: Items18;
}
export interface ConsistencyBatchSummary {
  batch_id: BatchId5;
  root_batch_id: RootBatchId1;
  parent_batch_id: ParentBatchId1;
  kind: Kind40;
  scopes: ConsistencyScopesSummary;
  status: Status39;
  cancel_requested: CancelRequested3;
  error: BatchFailure | null;
  total: Total19;
  completed: Completed6;
  failed: Failed8;
  unprocessed: Unprocessed5;
  pair_count: PairCount1;
  created_at: CreatedAt9;
  conflict_count: ConflictCount3;
  duration_seconds: DurationSeconds1;
  children: Children1;
}
export interface ConsistencyScopesSummary {
  subjects: ScopeSummary;
  corpus: ScopeSummary;
}
export interface ScopeSummary {
  scope_id: ScopeId3;
  dataset_ids: DatasetIds29;
  frozen_at: FrozenAt2;
  sample_count: SampleCount2;
}
export interface ConsistencyChildSummary {
  run_id: RunId16;
  dataset_id: DatasetId46;
  job_type: JobType2;
  status: Status40;
  phase: Phase8;
  completed: Completed7;
  failed: Failed9;
  unprocessed: Unprocessed6;
  errors: Errors3;
}
export interface Started {
  kind: Kind41;
  batch_id: BatchId6;
  status: Status41;
}
export interface NoWork {
  kind: Kind42;
  reason: Reason48;
  coverage: ConsistencyCoverage;
}
export interface ConsistencyQuery {
  selection: Selection1;
  annotation_differences_only?: AnnotationDifferencesOnly;
  relation?: Relation4;
  confirmed_conflict?: ConfirmedConflict2;
  difference_type?: DifferenceType;
  review_state?: ReviewState2;
  correction_state?: CorrectionState2;
  cursor?: Cursor2;
  page_size?: PageSize17;
}
export interface BatchSelection {
  kind?: Kind43;
  batch_id: BatchId7;
}
export interface ScopeSelection {
  kind?: Kind44;
  subjects: Subjects2;
  corpus_scope?: CorpusScope3;
  facts?: Facts3;
  mode?: Mode5;
  profile_id?: ProfileId8;
  min_similarity?: MinSimilarity4;
}
export interface ResultPage {
  query_id: QueryId;
  scopes: ConsistencyScopesSummary;
  observed_at: ObservedAt;
  facts: FactCounts;
  total: Total20;
  execution: CoverageCount;
  corpus: CoverageCount;
  mode: Mode6;
  profile_id: ProfileId9;
  min_similarity: MinSimilarity5;
  retrieval_completeness: RetrievalCompleteness1;
  items: Items19;
  next_cursor: NextCursor2;
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
  pending_review: PendingReview2;
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
  pending_review: PendingReview1;
  pending_correction: PendingCorrection;
}
export interface GoldAvailability {
  total: Total21;
  confirmed: Confirmed;
  conflicts: Conflicts6;
  excluded: Excluded;
  policy_names: PolicyNames;
  unavailable_reason: UnavailableReason;
}
export interface GroupQuery {
  query_id: QueryId1;
  page?: Page17;
  page_size?: PageSize18;
}
export interface GroupMemberQuery {
  query_id: QueryId2;
  page?: Page18;
  page_size?: PageSize19;
  group_id: GroupId13;
  facts_state?: FactsState1;
}
export interface StrictGroupPage {
  query_id: QueryId3;
  items: Items20;
  total: Total22;
}
export interface StrictGroup {
  group_id: GroupId14;
  facts_state: FactsState2;
  member_count: MemberCount3;
  dataset_count: DatasetCount;
  pair_count: PairCount2;
}
export interface GroupMemberPage {
  query_id: QueryId4;
  group_id: GroupId15;
  facts_state: FactsState3;
  items: Items21;
  total: Total23;
}
export interface GroupMember {
  sample_id: SampleId61;
  dataset_id: DatasetId47;
  relative_path: RelativePath7;
  evidence_id: EvidenceId29;
}
export interface GalleryReference {
  query_id: QueryId5;
  kind: Kind45;
  group_id: GroupId16;
  facts_state?: FactsState4;
}
export interface GalleryQuery {
  query_id: QueryId6;
  kind: Kind46;
  page?: Page19;
  page_size?: PageSize20;
  search?: Search6;
  order?: Order;
  difference_filter?: DifferenceFilter;
  model_filter?: ModelFilter;
}
export interface GalleryMemberQuery {
  query_id: QueryId7;
  kind: Kind47;
  group_id: GroupId17;
  facts_state?: FactsState5;
  page?: Page20;
  page_size?: PageSize21;
}
export interface GalleryPage {
  query_id: QueryId8;
  kind: Kind48;
  filters: Filters;
  model_filters: ModelFilters;
  items: Items22;
  total: Total24;
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
  group_id: GroupId18;
  facts_state: FactsState6;
  anchor: GalleryImage;
  member_count: MemberCount4;
  candidate_count: CandidateCount;
  dataset_count: DatasetCount1;
  pair_count: PairCount3;
  difference_types: DifferenceTypes;
  conflict_categories: ConflictCategories;
  model_categories: ModelCategories;
  confirmed_conflict: ConfirmedConflict3;
  model_state: ModelState;
  model_conclusion: ModelConclusion2;
  annotation_conclusion: AnnotationConclusion;
  review_state: ReviewState3;
}
export interface GalleryMemberPage {
  query_id: QueryId9;
  group_id: GroupId19;
  anchor: GalleryImage;
  items: Items23;
  total: Total25;
}
export interface GalleryMember {
  image: GalleryImage;
  comparison: GalleryComparison | null;
}
export interface GalleryComparison {
  evidence_id: EvidenceId30;
  result_id: ResultId9;
  anchor_side: AnchorSide;
}
export interface GroupAnalysisView {
  group_id: GroupId20;
  status: Status42;
  run_id: RunId17;
  model_name: ModelName6;
  result: GroupAnalysisDraft | null;
  error: Error5;
  completed_batches: CompletedBatches2;
  total_batches: TotalBatches2;
}
export interface GroupAnalysisDraft {
  overall: GroupOverallConclusion1;
  conclusions: Conclusions1;
  limitations: Limitations65;
  assessments: Assessments11;
}
/**
 * 整组唯一简短结论；详细分析保留在conclusions
 */
export interface GroupOverallConclusion1 {
  text: Text6;
  verdict: Verdict2;
  references: References1;
}
export interface ImageEncoderConfig {
  device: Device;
  batch_size: BatchSize3;
  gpu_memory_mb: GpuMemoryMb;
  compute_dtype: ComputeDtype;
  decode_workers: DecodeWorkers;
  decode_memory_mb: DecodeMemoryMb;
  profile: EmbeddingProfile;
}
export interface ImageEncoderSettings {
  revision: Revision26;
  selection: ImageEncoderConfig | null;
  resources: ImageResources;
}
export interface ImageResources {
  device: Device1;
  batch_size: BatchSize4;
  gpu_memory_mb: GpuMemoryMb1;
  compute_dtype: ComputeDtype1;
  decode_workers: DecodeWorkers1;
  decode_memory_mb: DecodeMemoryMb1;
}
export interface ImageEncoderEdit {
  expected_revision: ExpectedRevision4;
  selection: ImageEncoderConfig1 | null;
  resources?: ImageResources1 | null;
}
export interface ImageEncoderConfig1 {
  device?: Device2;
  batch_size?: BatchSize5;
  gpu_memory_mb?: GpuMemoryMb2;
  compute_dtype?: ComputeDtype2;
  decode_workers?: DecodeWorkers2;
  decode_memory_mb?: DecodeMemoryMb2;
  profile: EmbeddingProfile1;
}
export interface EmbeddingProfile1 {
  profile_id: ProfileId10;
  backend: Backend1;
  model_id: ModelId7;
  weights_ref: WeightsRef1;
  weights_sha256: WeightsSha2561;
  source_ref?: SourceRef1;
  source_sha256?: SourceSha2565;
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
  batch_size?: BatchSize6;
  gpu_memory_mb?: GpuMemoryMb3;
  compute_dtype?: ComputeDtype3;
  decode_workers?: DecodeWorkers3;
  decode_memory_mb?: DecodeMemoryMb3;
}
export interface ImageProfileCreate {
  model_id: ModelId8;
  weights_ref: WeightsRef2;
  source_ref?: SourceRef2;
  storage_dtype?: StorageDtype2;
}
export interface ModuleSettingsSnapshot {
  module: Module9;
  settings: Settings2;
  revision: Revision27;
}
export interface ModuleSettingsValues {
  model: ModuleModelReference | null;
  reasoning_effort: ReasoningEffort5;
}
export interface ConsistencySettingsValues {
  mode: Mode7;
  min_similarity: MinSimilarity6;
  max_exact_candidates: MaxExactCandidates1;
  max_similar_candidates: MaxSimilarCandidates1;
  model: ModuleModelReference | null;
  reasoning_effort: ReasoningEffort6;
  concurrency: Concurrency2;
  agent_limits: GenerationLimits;
  vision_limits: ModelLimits;
  position_tolerance: PositionTolerancePolicy;
}
export interface PositionTolerancePolicy {
  policy_version: PolicyVersion;
  absolute_boundary_px: AbsoluteBoundaryPx;
  relative_boundary_fraction: RelativeBoundaryFraction;
  min_coverage_consistency: MinCoverageConsistency;
  consider_registration_uncertainty: ConsiderRegistrationUncertainty;
  tiny_defect_coverage_override: TinyDefectCoverageOverride;
}
export interface AuditSettingsValues {
  model: ModuleModelReference | null;
  reasoning_effort: ReasoningEffort7;
  whole_image_max_side: WholeImageMaxSide2;
  batch_size: BatchSize7;
  concurrency: Concurrency3;
  agent_limits: GenerationLimits;
}
export interface ModuleSettingsEdit {
  module: Module10;
  settings: Settings3;
  expected_revision: ExpectedRevision5;
}
export interface ModuleSettingsValues1 {
  model?: ModuleModelReference | null;
  reasoning_effort?: ReasoningEffort8;
}
export interface ExplorationSettingsValues1 {
  model?: ModuleModelReference | null;
  reasoning_effort?: ReasoningEffort9;
  batch_size?: BatchSize8;
  sampling_ratio?: SamplingRatio3;
  whole_image_max_side?: WholeImageMaxSide3;
  agent_limits?: GenerationLimits1;
  concurrency?: Concurrency4;
}
export interface SamplingRatio3 {
  normal: Normal1;
  abnormal: Abnormal1;
}
export interface GenerationLimits1 {
  context_tokens?: ContextTokens7;
  max_output_tokens?: MaxOutputTokens7;
  request_parameters?: RequestParameters5;
  generation_timeout_seconds?: GenerationTimeoutSeconds5;
}
export interface RequestParameters5 {
  [k: string]: unknown;
}
export interface KnowledgeSettingsValues1 {
  model?: ModuleModelReference | null;
  reasoning_effort?: ReasoningEffort10;
  batch_size?: BatchSize9;
  sampling_ratio?: SamplingRatio4;
  whole_image_max_side?: WholeImageMaxSide4;
  agent_limits?: GenerationLimits1;
  concurrency?: Concurrency5;
}
export interface SamplingRatio4 {
  normal: Normal1;
  abnormal: Abnormal1;
}
export interface ConsistencySettingsValues1 {
  mode?: Mode8;
  min_similarity?: MinSimilarity7;
  max_exact_candidates?: MaxExactCandidates2;
  max_similar_candidates?: MaxSimilarCandidates2;
  model?: ModuleModelReference | null;
  reasoning_effort?: ReasoningEffort11;
  concurrency?: Concurrency6;
  agent_limits?: GenerationLimits1;
  vision_limits?: ModelLimits1;
  position_tolerance?: PositionTolerancePolicy1;
}
export interface ModelLimits1 {
  context_tokens?: ContextTokens8;
  max_output_tokens?: MaxOutputTokens8;
  request_parameters?: RequestParameters6;
  generation_timeout_seconds?: GenerationTimeoutSeconds6;
  capacity_mode?: CapacityMode4;
  max_visual_inputs?: MaxVisualInputs4;
  max_request_bytes?: MaxRequestBytes4;
  connect_timeout_seconds?: ConnectTimeoutSeconds4;
  write_timeout_seconds?: WriteTimeoutSeconds4;
  pool_timeout_seconds?: PoolTimeoutSeconds4;
}
export interface RequestParameters6 {
  [k: string]: unknown;
}
export interface PositionTolerancePolicy1 {
  policy_version?: PolicyVersion1;
  absolute_boundary_px?: AbsoluteBoundaryPx1;
  relative_boundary_fraction?: RelativeBoundaryFraction1;
  min_coverage_consistency?: MinCoverageConsistency1;
  consider_registration_uncertainty?: ConsiderRegistrationUncertainty1;
  tiny_defect_coverage_override?: TinyDefectCoverageOverride1;
}
export interface AuditSettingsValues1 {
  model?: ModuleModelReference | null;
  reasoning_effort?: ReasoningEffort12;
  whole_image_max_side?: WholeImageMaxSide5;
  batch_size?: BatchSize10;
  concurrency?: Concurrency7;
  agent_limits?: GenerationLimits1;
}
export interface ConsistencyAgentStart {
  mode?: Mode9;
  min_similarity?: MinSimilarity8;
  max_exact_candidates?: MaxExactCandidates3;
  max_similar_candidates?: MaxSimilarCandidates3;
  submission_id: SubmissionId11;
  dataset_ids: DatasetIds30;
  analysis_kind?: AnalysisKind6;
  instruction?: Instruction22;
  system_prompt?: SystemPrompt8;
  identity_prompts?: IdentityPrompts | null;
  subjects?: Subjects3;
  corpus_scope?: CorpusScope4;
}
export interface ConsistencyCheckSnapshot {
  schema_version: SchemaVersion5;
  settings_revision: SettingsRevision2;
  concurrency: Concurrency8;
  retrieval: Retrieval;
  scopes: ConsistencyScopesSnapshot;
  model: ModuleModelReference | null;
  model_limits: ModelLimits;
  roles: ConsistencyModelRoles;
  image_encoder: ImageEncoderConfig | null;
  policies: Policies;
  position_tolerance: PositionTolerancePolicy;
  instruction: Instruction23;
  system_prompt: SystemPrompt9;
  prompt_version: PromptVersion;
  pixel_profile: PixelProfile;
  model_call_logging: ModelCallLogging;
  phase_logging: PhaseLogging;
  review_pipeline: ReviewPipeline;
  task_type: TaskType4;
  prompts: Prompts;
  dataset_formats: DatasetFormats;
  [k: string]: unknown;
}
export interface ExactCandidatePolicy {
  mode: Mode10;
  min_similarity: MinSimilarity9;
  max_exact_candidates: MaxExactCandidates4;
  max_similar_candidates: MaxSimilarCandidates4;
}
export interface CombinedCandidatePolicy {
  mode: Mode11;
  min_similarity: MinSimilarity10;
  max_exact_candidates: MaxExactCandidates5;
  max_similar_candidates: MaxSimilarCandidates5;
}
export interface ConsistencyModelRoles {
  agent: FrozenModelRole;
  vision: FrozenModelRole;
}
export interface Policies {
  [k: string]: AnnotationPolicy1;
}
export interface Prompts {
  [k: string]: string;
}
export interface DatasetFormats {
  [k: string]: "labelme" | "folder_classification";
}
export interface ConsistencyAnchorRun {
  job_id: JobId24;
  anchor_id: AnchorId4;
  ordinal: Ordinal;
  session_id: SessionId15;
  session_created: SessionCreated3;
  attempt: Attempt3;
  state: State16;
  phase: Phase9;
  trace_state: TraceState;
  trace_error: TraceError;
  candidates: AnchorCandidates | null;
  visual_plan: AnchorVisualPlan | null;
  result: Result5;
}
export interface AnchorCandidates {
  anchor_id: AnchorId5;
  scope_id: ScopeId4;
  mode: Mode12;
  min_similarity: MinSimilarity11;
  exact: CandidateBranch;
  similar: CandidateBranch;
  candidates: Candidates;
}
export interface CandidateBranch {
  state: State17;
  limit: Limit5;
  matched: Matched;
  selected: Selected;
  truncated: Truncated;
}
export interface SelectedCandidate {
  sample_id: SampleId62;
  content_group_id: ContentGroupId4;
  kind: Kind49;
  rank: Rank3;
  score: Score3;
}
export interface AnchorVisualPlan {
  fingerprint: Fingerprint1;
  pages: Pages;
}
export interface AnchorVisualStart {
  request_id: RequestId5;
  fingerprint: Fingerprint2;
  candidate_ids: CandidateIds;
  question: Question;
  gate_revisions: GateRevisions;
}
export interface GateRevisions {
  [k: string]: number;
}
export interface ConsistencyCheckConfiguration {
  settings_revision: SettingsRevision3;
  settings: ConsistencySettingsValues;
}
export interface AnchorTraceEvent {
  schema_version: SchemaVersion6;
  job_id: JobId25;
  anchor_id: AnchorId6;
  session_id: SessionId16;
  attempt: Attempt4;
  state: State18;
  result: Result6;
  errors: Errors4;
}
export interface ConsistencyCheckReference {
  run_id: RunId18;
}
export interface ConsistencyAnchorReference {
  run_id: RunId19;
  anchor_id: AnchorId7;
}
export interface ConsistencyCheckResultsQuery {
  run_id: RunId20;
  page: Page21;
  page_size: PageSize22;
}
export interface PairReviewTask {
  pair_key: PairKey;
  links: Links;
}
export interface PairReviewLink {
  anchor_id: AnchorId8;
  candidate_id: CandidateId13;
}
export interface PairReviewReceipt {
  pair_key: PairKey1;
  links: Links1;
  observation_owner_id: ObservationOwnerId;
  observation_call_ids: ObservationCallIds;
}
export interface AnchorVisualStart1 {
  request_id: RequestId6;
  fingerprint: Fingerprint3;
  candidate_ids: CandidateIds1;
  question: Question1;
  windows?: Windows;
  gate_revisions?: GateRevisions1;
}
export interface VisualWindow {
  sample_id: SampleId63;
  bbox: Bbox10;
  padding?: Padding;
  reason: Reason49;
}
export interface GateRevisions1 {
  [k: string]: number;
}
export interface AnchorObservation {
  observation_id: ObservationId3;
  request: AnchorVisualRequest;
  result: AnchorVisualResult;
}
export interface AnchorVisualRequest {
  request_id: RequestId7;
  fingerprint: Fingerprint4;
  candidate_ids: CandidateIds2;
  question: Question2;
  gate_revisions: GateRevisions2;
  anchor_id: AnchorId9;
  input_fingerprint: InputFingerprint;
  media: Media2;
  facts: Facts4;
}
export interface GateRevisions2 {
  [k: string]: number;
}
export interface Facts4 {
  [k: string]: unknown;
}
export interface AnchorVisualResult {
  observations: Observations15;
}
export interface CandidateVisualObservation {
  candidate_id: CandidateId14;
  description: Description38;
  media_ids: MediaIds3;
  limitations: Limitations66;
  assessment: AnchorAssessmentDecision | null;
  /**
   * 发现两侧实际内容不同或资格依据不足时报告争议；不能继续提交标注差异。
   */
  gate_dispute: GateDispute | null;
}
export interface AnchorAssessmentDecision {
  candidate_id: CandidateId15;
  verdict: Verdict5;
  explanation: Explanation1;
  findings: Findings7;
  limitations: Limitations67;
  issues: Issues8;
}
export interface GateDispute {
  reason: Reason50;
  region_pair_ids: RegionPairIds1;
}
export interface AnchorContextQuery {
  candidate_id?: CandidateId16;
}
export interface AnchorAssessmentInput {
  fingerprint: Fingerprint5;
  observation_ids: ObservationIds2;
  assessment: AnchorAssessmentDecision1;
}
/**
 * 提交候选判定和全部独立问题，展示分类及结论由服务端派生
 */
export interface AnchorAssessmentDecision1 {
  candidate_id: CandidateId17;
  verdict: Verdict6;
  explanation: Explanation2;
  findings?: Findings8;
  limitations?: Limitations68;
  issues?: Issues9;
}
export interface BboxAnnotationIssue1 {
  description: Description39;
  media_ids: MediaIds4;
  limitations?: Limitations69;
  review_suggestion?: ReviewSuggestion3;
  type: Type7;
  main_annotation_ids?: MainAnnotationIds2;
  candidate_annotation_ids?: CandidateAnnotationIds2;
  region_pair_ids?: RegionPairIds2;
  coverage_effect?: CoverageEffect1;
  coverage_reason?: CoverageReason1;
  same_main_object_as?: SameMainObjectAs2;
}
export interface AnchorReviewSubmission {
  request_id?: RequestId8;
  fingerprint: Fingerprint6;
  assessment_ids: AssessmentIds;
}
export interface AnchorResultDetail {
  outcome: IdentityResultFields | null;
  dataset_format: DatasetFormat5;
  schema_version: SchemaVersion7;
  job_id: JobId26;
  anchor_id: AnchorId10;
  session_id: SessionId17;
  state: State19;
  phase: Phase10;
  attempt: Attempt5;
  mode: Mode13;
  min_similarity: MinSimilarity12;
  max_exact_candidates: MaxExactCandidates6;
  max_similar_candidates: MaxSimilarCandidates6;
  selected_exact: SelectedExact1;
  selected_similar: SelectedSimilar1;
  verdict: Verdict7;
  reason: Reason51;
  categories: Categories6;
  conclusion: Conclusion11;
  original_categories: OriginalCategories1;
  original_conclusion: ConflictCategory | null;
  program_conclusion: ProgramConclusion2;
  model_conclusion: ModelConclusion3;
  result_ref: ResultRef1;
  candidate_records: CandidateRecords;
  gates: Gates1;
  captured_evidence: CapturedEvidence;
  session_created: SessionCreated4;
  trace_state: TraceState1;
  trace_error: TraceError1;
  snapshot_ref: SnapshotRef;
  trace_ref: TraceRef;
  diagnostics_ref: DiagnosticsRef;
  candidates: AnchorCandidates | null;
  visual_plan: AnchorVisualPlan | null;
  result: Result7;
  requests: Requests;
  observations: Observations16;
  assessments: Assessments12;
  evidence: Evidence9;
  errors: Errors5;
  error_history: ErrorHistory2;
}
export interface CandidatePhaseRecord {
  record_id: RecordId;
  candidate_id: CandidateId18;
  phase: Phase11;
  revision: Revision28;
  gate_revision: GateRevision;
  request_id: RequestId9;
  active: Active;
  gate: CandidateIdentityRecord | null;
  audit: AnchorAssessmentSubmission | null;
}
export interface CandidateIdentityRecord {
  gate_id: GateId;
  candidate_id: CandidateId19;
  fingerprint: Fingerprint7;
  execution_status: ExecutionStatus10;
  revision: Revision29;
  relation: Relation5;
  reason: Reason52;
  limitations: Limitations70;
  media: Media3;
  geometry: Registration | null;
  error_code: ErrorCode3;
  gate_status: GateStatus1;
  source: Source13;
  pair_key: PairKey2;
  observation_call_ids: ObservationCallIds1;
  region_pairs: RegionPairs;
  required_region_pair_ids: RequiredRegionPairIds;
  region_checks: RegionChecks;
  unmapped_region_checks: UnmappedRegionChecks;
  overview_relation: OverviewRelation;
}
export interface IdentityRegionPair {
  region_pair_id: RegionPairId;
  source_annotations: SourceAnnotations;
  main_window: MainWindow;
  candidate_window: CandidateWindow;
  mapping: Mapping;
  limitation: Limitation;
  main_media: VisualEvidence | null;
  candidate_media: VisualEvidence | null;
}
export interface IdentityRegionSource {
  side: Side2;
  annotation_id: AnnotationId9;
  original_bbox: OriginalBbox;
}
export interface IdentityRegionCheck {
  region_pair_id: RegionPairId1;
  main_media_id: MainMediaId;
  candidate_media_id: CandidateMediaId;
  visual_relation: VisualRelation;
  main_description: MainDescription;
  candidate_description: CandidateDescription;
  reason: Reason53;
}
export interface UnmappedRegionCheck {
  region_pair_id: RegionPairId2;
  media_ids: MediaIds5;
  observation: Observation4;
}
export interface AnchorAssessmentSubmission {
  fingerprint: Fingerprint8;
  observation_ids: ObservationIds3;
  assessment: GroupPairAssessment;
  comparison: GroupAnalysisComparison;
  gate_revision: GateRevision1;
}
export interface AnchorEvidenceReference {
  candidate_id: CandidateId20;
  evidence_id: EvidenceId31;
  result_id: ResultId10;
  detail_ref: DetailRef;
}
export interface AnchorAssessmentRecord {
  assessment_id: AssessmentId2;
  submission: AnchorAssessmentSubmission;
}
export interface AnchorResultPage {
  job_id: JobId27;
  total: Total26;
  items: Items24;
}
export interface ConsistencyCheckReport {
  schema_version: SchemaVersion8;
  job_id: JobId28;
  status: Status43;
  total: Total27;
  completed: Completed8;
  no_candidates: NoCandidates;
  original_conflicts: OriginalConflicts;
  states: States;
  verdicts: Verdicts;
  original_categories: OriginalCategories2;
  model_categories: ModelCategories1;
  agreement: Agreement;
}
export interface States {
  [k: string]: number;
}
export interface Verdicts {
  [k: string]: number;
}
export interface OriginalCategories2 {
  [k: string]: number;
}
export interface ModelCategories1 {
  [k: string]: number;
}
export interface Agreement {
  [k: string]: number;
}
export interface NativeModelCallStart {
  call_id: CallId2;
  started_at: StartedAt10;
  request: Request;
}
export interface Request {
  [k: string]: unknown;
}
export interface NativeModelCallEnd {
  call_id: CallId3;
  finished_at: FinishedAt8;
  elapsed_ms: ElapsedMs2;
  finish_reason: FinishReason2;
  usage: Usage2;
  error: ModelCallError | null;
  http_status: HttpStatus2;
}
export interface TokenBudget {
  input_tokens: InputTokens;
  context_tokens: ContextTokens9;
  output_reserve: OutputReserve;
  fits: Fits;
}
export interface ImageSessionLocation {
  job_id: JobId29;
  submitted_at: SubmittedAt10;
  image_name: ImageName;
  image_id: ImageId;
}
export interface AuditAgentConfiguration {
  settings_revision: SettingsRevision4;
  settings: AuditSettingsValues;
}
export interface AuditWorkflowSnapshot {
  settings_revision: SettingsRevision5;
  settings: AuditSettingsValues;
  schema_version: SchemaVersion9;
  context_policy: ContextPolicy2;
  manifest: AnalysisManifest;
  agent: FrozenModelRole;
  report_instruction: ReportInstruction1;
  consistency_job_id: ConsistencyJobId2;
  knowledge: AuditKnowledge | null;
  master_prompt: AnalysisRolePrompts;
  observer_prompt: AnalysisRolePrompts;
  dataset_profile: AuditDatasetProfile;
}
export interface AuditSampleRun {
  job_id: JobId30;
  sample_id: SampleId64;
  ordinal: Ordinal1;
  session_id: SessionId18;
  session_created: SessionCreated5;
  state: State20;
  consistency: AnchorResultDetail;
  result: AuditFinal | null;
  result_revision: ResultRevision5;
}
export interface AuditAgentContext {
  job_id: JobId31;
  sample_id: SampleId65;
  session_id: SessionId19;
  target: AnalysisRegistration;
  consistency: AuditConsistencyContext;
  knowledge: AuditKnowledge | null;
  saved_progress: AuditFinal | null;
  batch: AuditBatch | null;
  review: AuditRecheck | null;
  prior_result: AuditFinal | null;
}
export interface AuditConsistencyContext {
  outcome: IdentityResultFields | null;
  dataset_format: DatasetFormat6;
  schema_version: SchemaVersion10;
  job_id: JobId32;
  anchor_id: AnchorId11;
  session_id: SessionId20;
  state: State21;
  phase: Phase12;
  attempt: Attempt6;
  mode: Mode14;
  min_similarity: MinSimilarity13;
  max_exact_candidates: MaxExactCandidates7;
  max_similar_candidates: MaxSimilarCandidates7;
  selected_exact: SelectedExact2;
  selected_similar: SelectedSimilar2;
  verdict: Verdict8;
  reason: Reason54;
  categories: Categories7;
  conclusion: Conclusion12;
  original_categories: OriginalCategories3;
  original_conclusion: ConflictCategory | null;
  program_conclusion: ProgramConclusion3;
  model_conclusion: ModelConclusion4;
  result_ref: ResultRef2;
  result: Result8;
  evidence: Evidence10;
  assessments: Assessments13;
  gates: Gates2;
  observations: Observations17;
  captured_evidence: CapturedEvidence1;
}
export interface AuditCommit {
  commit_key: CommitKey15;
  final: AuditLegacyFinal;
}
export interface AuditLegacyFinal {
  execution_status: ExecutionStatus11;
  state: State22;
  analysis: Analysis10;
  conclusion: Conclusion13;
  basis: Basis5;
  evidence_ids: EvidenceIds38;
  check_assessments: CheckAssessments4;
  consistency_review: ConsistencyReview2;
  findings: Findings9;
  observations?: Observations18;
  hypothesis_assessments?: HypothesisAssessments2;
  visual_features?: VisualFeatures2;
  limitations: Limitations71;
}
export interface AuditJobPrompts {
  sections: Sections;
}
export interface AuditPromptSection {
  title: Title41;
  text: Text8;
}
export interface RegistrationCropQuery {
  bbox: Bbox11;
  sample_id: SampleId66;
  offset?: Offset9;
  limit?: Limit6;
}
export interface NativeAuditSampleDetail {
  sample: AuditSampleItem;
  final: AuditFinal | null;
  knowledge: AuditKnowledge | null;
  consistency: AnchorResultDetail;
  evidence: Evidence11;
  errors: Errors6;
}
export interface AuditMediaView {
  image: VisualEvidence;
  sample_id: SampleId67;
  source: AnalysisRegistration | null;
}
export interface NativeAuditEvidenceReference {
  run_id: RunId21;
  sample_id: SampleId68;
  evidence_id: EvidenceId32;
}
export interface HistoricalAuditEvidenceReference {
  suggestion_id: SuggestionId2;
  evidence_id: EvidenceId33;
}
export interface AnchorObservationReceipt {
  observation_id: ObservationId4;
  request_id: RequestId10;
  candidate_ids: CandidateIds3;
}
export interface AnchorDiagnostics {
  schema_version: SchemaVersion11;
  job_id: JobId33;
  anchor_id: AnchorId12;
  session_id: SessionId21;
  attempt: Attempt7;
  state: State23;
  phase: Phase13;
  phase_recording: PhaseRecording;
  phases: Phases;
  roles: ModelRolesDiagnostics;
  calls: Calls;
}
export interface AnchorPhaseTiming {
  attempt: Attempt8;
  phase: Phase14;
  state: State24;
  started_at: StartedAt11;
  ended_at: EndedAt;
  duration_seconds: DurationSeconds2;
}
export interface ModelRolesDiagnostics {
  agent: ModelRoleDiagnostics;
  vision: ModelRoleDiagnostics;
}
export interface ModelRoleDiagnostics {
  recording: Recording;
  recorded_requests: RecordedRequests;
  requests: Requests1;
  generation_requests: GenerationRequests;
  tokenization_requests: TokenizationRequests;
  failed_requests: FailedRequests;
  in_flight_requests: InFlightRequests;
  unknown_outcomes: UnknownOutcomes;
  usage_missing: UsageMissing;
  input_tokens: InputTokens1;
  output_tokens: OutputTokens;
  total_tokens: TotalTokens;
  cost: Cost;
}
export interface WorkflowContextQuery {
  candidate_id?: CandidateId21;
}
export interface AnomalyWorkflowObserve {
  phase: Phase15;
  request_id: RequestId11;
  fingerprint: Fingerprint9;
  candidate_ids: CandidateIds4;
  gate_revisions: GateRevisions3;
}
export interface GateRevisions3 {
  [k: string]: number;
}
export interface BboxWorkflowObserve {
  phase: Phase16;
  request_id: RequestId12;
  fingerprint: Fingerprint10;
  candidate_ids: CandidateIds5;
  gate_revisions: GateRevisions4;
  question?: Question3;
}
export interface GateRevisions4 {
  [k: string]: number;
}
export interface AnomalyWorkflowAssess {
  phase: Phase17;
  request_id: RequestId13;
  fingerprint: Fingerprint11;
  candidate_id: CandidateId22;
  expected_revision: ExpectedRevision6;
  action?: Action9;
  observation_ids?: ObservationIds4;
}
export interface BboxWorkflowAssess {
  phase: Phase18;
  request_id: RequestId14;
  fingerprint: Fingerprint12;
  candidate_id: CandidateId23;
  expected_revision: ExpectedRevision7;
  action?: Action10;
  observation_ids?: ObservationIds5;
  /**
   * 仅phase=audit提交当前候选的标注审核。phase=gate必须省略或传null，只用observation_ids引用已保存的身份观察，由程序保存资格结论，不提交标注问题。
   */
  assessment?: AnchorAssessmentDecision2 | null;
}
export interface AnchorAssessmentDecision2 {
  candidate_id: CandidateId17;
  verdict: Verdict6;
  explanation: Explanation2;
  findings?: Findings8;
  limitations?: Limitations68;
  issues?: Issues9;
}
export interface WorkflowSubmit {
  request_id: RequestId15;
  fingerprint: Fingerprint13;
  assessment_ids?: AssessmentIds1;
}
