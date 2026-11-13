import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { compile } from "json-schema-to-typescript";
import { findWorkspaceRoot, resolvePythonPath } from "../lib/server/python-bridge/index.js";

const workspace = findWorkspaceRoot();
const schema = JSON.parse(execFileSync(resolvePythonPath(), ["-c", `
import json
from pydantic.json_schema import models_json_schema
from iad_core.entry import QUERY_OPERATIONS
from iad_core.workbench.session_models import ImageSessionLocation
from iad_core.audit.prompt_text import OBSERVER_AUDIT_SYSTEM_PROMPT, MASTER_AUDIT_SYSTEM_PROMPT, DEFAULT_AUDIT_BATCH_PROMPT, DEFAULT_AUDIT_USER_PROMPT, DEFAULT_AUDIT_REPORT_PROMPT
from iad_core.workbench.audit_sources import AuditSourceCatalog
from iad_core.analysis.prompt_text import knowledge_agent_prompt, DEFAULT_KNOWLEDGE_USER_PROMPT
from iad_core.exploration.prompts import ExplorationPrompts
from iad_core.knowledge.prompts import KnowledgePrompts
from iad_core.knowledge.observation_models import KnowledgeBatchReport, KnowledgeEvidenceReport
from iad_core.exploration.observation_models import ExplorationEvidenceReport
from iad_core.analysis.context_models import ExplorationDeltaCommit, KnowledgeDeltaCommit, ExplorationDeltaFinalize, KnowledgeDeltaFinalize
from iad_core.analysis.evidence_models import AnalysisEvidenceReferenceQuery, AnalysisImageQuery
from iad_core.analysis.delegation_models import AnalysisWave, ExplorationBatchReport, AnalysisWorkerMaterials
from iad_core.knowledge.instructions import DEFAULT_OBJECTIVE, SubmittedMiningPrompt
from iad_core.advisory.analysis import AuditAnalysis
from iad_core.exploration.models import ExplorationStart, ExplorationSnapshot, ExplorationCatalog, ExplorationResults, DirectionRemoval, DirectionAdoption, ExplorationPromptPreset, ExplorationPresetEdit
from iad_core.workbench.analysis_manifest import AnalysisManifest, AnalysisPlan
from iad_core.evidence.registrations import RegistrationImageQuery, ExplorationCropQuery, RegistrationMediaQuery, RegistrationMediaPage, RegistrationCropQuery, EvidenceReferenceQuery
from iad_core.analysis.models import (AnalysisAgentStart, ExplorationAgentStart, KnowledgeAgentStart,
    AnalysisAgentConfiguration, AnalysisScope, AnalysisWorkflowSnapshot, AnalysisWorkflowState, AnalysisAgentContext, AnalysisBatchMaterials, AnalysisCatalogQuery, AnalysisCatalogPage,
    KnowledgeCheckEvidencePage, AnalysisSessionLocation, ExplorationCommit, KnowledgeCommit, AnalysisCommitReceipt, AnalysisPublication, AnalysisResultView, AnalysisPublicationView, AnalysisSampleEvidence, AnalysisObservationQuery, AnalysisObservationPage, AnalysisObservationHistoryPage, AnalysisResults, AnalysisJobPrompts, PublishedDirectionCatalog, AnalysisSourceCatalog)
from iad_core.analysis.finalization_models import ExplorationFinalize, KnowledgeFinalize, AnalysisFinalizationContext, AnalysisFinalizationReceipt
from iad_core.analysis.argument_models import AnalysisArgumentQuery, AnalysisArgumentPage, AnalysisEntryQuery
from iad_core.analysis.models import AnalysisClaimHistory
from iad_core.knowledge.models import KnowledgeSnapshot, KnowledgeVersion, KnowledgeQuery, KnowledgeSourceQuery, KnowledgeSourcePage, KnowledgeDetailQuery, KnowledgeCheckPage, KnowledgeEvidencePage, KnowledgeDiscoveryPage
from iad_core.knowledge.models import KnowledgeCheckReviewSubmission
from iad_core.knowledge.models import KnowledgeVersionCatalog
from iad_core.workbench.module_settings import ModuleSettingsSnapshot, ModuleSettingsEdit, ModuleModelReference, ModuleSettingsValues, ConsistencySettingsValues
from iad_core.workbench.model_settings import WorkbenchProvider, ModelCatalog, ModelExecution, ProviderEdit, ProviderReference, ProviderDiscovery
from iad_core.workbench.model_profile import ModelLimits, ModelProfile, REASONING_EFFORT_LABELS
from iad_core.workbench.vision import TokenBudget
from iad_core.audit.report_models import AUDIT_ISSUE_LABELS, AUDIT_ISSUE_DESCRIPTIONS, AUDIT_ISSUE_TYPES_BY_FORMAT, AUDIT_ASSESSMENT_LABELS, AUDIT_CONSISTENCY_LABELS, AUDIT_CONSISTENCY_DESCRIPTIONS, AuditStatistics, AuditRecordQuery, AuditReportCommit, AuditReportSession, AuditReportEvidenceQuery
from iad_core.audit.master_models import AuditMasterContext
from iad_core.audit.distribution_models import AuditDistributionQuery, AuditDataDistribution
from iad_core.audit.report_models import AuditBatchDelta, AuditDiscoveryQuery
from iad_core.audit.models import AuditEvidenceCommit, AuditMediaQuery
from iad_core.audit.delegation_models import AuditBatch, AuditRecheck
from iad_core.audit.report_models import (AuditBatchCommit, AUDIT_CAPABILITY_LABELS, AUDIT_COVERAGE_LABELS, AUDIT_DISCOVERY_STATUS_LABELS, AUDIT_PURPOSE_LABELS, AUDIT_USABILITY_LABELS, AUDIT_READINESS_LABELS)
from iad_core.audit.models import (AuditAgentStart, AuditAgentConfiguration, AuditWorkflowSnapshot, AuditSampleRun, AuditAgentContext, AuditCommit, AuditJobPrompts, NativeAuditSampleDetail, AuditEvidenceQuery)
from iad_core.workbench.calls import ModelCallDetail, NativeModelCallStart, NativeModelCallEnd
from iad_core.workbench.job_models import JobRetry, JobSnapshot, JobView, JobRetryOptions
from iad_core.workbench.inspection_context import InspectionReference, InspectionSnapshot
from iad_core.dataset.registry import DatasetImport
from iad_core.dataset.folder_preview import FolderPreview
from iad_core.dataset.archive import ArchiveInspection
from iad_core.dataset.scanner import ScanResult
from iad_core.workbench.report import DatasetReport
from iad_core.workbench.audit_result_models import AuditSampleQuery, AuditSamplePage, AuditRunReport, AUDIT_STATE_LABELS
from iad_core.storage.models import Annotation, ReviewDecisionRecord
from iad_core.workbench.review import ReviewSubmission, ReviewHistoryQuery, ReviewHistoryPage
from iad_core.workbench.knowledge_review import KnowledgeReviewContext, KnowledgeReviewSubmission, KnowledgeReviewEvent, KnowledgeReviewItem
from iad_core.workbench.query import SampleQuery
from iad_core.consistency.models import MODEL_ASSESSMENT_LABELS, ConsistencyStart, ImageRetrieve, ImageIndexPrepare, ConsistencyScopesSnapshot, ConsistencyCoverage, PixelDescriptor, PixelComparison, RetrievalCandidate
from iad_core.consistency.annotation_models import AnnotationComparison, AnnotationDifference, AnnotationMatchingConfig
from iad_core.consistency.conflict_categories import ConflictCategory, CONFLICT_CATEGORY_DEFAULTS, CONFLICT_CATEGORY_LABELS
from iad_core.consistency.group_analysis_conclusions import MODEL_CONCLUSION_LABELS
from iad_core.consistency.annotations import AnnotationSet
from iad_core.consistency.retrieval_models import RetrievalPage
from iad_core.consistency.evidence_models import ConsistencyCompare, ConsistencyResult, EvidenceBundle, ConsistencyEvidenceReference,ConsistencyEvidenceMediaReference
from iad_core.consistency.context_models import ConsistencyContextRequest,ConsistencyContext,ConsistencyReturnLocation
from iad_core.consistency.audit_models import AuditConsistencyView
from iad_core.consistency.review_models import ConsistencyReviewSubmission, ConsistencyReviewContext, CorrectionVerification, CorrectionCheck
from iad_core.consistency.group_review_models import GroupReviewSubmission, GroupReviewContext, GroupReviewDecision
from iad_core.consistency.job_models import ConsistencyBatch,ConsistencyBatchReference,ConsistencyBatchRetry,ConsistencyBatchList,StartResultResponse
from iad_core.consistency.result_models import ConsistencyQuery,ResultPage,ConsistencyReport
from iad_core.consistency.gallery import GalleryReference,GalleryQuery,GalleryMemberQuery,GalleryPage,GalleryMemberPage
from iad_core.consistency.group_analysis_models import GroupAnalysisView
from iad_core.consistency.group_queries import GroupQuery,GroupMemberQuery,StrictGroupPage,GroupMemberPage
from iad_core.contracts import ArtifactRef
from iad_core.consistency.temporary_images import TemporaryImageRef, TemporaryImageLimits
from iad_core.consistency.policy import AnnotationPolicy
from iad_core.consistency.agent_models import AnchorTraceEvent, ConsistencyAgentStart, ConsistencyCheckSnapshot, ConsistencyAnchorRun, ConsistencyCheckConfiguration, ConsistencyCheckReference, ConsistencyAnchorReference, ConsistencyCheckResultsQuery
from iad_core.consistency.pair_reviews import PairReviewTask, PairReviewReceipt
from iad_core.consistency.agent_review_models import AnchorVisualStart, AnchorObservation, AnchorObservationReceipt, AnchorContextQuery, AnchorAssessmentInput, AnchorReviewSubmission
from iad_core.consistency.agent_result_models import AnchorResultDetail, AnchorResultPage, AnchorResultSummary, ConsistencyCheckReport, AnchorDiagnostics, AnchorCandidatePage, AnchorImagePage
from iad_core.consistency.workflow_models import WorkflowContextQuery, AnomalyWorkflowObserve, BboxWorkflowObserve, AnomalyWorkflowAssess, BboxWorkflowAssess, WorkflowSubmit
from iad_core.consistency.identity_prompts import task_prompt_defaults, identity_prompt_defaults
from iad_core.consistency.task_types import TASK_TYPES_BY_FORMAT, TASK_CATEGORIES
from iad_core.feature.profiles import EmbeddingProfile, ImageEncoderConfig, ImageEncoderSettings, ImageEncoderEdit
from iad_core.feature.operations import ImageProfileCreate
from iad_core.feature.settings import DinoEncoderEdit, DinoSettingsView
models = [ ExplorationResults, DirectionRemoval, ExplorationPromptPreset, ExplorationPresetEdit, ProviderEdit, ProviderReference, ProviderDiscovery, ModelLimits, ModelProfile, ModelExecution, WorkbenchProvider, ModelCatalog, DirectionAdoption, ExplorationStart, ExplorationSnapshot, ExplorationCatalog, KnowledgeDiscoveryPage, KnowledgeDetailQuery, KnowledgeCheckPage, KnowledgeCheckEvidencePage, KnowledgeEvidencePage, KnowledgeReviewContext, KnowledgeReviewSubmission, KnowledgeReviewEvent, KnowledgeReviewItem, AuditAnalysis, KnowledgeSnapshot, KnowledgeVersion, KnowledgeQuery, KnowledgeSourceQuery, KnowledgeSourcePage, AuditAgentStart, ModelCallDetail, JobRetry, JobSnapshot, JobRetryOptions, InspectionReference, InspectionSnapshot, DatasetImport, FolderPreview, ArchiveInspection, ScanResult, DatasetReport, Annotation, ReviewDecisionRecord, ReviewSubmission, ReviewHistoryQuery, ReviewHistoryPage, SampleQuery]
models.extend([JobView, ConsistencyStart, ImageRetrieve, ImageIndexPrepare, ConsistencyScopesSnapshot, ConsistencyCoverage, PixelDescriptor, PixelComparison, RetrievalCandidate])
models.extend([AnnotationPolicy, AnnotationSet, AnnotationComparison, AnnotationDifference, AnnotationMatchingConfig])
models.extend([RetrievalPage, TemporaryImageRef])
models.extend([AuditConsistencyView, AuditSourceCatalog])
models.extend([AuditMasterContext, AuditBatch, AuditRecheck, AuditBatchCommit])
models.extend([AuditDistributionQuery, AuditDataDistribution])
models.extend([AuditBatchDelta, AuditDiscoveryQuery, AuditEvidenceCommit, AuditMediaQuery])
models.extend([AuditSampleQuery, AuditSamplePage, AuditRunReport, AuditStatistics, AuditRecordQuery, AuditReportCommit, AuditReportSession, AuditReportEvidenceQuery])
models.extend([KnowledgeCheckReviewSubmission])
models.extend([SubmittedMiningPrompt])
models.extend([AnalysisWave, ExplorationBatchReport, KnowledgeBatchReport, AnalysisWorkerMaterials])
models.extend([ExplorationEvidenceReport, KnowledgeEvidenceReport, ExplorationDeltaCommit, KnowledgeDeltaCommit, ExplorationDeltaFinalize, KnowledgeDeltaFinalize, AnalysisEvidenceReferenceQuery, AnalysisImageQuery])
models.extend([KnowledgeVersionCatalog])
models.extend([RegistrationImageQuery, ExplorationCropQuery, AnalysisBatchMaterials, AnalysisManifest, AnalysisPlan, RegistrationMediaQuery, RegistrationMediaPage, EvidenceReferenceQuery])
models.extend([ExplorationFinalize, KnowledgeFinalize, AnalysisFinalizationContext, AnalysisFinalizationReceipt])
models.extend([AnalysisArgumentQuery, AnalysisArgumentPage, AnalysisEntryQuery, AnalysisClaimHistory])
models.extend([AnalysisAgentStart, ExplorationAgentStart, KnowledgeAgentStart, AnalysisAgentConfiguration, AnalysisScope, AnalysisCatalogQuery, AnalysisCatalogPage,
    AnalysisWorkflowSnapshot, AnalysisWorkflowState, AnalysisAgentContext, AnalysisSessionLocation,
    RegistrationMediaQuery, RegistrationMediaPage, ExplorationCommit, KnowledgeCommit, AnalysisCommitReceipt, AnalysisPublication, AnalysisResultView, AnalysisPublicationView, AnalysisSampleEvidence, AnalysisObservationQuery, AnalysisObservationPage, AnalysisObservationHistoryPage, AnalysisResults, AnalysisJobPrompts, PublishedDirectionCatalog, AnalysisSourceCatalog])
models.extend([ConsistencyReviewSubmission, ConsistencyReviewContext, CorrectionVerification, CorrectionCheck])
models.extend([GroupReviewSubmission, GroupReviewContext, GroupReviewDecision, AnchorCandidatePage, AnchorImagePage])
models.extend([ConsistencyCompare,ConsistencyResult,EvidenceBundle,ConsistencyEvidenceReference,ConsistencyEvidenceMediaReference,ArtifactRef,ConsistencyContextRequest,ConsistencyContext,ConsistencyReturnLocation])
models.extend([ConsistencyBatch,ConsistencyBatchReference,ConsistencyBatchRetry,ConsistencyBatchList,StartResultResponse,ConsistencyQuery,ResultPage,ConsistencyReport])
models.extend([GroupQuery,GroupMemberQuery,StrictGroupPage,GroupMemberPage,GalleryReference,GalleryQuery,GalleryMemberQuery,GalleryPage,GalleryMemberPage,GroupAnalysisView])
models.extend([EmbeddingProfile, ImageEncoderConfig, ImageEncoderSettings, ImageEncoderEdit, ImageProfileCreate, DinoEncoderEdit, DinoSettingsView])
models.extend([ModuleSettingsSnapshot, ModuleSettingsEdit, ModuleModelReference, ModuleSettingsValues, ConsistencySettingsValues])
models.extend([ConsistencyAgentStart, ConsistencyCheckSnapshot, ConsistencyAnchorRun, ConsistencyCheckConfiguration, AnchorTraceEvent, ConsistencyCheckReference, ConsistencyAnchorReference, ConsistencyCheckResultsQuery, PairReviewTask, PairReviewReceipt])
models.extend([AnchorVisualStart, AnchorObservation, AnchorContextQuery, AnchorAssessmentInput, AnchorReviewSubmission])
models.extend([AnchorResultDetail, AnchorResultPage, AnchorResultSummary, ConsistencyCheckReport])
models.extend([NativeModelCallStart, NativeModelCallEnd])
models.extend([TokenBudget, ImageSessionLocation, AuditAgentConfiguration, AuditWorkflowSnapshot, AuditSampleRun, AuditAgentContext, AuditCommit, AuditJobPrompts, RegistrationCropQuery, NativeAuditSampleDetail, AuditEvidenceQuery])
models.extend([AnchorObservationReceipt])
models.extend([AnchorDiagnostics, WorkflowContextQuery, AnomalyWorkflowObserve, BboxWorkflowObserve, AnomalyWorkflowAssess, BboxWorkflowAssess, WorkflowSubmit])
modes = [(model, 'validation' if model is AuditDistributionQuery or model in (AuditBatchDelta, AuditDiscoveryQuery, AuditEvidenceCommit, AuditMediaQuery, ExplorationEvidenceReport, KnowledgeEvidenceReport, ExplorationDeltaCommit, KnowledgeDeltaCommit, ExplorationDeltaFinalize, KnowledgeDeltaFinalize, AnalysisEvidenceReferenceQuery, AnalysisImageQuery, AuditBatchCommit, ExplorationBatchReport, KnowledgeBatchReport, RegistrationImageQuery, ExplorationCropQuery, AuditRecordQuery, AuditReportCommit, AuditReportEvidenceQuery, WorkflowContextQuery, AnomalyWorkflowObserve, BboxWorkflowObserve, AnomalyWorkflowAssess, BboxWorkflowAssess, WorkflowSubmit, ExplorationFinalize, KnowledgeFinalize, AnalysisArgumentQuery, AnalysisEntryQuery, AuditAgentStart, AuditCommit, RegistrationCropQuery, AuditEvidenceQuery, AnalysisObservationQuery, EvidenceReferenceQuery, AnalysisCatalogQuery, ExplorationAgentStart, KnowledgeAgentStart, AnalysisScope, RegistrationMediaQuery, ExplorationCommit, KnowledgeCommit, AnchorVisualStart,AnchorContextQuery,AnchorAssessmentInput,AnchorReviewSubmission,ConsistencyAgentStart,ModuleSettingsEdit,GalleryReference,GalleryQuery,GalleryMemberQuery,ConsistencyContextRequest,ConsistencyReturnLocation,ConsistencyEvidenceMediaReference,GroupQuery,GroupMemberQuery,ConsistencyBatchReference,ConsistencyBatchRetry,ConsistencyQuery,ConsistencyCompare,ConsistencyEvidenceReference,ImageEncoderEdit, ImageProfileCreate, AnnotationPolicy, AnnotationMatchingConfig, ConsistencyStart, ImageRetrieve, ImageIndexPrepare, ExplorationPresetEdit, ProviderEdit, ProviderDiscovery, ModelExecution, DirectionAdoption, ExplorationStart, KnowledgeCheckReviewSubmission, KnowledgeDetailQuery, KnowledgeReviewSubmission, KnowledgeSourceQuery, AuditAgentStart, JobRetry, InspectionReference, DatasetImport, ReviewSubmission, ReviewHistoryQuery) else 'serialization') for model in models]
references, schema = models_json_schema(modes)
schema.update(title='WorkbenchDomain', type='object', additionalProperties=False,
    properties={model.__name__: references[(model, mode)] for model, mode in modes})
schema['x-query-operations'] = sorted(QUERY_OPERATIONS)
schema['x-audit-state-labels'] = AUDIT_STATE_LABELS
schema['x-audit-capability-labels'] = AUDIT_CAPABILITY_LABELS
schema['x-audit-coverage-labels'] = AUDIT_COVERAGE_LABELS
schema['x-audit-discovery-status-labels'] = AUDIT_DISCOVERY_STATUS_LABELS
schema['x-audit-purpose-labels'] = AUDIT_PURPOSE_LABELS
schema['x-audit-usability-labels'] = AUDIT_USABILITY_LABELS
schema['x-audit-readiness-labels'] = AUDIT_READINESS_LABELS
schema['x-audit-issue-labels'] = AUDIT_ISSUE_LABELS
schema['x-audit-issue-descriptions'] = AUDIT_ISSUE_DESCRIPTIONS
schema['x-audit-assessment-labels'] = AUDIT_ASSESSMENT_LABELS
schema['x-audit-issue-types-by-format'] = AUDIT_ISSUE_TYPES_BY_FORMAT
schema['x-audit-consistency-labels'] = AUDIT_CONSISTENCY_LABELS
schema['x-audit-consistency-descriptions'] = AUDIT_CONSISTENCY_DESCRIPTIONS
schema['x-model-assessment-labels'] = MODEL_ASSESSMENT_LABELS
schema['x-conflict-categories'] = [category.value for category in ConflictCategory]
schema['x-conflict-category-defaults'] = CONFLICT_CATEGORY_DEFAULTS
schema['x-conflict-category-labels'] = CONFLICT_CATEGORY_LABELS
schema['x-model-conclusion-labels'] = MODEL_CONCLUSION_LABELS
schema['x-model-defaults'] = ModelLimits().model_dump()
schema['x-reasoning-effort-labels'] = REASONING_EFFORT_LABELS
schema['x-consistency-task-prompts'] = {task: task_prompt_defaults(task) for task in TASK_TYPES_BY_FORMAT.values()}
schema['x-consistency-identity-prompts'] = identity_prompt_defaults()
schema['x-consistency-task-formats'] = TASK_TYPES_BY_FORMAT
schema['x-consistency-task-categories'] = TASK_CATEGORIES
schema['x-prompt-defaults'] = {'audit':DEFAULT_AUDIT_USER_PROMPT, 'auditReport':DEFAULT_AUDIT_REPORT_PROMPT, 'auditMasterSystem':MASTER_AUDIT_SYSTEM_PROMPT, 'auditBatch':DEFAULT_AUDIT_BATCH_PROMPT,
    'knowledgeObserverSystem':KnowledgePrompts.system('observer'), 'knowledgeObjective':DEFAULT_OBJECTIVE, 'knowledgeInstruction':DEFAULT_KNOWLEDGE_USER_PROMPT, 'explorationSystem':{format:ExplorationPrompts.system(format) for format in ('labelme','folder_classification')}, 'explorationObserverSystem':{format:ExplorationPrompts.system(format,'observer') for format in ('labelme','folder_classification')}, 'system':{'audit':OBSERVER_AUDIT_SYSTEM_PROMPT,'exploration':ExplorationPrompts.system('labelme'),'knowledge':KnowledgePrompts.system()}}
schema['x-temporary-image-limits'] = TemporaryImageLimits().model_dump()
print(json.dumps(schema))
`], { cwd: workspace, env: { ...process.env, PYTHONPATH: path.join(workspace, "python") }, encoding: "utf8" }));
function typescriptSchema(node) {
  if(Array.isArray(node))return node.map(typescriptSchema);
  if(!node||typeof node!=='object')return node;
  const result=Object.fromEntries(Object.entries(node).map(([key,value])=>[key,typescriptSchema(value)]));
  if(result.prefixItems){
    result.additionalItems=result.items??(result.maxItems===undefined);
    result.items=result.prefixItems;
    delete result.prefixItems;
  }
  return result;
}

const output = await compile(typescriptSchema(schema), "WorkbenchDomain", {
  bannerComment: "/* Generated from Python Pydantic models by scripts/generate-contracts.js. */",
  additionalProperties: false, format: true,
});
// The native SDK uses per-property required flags and a JSON-value schema DSL.
function toolSchema(node, required = true) {
  if (node.$ref) return toolSchema(schema.$defs[node.$ref.split("/").at(-1)], required);
  const alternatives = node.oneOf || node.anyOf;
  const branches = alternatives?.map(branch => toolSchema(branch));
  const nonNull = branches?.filter(branch => branch.type !== 'null');
  // Optional objects are omitted when unused, keeping their type visible to tool templates.
  const value = !required && nonNull?.length === 1 && nonNull[0].type === 'object' ? nonNull[0]
    : branches ? {oneOf: branches} : {type: node.type};
  if (node.type === "object") {
    value.additionalProperties = typeof node.additionalProperties === "object" ? true : node.additionalProperties ?? false;
    value.properties = Object.fromEntries(Object.entries(node.properties || {}).map(([name, property]) => [name,
      { ...toolSchema(property, !!node.required?.includes(name)), ...(node.required?.includes(name) ? { required: true } : {}) }]));
  }
  if (node.items) value.items = toolSchema(node.items);
  if(node.prefixItems){
    const items=[...new Map(node.prefixItems.map(item=>{const schema=toolSchema(item);return [JSON.stringify(schema),schema];})).values()];
    value.items=items.length===1 ? items[0] : {oneOf:items};
  }
  if ('const' in node) value.enum = [node.const];
  for (const key of ["enum", "description", "title", "default"]) {
    if(key==='default' && typeof node[key]==='object')continue;
    if (key in node) value[key] = node[key];
  }
  return value;
}
const explorationAgentParameters = toolSchema(schema.properties.ExplorationAgentStart).properties;
const knowledgeAgentParameters = toolSchema(schema.properties.KnowledgeAgentStart).properties;
delete explorationAgentParameters.analysis_kind;
delete knowledgeAgentParameters.analysis_kind;
const consistencyParameters=toolSchema(schema.properties.ConsistencyStart).properties;
for(const field of ['mode','min_similarity','top_k'])delete consistencyParameters[field].default;
const consistencyAgentParameters = toolSchema(schema.properties.ConsistencyAgentStart).properties;
const auditParameters = toolSchema(schema.properties.AuditAgentStart).properties;
const auditEvidenceSchemas = toolSchema(schema.properties.AuditEvidenceQuery).oneOf;
const auditEvidenceParameters = Object.fromEntries(auditEvidenceSchemas.flatMap(branch => Object.entries(branch.properties))
  .map(([name, property]) => {
    const {required, ...value} = property;
    return [name, {...value, ...(auditEvidenceSchemas.every(branch => branch.properties[name]?.required) ? {required:true} : {})}];
  }));

const consistencyRouteEnums = Object.fromEntries(Object.entries(toolSchema(schema.properties.ConsistencyReturnLocation).properties)
  .flatMap(([key, value]) => {
    const choices = (value.oneOf || [value]).flatMap(branch => branch.enum || []);
    return choices.length ? [[key, choices]] : [];
  }));

const anchorToolParameters = Object.fromEntries([
  ['anomaly_detection','AnomalyWorkflowObserve','AnomalyWorkflowAssess'],
  ['bbox_defect','BboxWorkflowObserve','BboxWorkflowAssess'],
].map(([task,observe,assess])=>[task,{
  context:toolSchema(schema.properties.WorkflowContextQuery).properties,
  observe:toolSchema(schema.properties[observe]).properties,
  assess:toolSchema(schema.properties[assess]).properties,
  submit:toolSchema(schema.properties.WorkflowSubmit).properties,
}]));
const targets = {
  "analysis-agent.parameters.generated.ts": `/* Generated from Python analysis Agent models. */\nexport const explorationAgentStartParameters = ${JSON.stringify(explorationAgentParameters,null,2)} as const;\nexport const knowledgeAgentStartParameters = ${JSON.stringify(knowledgeAgentParameters,null,2)} as const;\nexport const analysisScopeParameters = ${JSON.stringify(toolSchema(schema.properties.AnalysisScope).properties,null,2)} as const;\nexport const analysisCatalogParameters = ${JSON.stringify(toolSchema(schema.properties.AnalysisCatalogQuery).properties,null,2)} as const;\nexport const analysisObservationParameters = ${JSON.stringify(toolSchema(schema.properties.AnalysisObservationQuery).properties,null,2)} as const;\nexport const analysisArgumentParameters = ${JSON.stringify(toolSchema(schema.properties.AnalysisArgumentQuery).properties,null,2)} as const;\nexport const analysisClaimParameters = ${JSON.stringify(toolSchema(schema.properties.AnalysisEntryQuery).properties,null,2)} as const;\nexport const analysisMediaParameters = ${JSON.stringify(toolSchema(schema.properties.RegistrationMediaQuery).properties,null,2)} as const;\nexport const explorationImageParameters = ${JSON.stringify(toolSchema(schema.properties.RegistrationImageQuery).properties,null,2)} as const;\nexport const explorationCropParameters = ${JSON.stringify(toolSchema(schema.properties.ExplorationCropQuery).properties,null,2)} as const;\nexport const analysisCropParameters = ${JSON.stringify(toolSchema(schema.properties.RegistrationCropQuery).properties,null,2)} as const;\nexport const explorationFinalizeParameters = ${JSON.stringify(toolSchema(schema.properties.ExplorationFinalize).properties,null,2)} as const;\nexport const knowledgeFinalizeParameters = ${JSON.stringify(toolSchema(schema.properties.KnowledgeFinalize).properties,null,2)} as const;\nexport const explorationCommitParameters = ${JSON.stringify(toolSchema(schema.properties.ExplorationCommit).properties,null,2)} as const;\nexport const knowledgeBatchReportParameters = ${JSON.stringify(toolSchema(schema.properties.KnowledgeBatchReport).properties,null,2)} as const;\nexport const knowledgeCommitParameters = ${JSON.stringify(toolSchema(schema.properties.KnowledgeCommit).properties,null,2)} as const;\n`,
  "analysis-context.parameters.generated.ts": `/* Generated from Python analysis context models. */\n${Object.entries({explorationEvidenceReportParameters:'ExplorationEvidenceReport',knowledgeEvidenceReportParameters:'KnowledgeEvidenceReport',explorationDeltaCommitParameters:'ExplorationDeltaCommit',knowledgeDeltaCommitParameters:'KnowledgeDeltaCommit',explorationDeltaFinalizeParameters:'ExplorationDeltaFinalize',knowledgeDeltaFinalizeParameters:'KnowledgeDeltaFinalize',analysisEvidenceReferenceParameters:'AnalysisEvidenceReferenceQuery',analysisImageViewParameters:'AnalysisImageQuery'}).map(([name,model])=>`export const ${name} = ${JSON.stringify(toolSchema(schema.properties[model]).properties,null,2)} as const;`).join('\n')}\n`,
  "audit-context.parameters.generated.ts": `/* Generated from Python audit context models. */\n${Object.entries({auditBatchDeltaParameters:'AuditBatchDelta',auditDiscoveryParameters:'AuditDiscoveryQuery',auditEvidenceCommitParameters:'AuditEvidenceCommit',auditMediaParameters:'AuditMediaQuery'}).map(([name,model])=>`export const ${name} = ${JSON.stringify(toolSchema(schema.properties[model]).properties,null,2)} as const;`).join('\n')}\n`,
  "consistency-agent.parameters.generated.ts": `/* Generated from Python anchor review models. */\nexport const consistencyAgentStartParameters = ${JSON.stringify(consistencyAgentParameters,null,2)} as const;\nexport const consistencyAnchorReferenceParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyAnchorReference).properties,null,2)} as const;\nexport const consistencyCheckResultsQueryParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyCheckResultsQuery).properties,null,2)} as const;\nexport const consistencyCheckReferenceParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyCheckReference).properties,null,2)} as const;\nexport const anchorToolParameters = ${JSON.stringify(anchorToolParameters,null,2)} as const;\n`,
  "prompt-defaults.generated.ts": `/* Generated from Python model prompt defaults. */\nexport const promptDefaults = ${JSON.stringify(schema['x-prompt-defaults'],null,2)} as const;\nexport const consistencyTaskPrompts = ${JSON.stringify(schema['x-consistency-task-prompts'],null,2)} as const;\nexport const consistencyIdentityPrompts = ${JSON.stringify(schema['x-consistency-identity-prompts'],null,2)} as const;\nexport const consistencyTaskFormats = ${JSON.stringify(schema['x-consistency-task-formats'],null,2)} as const;\nexport const consistencyTaskCategories = ${JSON.stringify(schema['x-consistency-task-categories'],null,2)} as const;\n`,
  "audit.generated.ts": `/* Generated from Python audit result models by scripts/generate-contracts.js. */\nexport const auditCapabilityLabels = ${JSON.stringify(schema["x-audit-capability-labels"],null,2)} as const;\nexport const auditCoverageLabels = ${JSON.stringify(schema["x-audit-coverage-labels"],null,2)} as const;\nexport const auditDiscoveryStatusLabels = ${JSON.stringify(schema["x-audit-discovery-status-labels"],null,2)} as const;\nexport const auditPurposeLabels = ${JSON.stringify(schema["x-audit-purpose-labels"],null,2)} as const;\nexport const auditUsabilityLabels = ${JSON.stringify(schema["x-audit-usability-labels"],null,2)} as const;\nexport const auditReadinessLabels = ${JSON.stringify(schema["x-audit-readiness-labels"],null,2)} as const;\nexport const auditStateLabels = ${JSON.stringify(schema['x-audit-state-labels'], null, 2)} as const;\nexport const auditIssueLabels = ${JSON.stringify(schema['x-audit-issue-labels'],null,2)} as const;\nexport const auditIssueDescriptions = ${JSON.stringify(schema['x-audit-issue-descriptions'],null,2)} as const;\nexport const auditIssueTypesByFormat = ${JSON.stringify(schema["x-audit-issue-types-by-format"],null,2)} as const;\nexport const auditAssessmentLabels = ${JSON.stringify(schema['x-audit-assessment-labels'],null,2)} as const;\nexport const auditConsistencyLabels = ${JSON.stringify(schema['x-audit-consistency-labels'],null,2)} as const;\nexport const auditConsistencyDescriptions = ${JSON.stringify(schema['x-audit-consistency-descriptions'],null,2)} as const;\n`,
  "execution.generated.ts": `/* Generated from Python operation execution policy by scripts/generate-contracts.js. */\nexport const queryOperations = ${JSON.stringify(schema["x-query-operations"], null, 2)} as const;\n`,
  "media-reference.parameters.generated.ts": `/* Generated from Python EvidenceReferenceQuery. */\nexport const evidenceReferenceParameters = ${JSON.stringify(toolSchema(schema.properties.EvidenceReferenceQuery).properties,null,2)} as const;\n`,
  "distribution.parameters.generated.ts": `/* Generated from Python audit distribution models. */\nexport const auditDistributionParameters = ${JSON.stringify(toolSchema(schema.properties.AuditDistributionQuery).properties,null,2)} as const;\n`,
  "audit.parameters.generated.ts": `/* Generated from Python AuditAgentStart by scripts/generate-contracts.js. */\nexport const auditEvidenceParameters = ${JSON.stringify(auditEvidenceParameters,null,2)} as const;\nexport const auditBatchParameters = ${JSON.stringify(toolSchema(schema.properties.AuditBatchCommit).properties,null,2)} as const;\nexport const auditCommitParameters = ${JSON.stringify(toolSchema(schema.properties.AuditCommit).properties,null,2)} as const;\nexport const auditRecordParameters = ${JSON.stringify(toolSchema(schema.properties.AuditRecordQuery).properties,null,2)} as const;\nexport const auditReportParameters = ${JSON.stringify(toolSchema(schema.properties.AuditReportCommit).properties,null,2)} as const;\nexport const auditReportEvidenceParameters = ${JSON.stringify(toolSchema(schema.properties.AuditReportEvidenceQuery).properties,null,2)} as const;\nexport const auditCropParameters = ${JSON.stringify(toolSchema(schema.properties.RegistrationCropQuery).properties,null,2)} as const;\nexport const auditStartParameters = ${JSON.stringify(auditParameters,null,2)} as const;\n`,
  "consistency.parameters.generated.ts": `/* Generated from Python consistency models by scripts/generate-contracts.js. */\nexport const conflictCategoryDefaults = ${JSON.stringify(schema["x-conflict-category-defaults"],null,2)} as const;\nexport const conflictCategoryLabels = ${JSON.stringify(schema["x-conflict-category-labels"],null,2)} as const;\nexport const modelConclusionLabels = ${JSON.stringify(schema["x-model-conclusion-labels"],null,2)} as const;\nexport const conflictCategories = ${JSON.stringify(schema["x-conflict-categories"],null,2)} as const;\nexport const modelAssessmentLabels = ${JSON.stringify(schema["x-model-assessment-labels"],null,2)} as const;\nexport const consistencyRouteEnums = ${JSON.stringify(consistencyRouteEnums,null,2)} as const;\nexport const galleryReferenceParameters = ${JSON.stringify(toolSchema(schema.properties.GalleryReference).properties,null,2)} as const;\nexport const consistencyStartParameters = ${JSON.stringify(consistencyParameters, null, 2)} as const;\nexport const imageRetrieveParameters = ${JSON.stringify(toolSchema(schema.properties.ImageRetrieve).properties, null, 2)} as const;\nexport const imageIndexPrepareParameters = ${JSON.stringify(toolSchema(schema.properties.ImageIndexPrepare).properties, null, 2)} as const;\nexport const consistencyCompareParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyCompare).properties,null,2)} as const;\nexport const consistencyEvidenceParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyEvidenceReference).properties,null,2)} as const;\nexport const consistencyQueryParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyQuery).properties,null,2)} as const;\nexport const consistencyGroupParameters = ${JSON.stringify(toolSchema(schema.properties.GroupQuery).properties,null,2)} as const;\nexport const consistencyGroupMemberParameters = ${JSON.stringify(toolSchema(schema.properties.GroupMemberQuery).properties,null,2)} as const;\nexport const consistencyContextParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyContextRequest).properties,null,2)} as const;\nexport const consistencyBatchParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyBatchReference).properties,null,2)} as const;\nexport const consistencyRetryParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyBatchRetry).properties,null,2)} as const;\nexport const consistencyMediaParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyEvidenceMediaReference).properties,null,2)} as const;\nexport const temporaryImageLimits = ${JSON.stringify(schema["x-temporary-image-limits"], null, 2)} as const;\n`,
  "exploration.parameters.generated.ts": `/* Generated from Python exploration preset models. */\nexport const explorationPresetParameters = ${JSON.stringify(toolSchema(schema.properties.ExplorationPresetEdit).properties, null, 2)} as const;\nexport const explorationBatchReportParameters = ${JSON.stringify(toolSchema(schema.properties.ExplorationBatchReport).properties,null,2)} as const;\n`,
  "domain.generated.ts": output,
  "model-settings.generated.ts": `/* Generated from Python model settings by scripts/generate-contracts.js. */\nimport type { ModelLimits } from "./domain.generated.js";\nexport const defaultModelLimits: ModelLimits = ${JSON.stringify(schema["x-model-defaults"], null, 2)};\nexport const reasoningEffortLabels = ${JSON.stringify(schema['x-reasoning-effort-labels'],null,2)} as const;\n`,
  "dataset.parameters.generated.ts": `/* Generated from Python dataset models by scripts/generate-contracts.js. */\nexport const folderRulesParameter = ${JSON.stringify({type: "array", items: toolSchema({$ref: "#/$defs/FolderRule"})}, null, 2)} as const;\nexport const annotationPolicyParameter = ${JSON.stringify(toolSchema(schema.properties.AnnotationPolicy), null, 2)} as const;\n`,
  "knowledge-detail.parameters.generated.ts": `/* Generated from Python KnowledgeDetailQuery by scripts/generate-contracts.js. */\nexport const knowledgeDetailParameters = ${JSON.stringify(toolSchema(schema.properties.KnowledgeDetailQuery).properties, null, 2)} as const;\n`,
  "knowledge-source.parameters.generated.ts": `/* Generated from Python KnowledgeSourceQuery by scripts/generate-contracts.js. */\nexport const knowledgeSourceParameters = ${JSON.stringify(toolSchema(schema.properties.KnowledgeSourceQuery).properties, null, 2)} as const;\n`,
};
for (const [name, content] of Object.entries(targets)) {
  const target = fileURLToPath(new URL(`../src/shared/${name}`, import.meta.url));
  if (process.argv.includes("--check")) {
    if (await fs.readFile(target, "utf8") !== content) throw new Error(`${name} differs from Pydantic; run generate:contracts`);
  } else await fs.writeFile(target, content);
}
