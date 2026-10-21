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

for (const source of ["directory", "archive"]) test(`a real DSH Session imports a ${source} dataset and reads the shared report through allowed tools`, { timeout: 15000 }, async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-agent-session-"));
  execFileSync(resolvePythonPath(), [fileURLToPath(new URL("fixtures/knowledge_dataset.py", import.meta.url)), root]);
  const requests = [], trace = [];
  let rescanDataset = null, rescanStart = 0;
  const request = { format: "labelme", name: source === "directory" ? path.basename(root) : "会话测试部件", image_dir: path.join(root, "images"), annotation_dir: path.join(root, "labels") };
  const archived = source === "archive";
  const directoryPaths = archived ? [] : [root, request.image_dir, request.annotation_dir];
  const inspectionCount = archived ? 1 : directoryPaths.length;
  if (archived) {
    execFileSync(resolvePythonPath(), ["-c", `
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import sys
root = Path(sys.argv[1])
with ZipFile(root / 'dataset.zip', 'w', ZIP_DEFLATED) as archive:
    for directory in ('images', 'labels'):
        for item in (root / directory).rglob('*'):
            if item.is_file(): archive.write(item, 'product/' + item.relative_to(root).as_posix())
`, root]);
    request.image_dir = "product/images";
    request.annotation_dir = "product/labels";
  }
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString());
    requests.push(body);
    const tools = body.messages.filter(message => message.role === "tool");
    let delta, finish;
    if (rescanDataset) {
      const count = tools.length - rescanStart;
      if (count < 2) {
        delta = { role: "assistant", tool_calls: [{ index: 0, id: `rescan-${count}`, type: "function", function: {
          name: count === 0 ? "dataset_rescan" : "dataset_report", arguments: JSON.stringify({ dataset_id: rescanDataset.dataset_id }),
        } }] }; finish = "tool_calls";
      } else { delta = { role: "assistant", content: "已重新扫描目录，标注已更新；已有人工记录和历史结果保留。" }; finish = "stop"; }
    } else if (tools.length < inspectionCount) {
      delta = { role: "assistant", tool_calls: [{ index: 0, id: "inspect", type: "function", function: {
        name: archived ? "dataset_archive_inspect" : "dataset_directory_inspect",
        arguments: JSON.stringify(archived ? { archive_path: request.archive_path } : { path: directoryPaths[tools.length] }),
      } }] };
      finish = "tool_calls";
    } else if (tools.length === inspectionCount) {
      delta = { role: "assistant", tool_calls: [{ index: 0, id: "import", type: "function", function: { name: "dataset_import", arguments: JSON.stringify(request) } }] };
      finish = "tool_calls";
    } else if (tools.length === inspectionCount + 1) {
      const dataset = JSON.parse(tools.at(-1).content);
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
    const content = [{ type: "text", text: archived
      ? "导入附件数据集并查看报告，图像目录 product/images、Labelme 目录 product/labels，名称：会话测试部件。"
      : `导入服务器上的 ${root} 数据集并查看当前报告。` }];
    if (archived) {
      const attachment = await session.ctx.attachments.saveFile({ data: await fs.readFile(path.join(root, "dataset.zip")), name: "dataset.zip" });
      request.archive_path = session.ctx.attachments.fileHostPath(attachment);
      content.push({ type: "file", attachment });
    }
    session.handle.agent.followup(createUserMessage({ source: { kind: "user" }, content }));
    await session.handle.agent.whenIdle();
    assert.ok(trace.length, JSON.stringify(session.handle.agent.session.snapshotEvents().filter(event => /error|attempt|turn\/end/.test(event.type))));
    assert.deepEqual(trace.map(item => item.name), [...(archived ? ["dataset_archive_inspect"] : directoryPaths.map(() => "dataset_directory_inspect")), "dataset_import", "dataset_report"]);
    assert.ok(trace.every(item => item.result.isError === false));
    assert.equal(trace.at(-1).result.value.total_samples, 3);
    assert.equal(trace.at(-1).result.value.vlm_audited_count, 0);
    const messages = session.handle.agent.session.deriveMessages();
    assert.equal(messages.filter(item => item.role === "tool").length, inspectionCount + 2);
    if (!archived) {
      assert.deepEqual(trace[0].result.value.directories.map(item => item.name), ["images", "labels"]);
      assert.deepEqual(trace[1].result.value.file_counts, { ".png": 3 });
      assert.deepEqual(trace[2].result.value.file_counts, { ".json": 1 });
      assert.equal(trace[3].result.value.name, path.basename(root));
      const originalInput = requests[0].messages.filter(message => message.role === "user").map(message => message.content).join("\n");
      assert.ok(!originalInput.includes(request.image_dir) && !originalInput.includes(request.annotation_dir));
    }
    if (archived) {
      assert.ok(messages.some(item => item.content.some(block => block.type === "file")));
      const filePrompt = JSON.stringify(requests[0].messages.filter(message => message.role === "user"));
      assert.ok(filePrompt.includes(request.archive_path), filePrompt);
      assert.ok(trace[0].result.value.directories.some(item => item.path === "product/images" && item.image_count === 3));
      const imported = trace[1].result.value;
      assert.deepEqual(await fs.readFile(path.join(imported.image_dir, "part-2.png")), await fs.readFile(path.join(root, "images/part-2.png")));
      assert.deepEqual(await fs.readFile(path.join(imported.annotation_dir, "part-2.json")), await fs.readFile(path.join(root, "labels/part-2.json")));
      const sample = await session.ctx.iadPythonBridge.execute("sample_get", { sample_id: imported.dataset_id + ":part-2.png" });
      assert.equal(sample.annotations[0].raw_label, "待核实区域");
    }
    assert.ok(messages.some(item => item.role === "assistant" && item.content.some(block => block.type === "text" && block.text.includes("尚未开展"))));
    const names = requests[0].tools.map(tool => tool.function.name);
    assert.ok(names.includes("model_audit_start"));
    assert.ok(names.includes("knowledge_mine_normal"));
    assert.ok(!names.includes("review_submit_decision"));
    assert.ok(!names.includes("unrelated_test_tool"), "Agent-scoped policy must filter other registered tools");
    assert.match(requests[0].messages.filter(item => item.role === "system").map(item => item.content).join("\n"), /数据集分析流程/);
    if (!archived) {
      rescanDataset = trace.find(item => item.name === "dataset_import").result.value;
      rescanStart = requests.at(-1).messages.filter(message => message.role === "tool").length;
      const beforeRescan = trace.length;
      const labelPath = path.join(root, "labels/part-2.json");
      const label = JSON.parse(await fs.readFile(labelPath, "utf8")); label.shapes = [];
      await fs.writeFile(labelPath, JSON.stringify(label));
      session.handle.agent.followup(createUserMessage({ source: { kind: "user" }, content: [{ type: "text", text: "服务器目录里的标注已更新，请重新扫描原数据集，再查看质量报告。" }] }));
      await session.handle.agent.whenIdle();
      assert.deepEqual(trace.slice(beforeRescan).map(item => item.name), ["dataset_rescan", "dataset_report"]);
      assert.ok(trace.slice(beforeRescan).every(item => !item.result.isError));
      assert.equal(trace[beforeRescan].result.value.annotation_count, 0);
      assert.ok(requests.at(-1).tools.some(tool => tool.function.name === "dataset_rescan"));
      const sample = await session.ctx.iadPythonBridge.execute("sample_get", { sample_id: rescanDataset.dataset_id + ":part-2.png" });
      assert.deepEqual(sample.annotations, []);
      assert.equal((await session.ctx.iadPythonBridge.execute("dataset_list", {})).datasets.length, 1);
    }
  } finally {
    await session?.dispose();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    if (previousCredential === undefined) delete process.env.IAD_SESSION_TEST_CREDENTIAL;
    else process.env.IAD_SESSION_TEST_CREDENTIAL = previousCredential;
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("a real DSH Session previews, imports a folder classification dataset and reads the shared report", { timeout: 15000 }, async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-agent-folder-session-"));
  await fs.mkdir(path.join(root, "good"), { recursive: true });
  await fs.mkdir(path.join(root, "bad"), { recursive: true });
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=", "base64");
  await fs.writeFile(path.join(root, "good/part-1.png"), png);
  await fs.writeFile(path.join(root, "bad/part-2.png"), png);

  const requests = [], trace = [];
  let rescanDataset = null, rescanStart = 0;

  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString());
    requests.push(body);
    const tools = body.messages.filter(message => message.role === "tool");
    let delta, finish;

    if (rescanDataset) {
      const count = tools.length - rescanStart;
      if (count < 2) {
        delta = {
          role: "assistant",
          tool_calls: [{
            index: 0,
            id: `rescan-${count}`,
            type: "function",
            function: {
              name: count === 0 ? "dataset_rescan" : "dataset_report",
              arguments: JSON.stringify({ dataset_id: rescanDataset.dataset_id }),
            },
          }],
        };
        finish = "tool_calls";
      } else {
        delta = { role: "assistant", content: "已重新扫描目录，样本数已更新。" };
        finish = "stop";
      }
    } else if (tools.length === 0) {
      delta = {
        role: "assistant",
        tool_calls: [{
          index: 0,
          id: "preview",
          type: "function",
          function: { name: "dataset_preview", arguments: JSON.stringify({ root_dir: root }) },
        }],
      };
      finish = "tool_calls";
    } else if (tools.length === 1) {
      const preview = JSON.parse(tools[0].content);
      delta = {
        role: "assistant",
        tool_calls: [{
          index: 0,
          id: "import",
          type: "function",
          function: {
            name: "dataset_import",
            arguments: JSON.stringify({
              format: "folder_classification",
              name: path.basename(root),
              root_dir: root,
              rules: preview.items.map(({ path, role }) => ({ path, role })),
              preview_fingerprint: preview.preview_fingerprint,
            }),
          },
        }],
      };
      finish = "tool_calls";
    } else if (tools.length === 2) {
      const dataset = JSON.parse(tools[1].content);
      delta = {
        role: "assistant",
        tool_calls: [{
          index: 0,
          id: "report",
          type: "function",
          function: { name: "dataset_report", arguments: JSON.stringify({ dataset_id: dataset.dataset_id }) },
        }],
      };
      finish = "tool_calls";
    } else {
      delta = { role: "assistant", content: "已导入目录异常检测数据集，已登记2张图，包含1张良品和1张异常，尚未开展模型审计。" };
      finish = "stop";
    }

    res.writeHead(200, { "Content-Type": "text/event-stream" });
    for (const choice of [{ index: 0, delta, finish_reason: null }, { index: 0, delta: {}, finish_reason: finish }]) {
      res.write(`data: ${JSON.stringify({ id: "folder-session-response", object: "chat.completion.chunk", model: "test-agent", choices: [choice] })}\n\n`);
    }
    res.end("data: [DONE]\n\n");
  });

  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const previousCredential = process.env.IAD_SESSION_TEST_CREDENTIAL;
  process.env.IAD_SESSION_TEST_CREDENTIAL = "synthetic-test-credential";
  let session;
  try {
    session = await createDatasetSession({
      root: path.join(root, "dsh"),
      dbPath: path.join(root, "test.db"),
      endpoint: `http://127.0.0.1:${server.address().port}/v1`,
      model: "test-agent",
      apiKeyEnv: "IAD_SESSION_TEST_CREDENTIAL",
    });
    session.ctx.on("tools/result", (exec, result) => trace.push({ name: exec.name, result }));

    session.handle.agent.followup(createUserMessage({
      source: { kind: "user" },
      content: [{ type: "text", text: `导入服务器上的目录分类数据集 ${root} 并查看当前质量报告。` }],
    }));
    await session.handle.agent.whenIdle();

    assert.deepEqual(trace.map(item => item.name), ["dataset_preview", "dataset_import", "dataset_report"]);
    assert.ok(trace.every(item => item.result.isError === false));
    const imported = trace[1].result.value;
    assert.equal(imported.format, "folder_classification");
    assert.equal(imported.name, path.basename(root));

    const report = trace[2].result.value;
    assert.equal(report.total_samples, 2);
    assert.equal(report.quality.label_comparison.raw_ok, 1);
    assert.equal(report.quality.label_comparison.raw_ng, 1);
    assert.equal(report.quality.label_comparison.unaudited, 2);
    assert.equal(report.quality.label_comparison.inconsistency_ratio.denominator, 0);
    assert.equal(report.quality.label_comparison.inconsistency_ratio.percent, null);

    // Rescan followup
    rescanDataset = imported;
    rescanStart = requests.at(-1).messages.filter(message => message.role === "tool").length;
    const beforeRescan = trace.length;
    await fs.writeFile(path.join(root, "good/part-3.png"), png);

    session.handle.agent.followup(createUserMessage({
      source: { kind: "user" },
      content: [{ type: "text", text: "good 目录中新增了图片，请重新扫描原数据集并查看最新报告。" }],
    }));
    await session.handle.agent.whenIdle();

    assert.deepEqual(trace.slice(beforeRescan).map(item => item.name), ["dataset_rescan", "dataset_report"]);
    assert.ok(trace.slice(beforeRescan).every(item => !item.result.isError));
    const updatedReport = trace.at(-1).result.value;
    assert.equal(updatedReport.total_samples, 3);
    assert.equal(updatedReport.quality.label_comparison.raw_ok, 2);
    assert.equal(updatedReport.quality.label_comparison.raw_ng, 1);
  } finally {
    await session?.dispose();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    if (previousCredential === undefined) delete process.env.IAD_SESSION_TEST_CREDENTIAL;
    else process.env.IAD_SESSION_TEST_CREDENTIAL = previousCredential;
    await fs.rm(root, { recursive: true, force: true });
  }
});
