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
await fs.copyFile(path.join(output, 'images/part-2.png'), path.join(output, 'images/part-3.png'));
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
  assert.deepEqual(catalog.map(skill => skill.name), ["analyze-dataset"]);
  await execute("skill", { name: "analyze-dataset" });
  for (const { key, kind, sampleIndex } of [
    { key: "initial_normal", kind: "normal", sampleIndex: 0 },
    { key: "normal", kind: "normal", sampleIndex: 1 },
    { key: "defect", kind: "defect" },
  ]) {
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
    dataset_id: dataset.dataset_id, sample_ids: [before.sample.sample_id, dataset.dataset_id + ':part-3.png'],
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
  assert.ok(analysis.findings.length, 'Actual synthetic anomaly must produce a locatable review finding');
  assert.ok(analysis.findings.some(finding => finding.location.scope === 'local' && finding.location.bbox), 'Local synthetic obstruction must have an actual image location');
  const stepIds = new Set(analysis.joint_steps.map(step => step.step_id));
  for (const finding of analysis.findings) {
    assert.ok(finding.finding_id && finding.normal_explanation && finding.review_action);
    assert.ok(finding.source_step_ids.length && finding.source_step_ids.every(id => stepIds.has(id)));
    assert.ok(finding.evidence_ids.length && finding.evidence_ids.every(id => actualIds.has(id)));
  }
  assert.equal(analysis.coverage.complete, true);
  assert.equal(analysis.coverage.inspected_regions, analysis.regions.length);
  assert.equal(analysis.coverage.planned_regions, analysis.regions.length);
  assert.ok(analysis.regions.length >= 1);
  assert.equal(analysis.joint_steps[0].input_evidence_ids.length, 3);
  if (analysis.joint_steps.length > 1) {
    assert.ok(analysis.joint_steps.slice(0, -1).some(step => step.result.global_view.suspect_regions.length
      || step.result.check_assessments.some(check => check.inspection_regions.length)), 'Extra inspection needs an actual recorded evidence request');
    const initialRoi = analysis.regions[0].image.evidence_id;
    assert.ok(analysis.joint_steps.slice(1).every(step => !step.input_evidence_ids.includes(initialRoi)), 'Follow-up must inspect new detail without resending the original ROI');
    if (analysis.joint_steps[0].result.findings.length) {
      assert.ok(analysis.joint_steps.slice(1).some(step => step.result.findings.some(finding => finding.related_findings.length)
        || step.result.resolved_findings.length), 'Follow-up must explicitly update or resolve the prior synthetic anomaly');
    }
  }
  const mask = analysis.auxiliary_evidence.find(image => image.representation === "annotation_mask");
  assert.ok(mask);
  assert.deepEqual(mask.crop_bbox, analysis.regions[0].crop_bbox);
  const media = await ctx.iadPythonBridge.execute("audit_evidence", { suggestion_id: after.suggestion.suggestion_id, evidence_id: mask.evidence_id });
  assert.ok((await fs.readFile(media.path)).length);
  assert.deepEqual(after.annotations, before.annotations);
  assert.deepEqual(after.review_decision, before.review_decision);
  const candidate = await ctx.iadPythonBridge.execute('sample_get', { sample_id: dataset.dataset_id + ':part-3.png' });
  assert.equal(candidate.annotations.length, 0);
  assert.ok(candidate.suggestion.analysis.findings.length, 'Unannotated synthetic obstruction needs an actual audit finding');
  for (const kind of ['defect', 'normal']) {
    const args = { dataset_id: dataset.dataset_id, sample_ids: [candidate.sample.sample_id] };
    if (kind === 'defect') args.normal_version_id = versions.normal.version_id;
    let job = (await execute(`knowledge_mine_${kind}`, args)).value;
    console.log(JSON.stringify({ kind: `feedback_${kind}`, run_id: job.run_id, total: job.total_samples }));
    const deadline = Date.now() + 300000;
    while (['PENDING', 'RUNNING'].includes(job.status) && Date.now() < deadline) {
      await delay(500);
      job = (await execute('knowledge_job_status', { run_id: job.run_id })).value;
    }
    jobs[`feedback_${kind}`] = job;
    assert.equal(job.status, 'COMPLETED', JSON.stringify(job));
    const snapshot = (await execute('knowledge_get', { version_id: job.knowledge_version_id })).value.knowledge;
    versions[`feedback_${kind}`] = snapshot;
    assert.equal(snapshot.parent_version_id, versions[kind].version_id);
    const source = snapshot.sources.find(item => item.sample_id === candidate.sample.sample_id);
    assert.deepEqual(source.audit_suggestion_ids, [candidate.suggestion.suggestion_id]);
    const findings = snapshot.findings.filter(item => item.origin_suggestion_id === candidate.suggestion.suggestion_id);
    assert.equal(findings.length, candidate.suggestion.analysis.findings.length);
    for (const finding of findings) {
      const original = candidate.suggestion.analysis.findings.find(item => item.finding_id === finding.origin_finding_id);
      assert.deepEqual(finding.audit_finding, original);
      assert.ok(finding.judgment.evidence_ids.some(id => finding.regions.some(region => region.image.evidence_id === id)));
      if (kind === 'normal' && finding.judgment.status !== 'refuted') {
        const contaminated = new Set(snapshot.evidence.filter(item => item.sample_id === finding.sample_id)
          .map(item => item.image.evidence_id));
        for (const check of snapshot.checks.filter(item => finding.affected_check_ids.includes(item.check_id))) {
          assert.ok(check.support_evidence_ids.every(id => !contaminated.has(id)), 'Unresolved contamination cannot support the affected normal criterion');
        }
      }
    }
    assert.ok(snapshot.verification_steps.length, 'Feedback must actually be visually reverified');
    assert.deepEqual((await execute('knowledge_get', { version_id: versions[kind].version_id })).value.knowledge, versions[kind]);
  }
  const candidateAfter = await ctx.iadPythonBridge.execute('sample_get', { sample_id: candidate.sample.sample_id });
  assert.deepEqual(candidateAfter.suggestion, candidate.suggestion);
  assert.deepEqual(candidateAfter.annotations, candidate.annotations);
  assert.deepEqual(candidateAfter.review_decision, candidate.review_decision);
  for (const job of Object.values(jobs)) {
    assert.ok(job.model_calls.length, 'Actual native jobs must retain their model calls');
    for (const call of job.model_calls) {
      const detail = await ctx.iadPythonBridge.execute('model_call_get', { run_id: job.run_id, call_id: call.call_id });
      assert.equal(detail.http_status, 200);
      assert.equal(detail.error, null);
      assert.ok(detail.finished_at && detail.elapsed_ms >= 0);
      const request = JSON.parse(detail.request_body), response = JSON.parse(detail.response_body);
      assert.ok(request.messages[0].content.length);
      if (call.operation === 'generate') {
        assert.ok(response.choices[0].message.content);
        assert.deepEqual(detail.usage, response.usage);
        assert.ok(detail.usage.prompt_tokens >= 0 && detail.usage.completion_tokens > 0);
      } else assert.ok(response.count >= 0);
    }
  }
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
