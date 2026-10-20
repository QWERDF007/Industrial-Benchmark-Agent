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
import * as harness from "../lib/server/index.js";
import { resolvePythonPath } from "../lib/server/python-bridge/index.js";

test("DSH discovers and loads both bundled knowledge skills and removes them with the plugin", async () => {
  const ctx = new Context();
  new SystemPrompt(ctx, {});
  new ToolRuntime(ctx);
  new SkillRegistry(ctx);
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
  const fork = await ctx.plugin(harness, { dbPath: path.join(root, "test.db") });
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
    const stopping = await execute("knowledge_job_cancel", { run_id: job.run_id });
    assert.equal(stopping.status, "RUNNING");
    assert.match(stopping.message, /正在停止/);
    release.resolve();
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
  } finally {
    release.resolve();
    await fork.dispose();
    await new Promise(resolve => model.close(resolve));
    if (previousEndpoint === undefined) delete process.env.LIVE_VLM_ENDPOINT;
    else process.env.LIVE_VLM_ENDPOINT = previousEndpoint;
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("DSH knowledge skills execute shared jobs and return actual evidence attachments", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-skill-"));
  execFileSync(resolvePythonPath(), [fileURLToPath(new URL("fixtures/knowledge_dataset.py", import.meta.url)), root]);
  const model = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString());
    const content = body.messages[0].content;
    const evidence = content.filter(item => item.type === "text" && item.text.startsWith("视觉证据："))
      .map(item => JSON.parse(item.text.slice("视觉证据：".length)));
    let result;
    if (req.url === "/tokenize") result = { count: 4000, max_model_len: 262144 };
    else if (body.response_format.json_schema.name === "KnowledgeVerification") {
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
          current_check_titles: ["孔内外观"], reason: "追加来源仍支持同一孔内可见背景判据" }));
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
    const dataset = await ctx.iadPythonBridge.execute("dataset_import", { name: "合成部件", image_dir: path.join(root, "images"), annotation_dir: path.join(root, "labels") });
    const original = await ctx.iadPythonBridge.execute("sample_get", { sample_id: dataset.dataset_id + ":part-2.png" });
    assert.equal((await execute("dataset_list", {})).value.datasets.length, 1);
    const versions = {};
    for (const { key, kind, sampleIndex } of [
      { key: "initial_normal", kind: "normal", sampleIndex: 0 },
      { key: "normal", kind: "normal", sampleIndex: 1 },
      { key: "defect", kind: "defect" },
    ]) {
      await execute("skill", { name: `mine-${kind}-knowledge` });
      const args = { dataset_id: dataset.dataset_id, model_name: "test-mllm" };
      if (kind === "normal") args.sample_ids = [dataset.dataset_id + `:part-${sampleIndex}.png`];
      if (kind === "defect") args.normal_version_id = versions.normal.version_id;
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
    const after = await ctx.iadPythonBridge.execute("sample_get", { sample_id: original.sample.sample_id });
    assert.deepEqual(after.annotations, original.annotations);
    assert.deepEqual(after.review_decision, original.review_decision);
  } finally {
    await fork.dispose();
    await new Promise(resolve => model.close(resolve));
    if (previousEndpoint === undefined) delete process.env.LIVE_VLM_ENDPOINT;
    else process.env.LIVE_VLM_ENDPOINT = previousEndpoint;
    await fs.rm(root, { recursive: true, force: true });
  }
});
