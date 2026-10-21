import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { Context } from "@deepseek-ai/cordis";
import { SystemPrompt } from "@deepseek-ai/dsh-system-prompt";
import { ToolRuntime } from "@deepseek-ai/dsh-tools";
import { SkillRegistry } from "@deepseek-ai/dsh-skill";
import { LocalAttachmentStore } from "@deepseek-ai/dsh-attachment-local";
import * as harness from "../lib/server/index.js";
import { resolvePythonPath } from "../lib/server/python-bridge/index.js";

test("workbench and native tools reverify proposed knowledge corrections without rewriting history", { timeout: 30000 }, async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-knowledge-revision-"));
  execFileSync(resolvePythonPath(), [fileURLToPath(new URL("fixtures/knowledge_dataset.py", import.meta.url)), root]);
  const observed = [];
  const model = http.createServer(async (req, res) => {
    let body = ""; for await (const part of req) body += part;
    let result = { count: 1000, max_model_len: 262144 };
    if (req.url !== "/tokenize") {
      const content = JSON.parse(body).messages[0].content, prompt = content[0].text;
      const images = content.filter(part => part.type === "text" && part.text.startsWith("视觉证据：")).map(part => JSON.parse(part.text.slice(5)));
      const parent = JSON.parse(prompt.split("冻结父版本候选：")[1].split("\n")[0]);
      const corrections = prompt.includes("待核验人工修订：") ? JSON.parse(prompt.split("待核验人工修订：")[1].split("\n")[0]) : [];
      observed.push({ images, corrections, prompt });
      const unsupported = corrections.some(item => item.instruction.includes("100毫米"));
      result = { choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
        summary: "孔与主体的可见关系", checks: [{ title: "孔相对位置", subject: "主体与圆孔", location: "主体中部",
          criterion: unsupported ? "无法从当前图像确认100毫米，仅可观察相对排列" : "两孔沿主体长轴相对排列",
          allowed_variations: ["整体亮度变化"], support_evidence_ids: images.map(image => image.evidence_id),
          counter_evidence_ids: [], limitations: unsupported ? ["缺少尺度标定，人工候选尚未证实"] : [], status: unsupported ? "provisional" : "supported" }],
        revisions: parent.checks.map(check => ({ previous_check_id: check.check_id, current_check_titles: ["孔相对位置"], reason: unsupported ? "实际图像不支持绝对尺寸" : "重新观察支持相对位置判据" })),
        suspects: [], limitations: [],
      }) } }] };
    }
    res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(result));
  });
  await new Promise(resolve => model.listen(0, "127.0.0.1", resolve));
  const priorEndpoint = process.env.LIVE_VLM_ENDPOINT;
  process.env.LIVE_VLM_ENDPOINT = `http://127.0.0.1:${model.address().port}/v1`;
  const ctx = new Context(); new SystemPrompt(ctx, {}); new ToolRuntime(ctx); new SkillRegistry(ctx);
  new LocalAttachmentStore(ctx, { dshHome: path.join(root, "dsh") });
  const fork = await ctx.plugin(harness, { dbPath: path.join(root, "test.db") });
  const server = http.createServer(harness.createIadHttpHandler(ctx.iadPythonBridge));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/iad`;
  const api = (url, body, method = "POST") => fetch(base + url, body ? { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  async function complete(job) {
    assert.ok(job.run_id, JSON.stringify(job));
    for (let attempt = 0; attempt < 100; attempt++) {
      const status = await (await api(`/knowledge/status/${job.run_id}`)).json();
      assert.ok(!["FAILED", "PARTIAL", "CANCELLED"].includes(status.status), JSON.stringify(status.errors));
      if (status.status === "COMPLETED") return (await api(`/knowledge?version_id=${status.knowledge_version_id}`)).json();
      await delay(20);
    }
    assert.fail("Knowledge job did not complete");
  }
  try {
    const imported = await api("/datasets/import", { format: "labelme", name: "修订验证", image_dir: path.join(root, "images"), annotation_dir: path.join(root, "labels") });
    assert.equal(imported.status, 200, await imported.clone().text());
    const dataset = await imported.json();
    const input = { dataset_id: dataset.dataset_id, kind: "normal", model_name: "test-revision" };
    const first = (await complete(await (await api("/knowledge/start", input)).json())).knowledge;
    const originalImage = await fs.readFile(path.join(root, "images/part-0.png"));
    const freshness = async () => (await (await api(`/knowledge?version_id=${first.version_id}`)).json()).freshness;
    assert.equal((await freshness()).status, "current");
    assert.equal((await api(`/datasets/${dataset.dataset_id}`, { name: "仅改显示名称" }, "PATCH")).status, 200);
    assert.equal((await freshness()).status, "current", "改名不能使知识陈旧");
    await fs.copyFile(path.join(root, "images/part-1.png"), path.join(root, "images/part-0.png"));
    const changed = await freshness();
    assert.equal(changed.status, "changed");
    assert.deepEqual(changed.source_changes, [{ sample_id: dataset.dataset_id + ":part-0.png", reasons: ["image"] }]);
    assert.deepEqual((await (await api(`/knowledge?version_id=${first.version_id}`)).json()).knowledge, first, "查询来源变化不能修改冻结版本");
    await fs.writeFile(path.join(root, "images/part-0.png"), originalImage);
    assert.equal((await freshness()).status, "current", "状态必须派生于当前真实内容，不能存储陈旧标记");
    const nativeFreshness = await ctx.tools.execute({ name: "knowledge_get", arguments: { version_id: first.version_id }, callId: "read-freshness", signal: new AbortController().signal });
    assert.equal(nativeFreshness.value.freshness.status, "current");
    await fs.rename(path.join(root, "images/part-0.png"), path.join(root, "images/temporarily-missing.png"));
    assert.deepEqual((await freshness()).source_changes, [{ sample_id: dataset.dataset_id + ":part-0.png", reasons: ["unavailable"] }]);
    await fs.rename(path.join(root, "images/temporarily-missing.png"), path.join(root, "images/part-0.png"));
    assert.equal((await api(`/datasets/${dataset.dataset_id}`, { reference_sample_ids: [dataset.dataset_id + ":part-1.png"] }, "PATCH")).status, 200);
    assert.deepEqual((await freshness()).source_changes, [0, 1].map(index => ({ sample_id: dataset.dataset_id + `:part-${index}.png`, reasons: ["qualification"] })));
    assert.equal((await api(`/datasets/${dataset.dataset_id}`, { reset_references: true }, "PATCH")).status, 200);
    assert.equal((await freshness()).status, "current");
    const proposal = { check_id: first.checks[0].check_id, instruction: "两个孔必须精确相距100毫米" };
    const proposed = await api("/knowledge/start", { ...input, base_version_id: first.version_id, corrections: [proposal] });
    assert.equal(proposed.status, 200, await proposed.clone().text());
    const second = (await complete(await proposed.json())).knowledge;
    assert.notEqual(second.version_id, first.version_id);
    assert.equal(second.parent_version_id, first.version_id);
    assert.deepEqual(second.corrections, [proposal]);
    assert.equal(second.checks[0].status, "provisional", "人工建议不能自动升级为已证实知识");
    assert.ok(second.checks[0].limitations.includes("缺少尺度标定，人工候选尚未证实"));
    assert.deepEqual(observed.at(-1).corrections, [proposal]);
    assert.ok(new Set(observed.at(-1).images.map(image => image.source_sha256)).size >= 2, "修订仍须联合观察独立真实图像");
    assert.deepEqual((await (await api(`/knowledge?version_id=${first.version_id}`)).json()).knowledge, first);
    assert.equal((await api("/audit/start", { dataset_id: dataset.dataset_id, model_name: "test-revision", normal_version_id: second.version_id })).status, 422);
    for (const update of [
      { base_version_id: first.version_id, corrections: [proposal] },
      { base_version_id: second.version_id, corrections: [{ ...proposal, check_id: "foreign-check" }] },
      { base_version_id: second.version_id, corrections: [proposal, proposal] },
      { corrections: [proposal] },
      { base_version_id: second.version_id, corrections: [{ ...proposal, instruction: "  " }] },
    ]) assert.equal((await api("/knowledge/start", { ...input, ...update })).status, 422);
    const correction = { check_id: second.checks[0].check_id, instruction: "只采用相对排列，不作绝对尺寸断言" };
    const native = await ctx.tools.execute({ name: "knowledge_mine_normal", arguments: { dataset_id: dataset.dataset_id, model_name: "test-revision", base_version_id: second.version_id, corrections: [correction] }, callId: "revise-normal", signal: new AbortController().signal });
    assert.equal(native.isError, false, JSON.stringify(native));
    const third = (await complete(native.value)).knowledge;
    assert.equal(third.parent_version_id, second.version_id);
    assert.deepEqual(third.corrections, [correction]);
    assert.equal(third.checks[0].status, "supported");
    const calls = observed.length;
    const reused = (await complete(await (await api("/knowledge/start", { ...input, base_version_id: third.version_id, corrections: [correction] })).json())).knowledge;
    assert.equal(reused.version_id, third.version_id);
    assert.equal(observed.length, calls, "相同修订与图像来源可复用已完成知识");
    const report = await (await api(`/report/${dataset.task_id}?dataset_id=${dataset.dataset_id}`)).json();
    assert.equal(report.human_reviewed_count, 0);
    assert.equal(report.vlm_audited_count, 0);
    const review = await api("/review/submit", { submission_id: randomUUID(), dataset_id: dataset.dataset_id,
      sample_id: dataset.dataset_id + ":part-0.png", reviewer: "知识核验员", decision: "PASS" });
    assert.equal(review.status, 200, await review.clone().text());
    assert.deepEqual((await freshness()).source_changes, [{ sample_id: dataset.dataset_id + ":part-0.png", reasons: ["review", "qualification"] }]);
    const renewed = (await complete(await (await api("/knowledge/start", { ...input, base_version_id: third.version_id, corrections: [correction] })).json())).knowledge;
    assert.notEqual(renewed.version_id, third.version_id, "真实人工反馈变化后不能复用旧输入的版本");
    assert.equal((await (await api(`/knowledge?version_id=${renewed.version_id}`)).json()).freshness.status, "current");
    assert.equal((await api("/review/submit", { submission_id: randomUUID(), dataset_id: dataset.dataset_id,
      sample_id: dataset.dataset_id + ":part-2.png", reviewer: "知识核验员", decision: "PASS" })).status, 200);
    const expanded = (await (await api(`/knowledge?version_id=${renewed.version_id}`)).json()).freshness;
    assert.deepEqual(expanded.additional_source_ids, [dataset.dataset_id + ":part-2.png"], "新增合格候选应提示覆盖范围，而不是悄悄加入冻结知识");
    assert.deepEqual(expanded.source_changes, []);
    assert.equal((await api("/review/submit", { submission_id: randomUUID(), dataset_id: dataset.dataset_id,
      sample_id: dataset.dataset_id + ":part-1.png", reviewer: "知识核验员", decision: "FAIL" })).status, 200);
    const withdrawn = (await (await api(`/knowledge?version_id=${renewed.version_id}`)).json()).freshness;
    assert.deepEqual(withdrawn.source_changes, [{ sample_id: dataset.dataset_id + ":part-1.png", reasons: ["review", "qualification"] }], "资格撤销仍应指出导致撤销的人工反馈变化");
    await fs.writeFile(path.join(root, "labels/part-0.json"), JSON.stringify({ imageWidth: 320, imageHeight: 240,
      shapes: [{ shape_type: "rectangle", label: "新增核验区域", points: [[80, 90], [120, 150]] }] }));
    const rescan = await api(`/datasets/${dataset.dataset_id}/rescan`, {});
    assert.equal(rescan.status, 200, await rescan.clone().text());
    const rescanKnowledge = await (await api(`/knowledge?version_id=${renewed.version_id}`)).json();
    assert.deepEqual(rescanKnowledge.knowledge, renewed);
    assert.deepEqual(rescanKnowledge.freshness.source_changes.find(item => item.sample_id.endsWith(":part-0.png")).reasons, ["annotations"]);
    const afterRescan = (await complete(await (await api("/knowledge/start", input)).json())).knowledge;
    assert.notEqual(afterRescan.version_id, renewed.version_id);
    assert.equal(afterRescan.parent_version_id, renewed.version_id);
    assert.equal((await (await api(`/knowledge?version_id=${afterRescan.version_id}`)).json()).freshness.status, "current");
  } finally {
    await new Promise(resolve => server.close(resolve)); await fork.dispose();
    if (priorEndpoint === undefined) delete process.env.LIVE_VLM_ENDPOINT; else process.env.LIVE_VLM_ENDPOINT = priorEndpoint;
    await new Promise(resolve => model.close(resolve)); await fs.rm(root, { recursive: true, force: true });
  }
});
