import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Context } from "@deepseek-ai/cordis";
import { SkillRegistry } from "@deepseek-ai/dsh-skill";
import { SystemPrompt } from "@deepseek-ai/dsh-system-prompt";
import { ToolRuntime } from "@deepseek-ai/dsh-tools";
import * as harness from "../lib/server/index.js";
import { resolvePythonPath } from "../lib/server/python-bridge/index.js";

test("DSH directory import and browser queries share one dataset and report", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-dataset-tools-"));
  execFileSync(resolvePythonPath(), [fileURLToPath(new URL("fixtures/knowledge_dataset.py", import.meta.url)), root]);
  const ctx = new Context();
  new SystemPrompt(ctx, {});
  new ToolRuntime(ctx);
  new SkillRegistry(ctx);
  const fork = await ctx.plugin(harness, { dbPath: path.join(root, "test.db") });
  const server = http.createServer(harness.createIadHttpHandler(ctx.iadPythonBridge));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/iad`;
  const execute = (name, args) => ctx.tools.execute({ name, arguments: args,
    callId: name, signal: new AbortController().signal });
  try {
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
    const { generated_at: reportTime, task_id: toolTask, ...toolReport } = report.value;
    const { generated_at: httpReportTime, task_id: browserTask, ...browserReport } = await (await fetch(`${base}/report/${dataset.task_id}?dataset_id=${dataset.dataset_id}`)).json();
    assert.ok(reportTime && httpReportTime);
    assert.equal(toolTask, null);
    assert.equal(browserTask, dataset.task_id);
    assert.deepEqual(toolReport, browserReport);
    const duplicate = await execute("dataset_import", { name: "不应重复导入", image_dir: path.join(root, "images"), annotation_dir: path.join(root, "labels") });
    assert.equal(duplicate.isError, true);
    assert.equal((await execute("dataset_list", {})).value.datasets.length, 1);
    for (const name of ["dataset_import", "dataset_list", "dataset_report"]) {
      assert.ok(harness.ALLOWED_TOOL_SURFACE.includes(name), `${name} must be visible in an Agent scope`);
    }
  } finally {
    await fork.dispose();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
  assert.equal(ctx.tools.get("dataset_import"), undefined);
});
