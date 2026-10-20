import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { resolvePythonPath } from "../lib/server/python-bridge/index.js";
import { createDatasetSession } from "./fixtures/dataset_session.js";

test("a real DSH Session imports a dataset and reads the shared report through allowed tools", { timeout: 15000 }, async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-agent-session-"));
  execFileSync(resolvePythonPath(), [fileURLToPath(new URL("fixtures/knowledge_dataset.py", import.meta.url)), root]);
  const requests = [], trace = [];
  const request = { name: "会话测试部件", image_dir: path.join(root, "images"), annotation_dir: path.join(root, "labels") };
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString());
    requests.push(body);
    const tools = body.messages.filter(message => message.role === "tool");
    let delta, finish;
    if (!tools.length) {
      delta = { role: "assistant", tool_calls: [{ index: 0, id: "import", type: "function", function: { name: "dataset_import", arguments: JSON.stringify(request) } }] };
      finish = "tool_calls";
    } else if (tools.length === 1) {
      const dataset = JSON.parse(tools[0].content);
      delta = { role: "assistant", tool_calls: [{ index: 0, id: "report", type: "function", function: { name: "dataset_report", arguments: JSON.stringify({ dataset_id: dataset.dataset_id }) } }] };
      finish = "tool_calls";
    } else {
      delta = { role: "assistant", content: "已导入3张图，尚未开展模型审计或人工复核。" };
      finish = "stop";
    }
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    for (const choice of [{ index: 0, delta, finish_reason: null }, { index: 0, delta: {}, finish_reason: finish }]) {
      res.write(`data: ${JSON.stringify({ id: "session-response", object: "chat.completion.chunk", model: "test-agent", choices: [choice] })}\n\n`);
    }
    res.end("data: [DONE]\n\n");
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const previousCredential = process.env.IAD_SESSION_TEST_CREDENTIAL;
  process.env.IAD_SESSION_TEST_CREDENTIAL = "synthetic-test-credential";
  let session;
  try {
    session = await createDatasetSession({ root: path.join(root, "dsh"), dbPath: path.join(root, "test.db"),
      endpoint: `http://127.0.0.1:${server.address().port}/v1`, model: "test-agent", apiKeyEnv: "IAD_SESSION_TEST_CREDENTIAL" });
    session.ctx.on("tools/result", (exec, result) => trace.push({ name: exec.name, result }));
    session.ctx.tools.register(defineTool({ name: "unrelated_test_tool", description: "Outside the IAD Agent tool surface",
      parameters: {}, output: { schema: { type: "json" }, render: () => [] }, execute: () => ({}) }));
    session.handle.agent.followup(createUserMessage({ source: { kind: "user" },
      content: [{ type: "text", text: `导入这份数据集并查看当前报告：${JSON.stringify(request)}` }] }));
    await session.handle.agent.whenIdle();
    assert.ok(trace.length, JSON.stringify(session.handle.agent.session.snapshotEvents().filter(event => /error|attempt|turn\/end/.test(event.type))));
    assert.deepEqual(trace.map(item => item.name), ["dataset_import", "dataset_report"]);
    assert.ok(trace.every(item => item.result.isError === false));
    assert.equal(trace[1].result.value.total_samples, 3);
    assert.equal(trace[1].result.value.vlm_audited_count, 0);
    const messages = session.handle.agent.session.deriveMessages();
    assert.equal(messages.filter(item => item.role === "tool").length, 2);
    assert.ok(messages.some(item => item.role === "assistant" && item.content.some(block => block.type === "text" && block.text.includes("尚未开展"))));
    const names = requests[0].tools.map(tool => tool.function.name);
    assert.ok(names.includes("model_audit_start"));
    assert.ok(names.includes("knowledge_mine_normal"));
    assert.ok(!names.includes("review_submit_decision"));
    assert.ok(!names.includes("unrelated_test_tool"), "Agent-scoped policy must filter other registered tools");
    assert.match(requests[0].messages.filter(item => item.role === "system").map(item => item.content).join("\n"), /数据集分析流程/);
  } finally {
    await session?.dispose();
    await new Promise(resolve => server.close(resolve));
    if (previousCredential === undefined) delete process.env.IAD_SESSION_TEST_CREDENTIAL;
    else process.env.IAD_SESSION_TEST_CREDENTIAL = previousCredential;
    await fs.rm(root, { recursive: true, force: true });
  }
});
