import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import { createDatasetSession, resolveDatasetSessionModel } from "../test/fixtures/dataset_session.js";
import { findWorkspaceRoot, resolvePythonPath } from "../lib/server/python-bridge/index.js";

assert.ok(process.env.LIVE_VLM_ENDPOINT && process.env.LIVE_VLM_KEY, "Configure the local model environment");
const workspace = findWorkspaceRoot();
const unspecified = process.argv.includes("--unspecified");
const confirm = process.argv.includes("--confirm");
assert.ok(!confirm || unspecified, "--confirm requires --unspecified");
const output = path.resolve(process.argv.slice(2).find(arg => !["--unspecified", "--confirm"].includes(arg)) || path.join(workspace, "runs/verification/knowledge-selection", String(Date.now())));
await fs.mkdir(output, { recursive: true });
execFileSync(resolvePythonPath(), [path.join(workspace, "apps/iad-harness/test/fixtures/knowledge_dataset.py"), output]);
execFileSync(resolvePythonPath(), ["-c", `
import sys, uuid
from pathlib import Path
from PIL import Image, ImageEnhance
root = Path(sys.argv[1])
with Image.open(root / 'images/part-0.png') as image:
    for index in range(int(sys.argv[2])):
        ImageEnhance.Brightness(image).enhance(0.9 + index * 0.02).save(root / 'images' / (uuid.uuid4().hex + '.png'))
`, output, unspecified ? "850" : "10"]);
const model = resolveDatasetSessionModel(workspace);
const session = await createDatasetSession({ root: path.join(output, "dsh"), dbPath: path.join(output, "test.db"),
  endpoint: process.env.LIVE_VLM_ENDPOINT.replace(/\/chat\/completions\/?$/, "").replace(/\/$/, ""),
  model, apiKeyEnv: "LIVE_VLM_KEY" });
const trace = [], violations = [], discovered = new Set();
let awaitingSelection = unspecified;
let timer;
try {
  const dataset = await session.ctx.iadPythonBridge.execute("dataset_import", { format: "labelme", name: "指定来源验证",
    image_dir: path.join(output, "images"), annotation_dir: path.join(output, "labels") });
  session.handle.agent.ctx.tools.guard(exec => {
    if (awaitingSelection) {
      if (["dataset_list", "knowledge_get", "dataset_report"].includes(exec.name)) return;
      if (exec.name === "knowledge_sources" && (exec.arguments.page || 1) === 1 && (exec.arguments.page_size || 10) <= 20) return;
      violations.push({ name: exec.name, arguments: exec.arguments });
      session.handle.agent.cancel({ kind: "hook", reason: "Unspecified group must be clarified before enumeration or mining" });
      return "Verification requires clarification of the unspecified image group before execution";
    }
    if (exec.name === "knowledge_mine_normal" && exec.arguments.image_count === 10
      && Array.isArray(exec.arguments.images) && exec.arguments.images.length === 10
      && new Set(exec.arguments.images).size === 10 && exec.arguments.images.every(id => discovered.has(id))
      && !(exec.arguments.knowledge_preset || []).length) return;
    if (!/^(knowledge_mine_(normal|defect)|knowledge_job_retry|model_audit_start|model_audit_retry|dataset_import|dataset_rescan|skill)$/.test(exec.name)) return;
    violations.push({ name: exec.name, arguments: exec.arguments });
    session.handle.agent.cancel({ kind: "hook", reason: "Selected-source verification scope violation" });
    return "Verification only permits the selected normal knowledge sources";
  });
  session.ctx.on("tools/result", (exec, result) => {
    trace.push({ name: exec.name, arguments: exec.arguments, result });
    if (exec.name === "knowledge_sources" && exec.arguments.kind === "normal" && !result.isError) {
      for (const item of result.value.items) discovered.add(item.sample_id);
    }
    console.log(JSON.stringify({ tool: exec.name, isError: result.isError, status: result.value?.status }));
  });
  timer = setTimeout(() => session.handle.agent.cancel({ kind: "hook", reason: "Selected-source verification deadline" }), 180000);
  session.handle.agent.followup(createUserMessage({ source: { kind: "user" }, content: [{ type: "text",
    text: unspecified ? "对 指定来源验证 数据集进行良品知识挖掘"
      : `对已接入数据集 ${dataset.dataset_id} 进行良品知识挖掘，每次10张良品图。本次完成一组，等待作业结束并读取知识结果，不执行其他阶段。` }] }));
  await session.handle.agent.whenIdle();
  assert.deepEqual(violations, []);
  assert.ok(trace.every(item => !item.result.isError), "Tool calls must not contain hidden argument-validation errors");
  if (unspecified) {
    assert.ok(trace.some(item => item.name === "dataset_list"), "Resolve a dataset name through actual discovery");
    const discovery = trace.find(item => item.name === "dataset_list").result.content[0].text;
    assert.ok(discovery.length < 4096, "Dataset discovery must stay compact even with hundreds of candidate sources");
    assert.equal(JSON.parse(discovery).datasets[0].reference_sample_ids, undefined);
    const text = session.handle.agent.session.deriveMessages().filter(item => item.role === "assistant")
      .flatMap(item => item.content.filter(block => block.type === "text").map(block => block.text)).join("\n");
    assert.match(text, /10|20/);
    assert.match(text, /是否|多少|几张|请选择|确认|选择|would|Would|how many/);
    assert.deepEqual((await session.ctx.iadPythonBridge.execute("knowledge_list", { dataset_id: dataset.dataset_id })).jobs, []);
    const turns = session.handle.agent.session.snapshotEvents().filter(event => event.type === "turn/end");
    assert.equal(turns.length, 1);
    assert.equal(turns[0].data.reason.kind, "completed");
    const result = { verified: true, unspecified: true, eligible_sources: 852, started_jobs: 0, tools: trace.map(item => item.name) };
    await fs.writeFile(path.join(output, confirm ? "scope-confirmation.json" : "result.json"), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
    if (confirm) {
      awaitingSelection = false;
      session.handle.agent.followup(createUserMessage({ source: { kind: "user" }, content: [{ type: "text",
        text: "先使用10张良品图，本次完成这一组，等待知识作业结束并读取结果。" }] }));
      await session.handle.agent.whenIdle();
      assert.deepEqual(violations, []);
      assert.ok(trace.every(item => !item.result.isError));
    }
  }
  if (!unspecified || confirm) {
    const started = trace.filter(item => item.name === "knowledge_mine_normal");
    assert.equal(started.length, 1);
    assert.ok(trace.findIndex(item => item.name === "knowledge_sources") < trace.indexOf(started[0]), "The Agent must discover references instead of receiving test-supplied sample IDs");
    const sampleIds = started[0].arguments.images;
    assert.equal(sampleIds.length, 10);
    assert.ok(sampleIds.every(id => discovered.has(id)));
    const status = await session.ctx.iadPythonBridge.execute("knowledge_status", { run_id: started[0].result.value.run_id });
    assert.equal(status.status, "COMPLETED", JSON.stringify(status));
    assert.equal(status.completed, 10);
    assert.equal(status.failed, 0);
    const knowledge = (await session.ctx.iadPythonBridge.execute("knowledge_get", { version_id: status.knowledge_version_id })).knowledge;
    assert.deepEqual(knowledge.sources.map(item => item.sample_id).sort(), [...sampleIds].sort());
    assert.equal((await session.ctx.iadPythonBridge.execute("knowledge_list", { dataset_id: dataset.dataset_id })).jobs.length, 1);
    assert.deepEqual((await session.ctx.iadPythonBridge.execute("audit_list", { dataset_id: dataset.dataset_id })).jobs, []);
    const turns = session.handle.agent.session.snapshotEvents().filter(event => event.type === "turn/end");
    assert.equal(turns.length, confirm ? 2 : 1);
    assert.ok(turns.every(turn => turn.data.reason.kind === "completed"));
    const result = { verified: true, model, run_id: status.run_id, knowledge_version_id: status.knowledge_version_id,
      completed: status.completed, sample_ids: sampleIds };
    await fs.writeFile(path.join(output, "result.json"), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  }
} finally {
  clearTimeout(timer);
  await fs.writeFile(path.join(output, "trace.json"), JSON.stringify({ trace, violations }, null, 2));
  await fs.writeFile(path.join(output, "events.json"), JSON.stringify(session.handle.agent.session.snapshotEvents(), null, 2));
  for (const item of trace.filter(item => item.name === "knowledge_mine_normal" && !item.result.isError)) {
    const status = await session.ctx.iadPythonBridge.execute("knowledge_status", { run_id: item.result.value.run_id });
    if (["PENDING", "RUNNING"].includes(status.status)) await session.ctx.iadPythonBridge.execute("knowledge_cancel", { run_id: status.run_id });
  }
  await session.dispose();
}
