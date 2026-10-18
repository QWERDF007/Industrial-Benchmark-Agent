import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { CoreClient } from "../lib/server/core-client/index.js";

test("CoreClient: successful tool dispatch and error handling", async () => {
  // Create a minimal mock HTTP server
  let lastRequest = null;
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      lastRequest = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: body ? JSON.parse(body) : null,
      };

      if (req.url === "/internal/tool/task_inspect") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          status: "OK",
          summary: "Inspection passed",
          metrics: { sample_count: 42 },
          artifacts: [],
          warnings: [],
          next_actions: [],
          mutation: "NONE",
        }));
      } else if (req.url === "/internal/sample/sample_001/image?view=raw") {
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])); // PNG header
      } else if (req.url === "/internal/tool/unknown_tool") {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ detail: "Tool 'unknown_tool' is not registered" }));
      } else {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ detail: "Server error" }));
      }
    });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const client = new CoreClient({ domainServerUrl: `http://127.0.0.1:${port}` });

  try {
    // 1. Successful tool dispatch
    const result = await client.call("task_inspect", { task_id: "demo_task" });
    assert.equal(result.status, "OK");
    assert.equal(result.metrics.sample_count, 42);
    assert.equal(lastRequest.method, "POST");
    assert.equal(lastRequest.url, "/internal/tool/task_inspect");
    assert.deepEqual(lastRequest.body, { task_id: "demo_task" });

    // 2. Image bytes fetch
    const bytes = await client.fetchImageBytes({ sampleId: "sample_001", view: "raw" });
    assert.ok(bytes instanceof Uint8Array);
    assert.equal(bytes[0], 0x89);
    assert.equal(bytes[1], 0x50);

    // 3. 404 error handling
    await assert.rejects(
      async () => {
        await client.call("unknown_tool", {});
      },
      /CoreClient call failed for unknown_tool.*404/
    );
  } finally {
    server.close();
  }
});
