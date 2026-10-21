import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { assembleContextFor } from "@deepseek-ai/dsh-agent";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { renderPrompt } from "@deepseek-ai/dsh-system-prompt";
import { createDatasetSession } from "./fixtures/dataset_session.js";

test("industrial Agent prompt follows actual tool availability instead of the coding preset", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-prompt-"));
  const session = await createDatasetSession({ root, dbPath: path.join(root, "test.db"),
    endpoint: "http://127.0.0.1:1/v1", model: "configured-model-a", apiKeyEnv: "IAD_PROMPT_TEST_KEY" });
  try {
    const agent = session.handle.agent;
    agent.ctx.systemPrompt.variable("cwd", () => root);
    agent.ctx.systemPrompt.section({ name: "deployment:persona-prefix", order: 0,
      text: "You are a coding agent powered by the {{model}} model." });
    agent.ctx.systemPrompt.section({ name: "deployment:persona-suffix", order: 10200,
      text: "Your working directory is {{cwd}}." });
    for (const [name, text] of Object.entries({
      "tool:bash": "Check the [exit code: N] marker on every bash result",
      "tool:jobs": "Track every background job id with job_output and job_kill",
      "tool:goal": "create_goal may infer goal intent",
      "tool:workflow": "Use the workflow tool for orchestration",
      "tool:subagent": "Start independent subagent delegations together",
      "ui:deliverable-file-references": "Use present when a separate file card helps",
      "harness:source": "The DeepSeek Harness implementation checkout is at /tmp/vendor-checkout",
      "app:web-surface": "The client-plugin HMR receiver is active; pnpm run dev:web rebuilds window.__DSH_BOOT__",
    })) session.ctx.systemPrompt.section({ name, order: 1000, text });
    session.ctx.tools.register(defineTool({ name: "bash", description: "Coding preset shell", parameters: {},
      output: { schema: { type: "json" }, render: () => [] }, execute: () => ({}) }));
    session.ctx.systemPrompt.context({ name: "verification:runtime", order: 110, text: "Actual runtime policy" });
    const assembly = await session.ctx.systemPrompt.assemble(assembleContextFor(agent));
    assert.ok(!assembly.tools.some(tool => tool.name === "bash"));
    const text = renderPrompt(assembly);
    assert.match(text, /工业.*数据集/);
    assert.doesNotMatch(text, /coding agent|configured-model-a|exit code|job_output|job_kill|create_goal|workflow tool|subagent delegations|Use present|vendor-checkout|HMR|pnpm run dev:web|working directory/);
    assert.match(text, /Annotation != Quality/);
    assert.match(text, /Never Write Review/);
    assert.doesNotMatch(text, /完整流程步骤/);
    // Later registration and removal must be reflected without caching the tool surface.
    agent.ctx.systemPrompt.section({ name: "tool:knowledge_get", order: 2000, text: "Guidance for the available knowledge reader" });
    assert.match(renderPrompt(await session.ctx.systemPrompt.assemble(assembleContextFor(agent))), /Guidance for the available knowledge reader/);
    const dispose = agent.ctx.tools.restrict({ deny: ["knowledge_get"] });
    assert.doesNotMatch(renderPrompt(await session.ctx.systemPrompt.assemble(assembleContextFor(agent))), /Guidance for the available knowledge reader/);
    dispose();
    assert.match(renderPrompt(await session.ctx.systemPrompt.assemble(assembleContextFor(agent))), /Guidance for the available knowledge reader/);
    assert.ok(assembly.variables.model, "Keep the actual model as runtime metadata instead of hardcoding identity");
    agent.ctx.systemPrompt.section({ name: "user:complete-prompt", order: 0, complete: true, text: "Explicit complete persona" });
    assert.equal(renderPrompt(await session.ctx.systemPrompt.assemble(assembleContextFor(agent))), "Explicit complete persona",
      "Respect the SDK's explicit complete-prompt contract");
  } finally {
    await session.dispose();
    await fs.rm(root, { recursive: true, force: true });
  }
});
