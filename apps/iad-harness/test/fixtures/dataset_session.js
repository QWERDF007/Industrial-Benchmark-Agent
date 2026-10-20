import { randomUUID } from "node:crypto";
import { Context } from "@deepseek-ai/cordis";
import { AgentRegistry } from "@deepseek-ai/dsh-agent";
import { AgentLoop } from "@deepseek-ai/dsh-agent-loop";
import { SessionStore, SessionId } from "@deepseek-ai/dsh-session";
import { SessionProjectionRegistry } from "@deepseek-ai/dsh-session-projection";
import { LlmRuntime } from "@deepseek-ai/dsh-llm";
import * as piAi from "@deepseek-ai/dsh-llm-pi-ai";
import { SkillRegistry } from "@deepseek-ai/dsh-skill";
import { SystemPrompt } from "@deepseek-ai/dsh-system-prompt";
import { ToolRuntime } from "@deepseek-ai/dsh-tools";
import { LocalAttachmentStore } from "@deepseek-ai/dsh-attachment-local";
import { LocalFileSystem } from "@deepseek-ai/dsh-fs-local";
import * as skillTool from "@deepseek-ai/dsh-tool-skill";
import * as harness from "../../lib/server/index.js";

export async function createDatasetSession({ root, dbPath, endpoint, model, apiKeyEnv }) {
  const ctx = new Context();
  new SystemPrompt(ctx, { includeHarnessIdentity: false, includeRuntimeContext: false,
    personaPrefix: "你是工业数据集分析助手，使用工具执行用户任务，依据真实结果回答。" });
  new ToolRuntime(ctx);
  new SkillRegistry(ctx);
  new LocalAttachmentStore(ctx, { dshHome: root });
  new LlmRuntime(ctx);
  new SessionStore(ctx);
  new SessionProjectionRegistry(ctx);
  new AgentRegistry(ctx);
  skillTool.apply(ctx);
  const forks = [];
  let handle;
  const dispose = async () => {
    await handle?.dispose();
    for (const fork of forks.toReversed()) await fork.dispose();
  };
  try {
    forks.push(await ctx.plugin(LocalFileSystem, { cwd: root }));
    forks.push(await ctx.plugin(piAi, { providers: { "iad-verification": {
      api: "openai-completions", baseURL: endpoint, apiKeyEnv,
      retryPolicy: { mode: "normal", maxRetries: 0 },
      models: [{ id: model, input: ["text", "image"], contextWindow: 262144, maxTokens: 8192, reasoningEfforts: false }],
    } } }));
    forks.push(await ctx.plugin(AgentLoop, { agents: [] }));
    forks.push(await ctx.plugin(harness, { dbPath }));
    handle = await ctx.agents.create({ sessionId: SessionId("iad-verification-" + randomUUID()),
      agentOptions: { provider: "iad-verification", model, maxTokens: 8192 } });
    return { ctx, handle, dispose };
  } catch (error) {
    await dispose();
    throw error;
  }
}
