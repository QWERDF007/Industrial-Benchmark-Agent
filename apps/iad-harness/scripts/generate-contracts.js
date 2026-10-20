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
from iad_core.knowledge.models import KnowledgeSnapshot, KnowledgeVersion
from iad_core.knowledge.service import MiningStart
from iad_core.workbench.audit import AuditStart
from iad_core.workbench.calls import ModelCallDetail
from iad_core.workbench.jobs import JobRetry
from iad_core.dataset.registry import DatasetImport
from iad_core.dataset.archive import ArchiveInspection
from iad_core.workbench.report import DatasetReport
from iad_core.storage.models import Annotation, ReviewDecisionRecord
from iad_core.workbench.review import ReviewSubmission, ReviewHistoryQuery, ReviewHistoryPage
models = [AuditAnalysis, KnowledgeSnapshot, KnowledgeVersion, AuditStart, ModelCallDetail, JobRetry, DatasetImport, ArchiveInspection, DatasetReport, MiningStart, Annotation, ReviewDecisionRecord, ReviewSubmission, ReviewHistoryQuery, ReviewHistoryPage]
_, schema = models_json_schema([(model, 'validation' if model in (MiningStart, AuditStart, JobRetry, DatasetImport, ReviewSubmission, ReviewHistoryQuery) else 'serialization') for model in models])
schema.update(title='WorkbenchDomain', type='object', additionalProperties=False,
    properties={model.__name__: {'$ref': '#/$defs/'+model.__name__} for model in models})
print(json.dumps(schema))
`], { cwd: workspace, env: { ...process.env, PYTHONPATH: path.join(workspace, "python") }, encoding: "utf8" }));
const output = await compile(schema, "WorkbenchDomain", {
  bannerComment: "/* Generated from Python Pydantic models by scripts/generate-contracts.js. */",
  additionalProperties: false, format: true,
});
const target = fileURLToPath(new URL("../src/shared/domain.generated.ts", import.meta.url));
if (process.argv.includes("--check")) {
  if (await fs.readFile(target, "utf8") !== output) throw new Error("Domain contracts differ from Pydantic; run generate:contracts");
} else await fs.writeFile(target, output);
