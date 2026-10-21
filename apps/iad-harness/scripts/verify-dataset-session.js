import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import { createDatasetSession, resolveDatasetSessionModel } from "../test/fixtures/dataset_session.js";
import { findWorkspaceRoot, resolvePythonPath } from "../lib/server/python-bridge/index.js";

assert.ok(process.env.LIVE_VLM_ENDPOINT && process.env.LIVE_VLM_KEY, "Set the configured LIVE_VLM_ENDPOINT and LIVE_VLM_KEY before verification");
const workspace = findWorkspaceRoot();
const archiveMode = process.argv.includes("--archive");
const folderMode = process.argv.includes("--folder");
const workflowOnly = process.argv.includes("--workflow-only");
assert.ok(!(archiveMode && folderMode), "Choose one dataset format");
const expectedCount = folderMode ? 5 : 3;
const output = path.resolve(process.argv.slice(2).find(arg => !["--archive", "--folder", "--workflow-only"].includes(arg)) || path.join(workspace, "runs/verification/dataset-session", String(Date.now())));
await fs.mkdir(output, { recursive: true });
execFileSync(resolvePythonPath(), [fileURLToPath(new URL("../test/fixtures/knowledge_dataset.py", import.meta.url)), output, ...(folderMode ? ["--folder"] : [])]);
const sourceRoot = folderMode ? path.join(output, "folder-dataset") : output;
const model = resolveDatasetSessionModel(workspace);
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
  const source = archiveMode ? "名称：合成部件会话验证；使用所附 ZIP，包内图像目录 product/images、Labelme 标注目录 product/labels"
    : folderMode ? `数据集在服务器上的 ${sourceRoot} 目录，OK及其子目录是正常，NG是异常，unknown未标记。请检查实际目录，按目录图像级格式完成预览导入，名称默认使用该目录名` : `数据集在服务器上的 ${output} 目录。请检查目录，识别图像和 Labelme 标注，名称默认使用该目录名`;
  const content = [{ type: "text", text: `请使用 analyze-dataset 技能完成这份数据集的导入、良品/异常知识挖掘、模型审计和质量报告。${source}。` }];
  let attachment;
  if (archiveMode) {
    execFileSync(resolvePythonPath(), ["-c", `
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import sys
root = Path(sys.argv[1])
with ZipFile(root / 'dataset.zip', 'w', ZIP_DEFLATED) as archive:
    for directory in ('images', 'labels'):
        for item in (root / directory).rglob('*'):
            if item.is_file(): archive.write(item, 'product/' + item.relative_to(root).as_posix())
`, output]);
    attachment = await session.ctx.attachments.saveFile({ data: await fs.readFile(path.join(output, "dataset.zip")), name: "dataset.zip" });
    content.push({ type: "file", attachment });
  }
  session.handle.agent.followup(createUserMessage({ source: { kind: "user" }, content }));
  await session.handle.agent.whenIdle();
  const failed = trace.filter(item => item.result.isError);
  assert.deepEqual(failed, [], "Agent tool errors must be inspected, not hidden");
  for (const name of ["dataset_import", "knowledge_mine_normal", "knowledge_mine_defect", "model_audit_start", "dataset_report"]) {
    assert.ok(trace.some(item => item.name === name), `Agent did not execute ${name}`);
  }
  for (const name of ["analyze-dataset"]) {
    assert.ok(trace.some(item => item.name === "skill" && item.arguments.name === name), `Agent did not load ${name}`);
  }
  const dataset = trace.find(item => item.name === "dataset_import").result.value;
  if (!archiveMode && !folderMode) {
    assert.ok(trace.some(item => item.name === "dataset_directory_inspect" && item.arguments.path === output && !item.result.isError));
    assert.equal(dataset.image_dir, path.join(output, "images"));
    assert.equal(dataset.annotation_dir, path.join(output, "labels"));
    assert.equal(dataset.name, path.basename(output));
  }
  if (folderMode) {
    assert.ok(trace.some(item => item.name === "dataset_preview"));
    assert.equal(dataset.format, "folder_classification");
    assert.equal(dataset.image_dir, sourceRoot);
    assert.equal(dataset.annotation_dir, null);
    assert.equal(dataset.name, path.basename(sourceRoot));
    const imported = trace.find(item => item.name === "dataset_import").arguments;
    assert.ok(imported.rules.length && imported.preview_fingerprint);
  }
  if (archiveMode) {
    assert.ok(trace.some(item => item.name === "dataset_archive_inspect" && !item.result.isError));
    assert.equal(trace.find(item => item.name === "dataset_import").arguments.archive_path, session.ctx.attachments.fileHostPath(attachment));
    assert.deepEqual(await fs.readFile(path.join(dataset.image_dir, "part-2.png")), await fs.readFile(path.join(output, "images/part-2.png")));
    assert.deepEqual(await fs.readFile(path.join(dataset.annotation_dir, "part-2.json")), await fs.readFile(path.join(output, "labels/part-2.json")));
  }
  const jobs = await session.ctx.iadPythonBridge.execute("knowledge_list", { dataset_id: dataset.dataset_id });
  const audits = await session.ctx.iadPythonBridge.execute("audit_list", { dataset_id: dataset.dataset_id });
  assert.equal(jobs.jobs.length, 2);
  assert.equal(audits.jobs.length, 1);
  assert.ok([...jobs.jobs, ...audits.jobs].every(job => job.status === "COMPLETED" && job.failed === 0));
  assert.ok([...jobs.jobs, ...audits.jobs].every(job => job.origin_session_id === session.handle.agent.id), "All jobs must retain the actual initiating Session");
  assert.equal(audits.jobs[0].completed, expectedCount);
  const report = trace.findLast(item => item.name === "dataset_report").result.value;
  assert.equal(report.vlm_audited_count, expectedCount);
  assert.equal(report.human_reviewed_count, 0);
  assert.equal(report.quality.scope.observed_inputs, expectedCount);
  assert.equal(report.quality.technical_usability.percent, 100);
  assert.equal(report.quality.audit_coverage.percent, 100);
  assert.equal(report.quality.human_verification_coverage.percent, 0);
  assert.equal(report.quality.model.unstructured_samples, 0);
  assert.deepEqual(report.quality.audit_run_ids, [audits.jobs[0].run_id]);
  assert.deepEqual(report.quality.knowledge_versions, [{ normal_version_id: audits.jobs[0].normal_version_id,
    defect_version_id: audits.jobs[0].defect_version_id, legacy_profile_id: null, sample_count: expectedCount }]);
  assert.ok(report.quality.technical_usability.basis && report.quality.scope.limitations.length);
  assert.ok(!Object.hasOwn(report.quality, "total_score") && !Object.hasOwn(report.quality, "accuracy"));
  if (workflowOnly) {
    const turns = session.handle.agent.session.snapshotEvents().filter(event => event.type === "turn/end");
    assert.equal(turns.length, 1);
    assert.equal(turns[0].data.reason.kind, "completed");
    await fs.writeFile(path.join(output, "result.json"), JSON.stringify({ verified: true, model,
      elapsed_ms: Date.now() - started, actual_tool_calls: trace.length, report, industrial_quality: "unassessed" }, null, 2));
    console.log(JSON.stringify({ verified: true, workflowOnly: true, actual_tool_calls: trace.length }));
  } else {
    const target = await session.ctx.iadPythonBridge.execute("sample_get", { sample_id: dataset.dataset_id + (folderMode ? ":NG/part-2.png" : ":part-2.png") });
    const beforeFollowup = trace.length;
    const roi = target.suggestion.analysis.regions[0].image;
    const finding = target.suggestion.analysis.findings.find(item => item.evidence_ids.includes(roi.evidence_id));
    const reference = { dataset_id: dataset.dataset_id, sample_id: target.sample.sample_id,
      suggestion_id: target.suggestion.suggestion_id, evidence_id: roi.evidence_id,
      ...(finding ? { finding_id: finding.finding_id } : {}) };
    session.handle.agent.followup(createUserMessage({ source: { kind: "user" }, content: [{ type: "text",
      text: `请先用 model_audit_context 解析本次冻结检视引用，再逐一打开返回清单的实际全图与 ROI 图像，结合图像解释需要关注的位置，不能只复述文本结论。冻结检视引用：${JSON.stringify(reference)}` }] }));
    await session.handle.agent.whenIdle();
    const followup = trace.slice(beforeFollowup);
    const context = followup.find(item => item.name === "model_audit_context");
    assert.ok(context && !context.result.isError, "Agent must resolve the exact frozen inspection reference");
    assert.equal(context.result.value.reference.suggestion_id, target.suggestion.suggestion_id);
    assert.equal(context.result.value.analysis.normal_version_id, target.suggestion.analysis.normal_version_id);
    assert.equal(context.result.value.origin_session_id, session.handle.agent.id);
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
    const beforeRevision = (await session.ctx.iadPythonBridge.execute("knowledge_get", { dataset_id: dataset.dataset_id, kind: "normal" })).knowledge;
    const proposal = { check_id: beforeRevision.checks[0].check_id,
      instruction: "均匀光照与亮度变化可能正常，须结合原图的位置和结构关系核验，不能仅凭亮度确定异常" };
    const revisionStart = trace.length;
    session.handle.agent.followup(createUserMessage({ source: { kind: "user" }, content: [{ type: "text", text:
      `请修订本数据集的良品判据。先用knowledge_get核对当前normal版本${beforeRevision.version_id}，将${JSON.stringify(proposal)}作为待核验corrections，明确base_version_id，不能直接当作事实。` +
      `调用knowledge_mine_normal重新看图核验，等待发布后继；再基于新良品版本挖掘不良品知识并等待完成，然后使用新版本审计本数据集全部${expectedCount}张图，最后读取质量报告。全部复用已有工具与真实作业，不改写原标注、人审或原始质量。` }] }));
    await session.handle.agent.whenIdle();
    const revisionTrace = trace.slice(revisionStart);
    assert.ok(revisionTrace.every(item => !item.result.isError), "Revision turn had a tool error");
    const proposedJob = revisionTrace.find(item => item.name === "knowledge_mine_normal");
    assert.ok(proposedJob, "Agent must submit the proposed correction through the real mining tool");
    assert.equal(proposedJob.arguments.base_version_id, beforeRevision.version_id);
    assert.deepEqual(proposedJob.arguments.corrections, [proposal]);
    const revised = (await session.ctx.iadPythonBridge.execute("knowledge_get", { dataset_id: dataset.dataset_id, kind: "normal" })).knowledge;
    assert.notEqual(revised.version_id, beforeRevision.version_id);
    assert.equal(revised.parent_version_id, beforeRevision.version_id);
    assert.deepEqual(revised.corrections, [proposal]);
    assert.deepEqual((await session.ctx.iadPythonBridge.execute("knowledge_get", { version_id: beforeRevision.version_id })).knowledge, beforeRevision);
    const revisedDefect = (await session.ctx.iadPythonBridge.execute("knowledge_get", { dataset_id: dataset.dataset_id, kind: "defect" })).knowledge;
    assert.equal(revisedDefect.normal_version_id, revised.version_id);
    const revisedJobs = await session.ctx.iadPythonBridge.execute("knowledge_list", { dataset_id: dataset.dataset_id });
    const revisedAudits = await session.ctx.iadPythonBridge.execute("audit_list", { dataset_id: dataset.dataset_id });
    const allJobs = [...revisedJobs.jobs, ...revisedAudits.jobs];
    assert.ok(allJobs.every(job => job.status === "COMPLETED" && job.failed === 0 && job.origin_session_id === session.handle.agent.id));
    assert.equal(revisedAudits.jobs[0].normal_version_id, revised.version_id);
    assert.equal(revisedAudits.jobs[0].defect_version_id, revisedDefect.version_id);
    assert.equal(revisedAudits.jobs[0].completed, expectedCount);
    const revisionReport = revisionTrace.findLast(item => item.name === "dataset_report")?.result.value;
    assert.ok(revisionReport, "Agent must report actual post-revision quality");
    assert.equal(revisionReport.human_reviewed_count, 0);
    assert.equal(revisionReport.quality.audit_coverage.percent, 100);
    const revisedSample = await session.ctx.iadPythonBridge.execute("sample_get", { sample_id: target.sample.sample_id });
    assert.deepEqual(revisedSample.annotations, target.annotations);
    assert.deepEqual(revisedSample.review_decision, target.review_decision);
    assert.equal(revisedSample.sample.quality_status, target.sample.quality_status);
    let sourceChangeReport;
    if (folderMode) {
      execFileSync(resolvePythonPath(), ["-c", "from PIL import Image, ImageEnhance; import sys; p=sys.argv[1]; im=Image.open(p).convert('RGB'); ImageEnhance.Brightness(im).enhance(0.96).save(p)", path.join(sourceRoot, "OK/batch/part-0.png")]);
      const start = trace.length;
      session.handle.agent.followup(createUserMessage({ source: { kind: "user" }, content: [{ type: "text", text:
        "OK/batch/part-0.png的图像内容已修改，目录角色不变。请复用原数据集先重新扫描，读取知识来源变化，再重新挖掘后继良品与不良品知识，使用新版本审计全部图像并读取最终质量报告。等待所有实际作业终态，不覆盖历史版本。" }] }));
      await session.handle.agent.whenIdle();
      const changed = trace.slice(start);
      assert.ok(changed.every(item => !item.result.isError));
      for (const name of ["dataset_rescan", "knowledge_get", "knowledge_mine_normal", "knowledge_mine_defect", "model_audit_start", "dataset_report"])
        assert.ok(changed.some(item => item.name === name), `Source change missing ${name}`);
      const current = (await session.ctx.iadPythonBridge.execute("knowledge_get", { dataset_id: dataset.dataset_id, kind: "normal" })).knowledge;
      assert.equal(current.parent_version_id, revised.version_id);
      sourceChangeReport = changed.findLast(item => item.name === "dataset_report").result.value;
      assert.equal(sourceChangeReport.quality.audit_coverage.percent, 100);
      assert.equal(sourceChangeReport.quality.label_comparison.source_changed_count, 0);
      assert.equal(sourceChangeReport.quality.label_comparison.source_unverified_count, 0);
      assert.equal(sourceChangeReport.total_samples, expectedCount);
    }
    const messages = session.handle.agent.session.deriveMessages();
    const turns = session.handle.agent.session.snapshotEvents().filter(event => event.type === "turn/end");
    assert.equal(turns.length, folderMode ? 4 : 3);
    assert.ok(turns.every(event => event.data.reason.kind === "completed"), "All actual Agent turns must finish without a model or tool error");
    assert.ok(messages.filter(message => message.role === "tool").flatMap(message => message.content).filter(block => block.type === "image").length >= 2);
    assert.ok(messages.some(message => message.role === "assistant" && message.content.some(block => block.type === "text" && block.text.length)));
    await fs.writeFile(path.join(output, "result.json"), JSON.stringify({ session_id: session.handle.agent.id, elapsed_ms: Date.now() - started,
      model, format: folderMode ? "folder_classification" : "labelme", report, source_change_report: sourceChangeReport, revision_report: revisionReport, revision: { parent_version_id: beforeRevision.version_id, version_id: revised.version_id, corrections: [proposal] },
      jobs: allJobs, actual_tool_calls: trace.length, industrial_quality: "unassessed",
      attachment_upload: archiveMode ? "actual DSH verbatim ZIP file attachment; browser upload not tested" : "not tested",
      sidebar_pages: "not tested", quality_score: "three factual dimensions with explicit counts, scope and frozen knowledge versions; no aggregate or accuracy", evidence_followup: "actual full-image and ROI attachments" }, null, 2));
    console.log(JSON.stringify({ verified: true, session_id: session.handle.agent.id, actual_tool_calls: trace.length, elapsed_ms: Date.now() - started }));
  }
} finally {
  clearTimeout(timeout);
  await fs.writeFile(path.join(output, "tool-trace.json"), JSON.stringify(trace, null, 2));
  await fs.writeFile(path.join(output, "session-events.json"), JSON.stringify(session.handle.agent.session.snapshotEvents(), null, 2));
  await session.dispose();
}
