import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { Context } from "@deepseek-ai/cordis";
import { createIadHttpHandler } from "../lib/server/routes/index.js";
import { IadRemoteService } from "../lib/server/remote/index.js";

test("DSH-05 / DSH-06 / DSH-07: Remote Service and HTTP Routes contract verification", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "iad-routes-test-"));
  const sampleThumbPath = path.join(tempDir, "sample_001_240.jpg");
  await fs.writeFile(sampleThumbPath, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]));

  const executed = [];
  const mockBridge = {
    cwd: tempDir,
    async execute(operation, args = {}) {
      executed.push({ operation, args });
      if (operation === "dataset_list") {
        return { datasets: [{ dataset_id: "dataset_demo", task_id: "task_demo", product: "demo_product", total_samples: 100 }] };
      }
      if (operation === "sample_list") {
        return {
          total: 100,
          page: args.page || 1,
          page_size: args.page_size || 24,
          items: [{ sample_id: "sample_001", quality_status: "UNCERTAIN" }],
        };
      }
      if (operation === "sample_thumbnail") {
        return {
          sample_id: args.sample_id,
          path: sampleThumbPath,
          media_type: "image/jpeg",
          cached: true,
        };
      }
      if (operation === "review_submit_decision") {
        return {
          session_id: args.session_id,
          sample_id: args.sample_id,
          decision: args.decision,
          status: "recorded",
        };
      }
      if (operation === "report_get") {
        return {
          task_id: args.task_id,
          total_samples: 100,
          vlm_audited_count: 80,
          vlm_coverage_pct: 80.0,
        };
      }
      return { status: "OK", args };
    },
  };

  // 1. Test IadRemoteService with genuine Cordis Context
  const ctx = new Context();
  const remoteService = new IadRemoteService(ctx, mockBridge);
  const taskList = await remoteService.datasetList({});
  assert.equal(taskList.datasets.length, 1);
  assert.equal(taskList.datasets[0].task_id, "task_demo");

  const sampleList = await remoteService.sampleList({ task_id: "task_demo", page: 1 });
  assert.equal(sampleList.items.length, 1);
  assert.equal(sampleList.items[0].sample_id, "sample_001");

  const report = await remoteService.reportGet({ task_id: "task_demo" });
  assert.equal(report.vlm_coverage_pct, 80.0);

  // 2. Test HTTP Handler (createIadHttpHandler)
  const handler = createIadHttpHandler(mockBridge);
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Test GET /api/iad/datasets
    const resTasks = await fetch(`${baseUrl}/api/iad/datasets`);
    assert.equal(resTasks.status, 200);
    const dataTasks = await resTasks.json();
    assert.equal(dataTasks.datasets[0].task_id, "task_demo");

    // Test GET /api/iad/samples/task_demo?page=2&page_size=10
    const resSamples = await fetch(`${baseUrl}/api/iad/samples/task_demo?page=2&page_size=10`);
    assert.equal(resSamples.status, 200);
    const dataSamples = await resSamples.json();
    assert.equal(dataSamples.page, 2);
    assert.equal(dataSamples.page_size, 10);

    // Test GET /api/iad/media/sample/task_demo/sample_001/thumbnail
    const resThumb = await fetch(`${baseUrl}/api/iad/media/sample/task_demo/sample_001/thumbnail`);
    assert.equal(resThumb.status, 200);
    assert.equal(resThumb.headers.get("content-type"), "image/jpeg");
    const thumbBytes = new Uint8Array(await resThumb.arrayBuffer());
    assert.equal(thumbBytes[0], 0xff);
    assert.equal(thumbBytes[1], 0xd8);

    // Test POST /api/iad/review/submit
    const resReview = await fetch(`${baseUrl}/api/iad/review/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: "sess_123",
        sample_id: "sample_001",
        decision: "PASS",
        reviewer: "auditor_alice",
      }),
    });
    assert.equal(resReview.status, 200);
    const dataReview = await resReview.json();
    assert.equal(dataReview.decision, "PASS");

    // Test GET /api/iad/report/task_demo
    const resReport = await fetch(`${baseUrl}/api/iad/report/task_demo`);
    assert.equal(resReport.status, 200);
    const dataReport = await resReport.json();
    assert.equal(dataReport.vlm_coverage_pct, 80.0);

    // Test 404 on unknown route
    const res404 = await fetch(`${baseUrl}/api/iad/non_existent_endpoint`);
    assert.equal(res404.status, 404);
  } finally {
    server.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
