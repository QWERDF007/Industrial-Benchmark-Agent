import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Context } from "@deepseek-ai/cordis";
import { SkillRegistry } from "@deepseek-ai/dsh-skill";
import { SystemPrompt } from "@deepseek-ai/dsh-system-prompt";
import { ToolRuntime } from "@deepseek-ai/dsh-tools";
import * as skillTool from "@deepseek-ai/dsh-tool-skill";
import { LocalAttachmentStore } from "@deepseek-ai/dsh-attachment-local";
import * as harness from "../lib/server/index.js";

test("DSH discovers independent exploration and full-analysis skills with standalone tools", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-skill-registration-"));
  const ctx = new Context();
  new SystemPrompt(ctx, {});
  new ToolRuntime(ctx);
  new SkillRegistry(ctx);
  new LocalAttachmentStore(ctx, { dshHome: root });
  skillTool.apply(ctx);
  const fork = await ctx.plugin(harness, {dbPath: path.join(root, 'test.db')});
  try {
    const catalog = await ctx.skills.list();
    assert.deepEqual(catalog.map(skill => skill.name).sort(), ["analyze-dataset", "audit-data-consistency", "explore-inspection-directions"]);
    const exploration = await ctx.tools.execute({ name: "skill", arguments: { name: "explore-inspection-directions" },
      callId: "load-exploration", signal: new AbortController().signal });
    assert.equal(exploration.isError, false);
    assert.match(exploration.content[0].text, /direction_exploration_start/);
    assert.match(exploration.content[0].text, /direction_exploration_status/);
    for (const name of ["analyze-dataset"]) {
      const result = await ctx.tools.execute({ name: "skill", arguments: { name }, callId: `load-${name}`,
        signal: new AbortController().signal });
      assert.equal(result.isError, false, JSON.stringify(result));
      assert.match(result.content[0].text, /knowledge_job_status/);
      assert.match(result.content[0].text, /knowledge_get/);
      assert.match(result.content[0].text, /model_audit_report/);
      assert.match(result.content[0].text, /knowledge_evidence/);
      assert.match(result.content[0].text, /不能|不得/);
      assert.equal(catalog.find(skill => skill.name === name).invocation.modelInvocable, true);
      assert.equal(catalog.find(skill => skill.name === name).invocation.userInvocable, true);
    }
    assert.ok(harness.ALLOWED_TOOL_SURFACE.includes("skill"));
    assert.ok(harness.ALLOWED_TOOL_SURFACE.includes("model_audit_report"));
    for (const name of ['knowledge_mine','knowledge_job_status','knowledge_get','model_audit_report'])
      assert.ok(ctx.tools.get(name), name);
    for (const name of ['knowledge_mine_normal','knowledge_mine_defect','knowledge_scope_open','knowledge_prompt_get'])
      assert.equal(ctx.tools.get(name), undefined);
  } finally {
    await fork.dispose();
    await fs.rm(root, { recursive: true, force: true });
  }
  assert.deepEqual(await ctx.skills.list(), []);
  assert.equal(ctx.tools.get("knowledge_mine_normal"), undefined);
});
