import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { Context } from "@deepseek-ai/cordis";
import { SkillRegistry } from "@deepseek-ai/dsh-skill";
import { SystemPrompt } from "@deepseek-ai/dsh-system-prompt";
import { ToolRuntime } from "@deepseek-ai/dsh-tools";
import { LocalAttachmentStore } from "@deepseek-ai/dsh-attachment-local";
import * as skillTool from "@deepseek-ai/dsh-tool-skill";
import * as harness from "../lib/server/index.js";
import { findWorkspaceRoot, resolvePythonPath } from "../lib/server/python-bridge/index.js";

const workspace = findWorkspaceRoot();
const output = path.resolve(process.argv[2] || path.join(workspace, "runs/verification/knowledge-skills", String(Date.now())));
await fs.mkdir(output, { recursive: true });
execFileSync(resolvePythonPath(), [fileURLToPath(new URL("../test/fixtures/knowledge_dataset.py", import.meta.url)), output]);
const ctx = new Context();
new SystemPrompt(ctx, {});
new ToolRuntime(ctx);
new SkillRegistry(ctx);
new LocalAttachmentStore(ctx, { dshHome: path.join(output, "dsh") });
skillTool.apply(ctx);
const fork = await ctx.plugin(harness, { cwd: workspace, dbPath: path.join(output, "verification.db") });
const trace = [];
ctx.on("tools/result", (exec, result) => { trace.push({ name: exec.name, arguments: exec.arguments, result }); });
let callId = 0;
const execute = async (name, args) => {
  const result = await ctx.tools.execute({ name, arguments: args, callId: `verify-${++callId}`, signal: new AbortController().signal });
  assert.equal(result.isError, false, JSON.stringify(result));
  return result;
};
const started = Date.now();
const versions = {}, jobs = {};
try {
  const dataset = await ctx.iadPythonBridge.execute("dataset_import", {
    name: "Synthetic knowledge skill validation", image_dir: path.join(output, "images"), annotation_dir: path.join(output, "labels"),
  });
  const before = await ctx.iadPythonBridge.execute("sample_get", { sample_id: dataset.dataset_id + ":part-2.png" });
  const catalog = await ctx.skills.list();
  assert.deepEqual(catalog.map(skill => skill.name), ["mine-defect-knowledge", "mine-normal-knowledge"]);
  for (const { key, kind, sampleIndex } of [
    { key: "initial_normal", kind: "normal", sampleIndex: 0 },
    { key: "normal", kind: "normal", sampleIndex: 1 },
    { key: "defect", kind: "defect" },
  ]) {
    await execute("skill", { name: `mine-${kind}-knowledge` });
    const args = { dataset_id: dataset.dataset_id };
    if (kind === "normal") args.sample_ids = [dataset.dataset_id + `:part-${sampleIndex}.png`];
    if (kind === "defect") args.normal_version_id = versions.normal.version_id;
    let job = (await execute(`knowledge_mine_${kind}`, args)).value;
    console.log(JSON.stringify({ key, kind, run_id: job.run_id, total: job.total_samples }));
    const deadline = Date.now() + 300000;
    while (["PENDING", "RUNNING"].includes(job.status) && Date.now() < deadline) {
      await delay(500);
      job = (await execute("knowledge_job_status", { run_id: job.run_id })).value;
    }
    jobs[key] = job;
    assert.equal(job.status, "COMPLETED", JSON.stringify(job));
    versions[key] = (await execute("knowledge_get", { version_id: job.knowledge_version_id })).value.knowledge;
    const evidence = versions[key].evidence.find(item => item.image.role === (kind === "normal" ? "normal" : "roi")
      && item.image.representation === "raw");
    const media = await execute("knowledge_evidence", { version_id: versions[key].version_id, evidence_id: evidence.image.evidence_id });
    const block = media.content.find(item => item.type === "image");
    assert.ok(block, "Native knowledge tool did not return an ImageBlock");
    const stored = await ctx.attachments.readImage(block.attachment);
    assert.ok(stored.data.length);
  }
  assert.equal(versions.initial_normal.sources.length, 1);
  assert.equal(versions.normal.sources.length, 2);
  assert.equal(versions.normal.parent_version_id, versions.initial_normal.version_id);
  assert.deepEqual(versions.normal.revisions.map(item => item.previous_check_id).sort(),
    versions.initial_normal.checks.map(item => item.check_id).sort());
  for (const check of versions.normal.checks) {
    if (check.predecessor_check_ids.length === 1) {
      const revision = versions.normal.revisions.find(item => item.previous_check_id === check.predecessor_check_ids[0]);
      if (revision.current_check_titles.length === 1) assert.equal(check.check_id, revision.previous_check_id);
    }
  }
  assert.deepEqual((await execute("knowledge_get", { version_id: versions.initial_normal.version_id })).value.knowledge,
    versions.initial_normal);
  assert.equal(versions.defect.normal_version_id, versions.normal.version_id);
  assert.ok(versions.defect.findings.length);
  let audit = await ctx.iadPythonBridge.execute("audit_start", {
    dataset_id: dataset.dataset_id, sample_ids: [before.sample.sample_id],
    normal_version_id: versions.normal.version_id, defect_version_id: versions.defect.version_id,
  });
  console.log(JSON.stringify({ kind: "audit", run_id: audit.run_id, total: audit.total_samples }));
  const auditDeadline = Date.now() + 300000;
  while (["PENDING", "RUNNING"].includes(audit.status) && Date.now() < auditDeadline) {
    await delay(500);
    audit = await ctx.iadPythonBridge.execute("audit_status", { run_id: audit.run_id });
  }
  jobs.audit = audit;
  assert.equal(audit.status, "COMPLETED", JSON.stringify(audit));
  const after = await ctx.iadPythonBridge.execute("sample_get", { sample_id: before.sample.sample_id });
  const analysis = after.suggestion.analysis;
  assert.equal(analysis.normal_version_id, versions.normal.version_id);
  assert.equal(analysis.defect_version_id, versions.defect.version_id);
  const expectedChecks = [...versions.normal.checks, ...versions.defect.checks].map(check => check.check_id).sort();
  assert.deepEqual(analysis.check_assessments.map(item => item.check_id).sort(), expectedChecks);
  const actualIds = new Set(analysis.joint_steps.flatMap(step => step.input_evidence_ids));
  assert.ok(analysis.check_assessments.every(item => item.evidence_ids.length && item.evidence_ids.every(id => actualIds.has(id))));
  assert.equal(analysis.coverage.complete, true);
  assert.equal(analysis.coverage.inspected_regions, 1);
  assert.equal(analysis.joint_steps.length, 1);
  assert.equal(analysis.joint_steps[0].input_evidence_ids.length, 3);
  const mask = analysis.auxiliary_evidence.find(image => image.representation === "annotation_mask");
  assert.ok(mask);
  assert.deepEqual(mask.crop_bbox, analysis.regions[0].crop_bbox);
  const media = await ctx.iadPythonBridge.execute("audit_evidence", { suggestion_id: after.suggestion.suggestion_id, evidence_id: mask.evidence_id });
  assert.ok((await fs.readFile(media.path)).length);
  assert.deepEqual(after.annotations, before.annotations);
  assert.deepEqual(after.review_decision, before.review_decision);
  const result = { catalog, jobs, versions, analysis, trace, elapsed_seconds: (Date.now() - started) / 1000,
    quality_evaluation: "unassessed; synthetic native skill workflow only; no autonomous Agent Session tested" };
  await fs.writeFile(path.join(output, "result.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ status: "COMPLETED", versions: Object.fromEntries(Object.entries(versions).map(([kind, value]) => [kind, value.version_id])),
    checks: Object.fromEntries(Object.entries(versions).map(([kind, value]) => [kind, value.checks.length])),
    findings: versions.defect.findings.map(item => ({ sample_id: item.sample_id, status: item.judgment.status })),
    elapsed_seconds: result.elapsed_seconds }));
} finally {
  await fs.writeFile(path.join(output, "tool-trace.json"), JSON.stringify(trace, null, 2));
  await fork.dispose();
}
