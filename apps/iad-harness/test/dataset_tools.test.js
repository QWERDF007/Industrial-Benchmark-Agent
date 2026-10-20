import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { Context } from "@deepseek-ai/cordis";
import { SkillRegistry } from "@deepseek-ai/dsh-skill";
import { SystemPrompt } from "@deepseek-ai/dsh-system-prompt";
import { ToolRuntime } from "@deepseek-ai/dsh-tools";
import { LocalAttachmentStore } from "@deepseek-ai/dsh-attachment-local";
import * as harness from "../lib/server/index.js";
import { resolvePythonPath } from "../lib/server/python-bridge/index.js";

test("DSH directory import and browser queries share one dataset and report", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-dataset-tools-"));
  execFileSync(resolvePythonPath(), [fileURLToPath(new URL("fixtures/knowledge_dataset.py", import.meta.url)), root]);
  const ctx = new Context();
  new SystemPrompt(ctx, {});
  new ToolRuntime(ctx);
  new SkillRegistry(ctx);
  new LocalAttachmentStore(ctx, { dshHome: path.join(root, "dsh") });
  const fork = await ctx.plugin(harness, { dbPath: path.join(root, "test.db") });
  const server = http.createServer(harness.createIadHttpHandler(ctx.iadPythonBridge));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/iad`;
  const execute = (name, args) => ctx.tools.execute({ name, arguments: args,
    callId: name, signal: new AbortController().signal });
  try {
    const rootListing = await execute("dataset_directory_inspect", { path: root });
    assert.equal(rootListing.isError, false, JSON.stringify(rootListing));
    assert.deepEqual(rootListing.value.directories.map(item => item.name), ["images", "labels"]);
    const images = await execute("dataset_directory_inspect", { path: path.join(root, "images") });
    const labels = await execute("dataset_directory_inspect", { path: path.join(root, "labels") });
    assert.deepEqual(images.value.file_counts, { ".png": 3 });
    assert.deepEqual(labels.value.file_counts, { ".json": 1 });
    assert.deepEqual((await (await fetch(base + "/directories?path=" + encodeURIComponent(root))).json()), rootListing.value);
    const missing = await execute("dataset_directory_inspect", { path: path.join(root, "missing") });
    assert.equal(missing.isError, true);
    assert.deepEqual((await execute("dataset_list", {})).value.datasets, [], "Directory inspection must not import datasets");
    const result = await execute("dataset_import", { name: "会话接入的部件", image_dir: path.join(root, "images"), annotation_dir: path.join(root, "labels") });
    assert.equal(result.isError, false, JSON.stringify(result));
    const dataset = result.value;
    assert.equal(dataset.total_samples, 3);
    assert.equal(dataset.name, "会话接入的部件");
    const browserDatasets = await (await fetch(base + "/datasets")).json();
    assert.equal(browserDatasets.datasets.length, 1);
    const { generated_at: browserTime, ...browserDataset } = browserDatasets.datasets[0];
    const { generated_at: importTime, ...importedDataset } = dataset;
    const { generated_at: toolTime, ...toolDataset } = (await execute("dataset_list", {})).value.datasets[0];
    assert.ok(browserTime && importTime && toolTime);
    assert.deepEqual(browserDataset, importedDataset);
    assert.deepEqual(toolDataset, importedDataset);
    const report = await execute("dataset_report", { dataset_id: dataset.dataset_id });
    assert.equal(report.isError, false, JSON.stringify(report));
    assert.equal(report.value.total_samples, 3);
    assert.equal(report.value.vlm_audited_count, 0);
    assert.equal(report.value.human_reviewed_count, 0);
    assert.equal(report.value.quality.technical_usability.percent, 100);
    assert.equal(report.value.quality.audit_coverage.percent, 0);
    assert.equal(report.value.quality.human_verification_coverage.percent, 0);
    assert.equal(report.value.quality.scope.observed_inputs, 3);
    const { generated_at: reportTime, task_id: toolTask, ...toolReport } = report.value;
    const { generated_at: httpReportTime, task_id: browserTask, ...browserReport } = await (await fetch(`${base}/report/${dataset.task_id}?dataset_id=${dataset.dataset_id}`)).json();
    assert.ok(reportTime && httpReportTime);
    assert.equal(toolTask, null);
    assert.equal(browserTask, dataset.task_id);
    assert.deepEqual(toolReport, browserReport);
    const duplicate = await execute("dataset_import", { name: "不应重复导入", image_dir: path.join(root, "images"), annotation_dir: path.join(root, "labels") });
    assert.equal(duplicate.isError, true);
    assert.equal((await execute("dataset_list", {})).value.datasets.length, 1);
    const sampleId = dataset.dataset_id + ":part-2.png";
    const before = await (await fetch(`${base}/sample/${encodeURIComponent(sampleId)}`)).json();
    assert.match(before.sample.sample_uuid, /^[a-f0-9]{8}-[a-f0-9-]{27}$/);
    assert.equal((await fetch(`${base}/review/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      submission_id: randomUUID(), dataset_id: dataset.dataset_id, sample_id: sampleId, reviewer: "目录核验", decision: "PASS",
    }) })).status, 200);
    const reviewed = await (await fetch(`${base}/sample/${encodeURIComponent(sampleId)}`)).json();
    const annotationPath = path.join(root, "labels/part-2.json");
    const annotation = JSON.parse(await fs.readFile(annotationPath, "utf8"));
    annotation.shapes.push({ ...annotation.shapes[0], points: [[150, 90], [190, 150]] });
    await fs.writeFile(annotationPath, JSON.stringify(annotation));
    const rescanned = await fetch(`${base}/datasets/${dataset.dataset_id}/rescan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    assert.equal(rescanned.status, 200, await rescanned.clone().text());
    assert.equal((await rescanned.json()).annotation_count, 2);
    const updated = await (await fetch(`${base}/sample/${encodeURIComponent(sampleId)}`)).json();
    assert.equal(updated.annotations.length, 2);
    assert.equal(updated.sample.sample_uuid, before.sample.sample_uuid);
    assert.deepEqual(updated.review_decision, reviewed.review_decision);
    annotation.shapes = [];
    await fs.writeFile(annotationPath, JSON.stringify(annotation));
    const nativeScan = await execute("dataset_rescan", { dataset_id: dataset.dataset_id });
    assert.equal(nativeScan.isError, false, JSON.stringify(nativeScan));
    assert.equal(nativeScan.value.annotation_count, 0);
    assert.equal((await (await fetch(`${base}/sample/${encodeURIComponent(sampleId)}`)).json()).annotations.length, 0);
    assert.equal((await execute("dataset_list", {})).value.datasets.length, 1);
    for (const name of ["dataset_directory_inspect", "dataset_import", "dataset_rescan", "dataset_list", "dataset_report"]) {
      assert.ok(harness.ALLOWED_TOOL_SURFACE.includes(name), `${name} must be visible in an Agent scope`);
    }
    await fs.writeFile(annotationPath, "{invalid");
    assert.equal((await execute("dataset_rescan", { dataset_id: dataset.dataset_id })).value.issue_count, 1);
    const beforeFailure = (await execute("dataset_report", { dataset_id: dataset.dataset_id })).value;
    await fs.rename(path.join(root, "images"), path.join(root, "images-offline"));
    assert.equal((await execute("dataset_rescan", { dataset_id: dataset.dataset_id })).isError, true);
    const afterFailure = (await execute("dataset_report", { dataset_id: dataset.dataset_id })).value;
    assert.deepEqual(afterFailure.quality.technical_usability, beforeFailure.quality.technical_usability, "扫描失败不能提前清空此前的真实问题");
    await fs.rename(path.join(root, "images-offline"), path.join(root, "images"));
    await fs.writeFile(annotationPath, JSON.stringify(annotation));
    annotation.shapes = [{ shape_type: "rectangle", label: "修订标注", points: [[80, 90], [120, 150]] }];
    await fs.writeFile(annotationPath, JSON.stringify(annotation));
    assert.equal((await execute("dataset_rescan", { dataset_id: dataset.dataset_id })).value.annotation_count, 1);
    await fs.rename(path.join(root, "labels"), path.join(root, "labels-offline"));
    const offlineLabels = await execute("dataset_rescan", { dataset_id: dataset.dataset_id });
    assert.equal(offlineLabels.isError, true, "明确配置的标注目录不可读不能被当作所有图像无标注");
    assert.equal((await (await fetch(`${base}/sample/${encodeURIComponent(sampleId)}`)).json()).annotations.length, 1);
    await fs.rename(path.join(root, "labels-offline"), path.join(root, "labels"));
    await fs.rename(path.join(root, "images/part-1.png"), path.join(root, "part-1.png"));
    const missingScan = await execute("dataset_rescan", { dataset_id: dataset.dataset_id });
    assert.equal(missingScan.isError, false, JSON.stringify(missingScan));
    assert.equal(missingScan.value.image_count, 2);
    assert.equal(missingScan.value.issue_count, 1, "旧样本原图消失时必须记录导入问题，不能保持技术可用");
    const missingReport = (await execute("dataset_report", { dataset_id: dataset.dataset_id })).value;
    assert.equal(missingReport.quality.technical_usability.numerator, 2);
    assert.equal(missingReport.total_samples, 3, "保留旧样本身份与历史，不因磁盘文件缺失删除记录");
    await fs.rename(path.join(root, "part-1.png"), path.join(root, "images/part-1.png"));
    assert.equal((await execute("dataset_rescan", { dataset_id: dataset.dataset_id })).value.issue_count, 0);
    const pendingImage = path.join(root, "images/pending.png");
    execFileSync(resolvePythonPath(), ["-c", "import os,sys;os.mkfifo(sys.argv[1])", pendingImage]);
    const pendingScan = execute("dataset_rescan", { dataset_id: dataset.dataset_id });
    const writer = await fs.open(pendingImage, "w");
    let whileReading;
    const concurrentReview = fetch(`${base}/review/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      submission_id: randomUUID(), dataset_id: dataset.dataset_id, sample_id: sampleId, reviewer: "扫描并发复核", decision: "PASS",
    }) });
    try {
      whileReading = await Promise.race([concurrentReview.then(() => "submitted"), delay(1500).then(() => "blocked")]);
    } finally {
      await writer.writeFile(await fs.readFile(path.join(root, "images/part-0.png")));
      await writer.close();
    }
    assert.equal((await pendingScan).isError, false);
    assert.equal((await concurrentReview).status, 200);
    assert.equal(whileReading, "submitted", "读取图像阶段不应长期占有数据库写锁，阻塞人工复核");
    await fs.unlink(pendingImage);
    execFileSync(resolvePythonPath(), ["-c", "import os,sys;os.mkfifo(sys.argv[1])", pendingImage]);
    const configurationScan = execute("dataset_rescan", { dataset_id: dataset.dataset_id });
    const configurationWriter = await fs.open(pendingImage, "w");
    try {
      assert.equal((await fetch(`${base}/datasets/${dataset.dataset_id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "扫描期间改名" }) })).status, 200);
    } finally {
      await configurationWriter.writeFile(await fs.readFile(path.join(root, "images/part-0.png")));
      await configurationWriter.close();
    }
    assert.equal((await configurationScan).isError, true, "扫描期间配置变化必须要求重扫，不能覆盖并发维护");
    assert.equal((await execute("dataset_list", {})).value.datasets[0].name, "扫描期间改名");
    await fs.unlink(pendingImage);
    const historyBeforeMove = (await (await fetch(`${base}/sample/${encodeURIComponent(sampleId)}`)).json()).review_history;
    assert.ok(historyBeforeMove.length);
    const movedImages = path.join(root, "moved-images"), movedLabels = path.join(root, "moved-labels");
    await fs.cp(path.join(root, "images"), movedImages, { recursive: true });
    await fs.cp(path.join(root, "labels"), movedLabels, { recursive: true });
    const relocated = await execute("dataset_rescan", { dataset_id: dataset.dataset_id, image_dir: movedImages, annotation_dir: movedLabels });
    assert.equal(relocated.isError, false, JSON.stringify(relocated));
    const relocatedDataset = (await (await fetch(base + "/datasets")).json()).datasets[0];
    assert.equal(relocatedDataset.dataset_id, dataset.dataset_id);
    assert.equal(relocatedDataset.image_dir, movedImages);
    assert.equal(relocatedDataset.annotation_dir, movedLabels);
    assert.deepEqual((await (await fetch(`${base}/sample/${encodeURIComponent(sampleId)}`)).json()).review_history,
      historyBeforeMove);

  } finally {
    await fork.dispose();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
  assert.equal(ctx.tools.get("dataset_import"), undefined);
});
