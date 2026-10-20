import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { createHash } from "node:crypto";
import { Context } from "@deepseek-ai/cordis";
import { SkillRegistry } from "@deepseek-ai/dsh-skill";
import { SystemPrompt } from "@deepseek-ai/dsh-system-prompt";
import { ToolRuntime } from "@deepseek-ai/dsh-tools";
import * as skillTool from "@deepseek-ai/dsh-tool-skill";
import { LocalAttachmentStore } from "@deepseek-ai/dsh-attachment-local";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import { createDatasetSession } from "./fixtures/dataset_session.js";
import * as harness from "../lib/server/index.js";
import { resolvePythonPath } from "../lib/server/python-bridge/index.js";

test("DSH discovers and loads both bundled knowledge skills and removes them with the plugin", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-skill-registration-"));
  const ctx = new Context();
  new SystemPrompt(ctx, {});
  new ToolRuntime(ctx);
  new SkillRegistry(ctx);
  new LocalAttachmentStore(ctx, { dshHome: root });
  skillTool.apply(ctx);
  const fork = await ctx.plugin(harness);
  try {
    const catalog = await ctx.skills.list();
    assert.deepEqual(catalog.map(skill => skill.name), ["mine-defect-knowledge", "mine-normal-knowledge"]);
    for (const name of ["mine-normal-knowledge", "mine-defect-knowledge"]) {
      const result = await ctx.tools.execute({ name: "skill", arguments: { name }, callId: `load-${name}`,
        signal: new AbortController().signal });
      assert.equal(result.isError, false, JSON.stringify(result));
      assert.match(result.content[0].text, /knowledge_job_status/);
      assert.match(result.content[0].text, /knowledge_get/);
      assert.match(result.content[0].text, /knowledge_evidence/);
      assert.match(result.content[0].text, /不能|不得/);
      assert.equal(catalog.find(skill => skill.name === name).invocation.modelInvocable, true);
      assert.equal(catalog.find(skill => skill.name === name).invocation.userInvocable, true);
    }
    assert.ok(harness.ALLOWED_TOOL_SURFACE.includes("skill"));
  } finally {
    await fork.dispose();
    await fs.rm(root, { recursive: true, force: true });
  }
  assert.deepEqual(await ctx.skills.list(), []);
  assert.equal(ctx.tools.get("knowledge_mine_normal"), undefined);
});

test("DSH cancelling a knowledge job preserves unprocessed scope and prevents late publication", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-skill-cancel-"));
  execFileSync(resolvePythonPath(), [fileURLToPath(new URL("fixtures/knowledge_dataset.py", import.meta.url)), root]);
  const entered = Promise.withResolvers(), release = Promise.withResolvers();
  const model = http.createServer(async (req, res) => {
    for await (const _ of req) { /* consume the external request */ }
    if (req.url !== "/tokenize") {
      entered.resolve();
      await release.promise;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(req.url === "/tokenize" ? { count: 4000, max_model_len: 262144 } : {
      choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ summary: "迟到结果", checks: [], suspects: [], limitations: [] }) } }],
    }));
  });
  await new Promise(resolve => model.listen(0, "127.0.0.1", resolve));
  const previousEndpoint = process.env.LIVE_VLM_ENDPOINT;
  process.env.LIVE_VLM_ENDPOINT = `http://127.0.0.1:${model.address().port}/v1`;
  const ctx = new Context();
  new SystemPrompt(ctx, {});
  new ToolRuntime(ctx);
  new SkillRegistry(ctx);
  new LocalAttachmentStore(ctx, { dshHome: path.join(root, "dsh") });
  const fork = await ctx.plugin(harness, { dbPath: path.join(root, "test.db") });
  const api = http.createServer(harness.createIadHttpHandler(ctx.iadPythonBridge));
  await new Promise(resolve => api.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${api.address().port}/api/iad`;
  let call = 0;
  const execute = async (name, args) => {
    const result = await ctx.tools.execute({ name, arguments: args, callId: `cancel-${++call}`, signal: new AbortController().signal });
    assert.equal(result.isError, false, JSON.stringify(result));
    return result.value;
  };
  try {
    const dataset = await ctx.iadPythonBridge.execute("dataset_import", { name: "取消验证", image_dir: path.join(root, "images"), annotation_dir: path.join(root, "labels") });
    const job = await execute("knowledge_mine_normal", { dataset_id: dataset.dataset_id, model_name: "test-mllm" });
    await entered.promise;
    const invalidWait = await ctx.tools.execute({ name: "knowledge_job_status", arguments: { run_id: job.run_id, wait_seconds: 31 },
      callId: "invalid-wait", signal: new AbortController().signal });
    assert.equal(invalidWait.isError, true);
    assert.equal((await execute("knowledge_job_status", { run_id: job.run_id, wait_seconds: 0 })).status, "RUNNING");
    const abort = new AbortController();
    const abortedWait = ctx.tools.execute({ name: "knowledge_job_status", arguments: { run_id: job.run_id }, callId: "aborted-wait", signal: abort.signal });
    await delay(50);
    abort.abort();
    assert.equal((await abortedWait).isError, true);
    assert.equal((await execute("knowledge_job_status", { run_id: job.run_id, wait_seconds: 0 })).status, "RUNNING");
    const waiting = execute("knowledge_job_status", { run_id: job.run_id });
    await delay(50);
    const stopping = await execute("knowledge_job_cancel", { run_id: job.run_id });
    assert.equal(stopping.status, "RUNNING");
    assert.match(stopping.message, /正在停止/);
    release.resolve();
    assert.equal((await waiting).status, "CANCELLED", "A bounded status wait must observe termination while allowing cancellation");
    let status = stopping;
    const deadline = Date.now() + 5000;
    while (["PENDING", "RUNNING"].includes(status.status) && Date.now() < deadline) {
      await delay(20);
      status = await execute("knowledge_job_status", { run_id: job.run_id });
    }
    assert.equal(status.status, "CANCELLED");
    assert.equal(status.completed, 0);
    assert.equal(status.failed, 0);
    assert.equal(status.unprocessed, 2);
    assert.equal((await execute("knowledge_get", { dataset_id: dataset.dataset_id, kind: "normal" })).knowledge, null);
    const response = await fetch(`${base}/knowledge/retry/${job.run_id}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
    });
    assert.equal(response.status, 200, await response.clone().text());
    const retry = await response.json();
    const restored = await execute("knowledge_job_status", { run_id: retry.run_id });
    assert.equal(restored.status, "COMPLETED");
    assert.equal(restored.parent_run_id, job.run_id);
    assert.equal(restored.completed, 2);
    assert.equal((await execute("knowledge_job_status", { run_id: job.run_id })).status, "CANCELLED");
    assert.equal((await execute("knowledge_job_status", { run_id: retry.run_id })).status,
      (await (await fetch(`${base}/knowledge/status/${retry.run_id}`)).json()).status);
    assert.ok(ctx.tools.get("knowledge_job_retry"));
    assert.ok(harness.ALLOWED_TOOL_SURFACE.includes("knowledge_job_retry"));
    const duplicate = await ctx.tools.execute({ name: "knowledge_job_retry", arguments: { run_id: job.run_id },
      callId: "already-completed-retry", signal: new AbortController().signal });
    assert.equal(duplicate.isError, true);
  } finally {
    release.resolve();
    await fork.dispose();
    await new Promise(resolve => api.close(resolve));
    await new Promise(resolve => model.close(resolve));
    if (previousEndpoint === undefined) delete process.env.LIVE_VLM_ENDPOINT;
    else process.env.LIVE_VLM_ENDPOINT = previousEndpoint;
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("DSH knowledge skills execute shared jobs and return actual evidence attachments", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-skill-"));
  execFileSync(resolvePythonPath(), [fileURLToPath(new URL("fixtures/knowledge_dataset.py", import.meta.url)), root]);
  let failNextAudit = true;
  let followupReference;
  const agentRequests = [];
  const model = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString());
    if (body.stream) {
      agentRequests.push(body);
      const outputs = body.messages.filter(message => message.role === "tool");
      const context = outputs[0]?.content.startsWith("{") ? JSON.parse(outputs[0].content) : null;
      const image = context?.evidence?.[outputs.length - 1];
      const tool = outputs.length === 0 ? { name: "model_audit_context", arguments: followupReference }
        : outputs.length < 3 && image ? { name: "model_audit_evidence", arguments: { suggestion_id: followupReference.suggestion_id, evidence_id: image.evidence_id } } : null;
      const delta = tool ? { role: "assistant", tool_calls: [{ index: 0, id: `inspection-${outputs.length}`, type: "function", function: { name: tool.name, arguments: JSON.stringify(tool.arguments) } }] }
        : { role: "assistant", content: "已结合本次冻结全图与左孔ROI核对，反光仍需人工核实。" };
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      for (const choice of [{ index: 0, delta, finish_reason: null }, { index: 0, delta: {}, finish_reason: tool ? "tool_calls" : "stop" }]) {
        res.write(`data: ${JSON.stringify({ id: "inspection-response", object: "chat.completion.chunk", model: "test-mllm", choices: [choice] })}\n\n`);
      }
      res.end("data: [DONE]\n\n");
      return;
    }
    const content = body.messages[0].content;
    const evidence = content.filter(item => item.type === "text" && item.text.startsWith("视觉证据："))
      .map(item => JSON.parse(item.text.slice("视觉证据：".length)));
    let result;
    if (req.url === "/tokenize") result = { count: 4000, max_model_len: 262144 };
    else if (body.response_format.json_schema.name === "JointAnalysis") {
      if (failNextAudit) {
        failNextAudit = false;
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { message: "temporary model failure" } }));
        return;
      }
      const checks = JSON.parse(content[0].text.split("冻结知识：")[1].split("\n")[0]).checks;
      const regions = evidence.filter(item => item.role === "roi" && item.representation === "raw");
      const view = { description: regions.length ? "左孔红色遮挡" : "两孔背景可见", position_analysis: "主体左侧", illumination_analysis: "整体亮度均匀" };
      result = { ...view, suggested_label: regions.length ? "FAIL" : "PASS", reason_category: regions.length ? "OCCLUSION" : "NORMAL", confidence: 0.8,
        evidence_ids: evidence.map(item => item.evidence_id), global_view: view,
        check_assessments: checks.map(check => ({ ...view, check_id: check.check_id, status: regions.length ? "anomaly" : "normal", evidence_ids: [evidence[0].evidence_id] })),
        region_observations: regions.map((_, index) => ({ ...view, region_index: index + 1 })),
        findings: regions.length ? [{ check_ids: checks.map(check => check.check_id), location: { scope: "local", bbox: [90, 110, 110, 130], description: "主体左孔" },
          description: "红色区域覆盖背景", hypothesis: "局部遮挡", normal_explanation: "仍需排除有色反光", limitations: ["合成验证"], review_action: "查看左孔", priority: "high", evidence_ids: [regions[0].evidence_id] }] : [] };
    } else if (body.response_format.json_schema.name === "KnowledgeVerification") {
      const payload = JSON.parse(content[0].text.split("待核验疑点：")[1].split("\n请根据图像")[0]);
      const raw = evidence.find(item => item.role === "roi" && item.representation === "raw");
      const normal = evidence.find(item => item.role === "normal");
      result = { findings: payload.findings.map(target => ({ finding_id: target.finding_id, status: "supported",
        affected_check_titles: ["孔内外观"], description: "红色区域覆盖孔内背景", normal_explanation: "需排除反光",
        limitations: ["合成验证"], evidence_ids: [raw.evidence_id, normal.evidence_id], conflicts: [] })) };
    } else {
      const defect = content[0].text.includes("已核验异常");
      result = { summary: defect ? "孔内遮挡判据" : "孔内可见背景", checks: [{ title: defect ? "孔内遮挡" : "孔内外观",
        subject: "孔", location: "主体左侧", criterion: defect ? "实体覆盖背景" : "可见背景", allowed_variations: ["整体亮度变化"],
        support_evidence_ids: evidence.filter(item => !defect || (item.role === "roi" && item.representation === "raw")).map(item => item.evidence_id),
        counter_evidence_ids: [], limitations: [], status: "supported" }], suspects: [], limitations: [] };
      if (content[0].text.includes("冻结父版本候选：")) {
        const parent = JSON.parse(content[0].text.split("冻结父版本候选：")[1].split("\n")[0]);
        result.revisions = parent.checks.map(check => ({ previous_check_id: check.check_id,
          current_check_titles: result.checks.map(item => item.title), reason: "重新核验同类型检查项" }));
      }
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(req.url === "/tokenize" ? result : { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(result) } }] }));
  });
  await new Promise(resolve => model.listen(0, "127.0.0.1", resolve));
  const previousEndpoint = process.env.LIVE_VLM_ENDPOINT;
  process.env.LIVE_VLM_ENDPOINT = `http://127.0.0.1:${model.address().port}/v1`;
  const ctx = new Context();
  new SystemPrompt(ctx, {});
  new ToolRuntime(ctx);
  new SkillRegistry(ctx);
  new LocalAttachmentStore(ctx, { dshHome: path.join(root, "dsh") });
  skillTool.apply(ctx);
  const fork = await ctx.plugin(harness, { dbPath: path.join(root, "test.db") });
  let call = 0;
  const execute = async (name, args) => {
    const result = await ctx.tools.execute({ name, arguments: args, callId: `knowledge-${++call}`, signal: new AbortController().signal });
    assert.equal(result.isError, false, JSON.stringify(result));
    if (name === "knowledge_job_status") {
      assert.ok(Array.isArray(result.value.model_calls));
      assert.ok(!result.content[0].text.includes('"model_calls"'), "Chat polling must not repeat technical call traces");
    }
    return result;
  };
  try {
    assert.ok(ctx.tools.get("dataset_list"), "Skills need a registered dataset discovery tool");
    const dataset = (await execute("dataset_import", { name: "合成部件", image_dir: path.join(root, "images"), annotation_dir: path.join(root, "labels") })).value;
    const original = await ctx.iadPythonBridge.execute("sample_get", { sample_id: dataset.dataset_id + ":part-2.png" });
    assert.equal((await execute("dataset_list", {})).value.datasets.length, 1);
    const versions = {};
    for (const { key, kind, sampleIndex } of [
      { key: "initial_normal", kind: "normal", sampleIndex: 0 },
      { key: "normal", kind: "normal", sampleIndex: 1 },
      { key: "defect", kind: "defect" },
      { key: "defect_revised", kind: "defect" },
    ]) {
      await execute("skill", { name: `mine-${kind}-knowledge` });
      const args = { dataset_id: dataset.dataset_id, model_name: "test-mllm" };
      if (kind === "normal") args.sample_ids = [dataset.dataset_id + `:part-${sampleIndex}.png`];
      if (kind === "defect") args.normal_version_id = versions.normal.version_id;
      if (key === "defect_revised") {
        args.base_version_id = versions.defect.version_id;
        args.corrections = [{ check_id: versions.defect.checks[0].check_id, instruction: "重新排除有色反光，实体遮挡须有独立可见证据" }];
      }
      let job = (await execute(`knowledge_mine_${kind}`, args)).value;
      const deadline = Date.now() + 5000;
      while (["PENDING", "RUNNING"].includes(job.status) && Date.now() < deadline) {
        await delay(20);
        job = (await execute("knowledge_job_status", { run_id: job.run_id })).value;
      }
      assert.equal(job.status, "COMPLETED", JSON.stringify(job));
      const read = await execute("knowledge_get", { version_id: job.knowledge_version_id });
      versions[key] = read.value.knowledge;
      assert.ok(versions[key].mining_steps.length);
      assert.ok(!read.content[0].text.includes('"mining_steps"'));
      assert.equal(versions[key].kind, kind);
      assert.equal(job.completed, key === "normal" ? 2 : 1);
    }
    assert.equal(versions.normal.parent_version_id, versions.initial_normal.version_id);
    assert.equal(versions.normal.checks[0].check_id, versions.initial_normal.checks[0].check_id);
    assert.deepEqual(versions.normal.checks[0].predecessor_check_ids, [versions.initial_normal.checks[0].check_id]);
    assert.equal(versions.normal.sources.length, 2);
    assert.equal(versions.defect.normal_version_id, versions.normal.version_id);
    assert.equal(versions.defect_revised.parent_version_id, versions.defect.version_id);
    assert.equal(versions.defect_revised.normal_version_id, versions.normal.version_id);
    assert.deepEqual(versions.defect_revised.corrections, [{ check_id: versions.defect.checks[0].check_id, instruction: "重新排除有色反光，实体遮挡须有独立可见证据" }]);
    assert.deepEqual((await execute("knowledge_get", { version_id: versions.defect.version_id })).value.knowledge, versions.defect);
    assert.equal(versions.defect.findings[0].judgment.status, "supported");
    const raw = versions.defect.evidence.find(item => item.image.role === "roi" && item.image.representation === "raw").image;
    const media = await execute("knowledge_evidence", { version_id: versions.defect.version_id, evidence_id: raw.evidence_id });
    const block = media.content.find(item => item.type === "image");
    assert.ok(block, "Knowledge evidence must render an actual ImageBlock");
    const stored = await ctx.attachments.readImage(block.attachment);
    assert.equal(createHash("sha256").update(stored.data).digest("hex"), raw.sha256);
    const unowned = await ctx.tools.execute({ name: "knowledge_evidence", arguments: { version_id: versions.normal.version_id,
      evidence_id: raw.evidence_id }, callId: "unowned", signal: new AbortController().signal });
    assert.equal(unowned.isError, true);
    let audit = (await execute("model_audit_start", { dataset_id: dataset.dataset_id, model_name: "test-mllm",
      normal_version_id: versions.normal.version_id, defect_version_id: versions.defect.version_id })).value;
    const auditDeadline = Date.now() + 5000;
    while (["PENDING", "RUNNING"].includes(audit.status) && Date.now() < auditDeadline) {
      await delay(20);
      audit = (await execute("model_audit_status", { run_id: audit.run_id })).value;
    }
    assert.equal(audit.status, "PARTIAL", JSON.stringify(audit));
    assert.equal(audit.completed, 2);
    assert.equal(audit.failed, 1);
    const retry = (await execute("model_audit_retry", { run_id: audit.run_id })).value;
    const restored = (await execute("model_audit_status", { run_id: retry.run_id })).value;
    assert.equal(restored.status, "COMPLETED");
    assert.equal(restored.completed, 1);
    assert.equal(restored.parent_run_id, audit.run_id);
    assert.ok(harness.ALLOWED_TOOL_SURFACE.includes("model_audit_retry"));
    assert.deepEqual(restored.sample_ids, audit.failed_sample_ids);
    assert.equal((await execute("model_audit_status", { run_id: audit.run_id })).value.status, "PARTIAL");
    assert.equal(audit.normal_version_id, versions.normal.version_id);
    assert.equal(audit.defect_version_id, versions.defect.version_id);
    const audited = await execute("model_audit_sample", { sample_id: original.sample.sample_id });
    assert.ok(!audited.content[0].text.includes('"joint_steps"'), "Chat should read the conclusion and evidence references without repeating every model step");
    const after = audited.value;
    assert.equal(after.suggestion.analysis.normal_version_id, versions.normal.version_id);
    assert.equal(after.suggestion.audit_run_id, audit.run_id);
    assert.equal(after.suggestion.analysis.conclusion.suggested_label, "FAIL");
    const roi = after.suggestion.analysis.regions[0].image;
    const auditMedia = await execute("model_audit_evidence", { suggestion_id: after.suggestion.suggestion_id, evidence_id: roi.evidence_id });
    const auditBytes = await ctx.attachments.readImage(auditMedia.content.find(item => item.type === "image").attachment);
    assert.equal(createHash("sha256").update(auditBytes.data).digest("hex"), roi.sha256);
    const badAuditMedia = await ctx.tools.execute({ name: "model_audit_evidence", arguments: { suggestion_id: after.suggestion.suggestion_id,
      evidence_id: versions.normal.evidence[0].image.evidence_id }, callId: "unowned-audit", signal: new AbortController().signal });
    assert.equal(badAuditMedia.isError, true);
    const report = (await execute("dataset_report", { dataset_id: dataset.dataset_id })).value;
    assert.equal(report.vlm_audited_count, 3);
    assert.equal(report.vlm_coverage_pct, 100);
    assert.equal(report.human_reviewed_count, 0);
    assert.deepEqual(after.annotations, original.annotations);
    assert.deepEqual(after.review_decision, original.review_decision);
    followupReference = { dataset_id: dataset.dataset_id, sample_id: after.sample.sample_id,
      suggestion_id: after.suggestion.suggestion_id, finding_id: after.suggestion.analysis.findings[0].finding_id,
      evidence_id: roi.evidence_id };
    const previousCredential = process.env.IAD_SESSION_TEST_CREDENTIAL;
    process.env.IAD_SESSION_TEST_CREDENTIAL = "synthetic-test-credential";
    const session = await createDatasetSession({ root: path.join(root, "followup"), dbPath: path.join(root, "test.db"),
      endpoint: process.env.LIVE_VLM_ENDPOINT, model: "test-mllm", apiKeyEnv: "IAD_SESSION_TEST_CREDENTIAL" });
    try {
      const trace = [];
      session.ctx.on("tools/result", (exec, result) => trace.push({ name: exec.name, result }));
      session.handle.agent.followup(createUserMessage({ source: { kind: "user" }, content: [{ type: "text",
        text: `请核对当前疑点，先解析冻结引用，再读取实际全图与ROI：${JSON.stringify(followupReference)}` }] }));
      await session.handle.agent.whenIdle();
      assert.deepEqual(trace.map(item => item.name), ["model_audit_context", "model_audit_evidence", "model_audit_evidence"]);
      assert.ok(trace.every(item => item.result.isError === false), JSON.stringify(trace));
      assert.equal(trace[0].result.value.reference.suggestion_id, after.suggestion.suggestion_id);
      assert.equal(trace[0].result.value.analysis.normal_version_id, versions.normal.version_id);
      const expected = [after.suggestion.analysis.overview, roi];
      for (const [index, evidence] of expected.entries()) {
        const attachment = trace[index + 1].result.content.find(item => item.type === "image");
        const actual = await session.ctx.attachments.readImage(attachment.attachment);
        assert.equal(createHash("sha256").update(actual.data).digest("hex"), evidence.sha256);
      }
      const imageInputs = agentRequests.at(-1).messages.flatMap(message => Array.isArray(message.content) ? message.content.filter(item => item.type === "image_url") : []);
      assert.equal(imageInputs.length, 2, "The actual Session must deliver both evidence images to its MLLM");
      assert.ok(!agentRequests[0].tools.some(tool => /review_submit|gold_write/.test(tool.function.name)));
    } finally {
      await session.dispose();
      if (previousCredential === undefined) delete process.env.IAD_SESSION_TEST_CREDENTIAL;
      else process.env.IAD_SESSION_TEST_CREDENTIAL = previousCredential;
    }
  } finally {
    await fork.dispose();
    await new Promise(resolve => model.close(resolve));
    if (previousEndpoint === undefined) delete process.env.LIVE_VLM_ENDPOINT;
    else process.env.LIVE_VLM_ENDPOINT = previousEndpoint;
    await fs.rm(root, { recursive: true, force: true });
  }
});
