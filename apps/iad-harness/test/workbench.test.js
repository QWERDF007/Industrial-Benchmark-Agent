import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { PythonBridge, createIadHttpHandler } from "../lib/server/index.js";

test("real bridge: Labelme import, composed filters and human session submission", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-workbench-"));
  const images = path.join(root, "images"), labels = path.join(root, "labels");
  await fs.mkdir(images); await fs.mkdir(labels);
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=", "base64");
  await fs.writeFile(path.join(images, "good.png"), png);
  const bridge = new PythonBridge({ cwd: process.cwd().endsWith("iad-harness") ? path.resolve("../..") : process.cwd(), dbPath: path.join(root, "test.db") });
  const server = http.createServer(createIadHttpHandler(bridge));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/iad`;
  const post = (url, body) => fetch(base + url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  try {
    const imported = await post("/datasets/import", { name: "Test dataset", image_dir: images, annotation_dir: labels });
    assert.equal(imported.status, 200, await imported.clone().text());
    const dataset = await imported.json();
    const response = await fetch(`${base}/samples/${dataset.task_id}?dataset_id=${dataset.dataset_id}&annotation_filters=${encodeURIComponent(JSON.stringify(["none"]))}`);
    const samples = await response.json();
    assert.equal(samples.total, 1);
    const sessionResponse = await post("/review/session", { task_id: dataset.task_id, dataset_id: dataset.dataset_id, reviewer: "alice" });
    const session = await sessionResponse.json();
    const decision = await post("/review/submit", { session_id: session.session_id, sample_id: samples.items[0].sample_id, decision: "PASS", comment: "human confirmed" });
    assert.equal(decision.status, 200, await decision.clone().text());
    const invalid = await post("/review/submit", { session_id: "invented", sample_id: samples.items[0].sample_id, decision: "PASS" });
    assert.equal(invalid.status, 404);
    const detail = await (await fetch(`${base}/sample/${encodeURIComponent(samples.items[0].sample_id)}`)).json();
    assert.equal(detail.sample.quality_status, "UNCERTAIN");
    assert.equal(detail.review_decision.decision, "PASS");
    const report = await (await fetch(`${base}/report/${dataset.task_id}?dataset_id=${dataset.dataset_id}`)).json();
    assert.equal(report.quality.technical_usability.percent, 100);
    assert.equal(report.quality.human_verification_coverage.percent, 100);
    assert.equal(report.quality.audit_coverage.percent, 0);
    const badImport = await post("/datasets/import", { name: "broken", image_dir: "/does-not-exist", annotation_dir: labels });
    assert.equal(badImport.status, 404);
    assert.equal((await (await fetch(base + "/datasets")).json()).datasets.length, 1);
  } finally {
    bridge.destroy();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("real bridge: normal mining publishes knowledge and serves its actual visual evidence", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-knowledge-"));
  const images = path.join(root, "images"), labels = path.join(root, "labels");
  await fs.mkdir(images); await fs.mkdir(labels);
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=", "base64");
  await fs.writeFile(path.join(images, "candidate.png"), png);
  let visualEvidence;
  const modelRequests = [];
  const model = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const requestBody = Buffer.concat(chunks).toString();
    modelRequests.push(requestBody);
    const body = JSON.parse(requestBody);
    const content = body.messages[0].content;
    const text = content.find(item => item.type === "text" && item.text.startsWith("视觉证据："));
    visualEvidence = JSON.parse(text.text.slice("视觉证据：".length));
    const response = req.url === "/tokenize" ? { count: 1000, max_model_len: 262144 } : {
      choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
        summary: "该来源无法支持结构判据", checks: [], suspects: [], limitations: ["输入仅一个像素"],
      }) } }],
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response));
  });
  await new Promise(resolve => model.listen(0, "127.0.0.1", resolve));
  const previousEndpoint = process.env.LIVE_VLM_ENDPOINT;
  process.env.LIVE_VLM_ENDPOINT = `http://127.0.0.1:${model.address().port}/v1`;
  const bridge = new PythonBridge({ cwd: process.cwd().endsWith("iad-harness") ? path.resolve("../..") : process.cwd(), dbPath: path.join(root, "test.db") });
  const server = http.createServer(createIadHttpHandler(bridge));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/iad`;
  const post = (url, body) => fetch(base + url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  try {
    const imported = await post("/datasets/import", { name: "Knowledge inputs", image_dir: images, annotation_dir: labels });
    assert.equal(imported.status, 200, await imported.clone().text());
    const dataset = await imported.json();
    const initial = await fetch(`${base}/knowledge?dataset_id=${dataset.dataset_id}&kind=normal`);
    assert.equal(initial.status, 200, await initial.clone().text());
    assert.equal((await initial.json()).knowledge, null);
    const started = await post("/knowledge/start", { dataset_id: dataset.dataset_id, kind: "normal", model_name: "test-mllm" });
    assert.equal(started.status, 200, await started.clone().text());
    let job = await started.json();
    const deadline = Date.now() + 5000;
    while (["PENDING", "RUNNING"].includes(job.status) && Date.now() < deadline) {
      await delay(20);
      job = await (await fetch(`${base}/knowledge/status/${job.run_id}`)).json();
    }
    assert.equal(job.status, "COMPLETED", JSON.stringify(job));
    assert.equal(job.completed, 1);
    assert.deepEqual(job.model_calls.map(call => call.operation), ["tokenize", "generate"]);
    for (const [index, call] of job.model_calls.entries()) {
      const response = await fetch(`${base}/jobs/${job.run_id}/model-calls/${call.call_id}`);
      assert.equal(response.status, 200, await response.clone().text());
      const detail = await response.json();
      assert.equal(detail.request_body, modelRequests[index]);
      assert.equal(detail.http_status, 200);
      assert.equal(detail.usage, null);
      assert.ok(detail.response_body);
    }
    assert.equal((await fetch(`${base}/jobs/not-this-job/model-calls/${job.model_calls[0].call_id}`)).status, 404);
    const knowledge = (await (await fetch(`${base}/knowledge?version_id=${job.knowledge_version_id}`)).json()).knowledge;
    assert.equal(knowledge.summary, "该来源无法支持结构判据");
    assert.equal(knowledge.sources.length, 1);
    const evidence = await fetch(`${base}/knowledge/evidence/${knowledge.version_id}/${visualEvidence.evidence_id}`);
    assert.equal(evidence.status, 200, await evidence.clone().text());
    assert.equal(evidence.headers.get("content-type"), "image/png");
    assert.deepEqual(Buffer.from(await evidence.arrayBuffer()).subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jobs = await (await fetch(`${base}/knowledge/jobs?dataset_id=${dataset.dataset_id}`)).json();
    assert.equal(jobs.jobs[0].run_id, job.run_id);
    const missing = await fetch(`${base}/knowledge/evidence/${knowledge.version_id}/invented`);
    assert.equal(missing.status, 404);
  } finally {
    bridge.destroy();
    if (previousEndpoint === undefined) delete process.env.LIVE_VLM_ENDPOINT;
    else process.env.LIVE_VLM_ENDPOINT = previousEndpoint;
    await new Promise(resolve => server.close(resolve));
    await new Promise(resolve => model.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});
