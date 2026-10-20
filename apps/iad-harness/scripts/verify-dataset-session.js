import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import { createDatasetSession } from "../test/fixtures/dataset_session.js";
import { findWorkspaceRoot, resolvePythonPath } from "../lib/server/python-bridge/index.js";

assert.ok(process.env.LIVE_VLM_ENDPOINT && process.env.LIVE_VLM_KEY, "Set the configured LIVE_VLM_ENDPOINT and LIVE_VLM_KEY before verification");
const workspace = findWorkspaceRoot();
const output = path.resolve(process.argv[2] || path.join(workspace, "runs/verification/dataset-session", String(Date.now())));
await fs.mkdir(output, { recursive: true });
execFileSync(resolvePythonPath(), [fileURLToPath(new URL("../test/fixtures/knowledge_dataset.py", import.meta.url)), output]);
const model = execFileSync(resolvePythonPath(), ["-c", "from iad_core.workbench.vision import DEFAULT_MODEL; print(DEFAULT_MODEL)"],
  { cwd: workspace, env: { ...process.env, PYTHONPATH: path.join(workspace, "python") }, encoding: "utf8" }).trim();
const session = await createDatasetSession({ root: path.join(output, "dsh"), dbPath: path.join(output, "verification.db"),
  endpoint: process.env.LIVE_VLM_ENDPOINT.replace(/\/chat\/completions\/?$/, "").replace(/\/$/, ""), model, apiKeyEnv: "LIVE_VLM_KEY" });
const trace = [];
session.ctx.on("tools/result", (exec, result) => {
  trace.push({ name: exec.name, arguments: exec.arguments, result });
  console.log(JSON.stringify({ tool: exec.name, isError: result.isError, status: result.value?.status, run_id: result.value?.run_id }));
});
const started = Date.now();
const timeout = setTimeout(() => session.handle.agent.cancel({ kind: "hook", reason: "Verification deadline exceeded" }), 900000);
try {
  const prompt = `现在有一份数据集，进行良品、不良品知识挖掘，并审计，评估此数据集的质量。名称：合成部件会话验证；图像目录：${path.join(output, "images")}；Labelme 标注目录：${path.join(output, "labels")}。`;
  session.handle.agent.followup(createUserMessage({ source: { kind: "user" }, content: [{ type: "text", text: prompt }] }));
  await session.handle.agent.whenIdle();
  const failed = trace.filter(item => item.result.isError);
  assert.deepEqual(failed, [], "Agent tool errors must be inspected, not hidden");
  for (const name of ["dataset_import", "knowledge_mine_normal", "knowledge_mine_defect", "model_audit_start", "dataset_report"]) {
    assert.ok(trace.some(item => item.name === name), `Agent did not execute ${name}`);
  }
  for (const name of ["mine-normal-knowledge", "mine-defect-knowledge"]) {
    assert.ok(trace.some(item => item.name === "skill" && item.arguments.name === name), `Agent did not load ${name}`);
  }
  const dataset = trace.find(item => item.name === "dataset_import").result.value;
  const jobs = await session.ctx.iadPythonBridge.execute("knowledge_list", { dataset_id: dataset.dataset_id });
  const audits = await session.ctx.iadPythonBridge.execute("audit_list", { dataset_id: dataset.dataset_id });
  assert.equal(jobs.jobs.length, 2);
  assert.equal(audits.jobs.length, 1);
  assert.ok([...jobs.jobs, ...audits.jobs].every(job => job.status === "COMPLETED" && job.failed === 0));
  assert.equal(audits.jobs[0].completed, 3);
  const report = trace.findLast(item => item.name === "dataset_report").result.value;
  assert.equal(report.vlm_audited_count, 3);
  assert.equal(report.human_reviewed_count, 0);
  const target = await session.ctx.iadPythonBridge.execute("sample_get", { sample_id: dataset.dataset_id + ":part-2.png" });
  const beforeFollowup = trace.length;
  session.handle.agent.followup(createUserMessage({ source: { kind: "user" }, content: [{ type: "text",
    text: `请打开样本 ${target.sample.sample_id} 本次审计真正使用的全图与 ROI 图像，结合图像解释需要关注的位置，不能只复述文本结论。` }] }));
  await session.handle.agent.whenIdle();
  const followup = trace.slice(beforeFollowup);
  const expected = [target.suggestion.analysis.overview.evidence_id, target.suggestion.analysis.regions[0].image.evidence_id];
  for (const evidence_id of expected) {
    const media = followup.find(item => item.name === "model_audit_evidence" && item.arguments.evidence_id === evidence_id);
    assert.ok(media && !media.result.isError, `Agent did not open actual audit evidence ${evidence_id}`);
    const image = media.result.content.find(block => block.type === "image");
    assert.ok(image);
    assert.ok((await session.ctx.attachments.readImage(image.attachment)).data.length);
  }
  const after = await session.ctx.iadPythonBridge.execute("sample_get", { sample_id: target.sample.sample_id });
  assert.ok(followup.every(item => !item.result.isError), "Evidence follow-up had a tool error");
  assert.deepEqual(after.annotations, target.annotations);
  assert.deepEqual(after.review_decision, target.review_decision);
  assert.equal(after.sample.quality_status, target.sample.quality_status);
  const messages = session.handle.agent.session.deriveMessages();
  const turns = session.handle.agent.session.snapshotEvents().filter(event => event.type === "turn/end");
  assert.equal(turns.length, 2);
  assert.ok(turns.every(event => event.data.reason.kind === "completed"), "Both actual Agent turns must finish without a model or tool error");
  assert.ok(messages.filter(message => message.role === "tool").flatMap(message => message.content).filter(block => block.type === "image").length >= 2);
  assert.ok(messages.some(message => message.role === "assistant" && message.content.some(block => block.type === "text" && block.text.length)));
  await fs.writeFile(path.join(output, "result.json"), JSON.stringify({ session_id: session.handle.agent.id, elapsed_ms: Date.now() - started,
    model, report, jobs: [...jobs.jobs, ...audits.jobs], actual_tool_calls: trace.length, industrial_quality: "unassessed",
    attachment_upload: "not tested", sidebar_pages: "not tested", quality_score: "not implemented", evidence_followup: "actual full-image and ROI attachments" }, null, 2));
  console.log(JSON.stringify({ verified: true, session_id: session.handle.agent.id, actual_tool_calls: trace.length, elapsed_ms: Date.now() - started }));
} finally {
  clearTimeout(timeout);
  await fs.writeFile(path.join(output, "tool-trace.json"), JSON.stringify(trace, null, 2));
  await fs.writeFile(path.join(output, "session-events.json"), JSON.stringify(session.handle.agent.session.snapshotEvents(), null, 2));
  await session.dispose();
}
