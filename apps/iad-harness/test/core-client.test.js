import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { CoreClient } from "../lib/server/core-client/index.js";

test("CoreClient: direct PythonBridge dispatch, image reading, security guards, and error handling", async () => {
  // Create a mock PythonBridge to verify contract without external dependencies
  const executedCalls = [];
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "iad-test-"));
  const samplePngPath = path.join(tempDir, "sample_001.png");
  // Write a valid PNG signature: 89 50 4E 47 0D 0A 1A 0A
  await fs.writeFile(samplePngPath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]));

  const mockBridge = {
    async execute(operation, args, signal) {
      executedCalls.push({ operation, args });
      if (operation === "tool_call") {
        if (args.tool_name === "task_inspect") {
          return {
            status: "OK",
            summary: "Inspection passed",
            metrics: { sample_count: 42 },
            artifacts: [],
            warnings: [],
            next_actions: [],
            mutation: "NONE",
          };
        }
        if (args.tool_name === "unknown_tool") {
          const err = new Error("Tool 'unknown_tool' is not registered");
          err.code = "TOOL_NOT_FOUND";
          throw err;
        }
      } else if (operation === "sample_image_path") {
        if (args.sample_id === "sample_001") {
          return {
            sample_id: "sample_001",
            path: samplePngPath,
            media_type: "image/png",
            exists: true,
          };
        }
        const err = new Error(`Sample '${args.sample_id}' not found`);
        err.code = "NOT_FOUND";
        throw err;
      }
      throw new Error(`Unhandled operation ${operation}`);
    },
  };

  const client = new CoreClient({ bridge: mockBridge });

  try {
    // 1. Successful tool dispatch
    const result = await client.call("task_inspect", { task_id: "demo_task" });
    assert.equal(result.status, "OK");
    assert.equal(result.metrics.sample_count, 42);
    assert.equal(executedCalls[0].operation, "tool_call");
    assert.deepEqual(executedCalls[0].args, {
      tool_name: "task_inspect",
      arguments: { task_id: "demo_task" },
    });

    // 2. Image bytes fetch and fetchImage with direct file reading and MIME detection
    const fetched = await client.fetchImage({ sampleId: "sample_001", view: "raw" });
    assert.equal(fetched.mediaType, "image/png");
    assert.equal(fetched.data[0], 0x89);
    assert.equal(fetched.data[1], 0x50);

    const bytes = await client.fetchImageBytes({ endpoint: "/internal/sample/sample_001/image" });
    assert.ok(bytes instanceof Uint8Array);
    assert.equal(bytes[0], 0x89);
    assert.equal(bytes[1], 0x50);

    // 3. Security boundary checks (DS-S15)
    await assert.rejects(
      async () => {
        await client.fetchImage({ endpoint: "http://malicious.com/exploit.png" });
      },
      /Security violation.*external or unauthorized/
    );

    await assert.rejects(
      async () => {
        await client.fetchImage({ endpoint: "/internal/sample/../../etc/passwd" });
      },
      /Security violation.*path traversal/
    );

    await assert.rejects(
      async () => {
        await client.fetchImage({ sampleId: "../secret.png" });
      },
      /Security violation.*path traversal/
    );

    // 4. Unknown tool and error handling
    await assert.rejects(
      async () => {
        await client.call("unknown_tool", {});
      },
      /CoreClient call failed for unknown_tool.*not registered/
    );
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
