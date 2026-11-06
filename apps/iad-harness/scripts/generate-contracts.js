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
from iad_core.consistency.group_analysis_prompts import DEFAULT_CONSISTENCY_PROMPT
from iad_core.workbench.audit_prompts import DEFAULT_AUDIT_PROMPT
from iad_core.workbench.audit_sources import AuditSourceCatalog
from iad_core.workbench.report_presentation import REPORT_CHART_STYLES
from iad_core.knowledge.prompt_text import mining_prompt_text
from iad_core.knowledge.instructions import DEFAULT_OBJECTIVE, SubmittedMiningPrompt
from iad_core.advisory.analysis import AuditAnalysis
from iad_core.exploration.models import ExplorationStart, ExplorationSnapshot, ExplorationCatalog, ExplorationResults, DirectionRemoval, DirectionAdoption, ExplorationPromptPreset, ExplorationPresetEdit
from iad_core.exploration.batches import ExplorationBatchStart
from iad_core.workbench.analysis_workflows import AnalysisWorkflowStart, ExplorationWorkflowStart, KnowledgeWorkflowStart, ConsistencyWorkflowStart
from iad_core.knowledge.models import KnowledgeSnapshot, KnowledgeVersion, KnowledgeQuery, KnowledgeSourceQuery, KnowledgeSourcePage, KnowledgeDetailQuery, KnowledgeCheckPage, KnowledgeCheckEvidencePage, KnowledgeEvidencePage, KnowledgeDiscoveryPage
from iad_core.knowledge.prompts import MiningPrompt, MiningPromptEdit
from iad_core.knowledge.models import KnowledgeCheckReviewSubmission
from iad_core.knowledge.models import KnowledgeVersionCatalog
from iad_core.knowledge.batches import KnowledgeBatchStart
from iad_core.knowledge.trace import KnowledgeTracePage
from iad_core.knowledge.requests import MiningStart, MiningRequest
from iad_core.knowledge.scopes import KnowledgeScopeOpen, KnowledgeScopeSnapshot
from iad_core.workbench.model_settings import WorkbenchModelSelection, WorkbenchModelSettings, WorkbenchModelEdit, WorkbenchProvider, WorkbenchModelView, ModelExecution, ModelConnection, ProviderEdit, ProviderReference, ProviderDiscovery
from iad_core.workbench.model_profile import ModelLimits, ModelProfile
from iad_core.workbench.audit import AuditStart
from iad_core.workbench.calls import ModelCallDetail
from iad_core.workbench.job_models import JobRetry, JobSnapshot, JobView, JobRetryOptions
from iad_core.workbench.inspection_context import InspectionReference, InspectionSnapshot
from iad_core.dataset.registry import DatasetImport
from iad_core.dataset.folder_preview import FolderPreview
from iad_core.dataset.archive import ArchiveInspection
from iad_core.dataset.scanner import ScanResult
from iad_core.workbench.report import DatasetReport
from iad_core.workbench.audit_result_models import AuditSampleQuery, AuditSamplePage, AuditSampleDetail, AuditRunReport, AUDIT_STATE_LABELS
from iad_core.workbench.dataset_report_models import DatasetReportStart, DatasetReportSnapshot, DatasetReportView, ReportJobState
from iad_core.workbench.report_requirements import REPORT_REQUIREMENTS, DEFAULT_REPORT_PROMPT
from iad_core.storage.models import Annotation, ReviewDecisionRecord
from iad_core.workbench.review import ReviewSubmission, ReviewHistoryQuery, ReviewHistoryPage
from iad_core.workbench.knowledge_review import KnowledgeReviewContext, KnowledgeReviewSubmission, KnowledgeReviewEvent, KnowledgeReviewItem
from iad_core.workbench.query import SampleQuery
from iad_core.consistency.models import MODEL_ASSESSMENT_LABELS, ConsistencyStart, ImageRetrieve, ImageIndexPrepare, ConsistencyScopesSnapshot, ConsistencyCoverage, PixelDescriptor, PixelComparison, RetrievalCandidate
from iad_core.consistency.annotation_models import AnnotationComparison, AnnotationDifference, AnnotationMatchingConfig
from iad_core.consistency.annotations import AnnotationSet
from iad_core.consistency.retrieval_models import RetrievalPage
from iad_core.consistency.evidence_models import ConsistencyCompare, ConsistencyResult, EvidenceBundle, ConsistencyEvidenceReference,ConsistencyEvidenceMediaReference
from iad_core.consistency.context_models import ConsistencyContextRequest,ConsistencyContext,ConsistencyReturnLocation
from iad_core.consistency.audit_models import AuditConsistencyView
from iad_core.consistency.review_models import ConsistencyReviewSubmission, ConsistencyReviewContext, CorrectionVerification, CorrectionCheck
from iad_core.consistency.job_models import ConsistencyBatch,ConsistencyBatchReference,ConsistencyBatchRetry,ConsistencyBatchList,StartResultResponse
from iad_core.consistency.result_models import ConsistencyQuery,ResultPage,ConsistencyReport
from iad_core.consistency.gallery import GalleryReference,GalleryQuery,GalleryMemberQuery,GalleryPage,GalleryMemberPage
from iad_core.consistency.group_analysis_models import GroupAnalysisStart,GroupAnalysisView
from iad_core.consistency.model_batches import ConsistencyModelStart
from iad_core.consistency.group_queries import GroupQuery,GroupMemberQuery,StrictGroupPage,GroupMemberPage
from iad_core.contracts import ArtifactRef
from iad_core.consistency.temporary_images import TemporaryImageRef, TemporaryImageLimits
from iad_core.consistency.policy import AnnotationPolicy
from iad_core.feature.profiles import BACKBONES, EmbeddingProfile, ImageEncoderConfig, ImageEncoderSettings, ImageEncoderEdit
from iad_core.feature.operations import ImageProfileCreate
models = [DatasetReportStart, DatasetReportSnapshot, DatasetReportView, ReportJobState, ExplorationResults, DirectionRemoval, ExplorationPromptPreset, ExplorationPresetEdit, ProviderEdit, ProviderReference, ProviderDiscovery, ModelConnection, ModelLimits, ModelProfile, ModelExecution, WorkbenchModelSelection, WorkbenchModelSettings, WorkbenchModelEdit, WorkbenchProvider, WorkbenchModelView, DirectionAdoption, ExplorationStart, ExplorationSnapshot, ExplorationCatalog, MiningPrompt, MiningPromptEdit, KnowledgeDiscoveryPage, KnowledgeTracePage, KnowledgeScopeOpen, KnowledgeScopeSnapshot, KnowledgeDetailQuery, KnowledgeCheckPage, KnowledgeCheckEvidencePage, KnowledgeEvidencePage, KnowledgeReviewContext, KnowledgeReviewSubmission, KnowledgeReviewEvent, KnowledgeReviewItem, AuditAnalysis, KnowledgeSnapshot, KnowledgeVersion, KnowledgeQuery, KnowledgeSourceQuery, KnowledgeSourcePage, AuditStart, ModelCallDetail, JobRetry, JobSnapshot, JobRetryOptions, InspectionReference, InspectionSnapshot, DatasetImport, FolderPreview, ArchiveInspection, ScanResult, DatasetReport, MiningStart, MiningRequest, Annotation, ReviewDecisionRecord, ReviewSubmission, ReviewHistoryQuery, ReviewHistoryPage, SampleQuery]
models.extend([JobView, ConsistencyStart, ImageRetrieve, ImageIndexPrepare, ConsistencyScopesSnapshot, ConsistencyCoverage, PixelDescriptor, PixelComparison, RetrievalCandidate])
models.extend([AnnotationPolicy, AnnotationSet, AnnotationComparison, AnnotationDifference, AnnotationMatchingConfig])
models.extend([RetrievalPage, TemporaryImageRef])
models.extend([AuditConsistencyView, AuditSourceCatalog])
models.extend([AuditSampleQuery, AuditSamplePage, AuditSampleDetail, AuditRunReport])
models.extend([KnowledgeCheckReviewSubmission])
models.extend([KnowledgeBatchStart, SubmittedMiningPrompt])
models.extend([KnowledgeVersionCatalog])
models.extend([ExplorationBatchStart, AnalysisWorkflowStart, ExplorationWorkflowStart, KnowledgeWorkflowStart, ConsistencyWorkflowStart])
models.extend([ConsistencyModelStart])
models.extend([ConsistencyReviewSubmission, ConsistencyReviewContext, CorrectionVerification, CorrectionCheck])
models.extend([ConsistencyCompare,ConsistencyResult,EvidenceBundle,ConsistencyEvidenceReference,ConsistencyEvidenceMediaReference,ArtifactRef,ConsistencyContextRequest,ConsistencyContext,ConsistencyReturnLocation])
models.extend([ConsistencyBatch,ConsistencyBatchReference,ConsistencyBatchRetry,ConsistencyBatchList,StartResultResponse,ConsistencyQuery,ResultPage,ConsistencyReport])
models.extend([GroupQuery,GroupMemberQuery,StrictGroupPage,GroupMemberPage,GalleryReference,GalleryQuery,GalleryMemberQuery,GalleryPage,GalleryMemberPage,GroupAnalysisStart,GroupAnalysisView])
models.extend([EmbeddingProfile, ImageEncoderConfig, ImageEncoderSettings, ImageEncoderEdit, ImageProfileCreate])
modes = [(model, 'validation' if model in (DatasetReportStart,GroupAnalysisStart,GalleryReference,GalleryQuery,GalleryMemberQuery,ConsistencyContextRequest,ConsistencyReturnLocation,ConsistencyEvidenceMediaReference,GroupQuery,GroupMemberQuery,ConsistencyBatchReference,ConsistencyBatchRetry,ConsistencyQuery,ConsistencyCompare,ConsistencyEvidenceReference,ImageEncoderEdit, ImageProfileCreate, AnnotationPolicy, AnnotationMatchingConfig, ConsistencyStart, ImageRetrieve, ImageIndexPrepare, ExplorationPresetEdit, ProviderEdit, ProviderDiscovery, ModelExecution, WorkbenchModelSelection, WorkbenchModelEdit, DirectionAdoption, ExplorationStart, ExplorationBatchStart, KnowledgeBatchStart, ConsistencyModelStart, KnowledgeCheckReviewSubmission, KnowledgeScopeOpen, KnowledgeDetailQuery, KnowledgeReviewSubmission, MiningStart, MiningRequest, KnowledgeSourceQuery, AuditStart, JobRetry, InspectionReference, DatasetImport, ReviewSubmission, ReviewHistoryQuery) else 'serialization') for model in models]
references, schema = models_json_schema(modes)
schema.update(title='WorkbenchDomain', type='object', additionalProperties=False,
    properties={model.__name__: references[(model, mode)] for model, mode in modes})
schema['x-query-operations'] = sorted(QUERY_OPERATIONS)
schema['x-audit-state-labels'] = AUDIT_STATE_LABELS
schema['x-report-chart-styles'] = REPORT_CHART_STYLES
schema['x-report-requirements'] = REPORT_REQUIREMENTS
schema['x-model-assessment-labels'] = MODEL_ASSESSMENT_LABELS
schema['x-model-defaults'] = ModelLimits().model_dump()
schema['x-prompt-defaults'] = {'consistency': DEFAULT_CONSISTENCY_PROMPT, 'audit':DEFAULT_AUDIT_PROMPT, 'report':DEFAULT_REPORT_PROMPT,
    'knowledge':mining_prompt_text(),'knowledgeObjective':DEFAULT_OBJECTIVE}
schema['x-analysis-defaults'] = {model.model_fields['analysis_kind'].default:
    {name:field.default for name,field in model.model_fields.items() if name in ('batch_size','initial_batch_size','candidate_batch_size')}
    for model in (ExplorationWorkflowStart, KnowledgeWorkflowStart, ConsistencyWorkflowStart)}
schema['x-image-backbones'] = {name: vars(backbone) for name, backbone in BACKBONES.items()}
schema['x-temporary-image-limits'] = TemporaryImageLimits().model_dump()
print(json.dumps(schema))
`], { cwd: workspace, env: { ...process.env, PYTHONPATH: path.join(workspace, "python") }, encoding: "utf8" }));
const output = await compile(schema, "WorkbenchDomain", {
  bannerComment: "/* Generated from Python Pydantic models by scripts/generate-contracts.js. */",
  additionalProperties: false, format: true,
});
// The native SDK uses per-property required flags and a JSON-value schema DSL.
function toolSchema(node, optional = false) {
  if (node.$ref) return toolSchema(schema.$defs[node.$ref.split("/").at(-1)], optional);
  // Optional nullable fields use omission on the tool boundary so native
  // parsers can read a concrete type without interpreting union schemas.
  const concrete = optional && node.anyOf?.length === 2 && node.anyOf.some(branch => branch.type === "null")
    ? node.anyOf.find(branch => branch.type !== "null") : null;
  const alternatives = node.oneOf || node.anyOf;
  const value = concrete ? toolSchema(concrete)
    : alternatives ? { oneOf: alternatives.map(branch => toolSchema(branch)) } : { type: node.type };
  if (node.type === "object") {
    value.additionalProperties = typeof node.additionalProperties === "object" ? true : node.additionalProperties ?? false;
    value.properties = Object.fromEntries(Object.entries(node.properties || {}).map(([name, property]) => [name,
      { ...toolSchema(property, !node.required?.includes(name)), ...(node.required?.includes(name) ? { required: true } : {}) }]));
  }
  if (node.items) value.items = toolSchema(node.items);
  if(node.prefixItems){
    const items=[...new Map(node.prefixItems.map(item=>{const schema=toolSchema(item);return [JSON.stringify(schema),schema];})).values()];
    value.items=items.length===1 ? items[0] : {oneOf:items};
  }
  if ('const' in node) value.enum = [node.const];
  for (const key of ["enum", "description", "title", "default"]) {
    if(key==='default' && typeof node[key]==='object')continue;
    if (key in node && !(concrete && key === "default" && node[key] === null)) value[key] = node[key];
  }
  return value;
}
const parameters = {...toolSchema(schema.properties.MiningStart).properties, mining_prompt: {...toolSchema(schema.properties.SubmittedMiningPrompt), required:true}};
const auditParameters = toolSchema(schema.properties.AuditStart).properties;
delete auditParameters.model_name;
delete auditParameters.origin_session_id;
auditParameters.knowledge_version_id.required = true;
const targets = {
  "report-chart-styles.generated.ts": `/* Generated from Python report presentation styles. */\nexport const reportChartStyles = ${JSON.stringify(schema['x-report-chart-styles'])};\n`,
  "prompt-defaults.generated.ts": `/* Generated from Python model prompt defaults. */\nexport const promptDefaults = ${JSON.stringify(schema['x-prompt-defaults'],null,2)} as const;\n`,
  "audit.generated.ts": `/* Generated from Python audit result models by scripts/generate-contracts.js. */\nexport const auditStateLabels = ${JSON.stringify(schema['x-audit-state-labels'], null, 2)} as const;\n`,
  "execution.generated.ts": `/* Generated from Python operation execution policy by scripts/generate-contracts.js. */\nexport const queryOperations = ${JSON.stringify(schema["x-query-operations"], null, 2)} as const;\n`,
  "report-requirements.generated.ts": `/* Generated from Python report requirements. */\nexport const reportRequirements = ${JSON.stringify(schema['x-report-requirements'],null,2)} as const;\n`,
  "audit.parameters.generated.ts": `/* Generated from Python AuditStart by scripts/generate-contracts.js. */\nexport const auditStartParameters = ${JSON.stringify(auditParameters,null,2)} as const;\n`,
  "image-encoder.parameters.generated.ts": `/* Generated from Python image encoder models by scripts/generate-contracts.js. */\nexport const imageBackbones = ${JSON.stringify(schema['x-image-backbones'],null,2)} as const;\n`,
  "consistency.parameters.generated.ts": `/* Generated from Python consistency models by scripts/generate-contracts.js. */\nexport const modelAssessmentLabels = ${JSON.stringify(schema["x-model-assessment-labels"],null,2)} as const;\nexport const consistencyRouteEnums = ${JSON.stringify(Object.fromEntries(Object.entries(toolSchema(schema.properties.ConsistencyReturnLocation).properties).filter(([,value])=>value.enum).map(([key,value])=>[key,value.enum])),null,2)} as const;\nexport const groupAnalysisStartParameters = ${JSON.stringify(toolSchema(schema.properties.GroupAnalysisStart).properties,null,2)} as const;\nexport const galleryReferenceParameters = ${JSON.stringify(toolSchema(schema.properties.GalleryReference).properties,null,2)} as const;\nexport const consistencyStartParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyStart).properties, null, 2)} as const;\nexport const imageRetrieveParameters = ${JSON.stringify(toolSchema(schema.properties.ImageRetrieve).properties, null, 2)} as const;\nexport const imageIndexPrepareParameters = ${JSON.stringify(toolSchema(schema.properties.ImageIndexPrepare).properties, null, 2)} as const;\nexport const consistencyCompareParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyCompare).properties,null,2)} as const;\nexport const consistencyEvidenceParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyEvidenceReference).properties,null,2)} as const;\nexport const consistencyQueryParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyQuery).properties,null,2)} as const;\nexport const consistencyGroupParameters = ${JSON.stringify(toolSchema(schema.properties.GroupQuery).properties,null,2)} as const;\nexport const consistencyGroupMemberParameters = ${JSON.stringify(toolSchema(schema.properties.GroupMemberQuery).properties,null,2)} as const;\nexport const consistencyContextParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyContextRequest).properties,null,2)} as const;\nexport const consistencyBatchParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyBatchReference).properties,null,2)} as const;\nexport const consistencyRetryParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyBatchRetry).properties,null,2)} as const;\nexport const consistencyMediaParameters = ${JSON.stringify(toolSchema(schema.properties.ConsistencyEvidenceMediaReference).properties,null,2)} as const;\nexport const temporaryImageLimits = ${JSON.stringify(schema["x-temporary-image-limits"], null, 2)} as const;\n`,
  "exploration.parameters.generated.ts": `/* Generated from Python ExplorationStart by scripts/generate-contracts.js. */\nexport const explorationParameters = ${JSON.stringify(toolSchema(schema.properties.ExplorationStart).properties, null, 2)} as const;\nexport const explorationPresetParameters = ${JSON.stringify(toolSchema(schema.properties.ExplorationPresetEdit).properties, null, 2)} as const;\nexport const directionAdoptionParameters = ${JSON.stringify(toolSchema(schema.properties.DirectionAdoption).properties, null, 2)} as const;\n`,
  "domain.generated.ts": output,
  "analysis-defaults.generated.ts": `/* Generated from Python analysis workflow models. */\nexport const analysisDefaults = ${JSON.stringify(schema["x-analysis-defaults"], null, 2)} as const;\n`,
  "model-settings.generated.ts": `/* Generated from Python ModelLimits by scripts/generate-contracts.js. */\nimport type { ModelLimits } from "./domain.generated.js";\nexport const defaultModelLimits: ModelLimits = ${JSON.stringify(schema["x-model-defaults"], null, 2)};\n`,
  "dataset.parameters.generated.ts": `/* Generated from Python dataset models by scripts/generate-contracts.js. */\nexport const folderRulesParameter = ${JSON.stringify({type: "array", items: toolSchema({$ref: "#/$defs/FolderRule"})}, null, 2)} as const;\nexport const annotationPolicyParameter = ${JSON.stringify(toolSchema(schema.properties.AnnotationPolicy), null, 2)} as const;\n`,
  "mining.parameters.generated.ts": `/* Generated from Python MiningStart by scripts/generate-contracts.js. */\nexport const miningParameters = ${JSON.stringify(parameters, null, 2)} as const;\n`,
  "knowledge-scope.parameters.generated.ts": `/* Generated from Python KnowledgeScopeOpen by scripts/generate-contracts.js. */\nexport const knowledgeScopeParameters = ${JSON.stringify(toolSchema(schema.properties.KnowledgeScopeOpen).properties, null, 2)} as const;\n`,
  "knowledge-detail.parameters.generated.ts": `/* Generated from Python KnowledgeDetailQuery by scripts/generate-contracts.js. */\nexport const knowledgeDetailParameters = ${JSON.stringify(toolSchema(schema.properties.KnowledgeDetailQuery).properties, null, 2)} as const;\n`,
  "knowledge-source.parameters.generated.ts": `/* Generated from Python KnowledgeSourceQuery by scripts/generate-contracts.js. */\nexport const knowledgeSourceParameters = ${JSON.stringify(toolSchema(schema.properties.KnowledgeSourceQuery).properties, null, 2)} as const;\n`,
};
for (const [name, content] of Object.entries(targets)) {
  const target = fileURLToPath(new URL(`../src/shared/${name}`, import.meta.url));
  if (process.argv.includes("--check")) {
    if (await fs.readFile(target, "utf8") !== content) throw new Error(`${name} differs from Pydantic; run generate:contracts`);
  } else await fs.writeFile(target, content);
}
