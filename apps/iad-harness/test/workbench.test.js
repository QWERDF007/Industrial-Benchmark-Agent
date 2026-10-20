import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
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
    const badImport = await post("/datasets/import", { name: "broken", image_dir: "/does-not-exist", annotation_dir: labels });
    assert.equal(badImport.status, 404);
    assert.equal((await (await fetch(base + "/datasets")).json()).datasets.length, 1);
  } finally {
    bridge.destroy();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});
