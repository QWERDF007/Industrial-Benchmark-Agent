import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import { createDatasetSession, resolveDatasetSessionModel } from "../test/fixtures/dataset_session.js";
import { findWorkspaceRoot, resolvePythonPath } from "../lib/server/python-bridge/index.js";

assert.ok(process.env.LIVE_VLM_ENDPOINT && process.env.LIVE_VLM_KEY, "Configure the local model environment");
const workspace = findWorkspaceRoot();
const output = path.resolve(process.argv[2] || path.join(workspace, "runs/verification/import-scope", String(Date.now())));
const attempts = Number(process.argv[3] || 3);
assert.ok(Number.isInteger(attempts) && attempts > 0);
const model = resolveDatasetSessionModel(workspace);
assert.ok(model, "A configured Agent model is required");
await fs.mkdir(output, { recursive: true });
execFileSync(resolvePythonPath(), [path.join(workspace, "apps/iad-harness/test/fixtures/knowledge_dataset.py"), output]);
const results = [];
for (let attempt = 1; attempt <= attempts; attempt++) {
  const root = path.join(output, `attempt-${attempt}`), datasetRoot = path.join(root, "dataset");
  for (const [directory, filename] of [["OK", "part-0.png"], ["NG", "part-2.png"]]) {
    await fs.mkdir(path.join(datasetRoot, directory), { recursive: true });
    await fs.copyFile(path.join(output, "images", filename), path.join(datasetRoot, directory, filename));
  }
  const session = await createDatasetSession({ root: path.join(root, "dsh"), dbPath: path.join(root, "test.db"),
    endpoint: process.env.LIVE_VLM_ENDPOINT.replace(/\/chat\/completions\/?$/, "").replace(/\/$/, ""),
    model, apiKeyEnv: "LIVE_VLM_KEY" });
  const trace = [], violations = [];
  const allowed = new Set(["dataset_list", "dataset_directory_inspect", "dataset_preview", "dataset_import", "dataset_report"]);
  // A failed scope check must never start an unwanted model job, even in the isolated fixture.
  session.handle.agent.ctx.tools.guard(exec => {
    if (allowed.has(exec.name)) return;
    violations.push({ name: exec.name, arguments: exec.arguments });
    session.handle.agent.cancel({ kind: "hook", reason: "Import-only scope violation" });
    return "Import-only verification: this action was not requested";
  });
  session.ctx.on("tools/result", (exec, result) => {
    trace.push({ name: exec.name, arguments: exec.arguments, result });
    console.log(JSON.stringify({ attempt, tool: exec.name, isError: result.isError }));
  });
  const timer = setTimeout(() => session.handle.agent.cancel({ kind: "hook", reason: "Import verification deadline" }), 120000);
  try {
    session.handle.agent.followup(createUserMessage({ source: { kind: "user" }, content: [{ type: "text", text: `导入 ${datasetRoot}` }] }));
    await session.handle.agent.whenIdle();
    assert.deepEqual(violations, [], "A bare import must not expand into knowledge mining or auditing");
    assert.ok(trace.every(item => !item.result.isError), "Import tools must complete without hidden errors");
    const imports = trace.filter(item => item.name === "dataset_import");
    assert.equal(imports.length, 1);
    const dataset = imports[0].result.value;
    const knowledge = await session.ctx.iadPythonBridge.execute("knowledge_list", { dataset_id: dataset.dataset_id });
    const audits = await session.ctx.iadPythonBridge.execute("audit_list", { dataset_id: dataset.dataset_id });
    assert.deepEqual(knowledge.jobs, []);
    assert.deepEqual(audits.jobs, []);
    const turns = session.handle.agent.session.snapshotEvents().filter(event => event.type === "turn/end");
    assert.equal(turns.length, 1);
    assert.equal(turns[0].data.reason.kind, "completed");
    results.push({ attempt, dataset_id: dataset.dataset_id, tools: trace.map(item => item.name) });
  } finally {
    clearTimeout(timer);
    await fs.writeFile(path.join(root, "trace.json"), JSON.stringify({ trace, violations }, null, 2));
    await fs.writeFile(path.join(root, "events.json"), JSON.stringify(session.handle.agent.session.snapshotEvents(), null, 2));
    await session.dispose();
  }
}
await fs.writeFile(path.join(output, "result.json"), JSON.stringify({ verified: true, model, results }, null, 2));
console.log(JSON.stringify({ verified: true, attempts, model }));
