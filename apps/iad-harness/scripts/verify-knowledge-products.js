import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import { createDatasetSession, resolveDatasetSessionModel, readDatasetSessionContext } from "../test/fixtures/dataset_session.js";
import { findWorkspaceRoot, resolvePythonPath } from "../lib/server/python-bridge/index.js";

assert.ok(process.env.LIVE_VLM_ENDPOINT && process.env.LIVE_VLM_KEY, "Configure LIVE_VLM_ENDPOINT and LIVE_VLM_KEY locally");
const workspace = findWorkspaceRoot();
const output = path.resolve(process.argv[2] || path.join(workspace, "runs/verification/knowledge-products", String(Date.now())));
await fs.mkdir(output, { recursive: true });
const resuming = process.argv[4] === "--resume";
if (!resuming) execFileSync(resolvePythonPath(), [path.join(workspace, "tests/product_corpus.py"), output]);
const corpus = JSON.parse(await fs.readFile(path.join(output, "casebook.json"), "utf8"));
const model = process.env.LIVE_VLM_MODEL || resolveDatasetSessionModel(workspace);
const endpoint = process.env.LIVE_VLM_ENDPOINT.replace(/\/chat\/completions\/?$/, "").replace(/\/$/, "");
const contextWindow = await readDatasetSessionContext({ endpoint, model, apiKeyEnv: "LIVE_VLM_KEY" });
const results = [];
const products = corpus.products.filter(product => !process.argv[3] || path.basename(product.root) === process.argv[3]);
assert.ok(products.length, "Select an actual synthetic corpus directory");
for (const product of products) {
  const root = path.join(output, path.basename(product.root) + "-session");
  await fs.mkdir(root, { recursive: true });
  const trace = resuming ? JSON.parse(await fs.readFile(path.join(root, "tool-trace.json"), "utf8")) : [];
  const seed = resuming ? JSON.parse(await fs.readFile(path.join(root, "session-events.json"), "utf8")) : undefined;
  const sessionId = trace.find(item => item.name === "knowledge_mine_normal" && !item.result.isError)?.result.value.origin_session_id;
  if (resuming) await fs.copyFile(path.join(output, "result.json"), path.join(output, `result-before-resume-${Date.now()}.json`));
  const session = await createDatasetSession({ root, dbPath: path.join(output, "verification.db"),
    endpoint, model, apiKeyEnv: "LIVE_VLM_KEY", contextWindow, seed, sessionId });
  const result = { form: product.form, session_id: session.handle.agent.id, cases: [], industrial_quality: "unassessed" };
  session.ctx.on("tools/result", async (exec, value) => {
    trace.push({ name: exec.name, arguments: exec.arguments, result: value });
    await fs.appendFile(path.join(root, "tool-trace.jsonl"), JSON.stringify(trace.at(-1)) + "\n");
    console.log(JSON.stringify({ product: path.basename(product.root), tool: exec.name, error: value.isError, status: value.value?.status }));
  });
  const timeoutMs = Number(process.env.IAD_LIVE_VERIFICATION_TIMEOUT_MS || 1800000);
  assert.ok(Number.isSafeInteger(timeoutMs) && timeoutMs > 0, "Verification timeout must be a positive integer");
  const deadline = setTimeout(() => session.handle.agent.cancel({ kind: "hook", reason: "Cross-product verification deadline" }), timeoutMs);
  try {
    session.handle.agent.followup(createUserMessage({ source: { kind: "user" }, content: [{ type: "text",
      text: resuming ? "继续原任务。此前作业已执行，请先核对实际报告与作业终态；已完成的知识和审计不要重跑，也不需要再逐张读取详情。请用简短中文回复技术可用率、审计覆盖率、人工核验覆盖率及主要限制，最多三个复核项。保留此前失败和恢复记录，不把模型结论当真值。" : `现在有一份数据集，在服务器 ${product.root}。请使用 analyze-dataset 技能完成接入、良品和不良品知识挖掘、全部图像模型审计，并评估此数据集的质量。两种知识均处理实际全部合格来源，每组最多20张，最后不足时按实际剩余；根据实际图像归纳产品知识；读取真实作业终态与报告，不能把标注当真值，也不能写人工裁决。` }] }));
    await session.handle.agent.whenIdle();
    result.tool_errors = trace.filter(item => item.result.isError);
    const turns = session.handle.agent.session.snapshotEvents().filter(event => event.type === "turn/end");
    if (!resuming) assert.equal(turns.length, 1);
    result.turn_outcomes = turns.map(turn => turn.data.reason.kind);
    assert.equal(turns.at(-1).data.reason.kind, "completed");
    for (const name of ["dataset_directory_inspect", "dataset_import", "knowledge_mine_normal", "knowledge_mine_defect", "model_audit_start", "dataset_report"]) {
      assert.ok(trace.some(item => item.name === name), `Actual Session did not execute ${name}`);
    }
    assert.ok(trace.some(item => item.name === "skill" && item.arguments.name === "analyze-dataset"));
    const dataset = trace.find(item => item.name === "dataset_import").result.value;
    assert.equal(dataset.image_dir, path.join(product.root, "images"));
    assert.equal(dataset.annotation_dir, path.join(product.root, "labels"));
    const query = (operation, args) => session.ctx.iadPythonBridge.execute(operation, args);
    const normal = (await query("knowledge_get", { dataset_id: dataset.dataset_id, kind: "normal" })).knowledge;
    const defect = (await query("knowledge_get", { dataset_id: dataset.dataset_id, kind: "defect" })).knowledge;
    result.dataset_id = dataset.dataset_id; result.normal = normal; result.defect = defect;
    const jobs = [...(await query("knowledge_list", { dataset_id: dataset.dataset_id })).jobs,
      ...(await query("audit_list", { dataset_id: dataset.dataset_id })).jobs];
    result.jobs = jobs;
    assert.ok(normal && defect, "Required knowledge was not published; inspect the recorded job failures");
    assert.equal(normal.dataset_id, dataset.dataset_id); assert.equal(defect.dataset_id, dataset.dataset_id);
    assert.equal(defect.normal_version_id, normal.version_id);
    assert.equal(normal.sources.length, 4, "All unannotated initial candidates, including contamination, must be observed");
    const roots = jobs.filter(job => job.run_id === job.root_run_id);
    assert.deepEqual(roots.map(job => job.job_type).sort(), ["DEFECT_KNOWLEDGE", "MODEL_AUDIT", "NORMAL_KNOWLEDGE"]);
    assert.ok(jobs.every(job => job.origin_session_id === session.handle.agent.id), "All attempts belong to the actual Session");
    assert.ok(jobs.every(job => !["PENDING", "RUNNING"].includes(job.status)), "No attempt is left running behind a completed report");
    for (const rootJob of roots) {
      const version = rootJob.job_type === "NORMAL_KNOWLEDGE" ? normal.version_id : rootJob.job_type === "DEFECT_KNOWLEDGE" ? defect.version_id : null;
      assert.ok(jobs.some(job => job.root_run_id === rootJob.run_id && job.status === "COMPLETED" && job.failed === 0
        && (!version || job.knowledge_version_id === version)), JSON.stringify(jobs));
    }
    for (const retry of jobs.filter(job => job.parent_run_id)) {
      const parent = jobs.find(job => job.run_id === retry.parent_run_id);
      assert.ok(parent && parent.root_run_id === retry.root_run_id && ["FAILED", "PARTIAL", "INTERRUPTED", "CANCELLED"].includes(parent.status));
      assert.ok(trace.some(item => ["knowledge_job_retry", "model_audit_retry"].includes(item.name)
        && item.arguments.run_id === parent.run_id && item.result.value?.run_id === retry.run_id), "Recovery must use the actual public retry tool");
    }
    result.failed_attempts = jobs.filter(job => ["FAILED", "PARTIAL"].includes(job.status)).map(job => ({ run_id: job.run_id, errors: job.errors }));
    const report = trace.findLast(item => item.name === "dataset_report").result.value;
    result.report = report;
    assert.equal(report.vlm_audited_count, 10); assert.equal(report.human_reviewed_count, 0);
    assert.equal(report.quality.audit_coverage.percent, 100);
    assert.equal(report.quality.model.unstructured_samples, 0);
    assert.ok(!Object.hasOwn(report.quality, "accuracy") && !Object.hasOwn(report.quality, "total_score"));
    for (const testCase of product.cases) {
      const sample_id = dataset.dataset_id + ":" + testCase.file;
      const detail = await query("sample_get", { sample_id });
      assert.equal(detail.review_decision, null);
      const analysis = detail.suggestion.analysis;
      result.cases.push({ ...testCase, sample_id, analysis });
      assert.equal(analysis.normal_version_id, normal.version_id);
      assert.equal(analysis.defect_version_id, defect.version_id);
      assert.ok(!analysis.reference_sample_ids.includes(sample_id), "A target cannot be its own normal comparison");
      const inputs = new Set(analysis.joint_steps.flatMap(step => step.input_evidence_ids));
      assert.ok(inputs.has(analysis.overview.evidence_id));
      assert.ok(analysis.coverage.complete && analysis.coverage.inspected_regions === analysis.regions.length);
      assert.ok(analysis.regions.every(region => inputs.has(region.image.evidence_id)));
      for (const image of [analysis.overview, ...analysis.regions.map(region => region.image), ...analysis.auxiliary_evidence]) {
        const media = await query("audit_evidence", { suggestion_id: detail.suggestion.suggestion_id, evidence_id: image.evidence_id });
        assert.equal(createHash("sha256").update(await fs.readFile(media.path)).digest("hex"), image.sha256);
      }
      if (testCase.condition === "masked_foreign_material") {
        const mask = analysis.auxiliary_evidence.find(image => image.representation === "annotation_mask");
        assert.ok(mask, "Actual Mask evidence must remain available");
        assert.deepEqual(mask.crop_bbox, [147, 181, 238, 316], "Each side expands by 20% of the pixel ROI dimensions");
      }
    }
    result.contaminated_source_findings = normal.findings.filter(finding => finding.sample_id.endsWith(":sample-03.png"));
    result.contaminated_source_detected = result.contaminated_source_findings.length > 0;
    result.verified = true;
  } catch (error) {
    result.verified = false; result.error = String(error);
    console.error(JSON.stringify({ product: product.form, error: result.error }));
  } finally {
    clearTimeout(deadline);
    await fs.writeFile(path.join(root, "tool-trace.json"), JSON.stringify(trace, null, 2));
    await fs.writeFile(path.join(root, "session-events.json"), JSON.stringify(session.handle.agent.session.snapshotEvents(), null, 2));
    await session.dispose();
    results.push(result);
    await fs.writeFile(path.join(output, "result.json"), JSON.stringify({ model, context_tokens: contextWindow, results, industrial_quality: "unassessed" }, null, 2));
  }
}
assert.ok(results.every(result => result.verified), JSON.stringify(results.map(({ form, verified, error }) => ({ form, verified, error }))));
if (results.length > 1) {
  assert.notEqual(results[0].dataset_id, results[1].dataset_id);
  assert.notDeepEqual(results[0].normal.checks.map(check => check.criterion), results[1].normal.checks.map(check => check.criterion), "Knowledge must describe different observed product structures");
}
console.log(JSON.stringify({ verified: true, products: results.length, samples: results.reduce((sum, result) => sum + result.cases.length, 0),
  failed_attempts: results.reduce((sum, result) => sum + result.failed_attempts.length, 0), output }));
