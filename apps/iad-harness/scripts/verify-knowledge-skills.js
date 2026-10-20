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
  for (const kind of ["normal", "defect"]) {
    await execute("skill", { name: `mine-${kind}-knowledge` });
    const args = { dataset_id: dataset.dataset_id };
    if (kind === "defect") args.normal_version_id = versions.normal.version_id;
    let job = (await execute(`knowledge_mine_${kind}`, args)).value;
    console.log(JSON.stringify({ kind, run_id: job.run_id, total: job.total_samples }));
    const deadline = Date.now() + 300000;
    while (["PENDING", "RUNNING"].includes(job.status) && Date.now() < deadline) {
      await delay(500);
      job = (await execute("knowledge_job_status", { run_id: job.run_id })).value;
    }
    jobs[kind] = job;
    assert.equal(job.status, "COMPLETED", JSON.stringify(job));
    versions[kind] = (await execute("knowledge_get", { version_id: job.knowledge_version_id })).value.knowledge;
    const evidence = versions[kind].evidence.find(item => item.image.role === (kind === "normal" ? "normal" : "roi")
      && item.image.representation === "raw");
    const media = await execute("knowledge_evidence", { version_id: versions[kind].version_id, evidence_id: evidence.image.evidence_id });
    const block = media.content.find(item => item.type === "image");
    assert.ok(block, "Native knowledge tool did not return an ImageBlock");
    const stored = await ctx.attachments.readImage(block.attachment);
    assert.ok(stored.data.length);
  }
  assert.equal(versions.defect.normal_version_id, versions.normal.version_id);
  assert.ok(versions.defect.findings.length);
  const after = await ctx.iadPythonBridge.execute("sample_get", { sample_id: before.sample.sample_id });
  assert.deepEqual(after.annotations, before.annotations);
  assert.deepEqual(after.review_decision, before.review_decision);
  const result = { catalog, jobs, versions, trace, elapsed_seconds: (Date.now() - started) / 1000,
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
