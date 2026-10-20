import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Context } from "@deepseek-ai/cordis";
import { SkillRegistry } from "@deepseek-ai/dsh-skill";
import { SystemPrompt } from "@deepseek-ai/dsh-system-prompt";
import { ToolRuntime } from "@deepseek-ai/dsh-tools";
import { LocalAttachmentStore } from "@deepseek-ai/dsh-attachment-local";
import * as skillTool from "@deepseek-ai/dsh-tool-skill";
import * as harness from "../lib/server/index.js";

test("Industrial Harness Plugin exposes the allowed native tools and its authoritative policies", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-plugin-"));
  const ctx = new Context();
  new SystemPrompt(ctx, {});
  new ToolRuntime(ctx);
  new SkillRegistry(ctx);
  new LocalAttachmentStore(ctx, { dshHome: root });
  skillTool.apply(ctx);
  const fork = await ctx.plugin(harness);
  try {
    const assembly = await ctx.systemPrompt.assemble();
    const policy = assembly.sections.find(section => section.name === "industrial_benchmark_policies");
    assert.equal(policy.text, harness.SYSTEM_POLICIES);
    assert.deepEqual(ctx.tools.schemas().map(tool => tool.name).sort(), [...harness.ALLOWED_TOOL_SURFACE].sort());
    for (const forbidden of ["review_write", "review_submit", "gold_write", "shell", "mcp__iad__task_inspect"]) {
      assert.equal(ctx.tools.get(forbidden), undefined);
    }
    assert.ok(ctx.tools.get("knowledge_mine_normal"));
    assert.ok(ctx.tools.get("knowledge_mine_defect"));
    assert.ok(ctx.tools.get("knowledge_evidence"));
  } finally {
    await fork.dispose();
    await fs.rm(root, { recursive: true, force: true });
  }
  assert.equal(ctx.tools.get("knowledge_mine_normal"), undefined);
  assert.equal(ctx.iadPythonBridge, undefined);
});
