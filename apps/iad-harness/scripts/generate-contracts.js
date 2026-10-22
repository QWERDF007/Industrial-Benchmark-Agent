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
from iad_core.advisory.analysis import AuditAnalysis
from iad_core.knowledge.models import KnowledgeSnapshot, KnowledgeVersion, KnowledgeQuery, KnowledgeSourceQuery, KnowledgeSourcePage, KnowledgeDetailQuery, KnowledgeCheckPage, KnowledgeCheckEvidencePage, KnowledgeDiscoveryPage
from iad_core.knowledge.prompts import MiningPrompt, MiningPromptEdit
from iad_core.knowledge.trace import KnowledgeTracePage
from iad_core.knowledge.requests import MiningStart, MiningRequest
from iad_core.knowledge.scopes import KnowledgeScopeOpen, KnowledgeScopeSnapshot
from iad_core.workbench.audit import AuditStart
from iad_core.workbench.calls import ModelCallDetail
from iad_core.workbench.job_models import JobRetry, JobSnapshot, JobRetryOptions
from iad_core.workbench.inspection_context import InspectionReference, InspectionSnapshot
from iad_core.dataset.registry import DatasetImport
from iad_core.dataset.folder_preview import FolderPreview
from iad_core.dataset.archive import ArchiveInspection
from iad_core.dataset.scanner import ScanResult
from iad_core.workbench.report import DatasetReport
from iad_core.storage.models import Annotation, ReviewDecisionRecord
from iad_core.workbench.review import ReviewSubmission, ReviewHistoryQuery, ReviewHistoryPage
from iad_core.workbench.knowledge_review import KnowledgeReviewContext, KnowledgeReviewSubmission, KnowledgeReviewEvent, KnowledgeReviewItem
from iad_core.workbench.query import SampleQuery
models = [MiningPrompt, MiningPromptEdit, KnowledgeDiscoveryPage, KnowledgeTracePage, KnowledgeScopeOpen, KnowledgeScopeSnapshot, KnowledgeDetailQuery, KnowledgeCheckPage, KnowledgeCheckEvidencePage, KnowledgeReviewContext, KnowledgeReviewSubmission, KnowledgeReviewEvent, KnowledgeReviewItem, AuditAnalysis, KnowledgeSnapshot, KnowledgeVersion, KnowledgeQuery, KnowledgeSourceQuery, KnowledgeSourcePage, AuditStart, ModelCallDetail, JobRetry, JobSnapshot, JobRetryOptions, InspectionReference, InspectionSnapshot, DatasetImport, FolderPreview, ArchiveInspection, ScanResult, DatasetReport, MiningStart, MiningRequest, Annotation, ReviewDecisionRecord, ReviewSubmission, ReviewHistoryQuery, ReviewHistoryPage, SampleQuery]
modes = [(model, 'validation' if model in (KnowledgeScopeOpen, KnowledgeDetailQuery, KnowledgeReviewSubmission, MiningStart, MiningRequest, KnowledgeSourceQuery, AuditStart, JobRetry, InspectionReference, DatasetImport, ReviewSubmission, ReviewHistoryQuery) else 'serialization') for model in models]
references, schema = models_json_schema(modes)
schema.update(title='WorkbenchDomain', type='object', additionalProperties=False,
    properties={model.__name__: references[(model, mode)] for model, mode in modes})
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
  const value = concrete ? toolSchema(concrete)
    : node.anyOf ? { oneOf: node.anyOf.map(branch => toolSchema(branch)) } : { type: node.type };
  if (node.type === "object") {
    value.additionalProperties = node.additionalProperties ?? false;
    value.properties = Object.fromEntries(Object.entries(node.properties || {}).map(([name, property]) => [name,
      { ...toolSchema(property, !node.required?.includes(name)), ...(node.required?.includes(name) ? { required: true } : {}) }]));
  }
  if (node.items) value.items = toolSchema(node.items);
  for (const key of ["enum", "description", "title", "default"]) {
    if (key in node && !(concrete && key === "default" && node[key] === null)) value[key] = node[key];
  }
  return value;
}
const parameters = toolSchema(schema.properties.MiningStart).properties;
const targets = {
  "domain.generated.ts": output,
  "dataset.parameters.generated.ts": `/* Generated from Python FolderRule by scripts/generate-contracts.js. */\nexport const folderRulesParameter = ${JSON.stringify({type: "array", items: toolSchema({$ref: "#/$defs/FolderRule"})}, null, 2)} as const;\n`,
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
