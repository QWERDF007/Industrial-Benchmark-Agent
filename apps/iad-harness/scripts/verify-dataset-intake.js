import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import { createDatasetSession } from "../test/fixtures/dataset_session.js";
import { findWorkspaceRoot, resolvePythonPath } from "../lib/server/python-bridge/index.js";

assert.ok(process.env.LIVE_VLM_ENDPOINT && process.env.LIVE_VLM_KEY, "Configure local model environment");
const workspace = findWorkspaceRoot();
const output = path.resolve(process.argv[2] || path.join(workspace, "runs/verification/intake", String(Date.now())));
await fs.mkdir(output, { recursive: true });
execFileSync(resolvePythonPath(), [path.join(workspace, "apps/iad-harness/test/fixtures/knowledge_dataset.py"), output]);
const model = execFileSync(resolvePythonPath(), ["-c", "from iad_core.workbench.vision import DEFAULT_MODEL;print(DEFAULT_MODEL)"],
  { cwd: workspace, env: { ...process.env, PYTHONPATH: path.join(workspace, "python") }, encoding: "utf8" }).trim();
const cases = [
  { name: "custom", directories: ["来源甲", "来源乙"], prompt: "这是目录图像级格式。来源甲明确为良品，来源乙明确为异常。请直接预览、按这两个规则导入并读取当前质量报告；这次不用挖掘或审计。", expected: 2 },
  { name: "normal-only", directories: ["OK", "OK"], prompt: "这是目录图像级格式。请挖掘可用知识、审计全部图像并读取质量报告，无合格异常来源应跳过不良知识。", expected: 2 },
  { name: "anomaly-only", directories: ["NG", "NG"], prompt: "这是目录图像级格式。请接入、挖掘知识、审计并读取质量报告，缺少合格良品来源时不要虚构知识，应说明缺口。", expected: 2 },
  { name: "ambiguous", directories: ["OK", "images"], prompt: "请检查并接入这份数据集。", ambiguous: true },
];
const results = [];
const selectedCases = cases.filter(scenario => !process.argv[3] || scenario.name === process.argv[3]);
assert.ok(selectedCases.length, "Unknown intake scenario");
for (const scenario of selectedCases) {
  const base = path.join(output, scenario.name), root = path.join(base, "dataset");
  for (const [index, directory] of scenario.directories.entries()) {
    await fs.mkdir(path.join(root, directory), { recursive: true });
    await fs.copyFile(path.join(output, "images", `part-${scenario.name === "custom" && index === 1 ? 2 : index}.png`), path.join(root, directory, `sample-${index}.png`));
  }
  if (scenario.ambiguous) {
    await fs.mkdir(path.join(root, "labels"));
    await fs.copyFile(path.join(output, "labels/part-2.json"), path.join(root, "labels/sample-1.json"));
  }
  const session = await createDatasetSession({ root: path.join(base, "dsh"), dbPath: path.join(base, "test.db"),
    endpoint: process.env.LIVE_VLM_ENDPOINT.replace(/\/chat\/completions\/?$/, "").replace(/\/$/, ""), model, apiKeyEnv: "LIVE_VLM_KEY" });
  const trace = [];
  session.ctx.on("tools/result", (exec, result) => {
    trace.push({ name: exec.name, arguments: exec.arguments, result });
    console.log(JSON.stringify({ case: scenario.name, tool: exec.name, isError: result.isError, status: result.value?.status }));
  });
  const timer = setTimeout(() => session.handle.agent.cancel({ kind: "hook", reason: "Intake verification deadline" }), 480000);
  try {
    session.handle.agent.followup(createUserMessage({ source: { kind: "user" }, content: [{ type: "text", text: `服务器数据集目录是 ${root}。${scenario.prompt}` }] }));
    await session.handle.agent.whenIdle();
    assert.ok(trace.every(item => !item.result.isError), `${scenario.name}: no hidden tool errors`);
    const turns = session.handle.agent.session.snapshotEvents().filter(event => event.type === "turn/end");
    assert.ok(turns.length && turns.every(event => event.data.reason.kind === "completed"));
    const imports = trace.filter(item => item.name === "dataset_import");
    if (scenario.ambiguous) {
      assert.equal(imports.length, 0, "两种合理格式必须先澄清，不任意导入");
      const reply = session.handle.agent.session.deriveMessages().filter(message => message.role === "assistant")
        .flatMap(message => message.content).filter(item => item.type === "text").map(item => item.text).join("\n");
      assert.match(reply, /[？?]|选择|确认|格式/);
      results.push({ name: scenario.name, outcome: "format clarification", reply });
    } else {
      assert.equal(imports.length, 1);
      assert.equal(imports[0].result.value.format, "folder_classification");
      assert.ok(imports[0].arguments.preview_fingerprint && imports[0].arguments.rules.length);
      const report = trace.findLast(item => item.name === "dataset_report")?.result.value;
      assert.ok(report);
      assert.equal(report.total_samples, scenario.expected);
      if (scenario.name === "custom") {
        assert.equal(report.quality.label_comparison.raw_ok, 1);
        assert.equal(report.quality.label_comparison.raw_ng, 1);
      } else if (scenario.name === "normal-only") {
        assert.ok(trace.some(item => item.name === "knowledge_mine_normal"));
        assert.ok(trace.some(item => item.name === "model_audit_start"));
        assert.ok(!trace.some(item => item.name === "knowledge_mine_defect"));
        assert.equal(report.quality.audit_coverage.percent, 100);
      } else {
        assert.ok(!trace.some(item => ["knowledge_mine_normal", "knowledge_mine_defect", "model_audit_start"].includes(item.name)));
        assert.equal(report.quality.audit_coverage.percent, 0);
      }
      results.push({ name: scenario.name, report });
    }
  } finally {
    clearTimeout(timer);
    await fs.writeFile(path.join(base, "trace.json"), JSON.stringify(trace, null, 2));
    await fs.writeFile(path.join(base, "events.json"), JSON.stringify(session.handle.agent.session.snapshotEvents(), null, 2));
    await session.dispose();
  }
}
await fs.writeFile(path.join(output, "result.json"), JSON.stringify({ verified: true, results, industrial_quality: "unassessed" }, null, 2));
console.log(JSON.stringify({ verified: true, cases: results.map(item => item.name) }));
