import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { Context } from "@deepseek-ai/cordis";
import { SystemPrompt } from "@deepseek-ai/dsh-system-prompt";
import { ToolRuntime } from "@deepseek-ai/dsh-tools";
import { SkillRegistry } from "@deepseek-ai/dsh-skill";
import { LocalAttachmentStore } from "@deepseek-ai/dsh-attachment-local";
import * as harness from "../lib/server/index.js";
import { resolvePythonPath } from "../lib/server/python-bridge/index.js";

test("DSH discovers real eligible source references through the same paginated HTTP query", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-source-discovery-"));
  execFileSync(resolvePythonPath(), [fileURLToPath(new URL("fixtures/knowledge_dataset.py", import.meta.url)), root]);
  const ctx = new Context();
  new SystemPrompt(ctx, {}); new ToolRuntime(ctx); new SkillRegistry(ctx);
  new LocalAttachmentStore(ctx, { dshHome: path.join(root, "dsh") });
  const fork = await ctx.plugin(harness, { dbPath: path.join(root, "test.db") });
  const api = http.createServer(harness.createIadHttpHandler(ctx.iadPythonBridge));
  await new Promise(resolve => api.listen(0, "127.0.0.1", resolve));
  let call = 0;
  const execute = (name, args) => ctx.tools.execute({ name, arguments: args, callId: `sources-${++call}`, signal: new AbortController().signal });
  const query = async args => {
    const result = await execute("knowledge_sources", args);
    assert.equal(result.isError, false, JSON.stringify(result));
    return result.value;
  };
  try {
    const imported = await execute("dataset_import", { format: "labelme", name: "真实引用", image_dir: path.join(root, "images"), annotation_dir: path.join(root, "labels") });
    assert.equal(imported.isError, false, JSON.stringify(imported));
    const dataset_id = imported.value.dataset_id;
    const first = await query({ dataset_id, kind: "normal", page_size: 1 });
    assert.equal(first.total, 2);
    assert.equal(first.items.length, 1);
    assert.equal(first.items[0].relative_path, "part-0.png");
    assert.equal(first.items[0].qualification, "initial_unannotated");
    const second = await query({ dataset_id, kind: "normal", page: 2, page_size: 1 });
    assert.equal(second.items[0].relative_path, "part-1.png");
    assert.notEqual(second.items[0].sample_id, first.items[0].sample_id);
    const url = `http://127.0.0.1:${api.address().port}/api/iad/knowledge/sources?` + new URLSearchParams({ dataset_id, kind: "normal", page: "2", page_size: "1" });
    const response = await fetch(url);
    assert.equal(response.status, 200, await response.clone().text());
    assert.deepEqual(await response.json(), second);
    const filtered = await query({ dataset_id, kind: "normal", search: "part-1" });
    assert.equal(filtered.total, 1);
    assert.equal(filtered.items[0].sample_id, second.items[0].sample_id);
    assert.deepEqual((await query({ dataset_id, kind: "normal", page: 3, page_size: 1 })).items, []);
    const defects = await query({ dataset_id, kind: "defect" });
    assert.equal(defects.total, 1);
    assert.equal(defects.items[0].relative_path, "part-2.png");
    assert.equal(defects.items[0].qualification, "annotated_candidate");
    const review = await fetch(`http://127.0.0.1:${api.address().port}/api/iad/review/submit`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submission_id: randomUUID(),
        dataset_id, sample_id: first.items[0].sample_id, reviewer: "来源核验", decision: "FAIL" }),
    });
    assert.equal(review.status, 200, await review.clone().text());
    const afterReview = await query({ dataset_id, kind: "normal" });
    assert.equal(afterReview.total, 1);
    assert.equal(afterReview.items[0].sample_id, second.items[0].sample_id);
    assert.ok((await query({ dataset_id, kind: "defect" })).items.some(item => item.sample_id === first.items[0].sample_id && item.qualification === "human_fail"));
    assert.ok(harness.ALLOWED_TOOL_SURFACE.includes("knowledge_sources"));
    for (const args of [{ dataset_id, kind: "normal", page_size: 0 }, { dataset_id, kind: "normal", page_size: 201 },
      { dataset_id, kind: "normal", page: 0 }, { dataset_id, kind: "unknown" }]) {
      assert.equal((await execute("knowledge_sources", args)).isError, true);
    }
    for (const sample_ids of [undefined, [], ["part-0.png"], ["invented"]]) {
      const result = await execute("knowledge_mine_normal", { dataset_id, ...(sample_ids === undefined ? {} : { sample_ids }) });
      assert.equal(result.isError, true, "Missing or invalid selections must never fall back to every eligible source");
    }
    assert.deepEqual((await ctx.iadPythonBridge.execute("knowledge_list", { dataset_id })).jobs, []);
  } finally {
    await fork.dispose();
    await new Promise(resolve => api.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});
