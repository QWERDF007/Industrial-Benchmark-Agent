import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Context } from "@deepseek-ai/cordis";
import { SystemPrompt } from "@deepseek-ai/dsh-system-prompt";
import { ToolRuntime } from "@deepseek-ai/dsh-tools";
import { SkillRegistry } from "@deepseek-ai/dsh-skill";
import { LocalAttachmentStore } from "@deepseek-ai/dsh-attachment-local";
import * as harness from "../lib/server/index.js";
import { resolvePythonPath } from "../lib/server/python-bridge/index.js";

test("DSH reads the same selected general and dataset directions saved in the workbench", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-mining-prompt-"));
  execFileSync(resolvePythonPath(), [fileURLToPath(new URL("fixtures/knowledge_dataset.py", import.meta.url)), root]);
  const ctx = new Context();
  new SystemPrompt(ctx, {}); new ToolRuntime(ctx); new SkillRegistry(ctx);
  new LocalAttachmentStore(ctx, { dshHome: path.join(root, "dsh") });
  const fork = await ctx.plugin(harness, { dbPath: path.join(root, "test.db") });
  const api = http.createServer(harness.createIadHttpHandler(ctx.iadPythonBridge));
  await new Promise(resolve => api.listen(0, "127.0.0.1", resolve));
  let count = 0;
  const execute = (name, args) => ctx.tools.execute({ name, arguments: args, callId: `prompt-${++count}`, signal: new AbortController().signal });
  try {
    const imported = await execute("dataset_import", { format: "labelme", name: "孔板", image_dir: path.join(root, "images"), annotation_dir: path.join(root, "labels") });
    assert.equal(imported.isError, false);
    const dataset_id = imported.value.dataset_id;
    const original = await execute("knowledge_prompt_get", { dataset_id, kind: "normal" });
    assert.equal(original.isError, false, JSON.stringify(original));
    assert.ok(original.value.configuration.directions.some(item => item.origin === "preset" && item.title === "装配与配合"));
    const configuration = { objective: "只检查孔内背景", directions: [
      { direction_id: "coating", title: "颜色与覆盖层", instruction: "不加入本次分析", enabled: false, origin: "preset" },
      { direction_id: "dataset-hole", title: "孔内背景", instruction: "检查孔内可见背景与遮挡", enabled: true, origin: "dataset" },
    ] };
    const url = `http://127.0.0.1:${api.address().port}/api/iad/knowledge/prompt`;
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id, kind: "normal", expected_revision: original.value.revision, configuration }) });
    assert.equal(response.status, 200, await response.clone().text());
    const saved = await response.json();
    const agent = await execute("knowledge_prompt_get", { dataset_id, kind: "normal" });
    assert.equal(agent.isError, false);
    assert.deepEqual(agent.value, saved);
    const rendered = JSON.parse(agent.content[0].text);
    assert.equal(rendered.configuration, undefined, '模型上下文不重复展开实际提示词和全部方向说明');
    assert.equal(rendered.disabled_direction_count, 1);
    assert.deepEqual(rendered.selected_directions.map(item => item.title), ['孔内背景']);
    assert.deepEqual(saved.configuration, configuration);
    assert.match(saved.instruction, /孔内背景/);
    assert.doesNotMatch(saved.instruction, /颜色与覆盖层|柔性部件/);
    const refreshed = await fetch(url + "?" + new URLSearchParams({ dataset_id, kind: "normal" }));
    assert.deepEqual(await refreshed.json(), saved);
    assert.equal((await execute("knowledge_prompt_get", { dataset_id, kind: "defect" })).value.customized, false);
    assert.ok(harness.ALLOWED_TOOL_SURFACE.includes("knowledge_prompt_get"));
    assert.deepEqual((await ctx.iadPythonBridge.execute("knowledge_list", { dataset_id })).jobs, []);
  } finally {
    await fork.dispose();
    await new Promise(resolve => api.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});
